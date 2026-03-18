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
      <div className="card-premium w-full max-w-[90%] lg:max-w-md p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow effect */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 blur-[80px] rounded-full opacity-20 ${
          type === 'danger' ? 'bg-brand-danger' : 'bg-brand-primary'
        }`} />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${
              type === 'danger' ? 'bg-brand-danger/10 text-brand-danger' : 'bg-brand-primary/10 text-brand-primary'
            }`}>
              {type === 'danger' ? <AlertCircle size={28} /> : <CheckCircle2 size={28} />}
            </div>
            <div>
              <h3 className="heading-2 !text-lg !mb-0">{title}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted/40 italic">
                {type === 'danger' ? 'Acción Crítica' : 'Confirmación'}
              </p>
            </div>
          </div>

          <p className="text-sm font-bold text-white/70 leading-relaxed uppercase tracking-tight">
            {message}
          </p>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onCancel}
              className="btn-secondary flex-1 bg-white/5 border-white/10 text-brand-muted hover:text-white"
            >
              <X size={16} /> {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              className={`btn-primary flex-[1.5] ${
                type === 'danger' ? 'bg-brand-danger shadow-brand-danger/20' : ''
              }`}
            >
              <CheckCircle2 size={16} /> {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
