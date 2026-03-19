"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { CLIENT_ID } from '@/lib/config';
import { getDriveFile, saveDriveFile, uploadImageToDrive } from '@/lib/gdrive';
import { analyzeReceipt } from '@/lib/gemini';
import { normalizeStoreName } from '@/lib/utils';
import { syncProductWithSupabase } from '@/lib/products';
import { getSystemLanguage, t } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';
import { AppDB, Gasto, UserState } from '@/lib/types';

// Componentes de la interfaz
import Navigation from './components/Navigation';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import ShoppingListView from './components/ShoppingListView';
import ScannerView from './components/ScannerView';
import SettingsView from './components/SettingsView';
import ReviewModal from './components/ReviewModal';
import DetailView from './components/DetailView';
import HelpModal from './components/HelpModal';

export default function Home() {
    // --- ESTADO GLOBAL ---
    const [lang, setLang] = useState('es');
    const [user, setUser] = useState<UserState>({ name: '', loggedIn: false, token: '' });
    const [activeTab, setActiveTab] = useState('home');
    const [loading, setLoading] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // Estructura inicial del DB
    const [db, setDb] = useState<AppDB>({ gastos: [], lista: [], customCategories: [] });
    const [fileId, setFileId] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const [currentViewDate, setCurrentViewDate] = useState(new Date());

    // --- ESTADO FLUJO DE COMPRA ---
    const [purchaseMode, setPurchaseMode] = useState<string | null>(null);
    const [tempPhotos, setTempPhotos] = useState<string[]>([]);
    const [pendingGasto, setPendingGasto] = useState<any>(null);
    const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null);
    const [showListDialog, setShowListDialog] = useState(false);

    const txt = useCallback((key: string) => t(key, lang), [lang]);

    // --- CARGA DE DATOS ---
    const loadData = useCallback(async (token: string) => {
        const res = await getDriveFile(token);
        if (res) {
            setDb(res.data);
            setFileId(res.id);
            localStorage.setItem('mi_compra_cache_db', JSON.stringify(res.data));

            // Lógica de Tutorial Inteligente: solo si la base de datos está vacía (usuario nuevo)
            // y no lo ha visto en esta sesión de navegador
            if (res.data.gastos.length === 0 && res.data.lista.length === 0 && !localStorage.getItem('mi_compra_seen_tour')) {
                setShowHelp(true);
                localStorage.setItem('mi_compra_seen_tour', 'true');
            }
        }
    }, []);

    // --- EFECTOS INICIALES ---
    useEffect(() => {
        setLang(getSystemLanguage());
        const localData = localStorage.getItem('mi_compra_cache_db');
        if (localData) {
            try {
                setDb(JSON.parse(localData));
            } catch (e) {
                console.error("Error parsing cache", e);
            }
        }

    const tkn = localStorage.getItem('gdrive_token');
    const name = localStorage.getItem('user_name');
    if (tkn && name) {
        setUser({ name, loggedIn: true, token: tkn });
        loadData(tkn);
    }

        const handleStatus = () => setIsOffline(!navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, [loadData]);

    const updateAndSync = async (newDb: AppDB) => {
        setDb(newDb);
        localStorage.setItem('mi_compra_cache_db', JSON.stringify(newDb));
        if (navigator.onLine && user.token) {
            try {
                await saveDriveFile(user.token, newDb, fileId);
            } catch (e) {
                console.error("Sync error:", e);
                // Aquí se podría implementar un sistema de reintentos silencioso
            }
        }
    };

    // --- LÓGICA DE PROCESAMIENTO IA ---
    const startAnalysis = async (useList: boolean) => {
        if (isOffline || loading) return;

        if (purchaseMode === 'manual') {
            // Seteamos el gasto pendiente primero
            setPendingGasto({
                comercio: "NUEVA COMPRA",
                fecha: new Date().toLocaleDateString('es-ES'),
                total: 0,
                productos: [],
                usedList: useList
            });
            // Cerramos cualquier diálogo y NO activamos loading
            setShowListDialog(false);
            return;
        }

        setLoading(true);
        setShowListDialog(false);

        try {
            const listItems = useList ? db.lista.filter(l => !l.confirmed).map(l => l.name) : [];
            const promptFinal = txt('ai.prompt')
                .replace('{{lista}}', listItems.join(", "))
                .replace('{{fecha}}', new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US'));

            const res = await analyzeReceipt(tempPhotos, purchaseMode || 'super', promptFinal);
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
            // OPTIMIZACIÓN: Subida de imágenes en paralelo
            let pIds: string[] = [];
            if (finalGasto.tempImages && !isOffline) {
                pIds = await Promise.all(
                    finalGasto.tempImages.map((img: string) => uploadImageToDrive(user.token, img))
                );
            }

            // Sincronización con Supabase (Catálogo maestro)
            if (!isOffline) {
                await Promise.all(
                    finalGasto.productos.map((prod: any) => syncProductWithSupabase(prod, finalGasto.comercio))
                );
            }

            const updatedL = db.lista.map(li => {
                if (!finalGasto.usedList) return li;
                const matched = finalGasto.productos?.some((p: any) => 
                    (p.nombre_base || "").toUpperCase() === li.name.toUpperCase()
                );
                return matched ? { ...li, confirmed: true, checked: true } : li;
            });

            const record: Gasto = { 
                comercio: finalGasto.comercio,
                fecha: finalGasto.fecha,
                total: Number(finalGasto.total) || 0,
                category: purchaseMode || 'super',
                photoIds: pIds,
                productos: finalGasto.productos
            };

            const returnToList = finalGasto.usedList || activeTab === 'list';
            
            await updateAndSync({ 
                ...db, 
                gastos: [record, ...db.gastos], 
                lista: updatedL 
            });

            resetFlow(returnToList ? 'list' : 'home');

        } catch (e) { 
            console.error(e);
            alert("Error al sincronizar datos"); 
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

    const [loadingStep, setLoadingStep] = useState(0);

    // Rotador de mensajes de carga
    useEffect(() => {
        let interval: any;
        if (loading) {
            interval = setInterval(() => {
                setLoadingStep(prev => (prev + 1) % 4);
            }, 3000);
        } else {
            setLoadingStep(0);
        }
        return () => clearInterval(interval);
    }, [loading]);

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
        
        const porComercio = currentGastos.reduce((acc: Record<string, number>, g) => { 
            const nombreLimpio = normalizeStoreName(g.comercio);
            acc[nombreLimpio] = (acc[nombreLimpio] || 0) + Number(g.total); 
            return acc; 
        }, {});
        
        return { total, currentGastos, porComercio };
    }, [db.gastos, currentViewDate]);

    if (!user.loggedIn) return <AuthView CLIENT_ID={CLIENT_ID} txt={txt} />;

    return (
        <main className="app-layout">
            <Navigation 
                user={user} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isOffline={isOffline} 
                txt={txt} 
                onShowHelp={() => setShowHelp(true)}
            />

            <div className="flex-1 overflow-y-auto pt-4 no-scrollbar">
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

                {activeTab === 'list' && (
                    <ShoppingListView 
                        db={db} 
                        updateAndSync={updateAndSync} 
                        setPurchaseMode={setPurchaseMode} 
                        txt={txt} 
                    />
                )}

                {activeTab === 'add' && !purchaseMode && (
                    <ScannerView 
                        db={db}
                        updateAndSync={updateAndSync}
                        setPurchaseMode={setPurchaseMode} 
                        startAnalysis={startAnalysis} 
                        txt={txt} 
                    />
                )}

                {activeTab === 'settings' && (
                    <SettingsView 
                        user={user} 
                        db={db} 
                        setActiveTab={setActiveTab} 
                        txt={txt} 
                        onShowHelp={() => setShowHelp(true)}
                    />
                )}
            </div>

            {showHelp && <HelpModal onClose={() => setShowHelp(false)} txt={txt} />}

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

            {pendingGasto && (
                <div className="modal-content-full z-[1100]">
                    <ReviewModal 
                        pendingGasto={pendingGasto} 
                        setPendingGasto={setPendingGasto} 
                        onSave={saveConfirmedGasto} 
                        onCancel={() => resetFlow(activeTab === 'list' ? 'list' : 'home')} 
                        loading={loading} 
                        db={db} 
                        txt={txt} 
                    />
                </div>
            )}
            
            {selectedGasto && (
                <div className="modal-content-full z-[1200]">
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
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 z-[9000] bg-brand-bg/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full animate-pulse" />
                        <Loader2 className="animate-spin text-brand-primary relative z-10" size={80} strokeWidth={2.5}/>
                    </div>
                    
                    <div className="space-y-4 max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <p className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-2">
                            {txt('scan.scanning_label')}
                        </p>
                        
                        <div className="h-10 flex items-center justify-center">
                            <p key={loadingStep} className="text-[10px] font-bold text-brand-muted uppercase tracking-widest leading-relaxed animate-in fade-in zoom-in duration-500">
                                {loadingStep === 0 && txt('scan.scanning_step_0')}
                                {loadingStep === 1 && txt('scan.scanning_step_1')}
                                {loadingStep === 2 && txt('scan.scanning_step_2')}
                                {loadingStep === 3 && txt('scan.scanning_step_3')}
                            </p>
                        </div>

                        <div className="flex gap-1 justify-center pt-4">
                            {[0,1,2,3].map(i => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${loadingStep === i ? 'bg-brand-primary w-4' : 'bg-white/10'}`} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="hidden lg:block fixed inset-0 bg-black/40 -z-10 pointer-events-none" />
        </main>
    );
}
