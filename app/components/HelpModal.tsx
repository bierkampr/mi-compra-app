"use client";
import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  LayoutGrid, 
  Plus, 
  History, 
  Settings, 
  BarChart3, 
  Camera, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
  txt: (key: string) => string;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose, txt }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: txt('help.home_title'),
      desc: txt('help.home_desc'),
      icon: <BarChart3 size={40} className="text-brand-primary" />,
      color: "bg-brand-primary/10"
    },
    {
      title: txt('help.nav_title'),
      desc: txt('help.nav_desc'),
      icon: (
        <div className="flex gap-2">
            <LayoutGrid size={24} className="text-brand-muted" />
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center -top-2 relative shadow-lg">
                <Plus size={24} className="text-white" />
            </div>
            <History size={24} className="text-brand-muted" />
        </div>
      ),
      color: "bg-brand-secondary/30"
    },
    {
      title: txt('help.scanner_title'),
      desc: txt('help.scanner_desc'),
      icon: <Camera size={40} className="text-brand-accent" />,
      color: "bg-brand-accent/10"
    },
    {
      title: txt('help.list_title'),
      desc: txt('help.list_desc'),
      icon: <CheckCircle2 size={40} className="text-brand-success" />,
      color: "bg-brand-success/10"
    },
    {
      title: txt('help.settings_title'),
      desc: txt('help.settings_desc'),
      icon: <Settings size={40} className="text-brand-muted" />,
      color: "bg-white/5"
    }
  ];

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else onClose();
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="modal-overlay !p-6 z-[3000]">
      <div className="card-premium max-w-sm w-full relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col min-h-[450px]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-brand-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted">
                {txt('help.onboarding_title')}
            </span>
          </div>
          <button onClick={onClose} className="btn-icon !p-1.5 border-none bg-white/5">
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO DINÁMICO */}
        <div className="flex-1 flex flex-col items-center text-center justify-center space-y-6 px-2">
          <div className={`w-24 h-24 rounded-[2rem] ${steps[currentStep].color} flex items-center justify-center mb-2 animate-in fade-in zoom-in duration-500`}>
            {steps[currentStep].icon}
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                {steps[currentStep].title}
            </h3>
            <p className="text-xs font-bold text-brand-muted leading-relaxed uppercase opacity-80">
                {steps[currentStep].desc}
            </p>
          </div>
        </div>

        {/* INDICADORES DE PASO (DOTS) */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep ? 'w-8 bg-brand-primary' : 'w-2 bg-white/10'
              }`} 
            />
          ))}
        </div>

        {/* BOTONES DE NAVEGACIÓN */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button 
              onClick={prev} 
              className="btn-secondary !py-4 flex-1"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          
          <button 
            onClick={next} 
            className="btn-primary !py-4 flex-[2] shadow-xl"
          >
            <span>{currentStep === steps.length - 1 ? txt('help.finish') : txt('help.next')}</span>
            {currentStep < steps.length - 1 && <ChevronRight size={18} />}
          </button>
        </div>

        {/* DECORACIÓN DE FONDO */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
};

export default HelpModal;