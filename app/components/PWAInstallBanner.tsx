"use client";
import React, { useState, useEffect } from 'react';
import { Download, X, ChevronRight, ChevronLeft, Smartphone } from 'lucide-react';

interface PWAInstallBannerProps {
  txt: (key: string) => string;
}

const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ txt }) => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSTutorial, setShowIOSTutorial] = useState(false);
  const [iosStep, setIosStep] = useState(0);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('pwa_banner_dismissed')) return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      setShowBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSTutorial(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const iosSteps = [
    {
      title: txt('pwa.ios_step1_title'),
      desc: txt('pwa.ios_step1_desc'),
      img: '/tutorial/cuadro-compartir.jpg',
    },
    {
      title: txt('pwa.ios_step2_title'),
      desc: txt('pwa.ios_step2_desc'),
      img: '/tutorial/ver-mas.jpg',
    },
    {
      title: txt('pwa.ios_step3_title'),
      desc: txt('pwa.ios_step3_desc'),
      img: '/tutorial/a%C3%B1adir-a-pantalla.jpg',
    },
    {
      title: txt('pwa.ios_step4_title'),
      desc: txt('pwa.ios_step4_desc'),
      img: '/tutorial/agregar.jpg',
    },
  ];

  if (!showBanner) return null;

  return (
    <>
      {/* BANNER FLOTANTE */}
      {!showIOSTutorial && (
        <div className="fixed bottom-28 left-4 right-4 z-[500] animate-in slide-in-from-bottom-4 duration-500">
          <div className="card-premium !p-4 border-brand-primary/40 bg-gradient-to-r from-brand-card via-brand-card to-brand-primary/10 shadow-[0_25px_60px_rgba(0,0,0,0.7)] flex items-center gap-3">
            <div className="w-11 h-11 bg-brand-primary/15 rounded-2xl flex items-center justify-center flex-shrink-0 border border-brand-primary/20">
              <Smartphone size={20} className="text-brand-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white leading-tight">
                {txt('pwa.banner_title')}
              </p>
              <p className="text-[8px] font-bold text-brand-muted uppercase tracking-wider mt-0.5 leading-tight truncate">
                {txt('pwa.banner_desc')}
              </p>
            </div>

            <button
              onClick={isIOS ? () => setShowIOSTutorial(true) : handleInstall}
              className="flex-shrink-0 px-4 py-2.5 bg-brand-primary rounded-xl text-white text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg"
            >
              {isIOS ? txt('pwa.ios_btn') : txt('pwa.install_btn')}
            </button>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1.5 text-brand-muted/30 hover:text-brand-muted transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* TUTORIAL PASO A PASO PARA iOS */}
      {showIOSTutorial && (
        <div className="fixed inset-0 z-[9998] bg-brand-bg flex flex-col animate-in slide-in-from-bottom duration-400">
          
          {/* HEADER */}
          <div className="flex justify-between items-start px-6 pt-10 pb-4 flex-shrink-0">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-primary">
                {txt('pwa.ios_tutorial_label')} {iosStep + 1} / {iosSteps.length}
              </p>
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-white mt-1 max-w-[260px] leading-tight">
                {iosSteps[iosStep].title}
              </h2>
            </div>
            <button
              onClick={handleDismiss}
              className="btn-icon !p-2.5 bg-white/5 border-none mt-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* PROGRESO */}
          <div className="flex gap-1.5 px-6 mb-4 flex-shrink-0">
            {iosSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 flex-1 ${
                  i < iosStep
                    ? 'bg-brand-primary'
                    : i === iosStep
                    ? 'bg-brand-primary animate-pulse'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* IMAGEN */}
          <div className="flex-1 flex items-center justify-center px-6 overflow-hidden">
            <div className="relative w-full max-w-[280px] rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.9)]">
              <img
                key={iosStep}
                src={iosSteps[iosStep].img}
                alt={iosSteps[iosStep].title}
                className="w-full h-auto object-cover animate-in zoom-in-95 fade-in duration-400"
              />
              <div className="absolute top-3 right-3 w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center shadow-lg">
                <span className="text-[12px] font-black text-white">{iosStep + 1}</span>
              </div>
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="px-6 py-5 flex-shrink-0">
            <div className="bg-brand-card border border-brand-primary/20 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-white/90 leading-relaxed tracking-wide text-center">
                {iosSteps[iosStep].desc}
              </p>
            </div>
          </div>

          {/* BOTONES DE NAVEGACIÓN */}
          <div className="flex gap-3 px-6 pb-10 flex-shrink-0">
            {iosStep > 0 ? (
              <button
                onClick={() => setIosStep(iosStep - 1)}
                className="btn-secondary flex-1 !py-4 gap-2"
              >
                <ChevronLeft size={16} />
                {txt('help.next') === 'Siguiente' ? 'Atrás' : 'Back'}
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="btn-secondary flex-1 !py-4"
              >
                {txt('help.skip')}
              </button>
            )}

            <button
              onClick={() => {
                if (iosStep < iosSteps.length - 1) {
                  setIosStep(iosStep + 1);
                } else {
                  handleDismiss();
                }
              }}
              className="btn-primary flex-[2] !py-4 shadow-xl"
            >
              {iosStep < iosSteps.length - 1 ? (
                <>
                  <span>{txt('help.next')}</span>
                  <ChevronRight size={18} />
                </>
              ) : (
                <span>✓ {txt('pwa.ios_done')}</span>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallBanner;
