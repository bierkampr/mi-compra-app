"use client";
import { useState, useEffect, useMemo } from 'react';

import { CLIENT_ID } from '../lib/config';
import { getDriveFile, saveDriveFile, uploadImageToDrive, getDriveFileBlob } from '../lib/gdrive';
import { analyzeReceipt } from '../lib/gemini';
import { compressImage, exportToCSV } from '../lib/utils';
import { searchLocalProducts } from '../lib/products';
import { getSystemLanguage, t } from '../lib/i18n';
import { 
    LayoutGrid, Plus, History, Camera, ShoppingCart, Store, Check, X, 
    Loader2, Trash2, Edit3, Settings, LogOut, CreditCard, 
    BarChart3, Download, ChevronRight, ChevronLeft, ImageIcon, WifiOff, AlertTriangle, 
    ShoppingBag, ListTodo, User, CheckCircle2
} from 'lucide-react';

export const dynamic = 'force-dynamic'; 
export default function Home() {
    // --- 1. ESTADOS ---
    const [lang, setLang] = useState('es');
    const [user, setUser] = useState({ name: '', loggedIn: false, token: '' });
    const [activeTab, setActiveTab] = useState('home');
    const [loading, setLoading] = useState(false);
    const [db, setDb] = useState({ gastos: [] as any[], lista: [] as any[] });
    const [fileId, setFileId] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const [currentViewDate, setCurrentViewDate] = useState(new Date());

    // --- 1.1 ESTADOS DE FLUJO ---
    const [purchaseMode, setPurchaseMode] = useState<'super' | 'mini' | 'manual' | null>(null);
    const [isVincularFlow, setIsVincularFlow] = useState(false);
    const [tempPhotos, setTempPhotos] = useState<string[]>([]);
    const [pendingGasto, setPendingGasto] = useState<any>(null);
    const [selectedGasto, setSelectedGasto] = useState<any | null>(null);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [newItemName, setNewItemName] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showListDialog, setShowListDialog] = useState(false);
    const [showComercioSuggestions, setShowComercioSuggestions] = useState(false);
    const [isManualExpanded, setIsManualExpanded] = useState(false);
    const [manualProd, setManualProd] = useState({ name: '', qty: 1, price: "" });

    const txt = (key: string) => t(key, lang);

    // --- 2. EFECTOS E INICIO ---
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
        if (navigator.onLine && user.token) await saveDriveFile(user.token, newDb, fileId);
    };

    // --- 3. LÓGICA DE PROCESAMIENTO ---
    const startAnalysis = async (useList: boolean) => {
        if (isOffline) return alert(txt('common.offline'));
        setShowListDialog(false); setLoading(true);
        try {
            const listItems = useList ? db.lista.filter(l => !l.confirmed).map(l => l.name) : [];
            const promptFinal = txt('ai.prompt')
                .replace('{{lista}}', listItems.join(", "))
                .replace('{{fecha}}', new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US'));

            const res = await analyzeReceipt(tempPhotos, purchaseMode || 'super', promptFinal);
            setPendingGasto({ ...res, tempImages: tempPhotos, usedList: useList });
        } catch (err: any) { alert(err.message); }
        finally { setLoading(false); }
    };

    const saveConfirmedGasto = async () => {
        setLoading(true);
        try {
            let pIds = [];
            if (pendingGasto.tempImages && !isOffline) {
                for (let img of pendingGasto.tempImages) pIds.push(await uploadImageToDrive(user.token, img));
            }
            const updatedL = db.lista.map(li => {
                if (!pendingGasto.usedList) return li;
                const matched = pendingGasto.productos?.some((p: any) => (p.nombre_base || "").toLowerCase() === li.name.toLowerCase());
                return matched ? { ...li, confirmed: true, checked: true } : li;
            });
            const final = { ...pendingGasto, photoIds: pIds, total: Number(pendingGasto.total) || 0 };
            delete final.tempImages; delete final.usedList;
            await updateAndSync({ ...db, gastos: [final, ...db.gastos], lista: updatedL });
            resetFlow();
        } catch (e) { alert("Error"); }
        finally { setLoading(false); }
    };

    const resetFlow = () => {
        setPendingGasto(null);
        setPurchaseMode(null);
        setTempPhotos([]);
        setIsVincularFlow(false);
        setActiveTab('home');
        setIsManualExpanded(false);
    };

    const deleteGasto = async (gasto: any) => {
        if (!confirm(txt('modals.delete_confirm'))) return;
        const newDb = { ...db, gastos: db.gastos.filter(x => x !== gasto) };
        await updateAndSync(newDb);
        setSelectedGasto(null);
    };

    // --- 4. LOGICA DE COMERCIOS (PROTECCIÓN CONTRA OBJECT OBJECT) ---
    const comerciosAnteriores = useMemo(() => 
        Array.from(new Set((db.gastos || []).map(g => {
            const val = g.comercio;
            return (typeof val === 'string') ? val.toUpperCase() : String(val || "").toUpperCase();
        }).filter(Boolean)))
    , [db.gastos]);
    
    const filteredComercios = useMemo(() => {
        const val = pendingGasto?.comercio;
        if (!val) return [];
        const search = (typeof val === 'string' ? val : String(val)).toUpperCase();
        return comerciosAnteriores.filter(c => c.includes(search));
    }, [pendingGasto?.comercio, comerciosAnteriores]);

    useEffect(() => {
        const val = pendingGasto?.comercio;
        const searchLen = typeof val === 'string' ? val.length : String(val || "").length;
        if (searchLen > 3 && filteredComercios.length === 0) setShowComercioSuggestions(false);
    }, [pendingGasto?.comercio, filteredComercios]);

    // --- 5. FUNCIONES UI ---
    const addManualItem = () => {
        if (!manualProd.name) return;
        const p = parseFloat(manualProd.price) || 0;
        setPendingGasto({
            ...pendingGasto,
            productos: [...(pendingGasto.productos || []), { nombre_ticket: manualProd.name, nombre_base: manualProd.name, cantidad: manualProd.qty, subtotal: p * manualProd.qty }]
        });
        setManualProd({ name: '', qty: 1, price: "" });
    };

    const addToList = async (n?: string) => {
        const val = n || newItemName; if (!val) return;
        setNewItemName(""); setSuggestions([]);
        const newDb = { ...db, lista: [...(db.lista || []), { name: val, checked: false, confirmed: false }] };
        await updateAndSync(newDb);
    };

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
        const porComercio = currentGastos.reduce((acc: any, g) => { acc[g.comercio] = (acc[g.comercio] || 0) + Number(g.total); return acc; }, {});
        return { total, currentGastos, porComercio };
    }, [db.gastos, currentViewDate]);

    // --- 6. RENDER ---
    if (!user.loggedIn) return (
        <main className="app-layout justify-center text-center">
            <div className="w-24 h-24 bg-brand-primary rounded-[2.5rem] mx-auto mb-10 flex items-center justify-center shadow-2xl rotate-6"><ShoppingCart className="text-white" size={48}/></div>
            <h1 className="heading-1 mb-4">{txt('auth.title')}</h1>
            <button onClick={() => {
                // @ts-ignore
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile",
                    callback: async (res: any) => {
                        localStorage.setItem('gdrive_token', res.access_token);
                        const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${res.access_token}` } }).then(r => r.json());
                        localStorage.setItem('user_name', info.name);
                        window.location.reload();
                    },
                });
                client.requestAccessToken();
            }} className="btn-primary py-5">{txt('auth.login_btn')}</button>
        </main>
    );

    return (
        <main className="app-layout">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <p className="text-small-caps mb-1">{isOffline ? txt('common.offline') : 'Online'}</p>
                    <h1 className="heading-1 text-2xl tracking-tighter">MI COMPRA</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveTab('settings')} className="btn-icon"><Settings size={20}/></button>
                    <div className="w-10 h-10 rounded-2xl bg-brand-primary flex items-center justify-center font-black text-white border border-white/10 shadow-lg">
                        {user.name ? user.name[0] : <User size={18}/>}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                {!purchaseMode && (activeTab === 'home' || activeTab === 'analytics') && (
                    <div className="flex items-center justify-between card-premium p-4 mb-8 bg-white/[0.03] border-none">
                        <button onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1))} className="btn-icon bg-transparent border-none text-brand-primary"><ChevronLeft/></button>
                        <span className="text-xs font-black uppercase tracking-widest text-white">{currentViewDate.toLocaleDateString(lang, { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1))} disabled={currentViewDate.getMonth() === new Date().getMonth()} className="btn-icon bg-transparent border-none text-brand-primary disabled:opacity-0"><ChevronRight/></button>
                    </div>
                )}

                {/* TAB: AJUSTES */}
                {activeTab === 'settings' && (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
                        <div className="card-premium text-center p-10">
                            <div className="w-20 h-20 bg-brand-primary/20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-brand-primary font-black text-3xl">{user.name[0]}</div>
                            <h2 className="heading-2 uppercase mb-1">{user.name}</h2>
                            <p className="text-small-caps">Google Account</p>
                        </div>
                        <button onClick={() => exportToCSV(db.gastos)} className="btn-secondary py-5"><Download size={20}/> {txt('settings.export')}</button>
                        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="btn-secondary py-5 text-brand-danger bg-brand-danger/5 border-brand-danger/10"><LogOut size={20}/> {txt('settings.logout')}</button>
                        <button onClick={() => setActiveTab('home')} className="btn-icon mx-auto mt-4"><ChevronLeft size={24}/></button>
                    </div>
                )}

                {/* TAB: INICIO */}
                {activeTab === 'home' && !purchaseMode && (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4">
                        <button onClick={() => setActiveTab('analytics')} className="w-full card-premium bg-gradient-to-br from-brand-primary to-indigo-800 p-8 text-center shadow-2xl active:scale-95 transition-all">
                            <p className="text-small-caps text-white/50 mb-3">{txt('home.monthly_spend')}</p>
                            <h2 className="text-6xl font-black italic tracking-tighter text-white">{(stats.total).toFixed(2)}€</h2>
                            <div className="mt-8 inline-flex items-center bg-white/10 px-4 py-2 rounded-full text-small-caps text-white border border-white/5">
                                {stats.currentGastos.length} {txt('home.records')}
                            </div>
                        </button>

                        <section className="space-y-4">
                            <h3 className="text-small-caps">{txt('home.records')}</h3>
                            {stats.currentGastos.map((g, i) => (
                                <button key={i} onClick={() => setSelectedGasto(g)} className="card-clickable w-full flex justify-between items-center p-5">
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="p-3 bg-brand-secondary/30 rounded-2xl text-brand-primary"><Store size={22}/></div>
                                        <div>
                                            <p className="font-black text-xs uppercase text-white truncate max-w-[140px]">{g.comercio}</p>
                                            <p className="text-[10px] font-bold text-brand-muted mt-1">{g.fecha}</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-black text-brand-success tracking-tighter">{(Number(g.total)).toFixed(2)}€</p>
                                </button>
                            ))}
                        </section>
                    </div>
                )}

                {/* TAB: ANALYTICS (DESGLOSE) */}
                {activeTab === 'analytics' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center">
                            <h2 className="heading-1 text-brand-primary">{txt('home.shop_breakdown')}</h2>
                            <button onClick={() => setActiveTab('home')} className="btn-icon"><X/></button>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(stats.porComercio).sort((a:any, b:any) => b[1] - a[1]).map(([name, val]: any, i) => (
                                <div key={i} className="shop-row">
                                    <span className="text-[11px] font-black uppercase text-white/80">{name}</span>
                                    <span className="text-sm font-black text-brand-success">{(val).toFixed(2)}€</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB: LISTA */}
                {activeTab === 'list' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        <div className="relative">
                            <input value={newItemName} onChange={(e) => {setNewItemName(e.target.value); if(e.target.value.length > 1) searchLocalProducts(e.target.value).then(setSuggestions); else setSuggestions([]);}} placeholder={txt('list.placeholder')} className="input-premium pr-14 font-bold" />
                            <button onClick={() => addToList()} className="absolute right-2 top-2 p-3 bg-brand-primary rounded-xl text-white shadow-lg active:scale-90 transition-all"><Plus size={20} strokeWidth={3}/></button>
                        </div>
                        {suggestions.length > 0 && (
                            <div className="card-premium p-2 -mt-6 border-brand-primary/30 z-50 relative">
                                {suggestions.map((s, idx) => (
                                    <button key={idx} onClick={() => addToList(s.nombre_base)} className="w-full text-left p-4 hover:bg-brand-primary/10 rounded-xl text-xs font-black uppercase border-b border-white/[0.03] last:border-none">{s.nombre_base}</button>
                                ))}
                            </div>
                        )}
                        {db.lista.length > 0 && (
                            <div className="flex gap-3">
                                <button onClick={() => { setPurchaseMode('super'); setIsVincularFlow(true); }} className="btn-primary flex-1 py-5 text-xs tracking-widest"><Camera size={18}/> {txt('list.scan_btn')}</button>
                                <button onClick={() => { if(confirm(txt('modals.clear_list_msg'))) updateAndSync({...db, lista: []}); }} className="btn-secondary w-20 bg-brand-danger/10 text-brand-danger border-none"><Trash2 size={20}/></button>
                            </div>
                        )}
                        <section className="space-y-10">
                            <div>
                                <h3 className="text-small-caps mb-4 flex items-center gap-2"><ListTodo size={14}/> {txt('list.pending')}</h3>
                                <div className="space-y-3">
                                    {db.lista.filter(li => !li.confirmed).map((item, i) => (
                                        <div key={i} className="card-premium p-4 flex items-center justify-between bg-white/[0.02] border-none shadow-md">
                                            <button className="flex items-center gap-4 flex-1 text-left" onClick={async () => { const nl = [...db.lista]; const id = db.lista.indexOf(item); nl[id].checked = !nl[id].checked; await updateAndSync({...db, lista: nl}); }}>
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${item.checked ? 'bg-brand-primary border-brand-primary' : 'border-brand-secondary'}`}>{item.checked && <Check size={14} className="text-white" strokeWidth={4}/>}</div>
                                                <span className={`text-xs font-black uppercase tracking-tight ${item.checked ? 'line-through text-brand-muted' : 'text-white'}`}>{item.name}</span>
                                            </button>
                                            <button onClick={async () => { const nl = [...db.lista]; nl.splice(db.lista.indexOf(item), 1); await updateAndSync({...db, lista: nl}); }} className="text-brand-muted/20 hover:text-brand-danger"><X size={18}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {db.lista.some(li => li.confirmed) && (
                                <div className="pt-6 border-t border-white/5 opacity-50">
                                    <h3 className="text-small-caps text-brand-success mb-4 flex items-center gap-2"><CheckCircle2 size={14}/> {txt('list.bought')}</h3>
                                    <div className="space-y-3">
                                        {db.lista.filter(li => li.confirmed).map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-brand-success/[0.03] border border-brand-success/10">
                                                <div className="flex items-center gap-4"><Check size={16} className="text-brand-success" strokeWidth={4}/><span className="text-xs font-black uppercase tracking-tight text-brand-muted">{item.name}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* TAB: AÑADIR */}
                {activeTab === 'add' && !purchaseMode && (
                    <div className="space-y-4 py-6 animate-in slide-in-from-bottom-8">
                        <button onClick={() => { setPurchaseMode('super'); setIsVincularFlow(false); }} className="card-clickable w-full p-10 flex flex-col items-center gap-6 group">
                            <div className="w-20 h-20 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform"><ShoppingCart size={40} strokeWidth={2.5}/></div>
                            <h2 className="heading-2 tracking-widest">{txt('scan.super')}</h2>
                        </button>
                        <button onClick={() => { setPurchaseMode('mini'); setIsVincularFlow(false); }} className="card-clickable w-full p-6 flex items-center gap-6">
                            <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent"><Store size={24}/></div>
                            <h2 className="heading-2 text-lg tracking-widest">{txt('scan.mini')}</h2>
                        </button>
                        <button onClick={() => { setPurchaseMode('manual'); startAnalysis(false); }} className="btn-secondary py-6 uppercase tracking-widest text-[10px] font-black"><Edit3 size={18}/> {txt('scan.manual')}</button>
                    </div>
                )}
            </div>

            {/* OVERLAY DE CARGA TICKET */}
            {(purchaseMode === 'super' || purchaseMode === 'mini') && !pendingGasto && (
                <div className="modal-content-full z-[1000] justify-center gap-10">
                    <h2 className="heading-1 text-center">{txt('scan.title')}</h2>
                    <div className="card-premium border-dashed border-2 border-brand-secondary/30 h-72 flex flex-col items-center justify-center gap-4 relative overflow-hidden bg-brand-secondary/5">
                        {tempPhotos.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 w-full p-4 h-full">
                                {tempPhotos.map((p, i) => (
                                    <div key={i} className="relative h-full rounded-2xl overflow-hidden shadow-xl">
                                        <img src={p} className="w-full h-full object-cover" />
                                        <button onClick={() => setTempPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1.5 bg-brand-danger rounded-full text-white shadow-lg"><X size={12} strokeWidth={3}/></button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center"><Camera size={48} className="text-brand-primary mx-auto mb-4"/><p className="text-small-caps">{txt('scan.add_photo')}</p></div>
                        )}
                        <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            files.forEach(file => {
                                const r = new FileReader();
                                r.onloadend = async () => { const comp = await compressImage(r.result as string, 800, 0.6); setTempPhotos(prev => [...prev, comp]); };
                                r.readAsDataURL(file);
                            });
                        }}/>
                    </div>
                    <button onClick={() => isVincularFlow ? startAnalysis(true) : (db.lista.filter(l => !l.confirmed).length > 0 ? setShowListDialog(true) : startAnalysis(false))} disabled={tempPhotos.length === 0 || loading} className="btn-primary py-5 uppercase tracking-widest text-xs">
                        {loading ? <Loader2 className="animate-spin" /> : txt('scan.process')}
                    </button>
                    <button onClick={() => {setPurchaseMode(null); setIsVincularFlow(false); setTempPhotos([]); setActiveTab('home');}} className="btn-secondary border-none bg-transparent text-brand-danger font-black">{txt('common.cancel')}</button>
                </div>
            )}

            {/* MODAL: REVISIÓN GASTO */}
            {pendingGasto && (
                <div className="modal-content-full pb-32">
                    <h2 className="heading-1 mb-10 text-center text-brand-primary tracking-widest">{txt('review.title')}</h2>
                    <div className="space-y-8 flex-1">
                        <div>
                            <label className="text-small-caps ml-2 mb-3 block">{txt('review.shop')}</label>
                            <div className="relative">
                                <input value={String(pendingGasto.comercio || "")} onFocus={() => setShowComercioSuggestions(true)} onChange={e => setPendingGasto({...pendingGasto, comercio: e.target.value})} className="input-premium font-black uppercase text-xl" />
                                {showComercioSuggestions && filteredComercios.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-3 card-premium z-[1100] p-3 max-h-52 overflow-y-auto border-brand-primary/20">
                                        {filteredComercios.map((c, i) => (<button key={i} onClick={() => { setPendingGasto({...pendingGasto, comercio: c}); setShowComercioSuggestions(false); }} className="w-full text-left p-4 hover:bg-brand-primary/10 rounded-2xl text-[10px] font-black text-white uppercase border-b border-white/5 last:border-none tracking-widest">{c}</button>))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-small-caps ml-2 mb-3 block">{txt('review.date')}</label><input value={pendingGasto.fecha} onChange={e => setPendingGasto({...pendingGasto, fecha: e.target.value})} className="input-premium text-center font-bold" /></div>
                            <div><label className="text-small-caps ml-2 mb-3 block">{txt('review.total')}</label><input type="number" value={pendingGasto.total} onChange={e => setPendingGasto({...pendingGasto, total: e.target.value})} className="input-premium text-center font-black text-brand-success text-2xl tracking-tighter" /></div>
                        </div>
                        
                        <div className="card-premium p-4 bg-white/[0.02] border-none">
                            {!isManualExpanded ? (
                                <button onClick={() => setIsManualExpanded(true)} className="w-full py-2 text-small-caps text-brand-primary">+ {txt('review.add_manual')}</button>
                            ) : (
                                <div className="space-y-4 animate-in fade-in zoom-in-95">
                                    <div className="grid grid-cols-3 gap-3">
                                        <input value={manualProd.name} onChange={e => setManualProd({...manualProd, name: e.target.value})} placeholder="Producto..." className="bg-brand-bg/50 p-4 rounded-xl text-xs text-white outline-none border border-white/5 col-span-2 uppercase font-bold" />
                                        <input value={manualProd.price} onChange={e => setManualProd({...manualProd, price: e.target.value})} placeholder="0.00" className="bg-brand-bg/50 p-4 rounded-xl text-xs text-right text-white border border-white/5 font-black" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={addManualItem} className="btn-primary flex-1 py-3 text-[10px]">Añadir</button>
                                        <button onClick={() => setIsManualExpanded(false)} className="btn-secondary w-12 p-0"><X size={18}/></button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 pt-6 pr-2">
                            {pendingGasto.productos?.map((p:any, i:number) => (
                                <div key={i} className="flex justify-between items-center py-4 border-b border-white/[0.03]">
                                    <div className="flex-1 pr-4">
                                        <p className="text-[11px] font-black uppercase text-white/80 leading-tight">{p.nombre_base || "..."}</p>
                                    </div>
                                    <p className="font-black italic text-brand-success tracking-tighter">{(Number(p.subtotal)).toFixed(2)}€</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-12 space-y-4">
                        <button onClick={saveConfirmedGasto} className="btn-primary py-6 text-sm bg-brand-success text-brand-bg shadow-2xl tracking-widest uppercase">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : <div className="flex items-center justify-center gap-3"><Check size={24} strokeWidth={4} /> {txt('review.finish')}</div>}
                        </button>
                        <button onClick={resetFlow} className="btn-secondary border-none text-brand-danger font-black uppercase text-[10px] tracking-widest">{txt('review.discard')}</button>
                    </div>
                </div>
            )}

            {/* MODAL: CONFLICTO LISTA */}
{/* MODAL: CONFLICTO LISTA */}
{showListDialog && (
    /* Añadimos z-[2000] para que flote sobre la carga de fotos */
    <div className="modal-overlay z-[2000]">
        <div className="card-premium w-full text-center space-y-8 p-10 border-brand-primary/20">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl mx-auto flex items-center justify-center text-brand-primary">
                <AlertTriangle size={40} strokeWidth={2.5}/>
            </div>
            
            <h2 className="heading-2 tracking-widest">{txt('modals.link_list_title')}</h2>
            <p className="text-xs font-bold text-brand-muted uppercase leading-relaxed px-4">
                {txt('modals.link_list_msg')}
            </p>

            <div className="space-y-3">
                {/* Verifica que las llaves aquí coincidan con i18n.ts (minúsculas) */}
                <button onClick={() => startAnalysis(true)} className="btn-primary py-5 text-[10px]">
                    {txt('modals.yes_link')}
                </button>
                <button onClick={() => startAnalysis(false)} className="btn-secondary py-5 text-[10px]">
                    {txt('modals.no_link')}
                </button>
                <button onClick={() => setShowListDialog(false)} className="text-[10px] font-black text-brand-muted py-4 block mx-auto uppercase tracking-widest">
                    {txt('common.cancel')}
                </button>
            </div>
        </div>
    </div>
)}

            {/* DETALLE GASTO HISTORIAL */}
            {selectedGasto && (
                <div className="modal-content-full">
                    <div className="flex justify-between items-start mb-10">
                        <button onClick={() => setSelectedGasto(null)} className="btn-icon"><ChevronLeft size={24}/></button>
                        <button onClick={() => deleteGasto(selectedGasto)} className="btn-icon text-brand-danger/40 bg-brand-danger/10 border-none"><Trash2 size={24}/></button>
                    </div>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-brand-primary mb-3 leading-none">{selectedGasto.comercio}</h2>
                    <p className="text-small-caps mb-12">{selectedGasto.fecha}</p>
                    <div className="flex-1 space-y-6 overflow-y-auto pr-4">
                        {selectedGasto.productos?.map((p:any, i:number) => (
                            <div key={i} className="flex justify-between items-center py-4 border-b border-white/[0.03]">
                                <div className="flex-1 pr-4"><p className="text-[11px] font-black uppercase text-white/70">{p.nombre_base}</p></div>
                                <span className="font-black italic text-brand-success tracking-tighter">{(Number(p.subtotal)).toFixed(2)}€</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 pt-10 border-t border-white/10 flex justify-between items-end">
                        <span className="text-small-caps">{txt('review.total')}</span>
                        <span className="text-6xl font-black italic text-white">{(Number(selectedGasto.total)).toFixed(2)}€</span>
                    </div>
                    <div className="mt-12 flex gap-3 overflow-x-auto pb-4">
                        {selectedGasto.photoIds?.map((id: string, idx: number) => (
                            <button key={idx} onClick={async () => { setLoading(true); const url = await getDriveFileBlob(user.token, id); if (url) setViewerUrl(url); setLoading(false); }} className="btn-secondary flex-none w-40 py-4 text-[10px] font-black uppercase tracking-widest"><ImageIcon size={16}/> Ticket {idx+1}</button>
                        ))}
                    </div>
                </div>
            )}

            {viewerUrl && (
                <div className="modal-overlay p-4 z-[2000] animate-in fade-in">
                    <button onClick={() => setViewerUrl(null)} className="absolute top-10 right-10 btn-icon bg-white/10 backdrop-blur-xl border-white/20 z-[600]"><X size={32}/></button>
                    <img src={viewerUrl} className="max-w-full max-h-[85vh] rounded-[2.5rem] shadow-2xl object-contain border border-white/10 animate-fade" alt="Ticket" />
                </div>
            )}

            {/* NAV BAR */}
            <nav className="nav-bottom">
                <button onClick={() => { setActiveTab('home'); setPurchaseMode(null); setIsVincularFlow(false); }} className={`p-4 rounded-2xl transition-all duration-300 ${activeTab === 'home' ? 'text-brand-primary bg-brand-primary/10' : 'text-brand-muted opacity-30'}`}><LayoutGrid size={26}/></button>
                <button onClick={() => {setActiveTab('add'); setPendingGasto(null); setPurchaseMode(null); setIsVincularFlow(false);}} className={`w-16 h-16 bg-brand-primary rounded-[1.8rem] flex items-center justify-center text-white shadow-[0_15px_35px_rgba(93,46,239,0.5)] active:scale-90 transition-all ${activeTab === 'add' ? 'rotate-45 shadow-brand-primary/20' : ''}`}><Plus size={32} strokeWidth={3}/></button>
                <button onClick={() => {setActiveTab('list'); setPurchaseMode(null); setIsVincularFlow(false);}} className={`p-4 rounded-2xl transition-all duration-300 ${activeTab === 'list' ? 'text-brand-primary bg-brand-primary/10' : 'text-brand-muted opacity-30'}`}><History size={26}/></button>
            </nav>

            {/* CARGADOR GLOBAL */}
            {loading && <div className="fixed inset-0 z-[2000] bg-brand-bg/60 backdrop-blur-md flex items-center justify-center"><Loader2 className="animate-spin text-brand-primary" size={56} strokeWidth={3}/></div>}
        </main>
    );
}