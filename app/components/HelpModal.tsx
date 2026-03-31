"use client";
import React from 'react';
import {
  X,
  BarChart3,
  Camera,
  CheckCircle2,
  Settings,
  Plus,
  Star,
  FileText,
  BookOpen,
} from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
  txt: (key: string) => string;
}

interface TipItem {
  label: string;
  text: string;
}

interface HelpSection {
  icon: React.ReactNode;
  color: string;
  accent: string;
  title: string;
  tips: TipItem[];
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose, txt }) => {
  const sections: HelpSection[] = [
    {
      icon: <BarChart3 size={20} />,
      color: 'bg-brand-primary/10',
      accent: 'text-brand-primary border-brand-primary/20',
      title: txt('help.home_title'),
      tips: [
        { label: txt('help.tip_spend_card_title'), text: txt('help.tip_spend_card') },
        { label: txt('help.tip_records_title'), text: txt('help.tip_records') },
      ],
    },
    {
      icon: <CheckCircle2 size={20} />,
      color: 'bg-brand-success/10',
      accent: 'text-brand-success border-brand-success/20',
      title: txt('help.list_title'),
      tips: [
        { label: txt('help.tip_list_input_title'), text: txt('help.tip_list_input') },
        { label: txt('help.tip_list_scan_title'), text: txt('help.tip_list_scan') },
      ],
    },
    {
      icon: <Camera size={20} />,
      color: 'bg-brand-accent/10',
      accent: 'text-brand-accent border-brand-accent/20',
      title: txt('help.scanner_title'),
      tips: [
        { label: txt('help.tip_scan_type_title'), text: txt('help.tip_scan_type') },
        { label: txt('help.tip_scan_photos_title'), text: txt('help.tip_scan_photos') },
      ],
    },
    {
      icon: <FileText size={20} />,
      color: 'bg-orange-400/10',
      accent: 'text-orange-400 border-orange-400/20',
      title: txt('review.title'),
      tips: [
        { label: txt('help.tip_review_title'), text: txt('help.tip_review') },
      ],
    },
    {
      icon: <Settings size={20} />,
      color: 'bg-white/5',
      accent: 'text-brand-muted border-white/10',
      title: txt('help.settings_title'),
      tips: [
        { label: txt('help.tip_settings_export_title'), text: txt('help.tip_settings_export') },
      ],
    },
  ];

  return (
    <div className="modal-overlay !p-0 z-[3000] items-end sm:items-center">
      <div className="w-full max-w-md bg-brand-card rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/[0.06] shadow-[0_-20px_80px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom duration-400 flex flex-col max-h-[88vh]">

        {/* HANDLE + HEADER */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/[0.05]">
          <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-brand-accent/10 rounded-xl flex items-center justify-center">
                <BookOpen size={15} className="text-brand-accent" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white">
                  {txt('help.onboarding_title')}
                </p>
                <p className="text-[8px] font-bold text-brand-muted uppercase tracking-wider mt-0.5">
                  {sections.length} {txt('help.next') === 'Siguiente' ? 'secciones' : 'sections'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="btn-icon !p-2 bg-white/5 border-none">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
          {sections.map((section, si) => (
            <div key={si} className="card-glass !rounded-2xl !p-0 overflow-hidden border border-white/[0.04]">

              {/* Título de sección */}
              <div className={`flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04] ${section.color}`}>
                <div className={`${section.accent.split(' ')[0]}`}>
                  {section.icon}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  {section.title}
                </p>
              </div>

              {/* Tips */}
              <div className="divide-y divide-white/[0.03]">
                {section.tips.map((tip, ti) => (
                  <div key={ti} className="px-4 py-3.5">
                    <div className="flex items-start gap-2 mb-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${section.accent.split(' ')[0].replace('text-', 'bg-')}`} />
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/90">
                        {tip.label}
                      </p>
                    </div>
                    <p className="text-[10px] font-semibold text-brand-muted leading-relaxed pl-3.5">
                      {tip.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Tip especial del botón + */}
          <div className="card-glass !rounded-2xl !p-4 border border-brand-primary/15 bg-brand-primary/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-brand-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Plus size={16} className="text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
                {txt('help.tip_nav_plus_title')}
              </p>
            </div>
            <p className="text-[10px] font-semibold text-brand-muted leading-relaxed">
              {txt('help.tip_nav_plus')}
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-shrink-0 px-4 pb-8 pt-3">
          <button onClick={onClose} className="btn-primary shadow-xl">
            <Star size={14} />
            <span>{txt('help.finish')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;