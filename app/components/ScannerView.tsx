"use client";
import React from 'react';
import { Camera, ShoppingCart, Store, Edit3, X, Plus, Loader2, AlertTriangle, Image as ImageIcon, Layout } from 'lucide-react';
import { compressImage } from '../../lib/utils';

interface ScannerViewProps {
  setPurchaseMode: (mode: 'super' | 'mini' | 'manual' | null) => void;
  txt: (key: string) => string;
}

const ScannerView: React.FC<ScannerViewProps> & { Capture: React.FC<any> } = ({ setPurchaseMode, txt }) => {
  return (
    <div className="space-y-4 py-4 animate-in slide-in-from-bottom-8 duration-500">
      <div className="px-1 mb-2">
        <h2 className="heading-1 !text-fluid-lg">{txt('scan.title')}</h2>
        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Elige el tipo de compra</p>
      </div>

      <button 
        onClick={() => setPurchaseMode('super')} 
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
        onClick={() => setPurchaseMode('mini')} 
        className="card-clickable w-full !p-5 flex items-center gap-6 group overflow-hidden relative"
      >
        <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform">
          <Store size={24}/>
        </div>
        <div className="text-left">
          <h2 className="heading-2 !text-xs tracking-widest">{txt('scan.mini')}</h2>
          <p className="text-[9px] font-bold text-brand-muted uppercase mt-0.5">Tiendas de barrio</p>
        </div>
      </button>

      <button 
        onClick={() => setPurchaseMode('manual')} 
        className="btn-secondary !py-5 !bg-transparent border-dashed border-white/10 text-brand-muted hover:border-brand-primary hover:text-white"
      >
        <Edit3 size={18}/> 
        <span className="text-[10px] tracking-[0.2em]">{txt('scan.manual')}</span>
      </button>
    </div>
  );
};

// --- SUB-COMPONENTE DE CAPTURA DE FOTOS (REDISEÑADO) ---
ScannerView.Capture = ({ 
  tempPhotos, setTempPhotos, loading, startAnalysis, db, 
  setShowListDialog, showListDialog, onCancel, txt 
}) => {
  
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const r = new FileReader();
      r.onloadend = async () => { 
        // Comprimimos inmediatamente a 600px para evitar errores 429
        const comp = await compressImage(r.result as string); 
        setTempPhotos((prev: string[]) => [...prev, comp]); 
      };
      r.readAsDataURL(file);
    });
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in zoom-in-95">
      <div className="text-center">
        <h2 className="heading-1 !text-fluid-xl mb-1">CARGAR TICKET</h2>
        <p className="text-small-caps opacity-40 italic">Para tickets largos, toma varias fotos</p>
      </div>

      {/* ZONA DE CARGA CON DOBLE BOTÓN */}
      <div className={`card-premium !p-2 border-dashed border-2 min-h-[250px] flex flex-col items-center justify-center relative ${
        tempPhotos.length > 0 ? 'border-brand-primary/30 bg-brand-primary/[0.02]' : 'border-brand-secondary/30 bg-brand-secondary/5'
      }`}>
        {tempPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 w-full p-2">
            {tempPhotos.map((p: string, i: number) => (
              <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 shadow-xl">
                <img src={p} className="w-full h-full object-cover" alt="Ticket" />
                <button 
                    onClick={() => setTempPhotos((prev: any) => prev.filter((_: any, idx: any) => idx !== i))} 
                    className="absolute top-1.5 right-1.5 p-1.5 bg-brand-danger rounded-lg text-white shadow-lg active:scale-90"
                >
                  <X size={12} strokeWidth={4}/>
                </button>
              </div>
            ))}
            {/* Botón rápido para añadir más fotos una vez ya hay una */}
            <label className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-brand-primary/20 flex flex-col items-center justify-center gap-1 cursor-pointer bg-brand-primary/5 active:bg-brand-primary/10">
                <Plus size={20} className="text-brand-primary" />
                <span className="text-[7px] font-black uppercase text-brand-primary">Añadir más</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full p-4">
             {/* BOTÓN CÁMARA: Forzado con capture="environment" */}
             <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-[2.5rem] bg-brand-primary/10 border border-brand-primary/20 active:scale-95 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                    <Camera size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Cámara</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
             </label>

             {/* BOTÓN GALERÍA: Estándar */}
             <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 active:scale-95 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-brand-secondary rounded-2xl flex items-center justify-center text-brand-muted">
                    <ImageIcon size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Galería</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
             </label>
          </div>
        )}
      </div>

      {/* ACCIÓN DE PROCESAMIENTO */}
      <div className="space-y-3 pt-4">
        <button 
          onClick={() => {
            const hasList = db.lista.filter((l: any) => !l.confirmed).length > 0;
            if (hasList) setShowListDialog(true);
            else startAnalysis(false);
          }} 
          disabled={tempPhotos.length === 0 || loading} 
          className="btn-primary !py-5 shadow-[0_15px_35px_rgba(16,185,129,0.2)] !bg-brand-success text-brand-bg hover:opacity-90 disabled:bg-brand-muted disabled:opacity-20"
        >
          {loading ? (
            <div className="flex items-center gap-3">
               <Loader2 className="animate-spin" size={20} />
               <span>Analizando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
               <Layout size={18}/> 
               <span>PROCESAR COMPRA ⚡</span>
            </div>
          )}
        </button>
        
        <button onClick={onCancel} className="btn-secondary !bg-transparent border-none text-brand-danger !text-[10px] !lowercase opacity-60 font-black">
          cancelar
        </button>
      </div>

      {/* MODAL: CONFLICTO LISTA */}
      {showListDialog && (
        <div className="modal-overlay z-[2000] !p-6">
          <div className="card-premium w-full text-center space-y-6 !p-8 border-brand-primary/20 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl mx-auto flex items-center justify-center text-brand-primary">
              <AlertTriangle size={32} strokeWidth={2.5}/>
            </div>
            
            <div className="space-y-2">
              <h2 className="heading-2 !text-sm tracking-widest">¿VINCULAR CON LISTA?</h2>
              <p className="text-[10px] font-bold text-brand-muted uppercase leading-relaxed px-2">
                Detectamos que tienes una lista pendiente. La IA puede marcar los productos automáticamente.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button onClick={() => startAnalysis(true)} className="btn-primary !py-4 !text-[10px]">
                SÍ, VINCULAR AHORA
              </button>
              <button onClick={() => startAnalysis(false)} className="btn-secondary !py-4 !text-[10px]">
                NO, SOLO EL TICKET
              </button>
              <button 
                onClick={() => setShowListDialog(false)} 
                className="text-[9px] font-black text-brand-muted py-2 block mx-auto uppercase tracking-widest opacity-40"
              >
                atrás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerView;