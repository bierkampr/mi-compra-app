"use client";
import React, { useState } from 'react';
import { 
  Camera, ShoppingCart, Store, Utensils, Pill, LayoutGrid, Edit3, X, Loader2, 
  AlertTriangle, Image as ImageIcon, Sparkles, CheckCircle2, Plus, Tag, ChevronRight, ChevronLeft 
} from 'lucide-react';
import { compressImage } from '../../lib/utils';

interface ScannerViewProps {
  db: { lista: any[], gastos: any[], customCategories?: string[] };
  updateAndSync: (newDb: any) => Promise<void>;
  setPurchaseMode: (mode: string | null) => void;
  startAnalysis: (useList: boolean) => void; 
  txt: (key: string) => string;
}

interface ScannerViewComponent extends React.FC<ScannerViewProps> {
  Capture: React.FC<any>;
}

const ScannerView: ScannerViewComponent = ({ db, updateAndSync, setPurchaseMode, startAnalysis, txt }) => {
  const [showOthers, setShowOthers] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const customCategories = db.customCategories || [];

  const handleAddCustomCategory = async () => {
    const val = newCatName.trim().toUpperCase();
    if (!val) return;
    
    if (!customCategories.includes(val)) {
      const newDb = {
        ...db,
        customCategories: [...customCategories, val]
      };
      await updateAndSync(newDb);
    }
    
    setPurchaseMode(val);
    setNewCatName("");
  };

  const selectMode = (mode: string) => {
    setPurchaseMode(mode);
  };

  return (
    <div className="space-y-6 py-4 animate-in slide-in-from-bottom-8 duration-500 no-scrollbar max-w-2xl mx-auto">
      <div className="text-center px-1 lg:mb-6">
        <h2 className="heading-1 !text-3xl lg:!text-4xl uppercase font-black italic">{txt('scan.title')}</h2>
        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.3em]">
            {txt('scan.subtitle')}
        </p>
      </div>

      {!showOthers ? (
        <div className="space-y-3">
          {/* CATEGORÍA PRINCIPAL: SUPERMERCADO (SIEMPRE GRANDE) */}
          <button 
            onClick={() => selectMode('super')} 
            className="card-clickable w-full !p-6 lg:!p-8 flex items-center gap-6 group overflow-hidden relative"
          >
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
              <ShoppingCart size={32} strokeWidth={2.5}/>
            </div>
            <div className="text-left relative z-10">
              <h2 className="text-sm lg:text-lg font-black uppercase tracking-widest text-white">{txt('scan.super')}</h2>
              <p className="text-[9px] font-bold text-brand-muted uppercase mt-0.5">Grandes superficies</p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-white"><ShoppingCart size={80} /></div>
          </button>

          {/* GRID SECUNDARIO: 2X2 TANTO EN MÓVIL COMO EN ESCRITORIO CONTROLADO */}
          <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={() => selectMode('mini')} 
                className="card-clickable !p-5 flex flex-col items-center justify-center text-center gap-3 group relative overflow-hidden"
            >
                <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform">
                    <Store size={24}/>
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white">{txt('scan.mini')}</h2>
                <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-white"><Store size={40} /></div>
            </button>

            <button 
                onClick={() => selectMode('dining')} 
                className="card-clickable !p-5 flex flex-col items-center justify-center text-center gap-3 group relative overflow-hidden"
            >
                <div className="w-12 h-12 bg-orange-400/10 rounded-xl flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                    <Utensils size={24}/>
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white">{txt('scan.dining')}</h2>
                <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-white"><Utensils size={40} /></div>
            </button>

            <button 
                onClick={() => selectMode('health')} 
                className="card-clickable !p-5 flex flex-col items-center justify-center text-center gap-3 group relative overflow-hidden"
            >
                <div className="w-12 h-12 bg-emerald-400/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Pill size={24}/>
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white">{txt('scan.health')}</h2>
                <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-white"><Pill size={40} /></div>
            </button>

            <button 
                onClick={() => setShowOthers(true)} 
                className="card-clickable !p-5 flex flex-col items-center justify-center text-center gap-3 group relative overflow-hidden bg-brand-secondary/20 border-dashed border-white/10"
            >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-brand-muted group-hover:scale-110 transition-transform">
                    <LayoutGrid size={24}/>
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white">{txt('scan.others')}</h2>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 w-full">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setShowOthers(false)} className="btn-icon !p-1.5 border-none bg-white/5"><ChevronLeft size={18} /></button>
            <span className="text-small-caps">Categorías Personalizadas</span>
          </div>

          <div className="relative mb-8">
            <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="AÑADIR..." className="input-premium pr-14 !py-5 uppercase" />
            <button onClick={handleAddCustomCategory} className="absolute right-2 top-2 p-3 bg-brand-primary rounded-xl text-white shadow-lg active:scale-90 transition-all"><Plus size={24}/></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customCategories.map((cat, i) => (
                <button key={i} onClick={() => selectMode(cat)} className="w-full flex items-center justify-between p-5 card-premium bg-white/[0.03] border-white/5 active:bg-brand-primary/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Tag size={18} className="text-brand-primary" />
                    <span className="text-[11px] lg:text-[13px] font-black uppercase text-white tracking-widest">{cat}</span>
                  </div>
                  <ChevronRight size={16} className="text-brand-muted opacity-20" />
                </button>
            ))}
            
            <button 
              onClick={() => selectMode('others')}
              className="w-full flex items-center justify-between p-5 card-premium bg-brand-secondary/20 border-dashed border-white/10"
            >
              <div className="flex items-center gap-3">
                <LayoutGrid size={18} className="text-brand-muted" />
                <span className="text-[11px] lg:text-[13px] font-black uppercase text-brand-muted italic">{txt('scan.others')}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* OPCIÓN: MANUAL */}
      <button 
        onClick={() => {
            setPurchaseMode('manual');
            startAnalysis(false); 
        }} 
        className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-brand-muted font-black text-[10px] uppercase hover:text-white transition-all active:scale-95"
      >
        <Edit3 size={18}/> 
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{txt('scan.manual')}</span>
      </button>
    </div>
  );
};

// --- SUB-COMPONENTE: CAPTURA ---
ScannerView.Capture = ({ tempPhotos, setTempPhotos, loading, startAnalysis, db, setShowListDialog, showListDialog, onCancel, txt, activeTab }) => {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const r = new FileReader();
      r.onloadend = async () => { 
        const comp = await compressImage(r.result as string); 
        setTempPhotos((prev: any) => [...prev, comp]); 
      };
      r.readAsDataURL(file);
    });
  };

  const handleProcessClick = () => {
    if (activeTab === 'list') {
      startAnalysis(true);
    } else {
      const hasListItems = db.lista.filter((l: any) => !l.confirmed).length > 0;
      if (hasListItems) setShowListDialog(true);
      else startAnalysis(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center gap-8 lg:gap-12 animate-in fade-in zoom-in-95 no-scrollbar max-w-xl mx-auto">
      <h2 className="heading-1 !text-4xl lg:!text-6xl text-center uppercase font-black italic">{txt('scan.capture_title')}</h2>

      <div className="grid grid-cols-2 gap-6 lg:gap-10">
          <label className="flex flex-col items-center justify-center gap-6 p-10 lg:p-16 rounded-[3.5rem] bg-brand-primary/5 border border-brand-primary/10 active:scale-95 transition-all cursor-pointer hover:bg-brand-primary/10">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-brand-primary rounded-3xl flex items-center justify-center text-white shadow-xl"><Camera size={40} /></div>
            <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-brand-primary">{txt('scan.take_photo')}</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          </label>
          <label className="flex flex-col items-center justify-center gap-6 p-10 lg:p-16 rounded-[3.5rem] bg-white/[0.02] border border-white/5 active:scale-95 transition-all cursor-pointer hover:bg-white/5">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-brand-secondary rounded-3xl flex items-center justify-center text-brand-muted"><ImageIcon size={40} /></div>
            <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-brand-muted">{txt('scan.gallery')}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
          </label>
      </div>

      {tempPhotos.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-1 max-w-xl mx-auto">
          {tempPhotos.map((p: any, i: number) => (
            <div key={i} className="relative aspect-[3/4] w-28 lg:w-40 flex-none rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
              <img src={p} className="w-full h-full object-cover" />
              <button onClick={() => setTempPhotos((prev: any) => prev.filter((_: any, idx: any) => idx !== i))} className="absolute top-2 right-2 p-2 bg-brand-danger rounded-xl text-white"><X size={14}/></button>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-sm mx-auto w-full space-y-4">
        <button onClick={handleProcessClick} disabled={tempPhotos.length === 0 || loading} className="btn-primary !py-6 shadow-2xl !bg-brand-success text-brand-bg">
          {loading ? <Loader2 className="animate-spin" /> : <div className="flex items-center gap-3"><CheckCircle2 size={24}/> <span className="text-lg">{txt('scan.process')}</span></div>}
        </button>
        <button onClick={onCancel} className="w-full text-center text-[10px] font-black uppercase text-brand-danger opacity-60">CANCELAR CARGA</button>
      </div>

      {showListDialog && (
        <div className="modal-overlay z-[2000] !p-6">
           <div className="card-premium max-w-sm w-full text-center space-y-8 !p-12 border-brand-primary/20">
              <AlertTriangle size={48} className="mx-auto text-brand-primary" />
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter">¿VINCULAR CON LISTA?</h3>
                <p className="text-[10px] font-bold text-brand-muted uppercase leading-relaxed">{txt('modals.link_list_desc')}</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => startAnalysis(true)} className="btn-primary !py-5">{txt('modals.yes_link')}</button>
                <button onClick={() => startAnalysis(false)} className="btn-secondary !py-5">SOLO TICKET</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ScannerView;