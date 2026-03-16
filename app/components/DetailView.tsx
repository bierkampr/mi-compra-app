"use client";
import React, { useState } from 'react';
import { ChevronLeft, Trash2, Store, ImageIcon, X, Loader2, Check } from 'lucide-react';
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
      alert("Error al cargar la imagen");
    } finally {
      setLoadingImg(false);
    }
  };

  return (
    <div className="modal-content-full !pb-10 flex flex-col animate-in slide-in-from-right-4">
      {/* HEADER ACCIONES */}
      <div className="flex justify-between items-start mb-8">
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

      {/* CABECERA GASTO */}
      <div className="mb-8 px-2">
        <h2 className="heading-1 !text-fluid-xl !mb-2 text-brand-primary">{gasto.comercio}</h2>
        <div className="flex items-center gap-2 text-small-caps opacity-50">
          <Store size={12} />
          <span className="tracking-[0.3em]">{gasto.fecha}</span>
        </div>
      </div>

      {/* LISTA PRODUCTOS (DENSIDAD ALTA) */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-2 mb-6">
        <h3 className="text-small-caps mb-4 ml-2 opacity-30">Desglose de compra</h3>
        {gasto.productos?.map((p: any, i: number) => (
          <div key={i} className="flex justify-between items-center py-3.5 border-b border-white/[0.03] px-2">
            <div className="flex-1 pr-4 overflow-hidden">
              <p className="text-[11px] font-black uppercase text-white/90 truncate leading-tight">
                {p.nombre_base}
              </p>
              <p className="text-[9px] font-bold text-brand-muted uppercase truncate opacity-40 mt-0.5">
                Detectado: {p.nombre_ticket}
              </p>
            </div>
            <span className="font-black italic text-brand-success tracking-tighter text-sm">
              {Number(p.subtotal).toFixed(2)}€
            </span>
          </div>
        ))}
      </div>

      {/* FOOTER: TOTAL Y TICKETS (REDISEÑO LINEAL) */}
      <div className="mt-auto pt-6 border-t border-white/5 space-y-6">
        {/* BANNER DE TOTAL */}
        <div className="flex justify-between items-center bg-white/[0.03] p-6 rounded-[2rem] border border-white/[0.02]">
            <div>
                <p className="text-small-caps opacity-40 mb-1">Inversión Total</p>
                <h3 className="text-5xl font-black italic tracking-tighter text-white">
                    {Number(gasto.total).toFixed(2)}€
                </h3>
            </div>
            <div className="w-14 h-14 bg-brand-success/10 rounded-2xl flex items-center justify-center text-brand-success border border-brand-success/20">
                <Check size={28} strokeWidth={3} />
            </div>
        </div>

        {/* EVIDENCIAS DIGITALES */}
        <div className="space-y-4">
            <p className="text-small-caps opacity-30 ml-4">Evidencias Digitales</p>
            <div className="flex gap-3 overflow-x-auto pb-4 px-2 no-scrollbar">
                {gasto.photoIds && gasto.photoIds.length > 0 ? (
                    gasto.photoIds.map((id: string, idx: number) => (
                        <button 
                            key={idx} 
                            onClick={() => openTicket(id)}
                            className="flex-none bg-brand-card border border-white/10 px-6 py-5 rounded-[1.75rem] flex items-center gap-4 active:scale-95 transition-all shadow-xl"
                        >
                            <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
                                <ImageIcon size={20} />
                            </div>
                            <div className="text-left">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-white/90">Ticket {idx + 1}</span>
                                <span className="block text-[8px] font-bold text-brand-muted uppercase mt-0.5">Ver Captura</span>
                            </div>
                        </button>
                    ))
                ) : (
                    <p className="text-[10px] font-bold text-brand-muted uppercase italic ml-4">Sin fotos adjuntas</p>
                )}
            </div>
        </div>
      </div>

      {/* VISOR DE IMAGEN (LIGHTBOX) */}
      {viewerUrl && (
        <div className="modal-overlay !p-4 z-[2000] animate-in fade-in">
          <button 
            onClick={() => setViewerUrl(null)} 
            className="absolute top-8 right-8 btn-icon !bg-white/10 backdrop-blur-2xl border-white/20 z-[600] !p-4"
          >
            <X size={32} className="text-white" strokeWidth={3} />
          </button>
          <div className="w-full h-full flex items-center justify-center p-4">
            <img 
              src={viewerUrl} 
              className="max-w-full max-h-full rounded-[2.5rem] shadow-2xl object-contain border border-white/10 animate-in zoom-in-95 duration-300" 
              alt="Ticket Original" 
            />
          </div>
        </div>
      )}

      {loadingImg && (
        <div className="fixed inset-0 z-[2100] bg-brand-bg/60 backdrop-blur-md flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-primary" size={56} strokeWidth={3} />
        </div>
      )}
    </div>
  );
};

export default DetailView;