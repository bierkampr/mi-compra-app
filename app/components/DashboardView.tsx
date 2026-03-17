"use client";
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Store, BarChart3, ArrowUpRight, TrendingUp } from 'lucide-react';

interface DashboardViewProps {
  stats: {
    total: number;
    currentGastos: any[];
    porComercio: Record<string, number>;
  };
  currentViewDate: Date;
  setCurrentViewDate: (date: Date) => void;
  setSelectedGasto: (gasto: any) => void;
  setActiveTab: (tab: string) => void;
  txt: (key: string) => string;
  lang: string;
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
  stats, currentViewDate, setCurrentViewDate, setSelectedGasto, setActiveTab, txt, lang 
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const changeMonth = (offset: number) => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1));
  };

  const isCurrentMonth = currentViewDate.getMonth() === new Date().getMonth() && 
                         currentViewDate.getFullYear() === new Date().getFullYear();

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* SELECTOR DE MES COMPACTO */}
      <div className="flex items-center justify-between px-2">
        <button onClick={() => changeMonth(-1)} className="btn-icon !p-1.5 border-none bg-white/5">
          <ChevronLeft size={18} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">
          {currentViewDate.toLocaleDateString(lang, { month: 'long', year: 'numeric' })}
        </span>
        <button 
          onClick={() => changeMonth(1)} 
          disabled={isCurrentMonth}
          className={`btn-icon !p-1.5 border-none bg-white/5 ${isCurrentMonth ? 'opacity-0' : ''}`}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* TARJETA DE GASTO TOTAL */}
      <div className="relative overflow-hidden card-premium bg-gradient-to-br from-brand-primary to-[#4318BB] border-none !p-6 shadow-[0_20px_40px_rgba(93,46,239,0.3)]">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/60">
              {txt('home.monthly_spend')}
            </p>
            <TrendingUp size={14} className="text-brand-accent opacity-50" />
          </div>
          <h2 className="text-5xl font-black italic tracking-tighter text-white leading-none">
            {stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
          </h2>
          <div className="flex items-center gap-3 mt-4">
            <div className="px-3 py-1 bg-white/10 rounded-full border border-white/5">
              <span className="text-[8px] font-black uppercase tracking-tighter text-white">
                {stats.currentGastos.length} {txt('home.records')}
              </span>
            </div>
            <button 
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-1.5 ml-auto text-[8px] font-black uppercase tracking-widest text-brand-accent"
            >
              <BarChart3 size={12} />
              {showBreakdown ? txt('home.view_gastos') : txt('home.analysis')}
            </button>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* CONTENIDO DINÁMICO: LISTA O ANÁLISIS */}
      {!showBreakdown ? (
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1 mb-1">
            <h3 className="text-small-caps">{txt('home.records')}</h3>
          </div>
          
          <div className="space-y-2.5">
            {stats.currentGastos.length > 0 ? (
              stats.currentGastos.map((g, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedGasto(g)} 
                  className="w-full flex justify-between items-center p-3.5 card-clickable bg-white/[0.03] border-white/[0.05]"
                >
                  <div className="flex items-center gap-3.5 text-left overflow-hidden">
                    <div className="flex-shrink-0 p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary">
                      <Store size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-black text-[11px] uppercase text-white truncate leading-tight">
                        {g.comercio}
                      </p>
                      <p className="text-[9px] font-bold text-brand-muted mt-0.5">{g.fecha}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-sm font-black text-brand-success tracking-tighter">
                      {Number(g.total).toFixed(2)}€
                    </p>
                    <ArrowUpRight size={12} className="text-brand-muted opacity-30" />
                  </div>
                </button>
              ))
            ) : (
              <div className="py-12 text-center card-premium bg-transparent border-dashed border-white/10">
                <p className="text-xs font-bold text-brand-muted uppercase tracking-widest">
                  {txt('home.no_records')}
                </p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
          <h3 className="text-small-caps mb-4">{txt('home.shop_breakdown')}</h3>
          <div className="space-y-2">
            {Object.entries(stats.porComercio)
              .sort((a, b) => b[1] - a[1])
              .map(([name, val], i) => {
                const percentage = (val / stats.total) * 100;
                return (
                  <div key={i} className="shop-row flex-col !items-start gap-2">
                    <div className="flex justify-between w-full">
                      <span className="text-[10px] font-black uppercase text-white/80">{name}</span>
                      <span className="text-xs font-black text-brand-success">{val.toFixed(2)}€</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-primary rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
};

export default DashboardView;