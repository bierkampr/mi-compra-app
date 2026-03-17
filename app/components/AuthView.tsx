"use client";
import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';

interface AuthViewProps {
  CLIENT_ID: string;
  txt: (key: string) => string;
}

const AuthView: React.FC<AuthViewProps> = ({ CLIENT_ID, txt }) => {
  const handleLogin = () => {
    // @ts-ignore
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile",
      callback: async (res: any) => {
        localStorage.setItem('gdrive_token', res.access_token);
        const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { 
          headers: { Authorization: `Bearer ${res.access_token}` } 
        }).then(r => r.json());
        
        localStorage.setItem('user_name', info.name);
        window.location.reload();
      },
    });
    client.requestAccessToken();
  };

  return (
    <main className="app-layout justify-center items-center text-center">
      <div className="relative mb-12">
        <div className="w-24 h-24 bg-brand-primary rounded-[2.5rem] mx-auto flex items-center justify-center shadow-[0_20px_50px_rgba(93,46,239,0.4)] rotate-6 animate-in zoom-in duration-700">
          <ShoppingCart className="text-white" size={48} strokeWidth={2.5} />
        </div>
        <div className="absolute -right-4 -top-4 w-8 h-8 bg-brand-accent rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
            <div className="w-2 h-2 bg-brand-bg rounded-full" />
        </div>
      </div>

      <div className="space-y-4 mb-12 px-4">
        <h1 className="heading-1 !text-5xl tracking-tighter leading-none">
          {txt('auth.title')} <br/> <span className="text-brand-primary">{txt('auth.app')}</span>
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-muted opacity-60">
          {txt('auth.subtitle')}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <button 
          onClick={handleLogin} 
          className="btn-primary py-5 group"
        >
          <span>{txt('auth.login_btn')}</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
        
        <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest leading-relaxed opacity-40">
          {txt('auth.footer')}
        </p>
      </div>

      {/* Decoración de fondo */}
      <div className="fixed -bottom-20 -left-20 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed -top-20 -right-20 w-64 h-64 bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none" />
    </main>
  );
};

export default AuthView;