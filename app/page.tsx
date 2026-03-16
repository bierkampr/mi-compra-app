"use client";
import { useState, useEffect, useMemo } from 'react';
import { CLIENT_ID } from '@/lib/config';
import { getDriveFile, saveDriveFile, uploadImageToDrive, getDriveFileBlob } from '@/lib/gdrive';
import { analyzeReceipt } from '@/lib/gemini';
import { compressImage, normalizeStoreName } from '@/lib/utils'; // <-- IMPORTANTE: Añadida normalización
import { syncProductWithSupabase } from '@/lib/products';
import { getSystemLanguage, t } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';

import Navigation from './components/Navigation';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import ShoppingListView from './components/ShoppingListView';
import ScannerView from './components/ScannerView';
import SettingsView from './components/SettingsView';
import ReviewModal from './components/ReviewModal';
import DetailView from './components/DetailView';

export default function Home() {
    const [lang, setLang] = useState('es');
    const [user, setUser] = useState({ name: '', loggedIn: false, token: '' });
    const [activeTab, setActiveTab] = useState('home');
    const [loading, setLoading] = useState(false);
    const [db, setDb] = useState({ gastos: [] as any[], lista: [] as any[] });
    const [fileId, setFileId] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const [currentViewDate, setCurrentViewDate] = useState(new Date());

    const [purchaseMode, setPurchaseMode] = useState<'super' | 'mini' | 'manual' | null>(null);
    const [tempPhotos, setTempPhotos] = useState<string[]>([]);
    const [pendingGasto, setPendingGasto] = useState<any>(null);
    const [selectedGasto, setSelectedGasto] = useState<any | null>(null);
    const [showListDialog, setShowListDialog] = useState(false);

    const txt = (key: string) => t(key, lang);

    useEffect(() => {
        setLang(getSystemLanguage());
        const localData = localStorage.getItem('mi_compra_cache_db');
        if (localData) setDb(JSON.parse(localData));

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
    }, []);

    const loadData = async (token: string) => {
        const res = await getDriveFile(token);
        if (res) {
            setDb(res.data);
            setFileId(res.id);
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

    const startAnalysis = async (useList: boolean) => {
        if (isOffline || loading) return;
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
        } finally { 
            setLoading(false); 
        }
    };

    const saveConfirmedGasto = async (finalGasto: any) => {
        if (loading) return;
        setLoading(true);
        try {
            let pIds = [];
            if (finalGasto.tempImages && !isOffline) {
                for (let img of finalGasto.tempImages) {
                    pIds.push(await uploadImageToDrive(user.token, img));
                }
            }
            if (!isOffline) {
                for (let prod of finalGasto.productos) {
                    await syncProductWithSupabase(prod, finalGasto.comercio);
                }
            }
            const updatedL = db.lista.map(li => {
                if (!finalGasto.usedList) return li;
                const matched = finalGasto.productos?.some((p: any) => (p.nombre_base || "").toLowerCase() === li.name.toLowerCase());
                return matched ? { ...li, confirmed: true, checked: true } : li;
            });

            const record = { ...finalGasto, photoIds: pIds, total: Number(finalGasto.total) || 0 };
            delete record.tempImages; delete record.usedList;
            
            await updateAndSync({ ...db, gastos: [record, ...db.gastos], lista: updatedL });
            resetFlow();
        } catch (e) { alert("Error al sincronizar"); } finally { setLoading(false); }
    };

    const resetFlow = () => {
        setPendingGasto(null);
        setPurchaseMode(null);
        setTempPhotos([]);
        setActiveTab('home');
    };

    // --- LÓGICA DE ESTADÍSTICAS ACTUALIZADA (FUSIÓN DE COMERCIOS) ---
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
        
        // Fusión inteligente: Mercadona S.A. + Mercadona = MERCADONA
        const porComercio = currentGastos.reduce((acc: any, g) => { 
            const nombreLimpio = normalizeStoreName(g.comercio); 
            acc[nombreLimpio] = (acc[nombreLimpio] || 0) + Number(g.total); 
            return acc; 
        }, {});

        return { total, currentGastos, porComercio };
    }, [db.gastos, currentViewDate]);

    if (!user.loggedIn) return <AuthView CLIENT_ID={CLIENT_ID} txt={txt} />;

    return (
        <main className="app-layout">
            <Navigation user={user} activeTab={activeTab} setActiveTab={setActiveTab} isOffline={isOffline} txt={txt} />

            <div className="flex-1 overflow-y-auto pt-4">
                {activeTab === 'home' && !purchaseMode && (
                    <DashboardView stats={stats} currentViewDate={currentViewDate} setCurrentViewDate={setCurrentViewDate} setSelectedGasto={setSelectedGasto} setActiveTab={setActiveTab} txt={txt} lang={lang} />
                )}
                {activeTab === 'list' && (
                    <ShoppingListView db={db} updateAndSync={updateAndSync} setPurchaseMode={setPurchaseMode} txt={txt} />
                )}
                {activeTab === 'add' && !purchaseMode && (
                    <ScannerView setPurchaseMode={setPurchaseMode} txt={txt} />
                )}
                {activeTab === 'settings' && (
                    <SettingsView user={user} db={db} setActiveTab={setActiveTab} txt={txt} />
                )}
            </div>

            {(purchaseMode === 'super' || purchaseMode === 'mini') && !pendingGasto && (
                <div className="modal-content-full z-[1000] justify-center gap-10">
                    <ScannerView.Capture 
                        tempPhotos={tempPhotos} setTempPhotos={setTempPhotos} 
                        loading={loading} startAnalysis={startAnalysis} 
                        db={db} setShowListDialog={setShowListDialog} 
                        showListDialog={showListDialog} onCancel={resetFlow} txt={txt} 
                    />
                </div>
            )}

            {pendingGasto && <ReviewModal pendingGasto={pendingGasto} setPendingGasto={setPendingGasto} onSave={saveConfirmedGasto} onCancel={resetFlow} loading={loading} db={db} txt={txt} />}
            
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
                    token={user.token} txt={txt} 
                />
            )}

            {loading && (
                <div className="fixed inset-0 z-[2000] bg-brand-bg/60 backdrop-blur-md flex items-center justify-center">
                    <Loader2 className="animate-spin text-brand-primary" size={48} strokeWidth={3}/>
                </div>
            )}
        </main>
    );
}