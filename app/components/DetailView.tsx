"use client";
import React, { useState } from 'react';
import { ChevronLeft, Trash2, Store, ImageIcon, X, Loader2, Check, ArrowRight } from 'lucide-react';
import { getDriveFileBlob } from '@/lib/gdrive';

interface DetailViewProps {
  gasto: any;
  onClose: () => void;
  onDelete: (g: any) => void;
  token: string;
  txt: (key: string) => string;
}

const DetailView: React.FC<DetailViewProps> = ({ gasto, onClose, onDelete, token, txt }) => {
  const [loadingImg, setLoadingImg] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const openTicket = async (id: string) => {
    setLoadingImg(true);
    try {
      const url = await getDriveFileBlob(token, id);
      if (url) setViewerUrl(url);
    } catch (e) {
      alert("Error al cargar la imagen digital");
    } finally {
      setLoadingImg(false);
    }
  };

  return (
    <div className="modal-content-full !pb-10 flex flex-col animate-in slide-in-from-right-4">
      {/* BARRA DE ACCIONES SUPERIOR */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={onClose} className="btn-icon !p-3 bg-brand-secondary/20 border-none">
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={() => onDelete(gasto)} 
          className="btn-icon !p-3 text-brand-danger/60 bg-brand-danger/10 border-none active:bg-brand-danger active:text-white"
        >
          <Trash2 size={24} />
        </button>
      </div>

      {/* CABECERA: COMERCIO Y FECHA */}
      <div className="mb-8 px-2">
        <p className="text-small-caps opacity-30 mb-1 tracking-[0.4em]">Establecimiento</p>
        <h2 className="heading-1 !text-fluid-xl !mb-2 text-brand-primary">{gasto.comercio}</h2>
        <div className="flex items-center gap-2 text-[10px] font-black text-brand-muted uppercase tracking-widest">
          <Store size={12} className="text-brand-primary" />
          <span>{gasto.fecha}</span>
        </div>
      </div>

      {/* LISTADO DE PRODUCTOS (DENSIDAD ALTA) */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-2 mb-6 scroll-smooth">
        <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-small-caps opacity-40">Ítems detectados</h3>
            <span className="text-[10px] font-bold text-brand-muted italic">{(gasto.productos?.length || 0)} productos</span>
        </div>
        
        {gasto.productos?.map((p: any, i: number) => (
          <div key={i} className="flex justify-between items-center py-4 border-b border-white/[0.03] px-2 hover:bg-white/[0.01] transition-colors">
            <div className="flex-1 pr-4 overflow-hidden">
              <p className="text-[11px] font-black uppercase text-white/90 truncate leading-tight">
                {p.nombre_base}
              </p>
              <p className="text-[9px] font-bold text-brand-muted uppercase truncate opacity-30 mt-1 flex items-center gap-1">
                <ArrowRight size={8} /> {p.nombre_ticket}
              </p>
            </div>
            <div className="text-right">
                <span className="block font-black italic text-brand-success tracking-tighter text-sm">
                {Number(p.subtotal).toFixed(2)}€
                </span>
                <span className="text-[8px] font-bold text-brand-muted opacity-40 uppercase">x{p.cantidad || 1}</span>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER: SECCIÓN LINEAL DE TOTAL Y EVIDENCIAS */}
      <div className="mt-auto pt-6 border-t border-white/5 space-y-8">
        
        {/* TARJETA DE INVERSIÓN TOTAL */}
        <div className="flex justify-between items-center bg-gradient-to-r from-white/[0.04] to-transparent p-7 rounded-[2.5rem] border border-white/[0.03] shadow-inner">
            <div>
                <p className="text-small-caps opacity-30 mb-1.5">Inversión Final</p>
                <div className="flex items-baseline gap-1">
                    <h3 className="text-5xl font-black italic tracking-tighter text-white">
                        {Number(gasto.total).toFixed(2)}
                    </h3>
                    <span className="text-2xl font-black italic text-brand-success">€</span>
                </div>
            </div>
            <div className="w-16 h-16 bg-brand-success/10 rounded-[1.5rem] flex items-center justify-center text-brand-success border border-brand-success/20 shadow-2xl shadow-brand-success/10">
                <Check size={32} strokeWidth={3} />
            </div>
        </div>

        {/* CARRUSEL DE EVIDENCIAS DIGITALES */}
        <div className="space-y-4">
            <div className="flex justify-between items-center px-4">
                <p className="text-small-caps opacity-30">Evidencias Digitales</p>
                {gasto.photoIds?.length > 1 && <span className="text-[8px] font-bold text-brand-muted uppercase animate-pulse">Desliza →</span>}
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-6 px-4 no-scrollbar">
                {gasto.photoIds && gasto.photoIds.length > 0 ? (
                    gasto.photoIds.map((id: string, idx: number) => (
                        <button 
                            key={idx} 
                            onClick={() => openTicket(id)}
                            className="flex-none bg-brand-card border border-white/[0.08] px-6 py-5 rounded-[2rem] flex items-center gap-4 active:scale-95 transition-all shadow-xl hover:border-brand-primary/30 group"
                        >
                            <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                <ImageIcon size={22} />
                            </div>
                            <div className="text-left">
                                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Ticket {idx + 1}</span>
                                <span className="block text-[8px] font-bold text-brand-muted uppercase mt-1 opacity-50">JPG • Nube</span>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="w-full py-4 text-center border border-dashed border-white/5 rounded-3xl">
                        <p className="text-[10px] font-bold text-brand-muted uppercase italic">Sin evidencias adjuntas</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* LIGHTBOX (VISOR DE IMAGEN) */}
      {viewerUrl && (
        <div className="modal-overlay !p-4 z-[2000] animate-in fade-in backdrop-blur-xl">
          <button 
            onClick={() => setViewerUrl(null)} 
            className="absolute top-8 right-8 btn-icon !bg-white/10 border-white/20 z-[600] !p-4 shadow-2xl"
          >
            <X size={32} className="text-white" strokeWidth={3} />
          </button>
          <div className="w-full h-full flex items-center justify-center p-2">
            <img 
              src={viewerUrl} 
              className="max-w-full max-h-[85vh] rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] object-contain border border-white/10 animate-in zoom-in-95 duration-500" 
              alt="Ticket Original" 
            />
          </div>
        </div>
      )}

      {/* CARGADOR DE IMAGEN ESPECÍFICO */}
      {loadingImg && (
        <div className="fixed inset-0 z-[2100] bg-brand-bg/80 backdrop-blur-md flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="animate-spin text-brand-primary mx-auto" size={56} strokeWidth={3} />
            <p className="text-small-caps animate-pulse">Recuperando evidencia...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailView;