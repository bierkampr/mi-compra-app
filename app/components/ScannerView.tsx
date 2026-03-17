"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, ShoppingCart, Store, Utensils, Pill, LayoutGrid, Edit3, X, Loader2, 
  AlertTriangle, Image as ImageIcon, Sparkles, CheckCircle2, Plus, Tag, 
  ChevronRight, ChevronLeft, Info
} from 'lucide-react';
import { compressImage } from '../../lib/utils';

interface ScannerViewProps {
  db: { lista: any[], gastos: any[], customCategories?: string[] };
  updateAndSync: (newDb: any) => Promise<void>;
  setPurchaseMode: (mode: string | null) => void;
  startAnalysis: (useList: boolean) => void; 
  txt: (key: string) => string;
}

const ScannerView: React.FC<ScannerViewProps> & { Capture: React.FC<any> } = ({ db, updateAndSync, setPurchaseMode, startAnalysis, txt }) => {
  const [showOthers, setShowOthers] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const customCategories = db.customCategories || [];

  const handleAddCustomCategory = async () => {
    const val = newCatName.trim().toUpperCase();
    if (!val) return;
    if (!customCategories.includes(val)) {
      const newDb = { ...db, customCategories: [...customCategories, val] };
      await updateAndSync(newDb);
    }
    setPurchaseMode(val);
    setNewCatName("");
  };

  return (
    <div className="space-y-6 py-4 animate-in slide-in-from-bottom-8 duration-500 no-scrollbar max-w-2xl mx-auto">
      <div className="text-center px-1 lg:mb-6">
        <h2 className="heading-1 !text-3xl lg:!text-4xl uppercase font-black italic">{txt('scan.title')}</h2>
        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.3em]">{txt('scan.subtitle')}</p>
      </div>

      {!showOthers ? (
        <div className="space-y-3">
          <button onClick={() => setPurchaseMode('super')} className="card-clickable w-full !p-6 lg:!p-8 flex items-center gap-6 group overflow-hidden relative">
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
              <ShoppingCart size={32} strokeWidth={2.5}/>
            </div>
            <div className="text-left relative z-10">
              <h2 className="text-sm lg:text-lg font-black uppercase tracking-widest text-white">{txt('scan.super')}</h2>
              <p className="text-[9px] font-bold text-brand-muted uppercase mt-0.5">Grandes superficies</p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-white"><ShoppingCart size={80} /></div>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setPurchaseMode('mini')} className="card-clickable !p-5 flex flex-col items-center justify-center text-center gap-3 group relative overflow-hidden">
                <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform"><Store size={24}/></div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white">{txt('scan.mini')}</h2>
                <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-white"><Store size={40} /></div>
            </button>
            <button onClick={() => setPurchaseMode('dining')} className="card-clickable !p-5 flex flex-col items-center justify-center text-center gap-3 group relative overflow-hidden">
                <div className="w-12 h-12 bg-orange-400/10 rounded-xl flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform"><Utensils size={24}/></div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white">{txt('scan.dining')}</h2>
                <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-white"><Utensils size={40} /></div>
            </button>
            <button onClick={() => setPurchaseMode('health')} className="card-clickable !p-5 flex flex-col items-center justify-center text-center gap-3 group relative overflow-hidden">
                <div className="w-12 h-12 bg-emerald-400/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform"><Pill size={24}/></div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white">{txt('scan.health')}</h2>
                <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-white"><Pill size={40} /></div>
            </button>
            <button onClick={() => setShowOthers(true)} className="card-clickable !p-5 flex flex-col items-center justify-center text-center gap-3 group relative overflow-hidden bg-brand-secondary/20 border-dashed border-white/10">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-brand-muted group-hover:scale-110 transition-transform"><LayoutGrid size={24}/></div>
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
                <button key={i} onClick={() => setPurchaseMode(cat)} className="w-full flex items-center justify-between p-5 card-premium bg-white/[0.03] border-white/5 active:bg-brand-primary/10 transition-colors">
                  <div className="flex items-center gap-3"><Tag size={18} className="text-brand-primary" /><span className="text-[11px] lg:text-[13px] font-black uppercase text-white tracking-widest">{cat}</span></div>
                  <ChevronRight size={16} className="text-brand-muted opacity-20" />
                </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => { setPurchaseMode('manual'); startAnalysis(false); }} className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-brand-muted font-black text-[10px] uppercase hover:text-white transition-all active:scale-95">
        <Edit3 size={18}/> <span className="text-[10px] font-black uppercase tracking-[0.2em]">{txt('scan.manual')}</span>
      </button>
    </div>
  );
};

// --- SUB-COMPONENTE: CAPTURA CON RECORTE MATEMÁTICO EXACTO ---
ScannerView.Capture = ({ tempPhotos, setTempPhotos, loading, startAnalysis, db, setShowListDialog, showListDialog, onCancel, txt, activeTab }) => {
  const [capturedStream, setCapturedStream] = useState<MediaStream | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (videoRef.current && capturedStream && !previewPhoto) {
        videoRef.current.srcObject = capturedStream;
    }
  }, [previewPhoto, capturedStream]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, 
        audio: false 
      });
      setCapturedStream(stream);
    } catch (err) {
      alert(txt('scan.camera_error'));
    }
  };

  const stopCamera = () => {
    if (capturedStream) {
      capturedStream.getTracks().forEach(track => track.stop());
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const vW = video.videoWidth;
      const vH = video.videoHeight;

      const rect = video.getBoundingClientRect();
      const cssW = rect.width;
      const cssH = rect.height;

      // 1. Calcular el factor de escala de 'object-cover'
      // El video se escala para cubrir el contenedor, manteniendo el ratio
      const scale = Math.max(cssW / vW, cssH / vH);

      // 2. Calcular dimensiones del video proyectado en el CSS
      const renderedW = vW * scale;
      const renderedH = vH * scale;

      // 3. Calcular el desplazamiento (centrado) del video respecto al contenedor
      const offsetX = (renderedW - cssW) / 2;
      const offsetY = (renderedH - cssH) / 2;

      // 4. Definir el área del recuadro en coordenadas CSS
      // El borde negro es de 40px en todos los lados
      const borderSize = 40;
      const cropX_css = borderSize;
      const cropY_css = borderSize;
      const cropW_css = cssW - (borderSize * 2);
      const cropH_css = cssH - (borderSize * 2);

      // 5. Traducir coordenadas CSS a píxeles reales del origen del video
      const sx = (cropX_css + offsetX) / scale;
      const sy = (cropY_css + offsetY) / scale;
      const sWidth = cropW_css / scale;
      const sHeight = cropH_css / scale;

      canvas.width = sWidth;
      canvas.height = sHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPreviewPhoto(dataUrl);
      }
    }
  };

  const confirmPhoto = async () => {
    if (previewPhoto) {
      const compressed = await compressImage(previewPhoto, tempPhotos.length + 1);
      setTempPhotos((prev: any) => [...prev, compressed]);
      setPreviewPhoto(null);
      if (tempPhotos.length + 1 >= 3) {
        handleProcessClick();
      }
    }
  };

  const handleProcessClick = () => {
    stopCamera();
    if (activeTab === 'list') startAnalysis(true);
    else {
      const hasListItems = db.lista.filter((l: any) => !l.confirmed).length > 0;
      if (hasListItems) setShowListDialog(true);
      else startAnalysis(false);
    }
  };

  const getStepText = () => {
    if (tempPhotos.length === 0) return txt('scan.step_top');
    if (tempPhotos.length === 1) return `${txt('scan.step_middle')} (${txt('scan.step_optional')})`;
    return `${txt('scan.step_bottom')} (${txt('scan.step_optional')})`;
  };

  return (
    <div className="fixed inset-0 bg-black z-[2000] flex flex-col overflow-hidden">
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {!previewPhoto ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            
            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/60">
                <div className="w-full h-full border-2 border-dashed border-brand-accent/40 rounded-3xl relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-brand-accent/20 animate-pulse" />
                    <div className="absolute top-10 left-0 right-0 px-6 text-center">
                        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-brand-accent/20 inline-flex items-center gap-2">
                             <Info size={14} className="text-brand-accent" />
                             <span className="text-[10px] font-black text-white uppercase tracking-wider">{txt('scan.important_note')}</span>
                        </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] font-black text-brand-accent/60 uppercase tracking-[0.4em]">{txt('scan.instructions_camera')}</span>
                    </div>
                </div>
            </div>

            {tempPhotos.length > 0 && (
                <div className="absolute top-6 left-6 w-20 aspect-[3/4] border-2 border-white/20 rounded-lg overflow-hidden shadow-2xl opacity-60">
                    <img src={tempPhotos[tempPhotos.length-1]} className="w-full h-full object-cover grayscale" />
                    <div className="absolute inset-0 bg-brand-primary/20 mix-blend-overlay" />
                </div>
            )}
          </>
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 gap-6 animate-in zoom-in-95">
             <h3 className="text-xl font-black italic text-brand-accent uppercase tracking-tighter">{txt('scan.quality_check')}</h3>
             <img src={previewPhoto} className="max-h-[60vh] rounded-3xl border-2 border-brand-accent shadow-2xl" />
             <div className="flex gap-4 w-full max-w-xs">
                <button onClick={() => setPreviewPhoto(null)} className="btn-secondary flex-1 !py-4">{txt('scan.retry_photo')}</button>
                <button onClick={confirmPhoto} className="btn-primary flex-1 !py-4 !bg-brand-success text-brand-bg">{txt('scan.confirm_photo')}</button>
             </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {!previewPhoto && (
        <div className="bg-brand-bg p-8 flex flex-col items-center gap-6 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
           <div className="text-center space-y-1">
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">{getStepText()}</p>
              <p className="text-[8px] font-bold text-brand-muted uppercase tracking-widest">{tempPhotos.length} / 3 FOTOS</p>
           </div>

           <div className="flex items-center justify-between w-full max-w-xs">
              <button onClick={onCancel} className="btn-icon !bg-white/5 border-none"><X size={24} /></button>
              <button onClick={takePhoto} className="w-20 h-20 bg-white rounded-full p-1 border-4 border-brand-primary shadow-2xl active:scale-90 transition-all flex items-center justify-center">
                <div className="w-full h-full bg-white rounded-full border-2 border-black/10" />
              </button>
              {tempPhotos.length > 0 ? (
                <div className="flex flex-col items-center gap-1">
                    <button onClick={handleProcessClick} className="btn-icon !bg-brand-success text-brand-bg border-none shadow-lg shadow-brand-success/20"><CheckCircle2 size={24} /></button>
                    <span className="text-[7px] font-black text-brand-success uppercase tracking-tighter">{txt('scan.process')}</span>
                </div>
              ) : ( <div className="w-12" /> )}
           </div>
           {tempPhotos.length > 0 && ( <p className="text-[8px] font-black text-brand-muted uppercase animate-pulse">{txt('scan.finish_now')}</p> )}
        </div>
      )}

      {showListDialog && (
        <div className="modal-overlay z-[3000] !p-6">
           <div className="card-premium max-w-sm w-full text-center space-y-8 !p-12 border-brand-primary/20">
              <AlertTriangle size={48} className="mx-auto text-brand-primary" />
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter">{txt('modals.link_list_title')}</h3>
                <p className="text-[10px] font-bold text-brand-muted uppercase leading-relaxed">{txt('modals.link_list_desc')}</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => startAnalysis(true)} className="btn-primary !py-5">{txt('modals.yes_link')}</button>
                <button onClick={() => startAnalysis(false)} className="btn-secondary !py-5">{txt('modals.no_link')}</button>
              </div>
           </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-[4000] bg-brand-bg/90 backdrop-blur-xl flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <Loader2 className="animate-spin text-brand-primary" size={64} strokeWidth={3}/>
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-accent animate-pulse" size={24} />
            </div>
            <p className="text-[10px] font-black text-white uppercase tracking-[0.5em] animate-pulse">{txt('scan.scanning_label')}</p>
        </div>
      )}
    </div>
  );
};

export default ScannerView;