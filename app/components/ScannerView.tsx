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
  ChevronRight
} from 'lucide-react';
import { compressImage } from '../../lib/utils';

interface ScannerViewProps {
  db: { lista: any[], gastos: any[], customCategories?: string[] };
  updateAndSync: (newDb: any) => Promise<void>;
  setPurchaseMode: (mode: string | null) => void;
  startAnalysis: (useList: boolean) => void; 
  txt: (key: string) => string;
}

// Definimos el tipo para soportar el sub-componente Capture
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
    
    // Si la categoría no existe, la añadimos al DB
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
    <div className="space-y-4 py-4 animate-in slide-in-from-bottom-8 duration-500 no-scrollbar">
      <div className="px-1 mb-2">
        <h2 className="heading-1 !text-fluid-lg">{txt('scan.title')}</h2>
        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">
            {txt('scan.subtitle')}
        </p>
      </div>

      {!showOthers ? (
        <>
          {/* CATEGORÍAS ESTÁNDAR */}
          <button 
            onClick={() => selectMode('super')} 
            className="card-clickable w-full !p-6 flex items-center gap-6 group overflow-hidden relative"
          >
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
              <ShoppingCart size={32} strokeWidth={2.5}/>
            </div>
            <div className="text-left">
              <h2 className="heading-2 !text-sm tracking-widest">{txt('scan.super')}</h2>
              <p className="text-[9px] font-bold text-brand-muted uppercase mt-1">Grandes superficies</p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-white">
                <ShoppingCart size={80} />
            </div>
          </button>

          <button 
            onClick={() => selectMode('mini')} 
            className="card-clickable w-full !p-5 flex items-center gap-6 group overflow-hidden relative"
          >
            <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform">
              <Store size={24}/>
            </div>
            <div className="text-left">
              <h2 className="heading-2 !text-xs tracking-widest">{txt('scan.mini')}</h2>
              <p className="text-[9px] font-bold text-brand-muted uppercase mt-0.5">Tiendas de barrio</p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-white">
                <Store size={40} />
            </div>
          </button>

          <button 
            onClick={() => selectMode('dining')} 
            className="card-clickable w-full !p-5 flex items-center gap-6 group overflow-hidden relative"
          >
            <div className="w-12 h-12 bg-orange-400/10 rounded-xl flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
              <Utensils size={24}/>
            </div>
            <div className="text-left">
              <h2 className="heading-2 !text-xs tracking-widest">{txt('scan.dining')}</h2>
              <p className="text-[9px] font-bold text-brand-muted uppercase mt-0.5">Consumo fuera de casa</p>
            </div>
          </button>

          <button 
            onClick={() => selectMode('health')} 
            className="card-clickable w-full !p-5 flex items-center gap-6 group overflow-hidden relative"
          >
            <div className="w-12 h-12 bg-emerald-400/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Pill size={24}/>
            </div>
            <div className="text-left">
              <h2 className="heading-2 !text-xs tracking-widest">{txt('scan.health')}</h2>
              <p className="text-[9px] font-bold text-brand-muted uppercase mt-0.5">Gastos médicos</p>
            </div>
          </button>

          {/* BOTÓN PARA ABRIR OTROS */}
          <button 
            onClick={() => setShowOthers(true)} 
            className="card-clickable w-full !p-5 flex items-center gap-6 group overflow-hidden relative"
          >
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-brand-muted group-hover:scale-110 transition-transform">
              <LayoutGrid size={24}/>
            </div>
            <div className="text-left">
              <h2 className="heading-2 !text-xs tracking-widest">{txt('scan.others')}</h2>
              <p className="text-[9px] font-bold text-brand-muted uppercase mt-0.5">Varios / Personalizados</p>
            </div>
            <ChevronRight size={18} className="ml-auto text-brand-muted opacity-30" />
          </button>
        </>
      ) : (
        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setShowOthers(false)} className="btn-icon !p-1.5 border-none bg-white/5">
              <X size={18} />
            </button>
            <span className="text-small-caps">Categorías Personalizadas</span>
          </div>

          {/* INPUT PARA NUEVA CATEGORÍA */}
          <div className="relative mb-6">
            <input 
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder={txt('scan.custom_cat_placeholder')}
              className="input-premium pr-14 uppercase"
            />
            <button 
              onClick={handleAddCustomCategory}
              className="absolute right-2 top-2 p-2.5 bg-brand-primary rounded-xl text-white shadow-lg active:scale-90 transition-all"
            >
              <Plus size={20} strokeWidth={3}/>
            </button>
          </div>

          {/* LISTA DE CATEGORÍAS GUARDADAS */}
          <div className="grid grid-cols-1 gap-2">
            {customCategories.length > 0 ? (
              customCategories.map((cat, i) => (
                <button 
                  key={i} 
                  onClick={() => selectMode(cat)}
                  className="w-full flex items-center justify-between p-4 card-premium bg-white/[0.03] border-white/5 active:bg-brand-primary/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Tag size={16} className="text-brand-primary" />
                    <span className="text-[11px] font-black uppercase text-white">{cat}</span>
                  </div>
                  <ChevronRight size={14} className="text-brand-muted opacity-20" />
                </button>
              ))
            ) : (
              <div className="py-8 text-center opacity-30">
                <p className="text-[9px] font-bold uppercase tracking-widest">No hay categorías guardadas</p>
              </div>
            )}
            
            {/* Categoría "Otros" por defecto si no quiere crear una específica */}
            <button 
              onClick={() => selectMode('others')}
              className="w-full flex items-center justify-between p-4 card-premium bg-brand-secondary/20 border-dashed border-white/10"
            >
              <div className="flex items-center gap-3">
                <LayoutGrid size={16} className="text-brand-muted" />
                <span className="text-[11px] font-black uppercase text-brand-muted italic">{txt('scan.others')}</span>
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
        className="btn-secondary !py-5 !bg-transparent border-dashed border-white/10 text-brand-muted hover:border-brand-primary hover:text-white transition-all active:scale-95"
      >
        <Edit3 size={18}/> 
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{txt('scan.manual')}</span>
      </button>
    </div>
  );
};

// --- SUB-COMPONENTE: CAPTURA DE FOTOS (Sin cambios estructurales, solo integración) ---
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
    <div className="w-full flex flex-col gap-5 animate-in fade-in zoom-in-95 no-scrollbar">
      <div className="text-center">
        <h2 className="heading-1 !text-fluid-xl mb-1 tracking-tighter">
            {txt('scan.capture_title')}
        </h2>
      </div>

      <div className="card-premium !p-4 bg-brand-primary/5 border-brand-primary/20 flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary shrink-0">
              <Sparkles size={20} />
          </div>
          <div>
              <p className="text-[10px] font-black uppercase text-white tracking-widest">{txt('scan.tip_title')}</p>
              <p className="text-[8px] font-bold text-brand-muted uppercase leading-relaxed mt-0.5">
                  {txt('scan.tip_desc')}
              </p>
          </div>
      </div>

      {tempPhotos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
          {tempPhotos.map((p: string, i: number) => (
            <div key={i} className="relative aspect-[3/4] flex-none w-24 rounded-xl overflow-hidden border border-white/20 shadow-2xl animate-in scale-up">
              <img src={p} className="w-full h-full object-cover" alt="Ticket part" />
              <button 
                  onClick={() => setTempPhotos((prev: any) => prev.filter((_: any, idx: any) => idx !== i))} 
                  className="absolute top-1 right-1 p-1 bg-brand-danger rounded-lg text-white shadow-lg"
              >
                <X size={10} strokeWidth={4}/>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-[2.5rem] bg-brand-primary/10 border border-brand-primary/20 active:scale-95 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-primary/20">
                <Camera size={32} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary">
                {txt('scan.take_photo')}
            </span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          </label>

          <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 active:scale-95 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-brand-secondary rounded-2xl flex items-center justify-center text-brand-muted">
                <ImageIcon size={32} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-muted">
                {txt('scan.gallery')}
            </span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
          </label>
      </div>

      <div className="space-y-3 mt-4">
        <button 
          onClick={handleProcessClick} 
          disabled={tempPhotos.length === 0 || loading} 
          className="btn-primary !py-5 shadow-[0_15px_35px_rgba(16,185,129,0.2)] !bg-brand-success text-brand-bg disabled:opacity-10"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <div className="flex items-center gap-3">
               <CheckCircle2 size={20} />
               <span>{txt('scan.process')}</span>
            </div>
          )}
        </button>
        
        <button onClick={onCancel} className="btn-secondary !bg-transparent border-none text-brand-danger !text-[10px] !lowercase opacity-60 font-black">
          {txt('scan.cancel')}
        </button>
      </div>

      {showListDialog && (
        <div className="modal-overlay z-[2000] !p-6">
          <div className="card-premium w-full text-center space-y-6 !p-8 border-brand-primary/20 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl mx-auto flex items-center justify-center text-brand-primary">
              <AlertTriangle size={32} strokeWidth={2.5}/>
            </div>
            <div className="space-y-2">
              <h2 className="heading-2 !text-sm tracking-widest">{txt('modals.link_list_title')}</h2>
              <p className="text-[10px] font-bold text-brand-muted uppercase leading-relaxed">
                {txt('modals.link_list_desc')}
              </p>
            </div>
            <div className="space-y-2">
              <button onClick={() => startAnalysis(true)} className="btn-primary !py-4 !text-[10px]">
                {txt('modals.yes_link')}
              </button>
              <button onClick={() => startAnalysis(false)} className="btn-secondary !py-4 !text-[10px]">
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