"use client";
import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';

interface AuthViewProps {
  CLIENT_ID: string;
  txt: (key: string) => string;
}

const AuthView: React.FC<AuthViewProps> = ({ CLIENT_ID, txt }) => {
  const handleLogin = () => {
    // Cambiamos a initCodeClient para obtener un Refresh Token (Sesión infinita)
    // @ts-ignore
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile",
      ux_mode: 'popup',
      callback: async (response: any) => {
        if (response.code) {
          try {
            // Enviamos el código al servidor para intercambiarlo por tokens
            const res = await fetch('/api/auth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: response.code })
            }).then(r => r.json());

            if (res.access_token) {
              localStorage.setItem('gdrive_token', res.access_token);
              if (res.refresh_token) {
                localStorage.setItem('gdrive_refresh_token', res.refresh_token);
              }
              
              const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { 
                headers: { Authorization: `Bearer ${res.access_token}` } 
              }).then(r => r.json());
              
              localStorage.setItem('user_name', info.name);
              window.location.reload();
            }
          } catch (error) {
            console.error("Error exchanging code for token", error);
            alert("Error al iniciar sesión");
          }
        }
      },
    });
    client.requestCode();
  };

  return (
    <main className="app-layout justify-center items-center text-center relative overflow-hidden">
      {/* Círculos de fondo dinámicos */}
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[40%] bg-brand-accent/10 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="relative mb-16">
          <div className="w-28 h-28 bg-brand-primary rounded-[3rem] mx-auto flex items-center justify-center shadow-[0_25px_60px_-15px_rgba(93,46,239,0.5)] rotate-12 animate-in zoom-in duration-1000">
            <ShoppingCart className="text-white" size={56} strokeWidth={2.5} />
          </div>
          <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-brand-accent rounded-3xl flex items-center justify-center shadow-2xl animate-bounce duration-[2000ms]">
              <div className="w-3 h-3 bg-brand-bg rounded-full animate-pulse" />
          </div>
        </div>

        <div className="space-y-6 mb-20 px-4">
          <div className="space-y-2">
            <h1 className="heading-1 !text-6xl lg:!text-7xl tracking-tighter leading-[0.8] mb-0">
              {txt('auth.title')}
            </h1>
            <h1 className="heading-1 !text-6xl lg:!text-7xl tracking-tighter leading-[0.8] text-brand-primary drop-shadow-2xl">
              {txt('auth.app')}
            </h1>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-white/10" />
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-muted">
              {txt('auth.subtitle')}
            </p>
            <div className="h-px w-8 bg-white/10" />
          </div>
        </div>

        <div className="w-full max-w-xs space-y-6">
          <button 
            onClick={handleLogin} 
            className="w-full group relative flex items-center bg-white text-black font-bold py-4 px-6 rounded-2xl transition-all duration-300 active:scale-95 shadow-[0_15px_30px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(255,255,255,0.4)]"
          >
            <div className="bg-white p-1 rounded-lg mr-4">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <span className="flex-1 text-center text-sm tracking-tight">{txt('auth.login_btn')}</span>
          </button>
          
          <div className="card-glass !p-4 !rounded-2xl border-white/5">
            <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest leading-relaxed">
              {txt('auth.footer')}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AuthView;