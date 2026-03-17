"use client";
import React, { useState } from 'react';
import { ChevronLeft, Trash2, Store, ImageIcon, X, Loader2 } from 'lucide-react';
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
      console.error("Error loading image", e);
    } finally {
      setLoadingImg(false);
    }
  };

  return (
    <div className="modal-content-full !p-5 flex flex-col animate-in slide-in-from-right-4">
      {/* HEADER COMPACTO */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={onClose} className="btn-icon !p-2 bg-brand-secondary/20 border-none">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center overflow-hidden">
            <h2 className="text-[14px] font-black italic text-brand-primary uppercase truncate max-w-[180px]">
                {gasto.comercio}
            </h2>
            <p className="text-[8px] font-bold text-brand-muted uppercase tracking-[0.2em]">
                {gasto.fecha}
            </p>
        </div>
        <button onClick={() => onDelete(gasto)} className="btn-icon !p-2 text-brand-danger/40 bg-brand-danger/5 border-none">
          <Trash2 size={20} />
        </button>
      </div>

      {/* LISTADO DE PRODUCTOS */}
      <div className="flex-1 overflow-y-auto no-scrollbar mb-4 border-y border-white/[0.03]">
        {gasto.productos?.map((p: any, i: number) => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-white/[0.02] last:border-none">
            <div className="flex-1 pr-4 overflow-hidden">
              <p className="text-[11px] font-black uppercase text-white leading-tight">
                {p.nombre_base}
              </p>
              <p className="text-[8px] font-bold text-brand-muted uppercase truncate opacity-20 mt-0.5">
                {p.nombre_ticket}
              </p>
            </div>
            <div className="text-right">
                <span className="block font-black italic text-brand-success tracking-tighter text-[11px]">
                    {Number(p.subtotal).toFixed(2)}€
                </span>
                <span className="text-[7px] font-bold text-brand-muted opacity-40 uppercase">x{p.cantidad || 1}</span>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER: TOTAL Y TICKETS */}
      <div className="flex items-stretch gap-2 h-20">
        <div className="flex-[1.2] bg-white/[0.03] p-3 rounded-2xl border border-white/[0.05] flex flex-col justify-center">
            <p className="text-[7px] font-black uppercase text-brand-muted mb-0.5 opacity-30">
              {txt('detail.investment')}
            </p>
            <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-black italic text-white tracking-tighter">
                    {Number(gasto.total).toFixed(2)}
                </span>
                <span className="text-xs font-black italic text-brand-success">€</span>
            </div>
        </div>

        <div className="flex-[2] overflow-x-auto no-scrollbar flex items-center gap-2">
            {gasto.photoIds && gasto.photoIds.length > 0 ? (
                gasto.photoIds.map((id: string, idx: number) => (
                    <button 
                        key={id} 
                        onClick={() => openTicket(id)}
                        className="h-full flex-none bg-brand-card border border-white/[0.1] px-4 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                    >
                        <ImageIcon size={16} className="text-brand-primary" />
                        <span className="text-[7px] font-black uppercase tracking-widest text-brand-muted">
                          {txt('detail.ticket_label')} {idx + 1}
                        </span>
                    </button>
                ))
            ) : (
                <div className="h-full flex-1 flex items-center justify-center border border-dashed border-white/5 rounded-2xl">
                    <p className="text-[8px] font-bold text-brand-muted uppercase italic">
                      {txt('detail.no_photos')}
                    </p>
                </div>
            )}
        </div>
      </div>

      {/* LIGHTBOX VISOR */}
      {viewerUrl && (
        <div className="modal-overlay !p-4 z-[2000] animate-in fade-in backdrop-blur-xl" onClick={() => setViewerUrl(null)}>
          <button className="absolute top-6 right-6 btn-icon !bg-white/10 border-white/20 z-[600] !p-3">
            <X size={24} className="text-white" />
          </button>
          <img src={viewerUrl} className="max-w-full max-h-[90vh] rounded-3xl shadow-2xl object-contain border border-white/10 animate-in zoom-in-95" alt="Receipt" />
        </div>
      )}

      {loadingImg && (
        <div className="fixed inset-0 z-[2100] bg-brand-bg/80 backdrop-blur-md flex items-center justify-center">
            <Loader2 className="animate-spin text-brand-primary" size={40} strokeWidth={3} />
        </div>
      )}
    </div>
  );
};

export default DetailView;