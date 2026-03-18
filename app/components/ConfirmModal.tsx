"use client";
import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "ACEPTAR",
  cancelText = "CANCELAR",
  type = 'info'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="card-premium w-[92%] max-w-md !p-6 lg:!p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow effect */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 blur-[80px] rounded-full opacity-20 ${
          type === 'danger' ? 'bg-brand-danger' : 'bg-brand-primary'
        }`} />

        <div className="relative z-10 space-y-5 lg:space-y-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 lg:p-4 rounded-2xl shrink-0 ${
              type === 'danger' ? 'bg-brand-danger/10 text-brand-danger' : 'bg-brand-primary/10 text-brand-primary'
            }`}>
              {type === 'danger' ? <AlertCircle size={24} className="lg:w-7 lg:h-7" /> : <CheckCircle2 size={24} className="lg:w-7 lg:h-7" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base lg:text-lg font-black uppercase italic tracking-tighter leading-none mb-1 truncate">{title}</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-muted/40 italic truncate">
                {type === 'danger' ? 'Acción Crítica' : 'Confirmación'}
              </p>
            </div>
          </div>

          <p className="text-[11px] lg:text-sm font-bold text-white/70 leading-relaxed uppercase tracking-tight line-clamp-3">
            {message}
          </p>

          <div className="flex gap-2.5 lg:gap-3 pt-2 items-stretch">
            <button 
              onClick={onCancel}
              className="btn-secondary !py-3 lg:!py-4 flex-1 bg-white/5 border-white/10 text-brand-muted hover:text-white !text-[9px] lg:!text-[11px] !px-2 leading-none"
            >
              <span className="truncate w-full block text-center">{cancelText}</span>
            </button>
            <button 
              onClick={onConfirm}
              className={`btn-primary !py-3 lg:!py-4 flex-[1.4] !text-[9px] lg:!text-[11px] !px-2 leading-none ${
                type === 'danger' ? 'bg-brand-danger shadow-brand-danger/20' : ''
              }`}
            >
              <span className="truncate w-full block text-center">{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
