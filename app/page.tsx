"use client";
import { useState, useEffect, useMemo } from 'react';
import { CLIENT_ID } from '@/lib/config';
import { getDriveFile, saveDriveFile, uploadImageToDrive } from '@/lib/gdrive';
import { analyzeReceipt } from '@/lib/gemini';
import { normalizeStoreName } from '@/lib/utils';
import { syncProductWithSupabase } from '@/lib/products';
import { getSystemLanguage, t } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';

// Componentes de la interfaz
import Navigation from './components/Navigation';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import ShoppingListView from './components/ShoppingListView';
import ScannerView from './components/ScannerView';
import SettingsView from './components/SettingsView';
import ReviewModal from './components/ReviewModal';
import DetailView from './components/DetailView';

export default function Home() {
    // --- ESTADO GLOBAL ---
    const [lang, setLang] = useState('es');
    const [user, setUser] = useState({ name: '', loggedIn: false, token: '' });
    const [activeTab, setActiveTab] = useState('home');
    const [loading, setLoading] = useState(false);
    const [db, setDb] = useState({ gastos: [] as any[], lista: [] as any[] });
    const [fileId, setFileId] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const [currentViewDate, setCurrentViewDate] = useState(new Date());

    // --- ESTADO FLUJO DE COMPRA ---
    const [purchaseMode, setPurchaseMode] = useState<'super' | 'mini' | 'dining' | 'health' | 'others' | 'manual' | null>(null);
    const [tempPhotos, setTempPhotos] = useState<string[]>([]);
    const [pendingGasto, setPendingGasto] = useState<any>(null);
    const [selectedGasto, setSelectedGasto] = useState<any | null>(null);
    const [showListDialog, setShowListDialog] = useState(false);

    // Función puente para traducciones
    const txt = (key: string) => t(key, lang);

    // --- EFECTOS INICIALES ---
    useEffect(() => {
        // 1. Detectar idioma del sistema
        setLang(getSystemLanguage());

        // 2. Cargar caché local para que la app abra instantáneamente
        const localData = localStorage.getItem('mi_compra_cache_db');
        if (localData) setDb(JSON.parse(localData));

        // 3. Verificar si hay sesión activa en el navegador
        const tkn = localStorage.getItem('gdrive_token');
        const name = localStorage.getItem('user_name');
        if (tkn && name) {
            setUser({ name, loggedIn: true, token: tkn });
            loadData(tkn);
        }

        // 4. Gestión de conectividad Online/Offline
        const handleStatus = () => setIsOffline(!navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    // --- LÓGICA DE DATOS (GDRIVE) ---
    const loadData = async (token: string) => {
        const res = await getDriveFile(token);
        if (res) {
            setDb(res.data);
            setFileId(res.id);
            // Actualizamos caché al recibir datos frescos
            localStorage.setItem('mi_compra_cache_db', JSON.stringify(res.data));
        }
    };

    const updateAndSync = async (newDb: any) => {
        setDb(newDb);
        localStorage.setItem('mi_compra_cache_db', JSON.stringify(newDb));
        if (navigator.onLine && user.token) {
            await saveDriveFile(user.token, newDb, fileId);
        }
    };

    // --- LÓGICA DE PROCESAMIENTO IA ---
    const startAnalysis = async (useList: boolean) => {
        if (isOffline || loading) return;

        // Caso especial: Entrada manual
        if (purchaseMode === 'manual') {
            setPendingGasto({
                comercio: "NUEVA COMPRA",
                fecha: new Date().toLocaleDateString('es-ES'),
                total: 0,
                productos: [],
                usedList: useList
            });
            return;
        }

        setLoading(true);
        setShowListDialog(false);

        try {
            // Preparamos los items de la lista para enviárselos a la IA
            const listItems = useList ? db.lista.filter(l => !l.confirmed).map(l => l.name) : [];
            
            // Construimos el prompt dinámico desde el JSON de idiomas
            const promptFinal = txt('ai.prompt')
                .replace('{{lista}}', listItems.join(", "))
                .replace('{{fecha}}', new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US'));

            const res = await analyzeReceipt(tempPhotos, purchaseMode || 'super', promptFinal);
            
            // Añadimos las imágenes temporales y el flag de lista al objeto pendiente
            setPendingGasto({ ...res, tempImages: tempPhotos, usedList: useList });
        } catch (err: any) { 
            alert(err.message); 
            setPurchaseMode(null);
        } finally { 
            setLoading(false); 
        }
    };

    const saveConfirmedGasto = async (finalGasto: any) => {
        if (loading) return;
        setLoading(true);
        try {
            let pIds = [];
            // 1. Subir fotos a la carpeta oculta de Google Drive
            if (finalGasto.tempImages && !isOffline) {
                for (let img of finalGasto.tempImages) {
                    const id = await uploadImageToDrive(user.token, img);
                    pIds.push(id);
                }
            }

            // 2. Sincronizar productos con el Diccionario Maestro de Supabase (Mayúsculas y Alias)
            if (!isOffline) {
                for (let prod of finalGasto.productos) {
                    await syncProductWithSupabase(prod, finalGasto.comercio);
                }
            }

            // 3. Si se usó la lista, marcar productos encontrados como comprados
            const updatedL = db.lista.map(li => {
                if (!finalGasto.usedList) return li;
                const matched = finalGasto.productos?.some((p: any) => 
                    (p.nombre_base || "").toUpperCase() === li.name.toUpperCase()
                );
                return matched ? { ...li, confirmed: true, checked: true } : li;
            });

            // 4. Crear el registro final del gasto
            const record = { 
                ...finalGasto, 
                category: purchaseMode, // Guardamos la categoría seleccionada
                photoIds: pIds, 
                total: Number(finalGasto.total) || 0 
            };

            // 5. Determinar a qué pestaña volver (Si vienes de lista, vuelves a lista)
            const returnToList = finalGasto.usedList || activeTab === 'list';

            // 6. Limpieza de campos internos antes de persistir
            delete record.tempImages; 
            delete record.usedList; 
            delete record._isGrouped;
            
            // 7. Guardar en Drive y actualizar estado local
            await updateAndSync({ 
                ...db, 
                gastos: [record, ...db.gastos], 
                lista: updatedL 
            });

            resetFlow(returnToList ? 'list' : 'home');

        } catch (e) { 
            alert("Error al sincronizar con Google Drive"); 
        } finally { 
            setLoading(false); 
        }
    };

    const resetFlow = (tab: string = 'home') => {
        setPendingGasto(null);
        setPurchaseMode(null);
        setTempPhotos([]);
        setActiveTab(tab);
    };

    // --- ESTADÍSTICAS DEL MES (Memoized) ---
    const stats = useMemo(() => {
        const y = currentViewDate.getFullYear();
        const m = currentViewDate.getMonth();
        const first = new Date(y, m, 1);
        const last = new Date(y, m + 1, 0);
        
        const currentGastos = (db.gastos || []).filter(g => {
            const [dd, mm, yy] = g.fecha.split('/');
            const d = new Date(+yy, +mm - 1, +dd);
            return d >= first && d <= last;
        });
        
        const total = currentGastos.reduce((acc, g) => acc + (Number(g.total) || 0), 0);
        
        const porComercio = currentGastos.reduce((acc: any, g) => { 
            const nombreLimpio = normalizeStoreName(g.comercio);
            acc[nombreLimpio] = (acc[nombreLimpio] || 0) + Number(g.total); 
            return acc; 
        }, {});
        
        return { total, currentGastos, porComercio };
    }, [db.gastos, currentViewDate]);

    // --- RENDERIZADO PRINCIPAL ---
    if (!user.loggedIn) return <AuthView CLIENT_ID={CLIENT_ID} txt={txt} />;

    return (
        <main className="app-layout">
            {/* Barra superior y navegación inferior */}
            <Navigation 
                user={user} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isOffline={isOffline} 
                txt={txt} 
            />

            <div className="flex-1 overflow-y-auto pt-4 no-scrollbar">
                {/* VISTA: DASHBOARD (INICIO) */}
                {activeTab === 'home' && !purchaseMode && (
                    <DashboardView 
                        stats={stats} 
                        currentViewDate={currentViewDate} 
                        setCurrentViewDate={setCurrentViewDate} 
                        setSelectedGasto={setSelectedGasto} 
                        setActiveTab={setActiveTab} 
                        txt={txt} 
                        lang={lang} 
                    />
                )}

                {/* VISTA: MI LISTA DE LA COMPRA */}
                {activeTab === 'list' && (
                    <ShoppingListView 
                        db={db} 
                        updateAndSync={updateAndSync} 
                        setPurchaseMode={setPurchaseMode} 
                        txt={txt} 
                    />
                )}

                {/* VISTA: SELECCIÓN DE ESTABLECIMIENTO */}
                {activeTab === 'add' && !purchaseMode && (
                    <ScannerView 
                        setPurchaseMode={setPurchaseMode} 
                        startAnalysis={startAnalysis} 
                        txt={txt} 
                    />
                )}

                {/* VISTA: AJUSTES */}
                {activeTab === 'settings' && (
                    <SettingsView 
                        user={user} 
                        db={db} 
                        setActiveTab={setActiveTab} 
                        txt={txt} 
                    />
                )}
            </div>

            {/* OVERLAY: CAPTURA DE FOTOS (CÁMARA / GALERÍA) */}
            {(purchaseMode && purchaseMode !== 'manual') && !pendingGasto && (
                <div className="modal-content-full z-[1000] justify-center gap-10">
                    <ScannerView.Capture 
                        tempPhotos={tempPhotos} 
                        setTempPhotos={setTempPhotos} 
                        loading={loading} 
                        startAnalysis={startAnalysis} 
                        db={db} 
                        setShowListDialog={setShowListDialog} 
                        showListDialog={showListDialog} 
                        onCancel={() => resetFlow(activeTab === 'list' ? 'list' : 'home')} 
                        txt={txt}
                        activeTab={activeTab} 
                    />
                </div>
            )}

            {/* OVERLAY: MODAL DE REVISIÓN DE PRODUCTOS (POST-IA) */}
            {pendingGasto && (
                <ReviewModal 
                    pendingGasto={pendingGasto} 
                    setPendingGasto={setPendingGasto} 
                    onSave={saveConfirmedGasto} 
                    onCancel={() => resetFlow(activeTab === 'list' ? 'list' : 'home')} 
                    loading={loading} 
                    db={db} 
                    txt={txt} 
                />
            )}
            
            {/* OVERLAY: DETALLE DE UN GASTO ANTERIOR */}
            {selectedGasto && (
                <DetailView 
                    gasto={selectedGasto} 
                    onClose={() => setSelectedGasto(null)} 
                    onDelete={async (g) => {
                        if (confirm(txt('modals.delete_confirm'))) {
                            const newDb = { ...db, gastos: db.gastos.filter(x => x !== g) };
                            await updateAndSync(newDb);
                            setSelectedGasto(null);
                        }
                    }} 
                    token={user.token} 
                    txt={txt} 
                />
            )}

            {/* OVERLAY: SPINNER DE CARGA GLOBAL */}
            {loading && (
                <div className="fixed inset-0 z-[2000] bg-brand-bg/60 backdrop-blur-md flex items-center justify-center">
                    <Loader2 className="animate-spin text-brand-primary" size={48} strokeWidth={3}/>
                </div>
            )}
        </main>
    );
}