"use client";
import React from 'react';
import { Camera, ShoppingCart, Store, Edit3, X, Plus, Loader2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
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

// --- SUB-COMPONENTE DE CAPTURA DE FOTOS ---
ScannerView.Capture = ({ 
  tempPhotos, setTempPhotos, loading, startAnalysis, db, 
  setShowListDialog, showListDialog, onCancel, txt 
}) => {
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const r = new FileReader();
      r.onloadend = async () => { 
        // Usamos nuestra nueva compresión agresiva (maxWidth 800, quality 0.4)
        const comp = await compressImage(r.result as string, 800, 0.4); 
        setTempPhotos((prev: string[]) => [...prev, comp]); 
      };
      r.readAsDataURL(file);
    });
  };

  const removePhoto = (idx: number) => {
    setTempPhotos((prev: string[]) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in zoom-in-95">
      <div className="text-center">
        <h2 className="heading-1 !text-fluid-xl mb-2">{txt('scan.title')}</h2>
        <p className="text-small-caps opacity-50">Captura o sube los tickets</p>
      </div>

      <div className={`card-premium !p-2 border-dashed border-2 min-h-[300px] flex flex-col items-center justify-center relative transition-all ${
        tempPhotos.length > 0 ? 'border-brand-primary/30 bg-brand-primary/[0.02]' : 'border-brand-secondary/30 bg-brand-secondary/5'
      }`}>
        {tempPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
            {tempPhotos.map((p: string, i: number) => (
              <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-white/10 animate-in scale-up">
                <img src={p} className="w-full h-full object-cover" alt="Ticket" />
                <button 
                  onClick={() => removePhoto(i)} 
                  className="absolute top-1.5 right-1.5 p-1.5 bg-brand-danger rounded-lg text-white shadow-lg active:scale-90"
                >
                  <X size={12} strokeWidth={4}/>
                </button>
              </div>
            ))}
            <label className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-brand-primary/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-brand-primary/5 transition-colors">
              <Plus size={24} className="text-brand-primary" />
              <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary">Añadir</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-6 cursor-pointer group">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center text-brand-primary group-active:scale-90 transition-all">
              <Camera size={40} strokeWidth={2.5}/>
            </div>
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-widest mb-1">{txt('scan.add_photo')}</p>
              <p className="text-[9px] font-bold text-brand-muted uppercase opacity-40">Cámara o Galería</p>
            </div>
            {/* INPUT UNIVERSAL: Sin atributo capture permite elegir origen en Android/iOS */}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          </label>
        )}
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => {
            const hasList = db.lista.filter((l: any) => !l.confirmed).length > 0;
            if (hasList) setShowListDialog(true);
            else startAnalysis(false);
          }} 
          disabled={tempPhotos.length === 0 || loading} 
          className="btn-primary !py-5"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <div className="flex items-center gap-3">
               <ImageIcon size={20} />
               <span>{txt('scan.process')}</span>
            </div>
          )}
        </button>
        
        <button onClick={onCancel} className="btn-secondary !bg-transparent border-none text-brand-danger !text-[10px] !lowercase opacity-60">
          {txt('common.cancel')}
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
              <p className="text-[10px] font-bold text-brand-muted uppercase leading-relaxed px-2">
                {txt('modals.link_list_msg')}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button onClick={() => startAnalysis(true)} className="btn-primary !py-4 !text-[10px]">
                {txt('modals.yes_link')}
              </button>
              <button onClick={() => startAnalysis(false)} className="btn-secondary !py-4 !text-[10px]">
                {txt('modals.no_link')}
              </button>
              <button 
                onClick={() => setShowListDialog(false)} 
                className="text-[9px] font-black text-brand-muted py-2 block mx-auto uppercase tracking-widest opacity-40"
              >
                {txt('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerView;