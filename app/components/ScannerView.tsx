"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Camera, ShoppingCart, Store, Utensils, Pill, LayoutGrid, Edit3, X, Loader2,
  AlertTriangle, Image as ImageIcon, Sparkles, CheckCircle2, Plus, Tag,
  ChevronRight, ChevronLeft, Info, Trash2, Zap, Brain
} from "lucide-react";
import { compressImage } from "../../lib/utils";
import ConfirmModal from "./ConfirmModal";

interface ScannerViewProps {
  db: { lista: any[], gastos: any[], customCategories?: string[] };
  updateAndSync: (newDb: any) => Promise<void>;
  setPurchaseMode: (mode: string | null) => void;
  startAnalysis: (useList: boolean, forceManual?: boolean, images?: string[] | undefined) => void;
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
        <h2 className="heading-1 !text-3xl lg:!text-4xl uppercase font-black italic">{txt("scan.title")}</h2>
        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.3em]">{txt("scan.subtitle")}</p>
      </div>

      {!showOthers ? (
        <div className="space-y-3">
          <button onClick={() => setPurchaseMode("super")} className="card-clickable w-full !p-6 lg:!p-8 flex items-center gap-6 group overflow-hidden relative">
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
              <ShoppingCart size={32} strokeWidth={2.5}/>
            </div>
            <div className="text-left relative z-10">
              <h2 className="text-sm lg:text-lg font-black uppercase tracking-widest text-white">{txt("scan.super")}</h2>
              <p className="text-[9px] font-bold text-brand-muted uppercase mt-0.5">Grandes superficies</p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-white"><ShoppingCart size={80} /></div>
          </button>

          <div className="grid grid-cols-2 gap-2.5 lg:gap-4">
            <button onClick={() => setPurchaseMode("mini")} className="card-premium card-clickable !p-4 lg:!p-6 flex flex-col items-center justify-center text-center gap-3 lg:gap-4 group relative overflow-hidden bg-brand-card/40 border-white/[0.08]">
                <div className="w-11 h-11 lg:w-14 lg:h-14 bg-brand-accent/10 rounded-xl lg:rounded-2xl flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform"><Store size={22} className="lg:w-7 lg:h-7" /></div>
                <h2 className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-white">{txt("scan.mini")}</h2>
                <div className="absolute -right-2 -bottom-2 opacity-[0.05] text-white"><Store size={40} className="lg:w-12 lg:h-12" /></div>
            </button>
            <button onClick={() => setPurchaseMode("dining")} className="card-premium card-clickable !p-4 lg:!p-6 flex flex-col items-center justify-center text-center gap-3 lg:gap-4 group relative overflow-hidden bg-brand-card/40 border-white/[0.08]">
                <div className="w-11 h-11 lg:w-14 lg:h-14 bg-orange-400/10 rounded-xl lg:rounded-2xl flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform"><Utensils size={22} className="lg:w-7 lg:h-7" /></div>
                <h2 className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-white">{txt("scan.dining")}</h2>
                <div className="absolute -right-2 -bottom-2 opacity-[0.05] text-white"><Utensils size={40} className="lg:w-12 lg:h-12" /></div>
            </button>
            <button onClick={() => setPurchaseMode("health")} className="card-premium card-clickable !p-4 lg:!p-6 flex flex-col items-center justify-center text-center gap-3 lg:gap-4 group relative overflow-hidden bg-brand-card/40 border-white/[0.08]">
                <div className="w-11 h-11 lg:w-14 lg:h-14 bg-emerald-400/10 rounded-xl lg:rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform"><Pill size={22} className="lg:w-7 lg:h-7" /></div>
                <h2 className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-white">{txt("scan.health")}</h2>
                <div className="absolute -right-2 -bottom-2 opacity-[0.05] text-white"><Pill size={40} className="lg:w-12 lg:h-12" /></div>
            </button>
            <button onClick={() => setShowOthers(true)} className="card-premium card-clickable !p-4 lg:!p-6 flex flex-col items-center justify-center text-center gap-3 lg:gap-4 group relative overflow-hidden bg-brand-secondary/20 border-dashed border-white/20">
                <div className="w-11 h-11 lg:w-14 lg:h-14 bg-white/5 rounded-xl lg:rounded-2xl flex items-center justify-center text-brand-muted group-hover:scale-110 transition-transform"><LayoutGrid size={22} className="lg:w-7 lg:h-7" /></div>
                <h2 className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-white">{txt("scan.others")}</h2>
                <div className="absolute -right-2 -bottom-2 opacity-[0.05] text-white"><LayoutGrid size={40} className="lg:w-12 lg:h-12" /></div>
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

      <button onClick={() => { setPurchaseMode("manual"); startAnalysis(false, true); }} className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-brand-muted font-black text-[10px] uppercase hover:text-white transition-all active:scale-95">
        <Edit3 size={18}/> <span className="text-[10px] font-black uppercase tracking-[0.2em]">{txt("scan.manual")}</span>
      </button>
    </div>
  );
};

// --- SUB-COMPONENTE: CAPTURA OPTIMIZADA ---
ScannerView.Capture = ({ tempPhotos, setTempPhotos, loading, startAnalysis, db, setShowListDialog, showListDialog, onCancel, txt, activeTab }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedStream, setCapturedStream] = useState<MediaStream | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [lastImageSent, setLastImageSent] = useState<string | undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LÓGICA DE CÁMARA ---
  useEffect(() => {
    if (showCamera) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false
          });
          setCapturedStream(stream);
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          alert(txt("scan.camera_error"));
          setShowCamera(false);
        }
      };
      startCamera();
    } else {
      if (capturedStream) {
        capturedStream.getTracks().forEach(track => track.stop());
        setCapturedStream(null);
      }
    }
    return () => {
      if (capturedStream) {
        capturedStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const vW = video.videoWidth;
      const vH = video.videoHeight;
      const rect = video.getBoundingClientRect();
      const cssW = rect.width;
      const cssH = rect.height;

      const scale = Math.max(cssW / vW, cssH / vH);
      const renderedW = vW * scale;
      const renderedH = vH * scale;
      const offsetX = (renderedW - cssW) / 2;
      const offsetY = (renderedH - cssH) / 2;

      const marginH = 40;
      const marginV = 20;
      const cropX_css = marginH;
      const cropY_css = marginV;
      const cropW_css = cssW - (marginH * 2);
      const cropH_css = cssH - (marginV * 2);

      const sx = (cropX_css + offsetX) / scale;
      const sy = (cropY_css + offsetY) / scale;
      const sWidth = cropW_css / scale;
      const sHeight = cropH_css / scale;

      canvas.width = sWidth;
      canvas.height = sHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        setPreviewPhoto(dataUrl);
      }
    }
  };

  const confirmPhoto = async (photo: string) => {
    // ✅ CORRECCIÓN: pasar el número de foto para que la compresión sea
    // más agresiva en fotos 2 y 3, evitando rate limits en Mistral
    const processedPhoto = await compressImage(photo, tempPhotos.length + 1);
    setTempPhotos((prev: any) => [...prev, processedPhoto]);
    setPreviewPhoto(null);
    setShowCamera(false);
    setLastImageSent(processedPhoto);
  };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const result = event.target?.result as string;
                        await confirmPhoto(result);
                    } catch (err: any) {
                        alert("Error al procesar la imagen: " + err.message);
                    }
                };
                reader.readAsDataURL(file);
            }
        } catch (err: any) {
            alert("Error al subir archivo: " + err.message);
        }
    };

  const handleProcessClick = async () => {
    setIsOcrRunning(true);
    setOcrProgress(0);

    try {
      setOcrProgress(100);
      const photosToPass = tempPhotos.length > 0 ? tempPhotos : undefined;

      if (activeTab === "list") {
        startAnalysis(true, false, photosToPass);
      } else {
        startAnalysis(false, false, photosToPass);
      }
    } catch (err) {
      console.error("Error en el procesamiento:", err);
      alert("Error procesando el ticket. Inténtalo de nuevo.");
    } finally {
      setIsOcrRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-bg z-[2000] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-500">

      {/* VISTA DE PREPARACIÓN */}
      {!showCamera && (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => tempPhotos.length > 0 ? setShowConfirmCancel(true) : onCancel()}
                className="btn-icon !bg-white/5 border-none"
              >
                <X size={24} />
              </button>
              <div className="text-right">
                  <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">{txt("scan.preparation_title")}</h2>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{txt("scan.preparation_subtitle")}</p>
              </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-8">
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary shrink-0"><Info size={20}/></div>
                  <div>
                      <h4 className="text-[11px] font-black uppercase text-brand-primary mb-1">{txt("scan.instructions_title")}</h4>
                      <div className="space-y-3 mt-4">
                          <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-brand-success/20 text-brand-success flex items-center justify-center text-[10px] font-black">1</div>
                              <p className="text-[10px] font-bold text-white uppercase"><span className="text-brand-success">{txt("scan.inst_small_title")}:</span> {txt("scan.inst_small_desc")}</p>
                          </div>
                          <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center text-[10px] font-black">2</div>
                              <p className="text-[10px] font-bold text-white uppercase"><span className="text-brand-accent">{txt("scan.inst_large_title")}:</span> {txt("scan.inst_large_desc")}</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex-1 space-y-4">
              <div className="flex flex-wrap gap-4">
                  {tempPhotos.map((img: string, i: number) => (
                      <div key={i} className="relative w-28 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/10 shadow-xl animate-in zoom-in-90">
                          <img src={img} className="w-full h-full object-cover" />
                          <button
                              onClick={() => setTempPhotos((prev: any) => prev.filter((_: any, idx: number) => idx !== i))}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-lg text-white shadow-lg active:scale-90"
                          >
                              <Trash2 size={14} />
                          </button>
                      </div>
                  ))}

                  {tempPhotos.length < 3 && (
                      <div className="flex flex-col gap-3">
                          <button
                              onClick={() => setShowCamera(true)}
                              className="w-28 aspect-[3/4] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-brand-muted hover:border-brand-primary hover:text-brand-primary transition-all active:scale-95"
                          >
                              <Camera size={28} />
                              <span className="text-[9px] font-black uppercase">{txt("scan.take_photo")}</span>
                          </button>
                          <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-28 py-3 bg-white/[0.05] border border-white/5 rounded-xl flex items-center justify-center gap-2 text-white active:scale-95 transition-all"
                          >
                              <ImageIcon size={16} />
                              <span className="text-[9px] font-black uppercase">{txt("scan.gallery")}</span>
                          </button>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </div>
                  )}
              </div>
          </div>

          <div className="mt-8">
              <button
                  disabled={tempPhotos.length === 0 || loading || isOcrRunning}
                  onClick={handleProcessClick}
                  className="btn-primary !py-6 w-full flex items-center justify-center gap-3 disabled:opacity-20 disabled:grayscale overflow-hidden relative"
              >
                  {isOcrRunning ? (
                    <>
                      <div className="absolute inset-0 bg-brand-primary/20 animate-pulse" />
                      <div className="absolute bottom-0 left-0 h-1 bg-white/40 transition-all duration-500" style={{ width: `${ocrProgress}%` }} />
                      <Brain size={24} className="animate-bounce" />
                      <span className="text-sm font-black italic uppercase tracking-widest">PROCESANDO IA ({ocrProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <Zap size={24} className="fill-current" />
                      <span className="text-sm font-black italic uppercase tracking-widest">{txt("scan.process")}</span>
                    </>
                  )}
              </button>
          </div>
        </div>
      )}

      {/* VISTA DE CÁMARA (WEBRTC) */}
      {showCamera && (
        <div className="absolute inset-0 bg-black flex flex-col overflow-hidden">
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            {!previewPhoto ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none border-x-[40px] border-y-[20px] border-black/70">
                    <div className="w-full h-full border-2 border-dashed border-brand-accent/60 rounded-3xl relative">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-brand-accent/20 animate-pulse" />
                        <div className="absolute -top-10 left-0 right-0 flex justify-center">
                            <div className="bg-brand-accent text-brand-bg px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl animate-bounce">
                                <Sparkles size={14} />
                                <span className="text-[9px] font-black uppercase tracking-wider">{txt("scan.inst_frame_title")}</span>
                            </div>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em] text-center px-6">
                                {txt("scan.inst_frame_desc")}
                            </span>
                        </div>
                    </div>
                </div>
              </>
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 gap-6 animate-in zoom-in-95 bg-brand-bg">
                 <h3 className="text-xl font-black italic text-brand-accent uppercase tracking-tighter">{txt("scan.quality_check")}</h3>
                 <img src={previewPhoto} className="max-h-[60vh] rounded-3xl border-2 border-brand-accent shadow-2xl" />
                 <div className="flex gap-4 w-full max-w-xs">
                    <button onClick={() => setPreviewPhoto(null)} className="btn-secondary flex-1 !py-4">{txt("scan.retry_photo")}</button>
                    <button onClick={() => confirmPhoto(previewPhoto!)} className="btn-primary flex-1 !py-4 !bg-brand-success text-brand-bg">{txt("scan.confirm_photo")}</button>
                 </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {!previewPhoto && (
            <div className="bg-brand-bg p-8 flex flex-col items-center gap-6 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
               <div className="flex items-center justify-between w-full max-w-xs">
                  <button onClick={() => setShowCamera(false)} className="btn-icon !bg-white/5 border-none"><ChevronLeft size={24} /></button>
                  <button onClick={takePhoto} className="w-20 h-20 bg-white rounded-full p-1 border-4 border-brand-primary shadow-2xl active:scale-90 transition-all flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-full border-2 border-black/10" />
                  </button>
                  <div className="w-12" />
               </div>
            </div>
          )}
        </div>
      )}

      {/* DIÁLOGO DE VINCULACIÓN */}
      <ConfirmModal
        isOpen={showListDialog}
        title={txt("modals.link_list_title") || "¿VINCULAR CON LISTA?"}
        message={txt("modals.link_list_desc")}
        onConfirm={() => startAnalysis(true, false, lastImageSent ? [lastImageSent] : undefined)}
        onCancel={() => startAnalysis(false, false, lastImageSent ? [lastImageSent] : undefined)}
        confirmText={txt("modals.yes_link") || "SÍ, VINCULAR"}
        cancelText={txt("modals.no_link") || "NO, SOLO SCAN"}
      />

      <ConfirmModal
        isOpen={showConfirmCancel}
        title="¿CANCELAR ESCANEO?"
        message="Se perderán las fotos capturadas."
        type="danger"
        onConfirm={onCancel}
        onCancel={() => setShowConfirmCancel(false)}
        confirmText="SÍ, CANCELAR"
        cancelText="CONTINUAR"
      />

    </div>
  );
};

export default ScannerView;
