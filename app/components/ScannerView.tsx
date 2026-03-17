"use client";
import React, { useState } from 'react';
import { 
  Camera, 
  ShoppingCart, 
  Store, 
  Utensils, 
  Pill, 
  LayoutGrid, 
  Edit3, 
  X, 
  Loader2, 
  AlertTriangle, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2, 
  Plus,
  Tag,
  ChevronRight,
  ChevronLeft
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
    <div className="space-y-8 py-4 animate-in slide-in-from-bottom-8 duration-500 no-scrollbar max-w-4xl mx-auto">
      <div className="px-1 mb-2 text-center lg:mb-6">
        <h2 className="heading-1 lg:text-5xl">{txt('scan.title')}</h2>
        <p className="text-[10px] lg:text-xs font-bold text-brand-muted uppercase tracking-[0.3em]">
            {txt('scan.subtitle')}
        </p>
      </div>

      {!showOthers ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* SUPERMERCADO: Ocupa todo el ancho en móvil, 7 de 12 en escritorio */}
          <button 
            onClick={() => selectMode('super')} 
            className="lg:col-span-7 card-clickable !p-8 lg:!p-12 flex items-center gap-8 bg-brand-primary/5 border-brand-primary/20 group overflow-hidden relative"
          >
            <div className="w-16 h-16 lg:w-24 lg:h-24 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
              <ShoppingCart size={36} className="lg:w-12 lg:h-12" strokeWidth={2.5}/>
            </div>
            <div className="text-left relative z-10">
              <h2 className="text-xl lg:text-3xl font-black italic tracking-tighter text-white uppercase">{txt('scan.super')}</h2>
              <p className="text-[9px] lg:text-[11px] font-bold text-brand-muted uppercase mt-1">Grandes superficies y alimentación</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-white">
                <ShoppingCart size={150} />
            </div>
          </button>

          {/* TIENDA DE BARRIO: Ocupa el resto en escritorio */}
          <button 
            onClick={() => selectMode('mini')} 
            className="lg:col-span-5 card-clickable !p-8 flex items-center gap-6 group overflow-hidden relative"
          >
            <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform">
              <Store size={28}/>
            </div>
            <div className="text-left relative z-10">
              <h2 className="text-base lg:text-xl font-black uppercase tracking-widest text-white">{txt('scan.mini')}</h2>
              <p className="text-[9px] font-bold text-brand-muted uppercase mt-0.5">Tiendas de barrio</p>
            </div>
          </button>

          {/* BAR / RESTO: Fila inferior escritorio */}
          <button 
            onClick={() => selectMode('dining')} 
            className="lg:col-span-4 card-clickable !p-6 flex flex-col items-center justify-center text-center gap-4 group relative overflow-hidden"
          >
            <div className="w-14 h-14 bg-orange-400/10 rounded-2xl flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
              <Utensils size={28}/>
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-white">{txt('scan.dining')}</h2>
          </button>

          {/* FARMACIA: Fila inferior escritorio */}
          <button 
            onClick={() => selectMode('health')} 
            className="lg:col-span-4 card-clickable !p-6 flex flex-col items-center justify-center text-center gap-4 group relative overflow-hidden"
          >
            <div className="w-14 h-14 bg-emerald-400/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Pill size={28}/>
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-white">{txt('scan.health')}</h2>
          </button>

          {/* OTROS: Fila inferior escritorio */}
          <button 
            onClick={() => setShowOthers(true)} 
            className="lg:col-span-4 card-clickable !p-6 flex flex-col items-center justify-center text-center gap-4 group relative overflow-hidden border-dashed border-white/10"
          >
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-brand-muted group-hover:scale-110 transition-transform">
              <LayoutGrid size={28}/>
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-white">{txt('scan.others')}</h2>
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setShowOthers(false)} className="btn-icon !p-1.5 border-none bg-white/5">
              <ChevronLeft size={18} />
            </button>
            <span className="text-small-caps">Categorías Personalizadas</span>
          </div>

          <div className="relative mb-8">
            <input 
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder={txt('scan.custom_cat_placeholder')}
              className="input-premium pr-14 !py-5 uppercase lg:text-lg"
            />
            <button 
              onClick={handleAddCustomCategory}
              className="absolute right-2 top-2 p-3 bg-brand-primary rounded-xl text-white shadow-lg active:scale-90 transition-all"
            >
              <Plus size={24} strokeWidth={3}/>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customCategories.map((cat, i) => (
                <button 
                  key={i} 
                  onClick={() => selectMode(cat)}
                  className="w-full flex items-center justify-between p-5 card-premium bg-white/[0.03] border-white/5 active:bg-brand-primary/10 transition-colors"
                >
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
                <span className="text-[11px] font-black uppercase text-brand-muted italic">{txt('scan.others')}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* OPCIÓN: MANUAL */}
      <div className="max-w-xs mx-auto w-full pt-10">
        <button 
          onClick={() => {
              setPurchaseMode('manual');
              startAnalysis(false); 
          }} 
          className="btn-secondary !py-5 !bg-transparent border-dashed border-white/10 text-brand-muted hover:border-brand-primary hover:text-white transition-all active:scale-95"
        >
          <Edit3 size={18}/> 
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{txt('scan.manual')}</span>
        </button>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTE: CAPTURA ---
ScannerView.Capture = ({ 
  tempPhotos, setTempPhotos, loading, startAnalysis, db, 
  setShowListDialog, showListDialog, onCancel, txt, activeTab 
}) => {
  
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const r = new FileReader();
      r.onloadend = async () => { 
        const comp = await compressImage(r.result as string); 
        setTempPhotos((prev: string[]) => [...prev, comp]); 
      };
      r.readAsDataURL(file);
    });
  };

  const handleProcessClick = () => {
    if (activeTab === 'list') {
      startAnalysis(true);
    } else {
      const hasListItems = db.lista.filter((l: any) => !l.confirmed).length > 0;
      if (hasListItems) {
        setShowListDialog(true);
      } else {
        startAnalysis(false);
      }
    }
  };

  return (
    <div className="w-full flex flex-col justify-center gap-8 lg:gap-12 animate-in fade-in zoom-in-95 no-scrollbar">
      <div className="text-center">
        <h2 className="heading-1 lg:text-7xl mb-1 tracking-tighter">
            {txt('scan.capture_title')}
        </h2>
      </div>

      {/* BOTONES DE ACCIÓN DE CÁMARA */}
      <div className="grid grid-cols-2 gap-6 lg:gap-10 max-w-2xl mx-auto w-full">
          <label className="flex flex-col items-center justify-center gap-6 p-10 lg:p-16 rounded-[3.5rem] bg-brand-primary/5 border border-brand-primary/10 active:scale-95 transition-all cursor-pointer hover:bg-brand-primary/10">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-brand-primary rounded-3xl flex items-center justify-center text-white shadow-xl">
                <Camera size={40} />
            </div>
            <span className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-brand-primary">
                {txt('scan.take_photo')}
            </span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          </label>

          <label className="flex flex-col items-center justify-center gap-6 p-10 lg:p-16 rounded-[3.5rem] bg-white/[0.02] border border-white/5 active:scale-95 transition-all cursor-pointer hover:bg-white/[0.05]">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-brand-secondary rounded-3xl flex items-center justify-center text-brand-muted">
                <ImageIcon size={40} />
            </div>
            <span className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-brand-muted">
                {txt('scan.gallery')}
            </span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
          </label>
      </div>

      {/* Galería de vistas previas */}
      {tempPhotos.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2 max-w-xl mx-auto">
          {tempPhotos.map((p: string, i: number) => (
            <div key={i} className="relative aspect-[3/4] flex-none w-28 lg:w-40 rounded-2xl overflow-hidden border border-white/20 shadow-2xl animate-in scale-up">
              <img src={p} className="w-full h-full object-cover" alt="Ticket part" />
              <button 
                  onClick={() => setTempPhotos((prev: any) => prev.filter((_: any, idx: any) => idx !== i))} 
                  className="absolute top-2 right-2 p-2 bg-brand-danger rounded-xl text-white shadow-lg"
              >
                <X size={14} strokeWidth={4}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Procesar compra */}
      <div className="space-y-4 mt-4 max-w-sm mx-auto w-full">
        <button 
          onClick={handleProcessClick} 
          disabled={tempPhotos.length === 0 || loading} 
          className="btn-primary !py-6 shadow-2xl !bg-brand-success text-brand-bg disabled:opacity-20"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <div className="flex items-center gap-3">
               <CheckCircle2 size={24} />
               <span className="text-lg">{txt('scan.process')}</span>
            </div>
          )}
        </button>
        
        <button onClick={onCancel} className="w-full text-center text-[10px] font-black uppercase text-brand-danger opacity-60">
          CANCELAR CARGA
        </button>
      </div>

      {/* Diálogo de vinculación */}
      {showListDialog && (
        <div className="modal-overlay z-[2000] !p-6">
          <div className="card-premium w-full max-w-sm text-center space-y-8 !p-12 border-brand-primary/20 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl mx-auto flex items-center justify-center text-brand-primary">
              <AlertTriangle size={40} strokeWidth={2.5}/>
            </div>
            <div className="space-y-2">
              <h2 className="heading-2 !text-lg tracking-widest">{txt('modals.link_list_title')}</h2>
              <p className="text-[10px] font-bold text-brand-muted uppercase leading-relaxed">
                {txt('modals.link_list_desc')}
              </p>
            </div>
            <div className="space-y-3">
              <button onClick={() => startAnalysis(true)} className="btn-primary !py-5">
                {txt('modals.yes_link')}
              </button>
              <button onClick={() => startAnalysis(false)} className="btn-secondary !py-5">
                {txt('modals.no_link')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerView;