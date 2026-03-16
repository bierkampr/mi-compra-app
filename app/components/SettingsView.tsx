"use client";
import React from 'react';
import { LogOut, Download, ChevronLeft, User, ShieldCheck, Database, CreditCard } from 'lucide-react';
import { exportToCSV } from '@/lib/utils';

interface SettingsViewProps {
  user: { name: string };
  db: { gastos: any[] };
  setActiveTab: (tab: string) => void;
  txt: (key: string) => string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, db, setActiveTab, txt }) => {
  const handleLogout = () => {
    if (confirm("¿Cerrar sesión? Se borrará el acceso local.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-20">
      {/* HEADER AJUSTES */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setActiveTab('home')} className="btn-icon">
          <ChevronLeft size={20} />
        </button>
        <h2 className="heading-2 !text-sm tracking-[0.2em]">{txt('settings.title') || 'Ajustes'}</h2>
      </div>

      {/* CARD PERFIL PREMIUM */}
      <div className="card-premium !p-8 text-center relative overflow-hidden group">
        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-primary to-indigo-600 rounded-[2rem] mx-auto mb-4 flex items-center justify-center text-white shadow-2xl group-hover:scale-105 transition-transform duration-500">
            <span className="text-3xl font-black">{user.name[0].toUpperCase()}</span>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">{user.name}</h2>
          <div className="flex items-center justify-center gap-1.5 opacity-50">
            <ShieldCheck size={12} className="text-brand-accent" />
            <p className="text-[9px] font-black uppercase tracking-widest">Cuenta Verificada</p>
          </div>
        </div>
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.02]">
            <User size={120} />
        </div>
      </div>

      {/* OPCIONES DE DATOS */}
      <div className="space-y-3">
        <h3 className="text-small-caps ml-1">Gestión de Datos</h3>
        
        <button 
          onClick={() => exportToCSV(db.gastos)} 
          className="w-full flex items-center justify-between p-5 card-premium bg-white/[0.03] hover:bg-white/[0.06] transition-colors border-none"
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-brand-accent/10 rounded-xl text-brand-accent">
              <Download size={20} />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-black uppercase text-white leading-tight">Exportar Gastos</p>
              <p className="text-[9px] font-bold text-brand-muted uppercase mt-0.5">Descargar en formato CSV</p>
            </div>
          </div>
          <ChevronLeft size={16} className="rotate-180 opacity-20" />
        </button>

        <div className="w-full flex items-center justify-between p-5 card-premium bg-white/[0.03] border-none opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary">
              <Database size={20} />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-black uppercase text-white leading-tight">Google Drive Sync</p>
              <p className="text-[9px] font-bold text-brand-muted uppercase mt-0.5">Sincronización Activa</p>
            </div>
          </div>
          <div className="w-2 h-2 bg-brand-success rounded-full animate-pulse" />
        </div>
      </div>

      {/* BOTÓN CERRAR SESIÓN */}
      <div className="pt-4">
        <button 
          onClick={handleLogout} 
          className="btn-secondary !py-5 text-brand-danger bg-brand-danger/5 border-brand-danger/10 active:bg-brand-danger active:text-white group"
        >
          <LogOut size={18} className="group-active:translate-x-1 transition-transform" />
          <span className="text-[10px] font-black tracking-[0.2em]">{txt('settings.logout')}</span>
        </button>
      </div>

      {/* FOOTER VERSIÓN */}
      <div className="text-center pt-8">
        <p className="text-[8px] font-black text-brand-muted uppercase tracking-[0.4em] opacity-30">
          Mi Compra App v1.1.0 • 2026
        </p>
      </div>
    </div>
  );
};

export default SettingsView;