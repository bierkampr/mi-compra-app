"use client";
import { useState, useEffect } from 'react';

let _prompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    _prompt = e;
  });
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(_prompt);
  const [isIOS, setIsIOS] = useState(false);
  const [isFirefox, setIsFirefox] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream);
    setIsFirefox(/Firefox/i.test(ua) && !(/iPhone|iPad|iPod/.test(ua)));
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);

    if (_prompt) setInstallPrompt(_prompt);

    const handler = (e: any) => {
      e.preventDefault();
      _prompt = e;
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      _prompt = null;
      setInstallPrompt(null);
    }
    return outcome === 'accepted';
  };

  return { canInstall: !!installPrompt || isIOS || isFirefox, installPrompt, isIOS, isFirefox, isInstalled, handleInstall };
}
