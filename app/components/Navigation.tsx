"use client";
import React from 'react';
import { LayoutGrid, Plus, History, Settings, User, WifiOff, Info } from 'lucide-react';

interface NavigationProps {
  user: { name: string };
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOffline: boolean;
  txt: (key: string) => string;
  onShowHelp: () => void; // Nueva prop para activar el tutorial
}

const Navigation: React.FC<NavigationProps> = ({ user, activeTab, setActiveTab, isOffline, txt, onShowHelp }) => {
  return (
    <>
      {/* HEADER SUPERIOR */}
      <header className="flex justify-between items-center mb-6 animate-in fade-in duration-500">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="heading-1 !text-fluid-lg !mb-0 tracking-tight">
              {txt('nav.title')}
            </h1>
            {isOffline && (
              <div className="px-2 py-0.5 bg-brand-danger/10 rounded-full flex items-center gap-1">
                <WifiOff size={10} className="text-brand-danger" />
                <span className="text-[8px] font-black text-brand-danger uppercase tracking-tighter">
                  {txt('nav.offline')}
                </span>
              </div>
            )}
          </div>
          <p className="text-small-caps !text-[8px] opacity-50">
            {txt('nav.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* BOTÓN DE AYUDA (i) */}
          <button 
            onClick={onShowHelp}
            className="btn-icon !p-2 bg-brand-accent/5 border-brand-accent/20 text-brand-accent hover:bg-brand-accent/10"
          >
            <Info size={18} />
          </button>

          {activeTab !== 'settings' && (
            <button 
              onClick={() => setActiveTab('settings')} 
              className="btn-icon !p-2"
            >
              <Settings size={18} />
            </button>
          )}
          
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-indigo-600 flex items-center justify-center font-black text-white border border-white/10 shadow-lg text-sm">
            {user.name ? user.name[0].toUpperCase() : <User size={16} />}
          </div>
        </div>
      </header>

      {/* BARRA DE NAVEGACIÓN INFERIOR (FLOTANTE) */}
      <nav className="nav-bottom">
        <button 
          onClick={() => setActiveTab('home')} 
          className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${
            activeTab === 'home' || activeTab === 'analytics' ? 'text-brand-primary' : 'text-brand-muted opacity-40'
          }`}
        >
          <LayoutGrid size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span className="text-[8px] font-black uppercase mt-1 tracking-widest">
            {txt('nav.home')}
          </span>
        </button>

        <div className="relative -top-5 px-2">
          <button 
            onClick={() => setActiveTab('add')} 
            className={`w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-[0_10px_30px_rgba(93,46,239,0.5)] active:scale-90 transition-all ${
              activeTab === 'add' ? 'rotate-45 shadow-brand-primary/20' : ''
            }`}
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>

        <button 
          onClick={() => setActiveTab('list')} 
          className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${
            activeTab === 'list' ? 'text-brand-primary' : 'text-brand-muted opacity-40'
          }`}
        >
          <History size={22} strokeWidth={activeTab === 'list' ? 2.5 : 2} />
          <span className="text-[8px] font-black uppercase mt-1 tracking-widest">
            {txt('nav.list')}
          </span>
        </button>
      </nav>
    </>
  );
};

export default Navigation;