"use client";
import React, { useState } from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';

interface AuthViewProps {
  CLIENT_ID: string;
  txt: (key: string) => string;
}

const AuthView: React.FC<AuthViewProps> = ({ CLIENT_ID, txt }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = () => {
    setIsLoggingIn(true);
    
    // @ts-ignore
    if (!window.google) {
      alert("Google SDK no cargado. Reintenta en un momento.");
      setIsLoggingIn(false);
      return;
    }

    // @ts-ignore
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile",
      ux_mode: 'popup',
      callback: async (response: any) => {
        if (response.code) {
          console.log("✅ Código recibido de Google. Intercambiando...");
          try {
            // 1. Intercambio de código por tokens en el servidor
            const tokenRes = await fetch('/api/auth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: response.code })
            });

            if (!tokenRes.ok) throw new Error("Error en el intercambio de tokens");
            
            const res = await tokenRes.json();
            console.log("✅ Tokens obtenidos correctamente");

            if (res.access_token) {
              // Guardamos tokens
              localStorage.setItem('gdrive_token', res.access_token);
              if (res.refresh_token) {
                localStorage.setItem('gdrive_refresh_token', res.refresh_token);
              }
              
              // 2. Obtener info del usuario para el nombre
              console.log("🔍 Obteniendo perfil de usuario...");
              const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { 
                headers: { Authorization: `Bearer ${res.access_token}` } 
              });

              if (userRes.ok) {
                const info = await userRes.json();
                localStorage.setItem('user_name', info.name || "Usuario");
              } else {
                localStorage.setItem('user_name', "Usuario"); // Fallback
              }

              console.log("🚀 Todo listo. Reiniciando app...");
              // Pequeño delay para asegurar persistencia
              setTimeout(() => {
                window.location.reload();
              }, 300);
            }
          } catch (error) {
            console.error("❌ Error en el proceso de login:", error);
            alert("Hubo un error al conectar con el servidor. Revisa tu conexión.");
            setIsLoggingIn(false);
          }
        } else {
          console.error("❌ Google no devolvió un código válido");
          setIsLoggingIn(false);
        }
      },
      error_callback: (err: any) => {
        console.error("❌ Error de Google Sign-In:", err);
        setIsLoggingIn(false);
      }
    });
    client.requestCode();
  };

  return (
    <main className="app-layout justify-center items-center text-center relative overflow-hidden pt-4 lg:pt-0">
      {/* Círculos de fondo decorativos */}
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px] animate-pulse" />
      
      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="relative mb-12">
          <div className="w-24 h-24 bg-brand-primary rounded-[2.5rem] mx-auto flex items-center justify-center shadow-[0_25px_60px_-15px_rgba(93,46,239,0.5)] rotate-12">
            <ShoppingCart className="text-white" size={48} strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-6 mb-16 px-4">
          <h1 className="heading-1 text-5xl tracking-tighter leading-[0.8]">
            {txt('auth.title')} <span className="text-brand-primary block">{txt('auth.app')}</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-muted">
            {txt('auth.subtitle')}
          </p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <button 
            onClick={handleLogin} 
            disabled={isLoggingIn}
            className="w-full group relative flex items-center bg-white text-black font-bold py-4 px-6 rounded-2xl transition-all duration-300 active:scale-95 shadow-xl disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="animate-spin mx-auto text-black" size={24} />
            ) : (
              <>
                <div className="bg-white p-0.5 rounded-lg mr-4">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <span className="flex-1 text-center text-sm">{txt('auth.login_btn')}</span>
              </>
            )}
          </button>
          
          <p className="text-[8px] font-bold text-brand-muted uppercase tracking-widest leading-relaxed px-4">
            {txt('auth.footer')}
          </p>
        </div>
      </div>
    </main>
  );
};

export default AuthView;