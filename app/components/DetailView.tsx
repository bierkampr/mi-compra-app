"use client";
import React, { useState } from 'react';
import { ChevronLeft, Trash2, Store, ImageIcon, X, Loader2, ArrowDown } from 'lucide-react';
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
      <div className="flex justify-between items-start mb-6">
        <button onClick={onClose} className="btn-icon !p-3">
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={() => onDelete(gasto)} 
          className="btn-icon !p-3 text-brand-danger/40 bg-brand-danger/5 border-none active:bg-brand-danger active:text-white"
        >
          <Trash2 size={24} />
        </button>
      </div>

      {/* CABECERA GASTO */}
      <div className="mb-8">
        <h2 className="heading-1 !text-fluid-xl !mb-1 text-brand-primary">{gasto.comercio}</h2>
        <div className="flex items-center gap-2 text-small-caps opacity-60">
          <Store size={10} />
          <span>{gasto.fecha}</span>
        </div>
      </div>

      {/* LISTA PRODUCTOS (DENSIDAD ALTA) */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-2">
        <h3 className="text-small-caps mb-3 opacity-40">Productos detectados</h3>
        {gasto.productos?.map((p: any, i: number) => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-white/[0.03]">
            <div className="flex-1 pr-4 overflow-hidden">
              <p className="text-[10px] font-black uppercase text-white/80 truncate leading-tight">
                {p.nombre_base}
              </p>
              <p className="text-[8px] font-bold text-brand-muted uppercase truncate opacity-40">
                Cant: {p.cantidad || 1}
              </p>
            </div>
            <span className="font-black italic text-brand-success tracking-tighter text-xs">
              {Number(p.subtotal).toFixed(2)}€
            </span>
          </div>
        ))}
      </div>

      {/* TOTAL Y TICKETS */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <p className="text-small-caps mb-1">Inversión Total</p>
            <div className="flex items-center gap-1 text-brand-success">
              <ArrowDown size={14} strokeWidth={3} />
              <span className="text-4xl font-black italic text-white leading-none">
                {Number(gasto.total).toFixed(2)}€
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-small-caps opacity-40">Evidencias Digitales</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {gasto.photoIds && gasto.photoIds.length > 0 ? (
              gasto.photoIds.map((id: string, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => openTicket(id)}
                  className="flex-none px-5 py-3.5 bg-brand-secondary/30 rounded-xl border border-white/5 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <ImageIcon size={16} className="text-brand-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white">Ticket {idx + 1}</span>
                </button>
              ))
            ) : (
              <p className="text-[10px] font-bold text-brand-muted uppercase italic">Sin fotos adjuntas</p>
            )}
          </div>
        </div>
      </div>

      {/* VISOR DE IMAGEN (LIGHTBOX) */}
      {viewerUrl && (
        <div className="modal-overlay !p-4 z-[2000] animate-in fade-in">
          <button 
            onClick={() => setViewerUrl(null)} 
            className="absolute top-8 right-8 btn-icon !bg-white/10 backdrop-blur-2xl border-white/20 z-[600] !p-3"
          >
            <X size={32} className="text-white" />
          </button>
          <div className="w-full h-full flex items-center justify-center p-4">
            <img 
              src={viewerUrl} 
              className="max-w-full max-h-full rounded-3xl shadow-2xl object-contain border border-white/10 animate-in zoom-in-95 duration-300" 
              alt="Ticket Original" 
            />
          </div>
        </div>
      )}

      {loadingImg && (
        <div className="fixed inset-0 z-[2100] bg-brand-bg/60 backdrop-blur-md flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-primary" size={48} strokeWidth={3} />
        </div>
      )}
    </div>
  );
};

export default DetailView;