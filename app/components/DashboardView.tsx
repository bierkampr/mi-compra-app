"use client";
import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Store, 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  Utensils, 
  Pill, 
  LayoutGrid,
  ArrowUpRight,
  Tag,
  PieChart as PieIcon
} from 'lucide-react';

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
  stats, 
  currentViewDate, 
  setCurrentViewDate, 
  setSelectedGasto, 
  setActiveTab, 
  txt, 
  lang 
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const changeMonth = (offset: number) => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1));
  };

  const isCurrentMonth = currentViewDate.getMonth() === new Date().getMonth() && 
                         currentViewDate.getFullYear() === new Date().getFullYear();

  const statsPorCategoria = useMemo(() => {
    const cats: Record<string, number> = {};
    stats.currentGastos.forEach(g => {
      const c = g.category || 'others';
      cats[c] = (cats[c] || 0) + Number(g.total);
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  },[stats.currentGastos]);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'dining':
        return { icon: <Utensils size={18} />, color: 'text-orange-400', bg: 'bg-orange-400/10', hex: '#FB923C' };
      case 'health':
        return { icon: <Pill size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-400/10', hex: '#34D399' };
      case 'mini':
        return { icon: <Store size={18} />, color: 'text-brand-accent', bg: 'bg-brand-accent/10', hex: '#00FAD9' };
      case 'super':
        return { icon: <ShoppingCart size={18} />, color: 'text-brand-primary', bg: 'bg-brand-primary/10', hex: '#5D2EEF' };
      case 'others':
        return { icon: <LayoutGrid size={18} />, color: 'text-brand-muted', bg: 'bg-white/5', hex: '#8E94AF' };
      default:
        return { icon: <Tag size={18} />, color: 'text-indigo-400', bg: 'bg-indigo-400/10', hex: '#818CF8' };
    }
  };

  // TU FUNCIÓN ORIGINAL, EFICIENTE Y SIN MODIFICAR (Solo añadí clases lg: para tamaño en escritorio)
  const renderDonutChart = (sizeClass = "w-40 h-40 lg:w-56 lg:h-56") => {
    let cumulativePercent = 0;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className={`relative ${sizeClass} mx-auto flex items-center justify-center`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {statsPorCategoria.map(([cat, val], i) => {
            const percent = (val / stats.total) * 100;
            const strokeDasharray = `${(percent * circumference) / 100} ${circumference}`;
            const strokeDashoffset = `-${(cumulativePercent * circumference) / 100}`;
            cumulativePercent += percent;
            const styles = getCategoryStyles(cat);

            return (
              <circle
                key={i}
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={styles.hex}
                strokeWidth="22"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[8px] lg:text-[10px] font-black text-brand-muted uppercase tracking-widest">{txt('home.records')}</span>
          <span className="text-xl lg:text-3xl font-black italic text-white tracking-tighter">{stats.currentGastos.length}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-10 lg:items-start animate-in fade-in duration-700 no-scrollbar">
      
      {/* COLUMNA IZQUIERDA: RESUMEN Y ANÁLISIS (Ocupa 5 de 12 columnas en escritorio) */}
      <div className="lg:col-span-5 space-y-6">
        {/* SELECTOR DE MES */}
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

        {/* TARJETA DE GASTO TOTAL CON TU LÓGICA DE ANIMACIÓN INTACTA */}
        <button 
          onClick={() => setShowBreakdown(!showBreakdown)}
          className={`w-full text-left relative overflow-hidden card-premium bg-gradient-to-br from-brand-primary to-[#4318BB] border-none shadow-[0_20px_40px_rgba(93,46,239,0.3)] active:scale-[0.98] transition-all duration-500 group ${
            showBreakdown ? '!p-4 lg:!p-8' : '!p-6 lg:!p-10'
          }`}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/60">
                  {txt('home.monthly_spend')}
              </p>
              {/* Se oculta en PC porque el análisis está al lado */}
              <TrendingUp size={showBreakdown ? 12 : 14} className="text-brand-accent opacity-50 group-hover:scale-125 transition-transform lg:hidden" />
            </div>
            
            <h2 className={`font-black italic tracking-tighter text-white leading-none transition-all duration-500 ${
              showBreakdown ? 'text-4xl lg:text-5xl' : 'text-6xl lg:text-7xl'
            }`}>
              {stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
            </h2>

            {!showBreakdown && (
              <div className="flex items-center gap-3 mt-8 animate-in fade-in duration-500">
                <div className="px-3 py-1 bg-white/10 rounded-full border border-white/5">
                  <span className="text-[8px] font-black uppercase tracking-tighter text-white">
                    {stats.currentGastos.length} {txt('home.records')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto text-[8px] font-black uppercase tracking-widest text-brand-accent lg:hidden">
                  <PieIcon size={12} />
                  {txt('home.analysis')}
                </div>
              </div>
            )}
          </div>
          <div className="absolute -right-4 -bottom-4 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        </button>

        {/* GRÁFICO: Visible por CSS en escritorio SIEMPRE, o por state en móvil */}
        <div className={`hidden lg:block card-premium bg-white/[0.02] border-white/[0.05] animate-in zoom-in-95`}>
           <h3 className="text-small-caps text-center mb-8">{txt('home.chart_title')}</h3>
           {renderDonutChart()}
           <div className="mt-10 space-y-3">
              {statsPorCategoria.map(([cat, val], i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase">
                  <span className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: getCategoryStyles(cat).hex}}/> 
                    {cat}
                  </span>
                  <span className="text-white/70">{val.toFixed(2)}€</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* COLUMNA DERECHA: REGISTROS (Ocupa 7 de 12 columnas en escritorio) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex justify-between items-center px-1 mb-1">
          <h3 className="text-small-caps">{txt('home.records')}</h3>
        </div>
        
        {/* CONTENEDOR MÓVIL: Mantiene tu lógica original de if/else */}
        <div className="space-y-3 lg:hidden">
          {showBreakdown ? (
            <div className="animate-in zoom-in-95 duration-300 py-4">
               {renderDonutChart("w-48 h-48")}
               <div className="mt-8 space-y-2">
                  {statsPorCategoria.map(([cat, val], i) => (
                    <div key={i} className="flex justify-between items-center p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.03]">
                        <span className="text-[10px] font-black uppercase">{cat}</span>
                        <span className="text-[10px] font-black text-brand-success">{val.toFixed(2)}€</span>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            stats.currentGastos.length > 0 ? (
              stats.currentGastos.map((g, i) => {
                const styles = getCategoryStyles(g.category);
                return (
                  <button key={i} onClick={() => setSelectedGasto(g)} className="w-full flex justify-between items-center p-4 card-clickable bg-white/[0.03] border-white/[0.05]">
                    <div className="flex items-center gap-4 text-left overflow-hidden">
                      <div className={`flex-shrink-0 p-3 rounded-2xl ${styles.bg} ${styles.color}`}>{styles.icon}</div>
                      <div className="overflow-hidden">
                        <p className="font-black text-[12px] uppercase text-white truncate leading-tight">{g.comercio}</p>
                        <p className="text-[9px] font-bold text-brand-muted mt-1">{g.fecha}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-base font-black text-brand-success tracking-tighter italic">{Number(g.total).toFixed(2)}€</p>
                      <ArrowUpRight size={14} className="text-brand-muted opacity-30" />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-20 text-center card-premium bg-transparent border-dashed border-white/10 opacity-30">
                  <p className="text-xs font-bold uppercase tracking-widest">{txt('home.no_records')}</p>
              </div>
            )
          )}
        </div>

        {/* CONTENEDOR ESCRITORIO: Siempre muestra la lista, tu misma lógica de mapeo */}
        <div className="hidden lg:block space-y-3">
          {stats.currentGastos.length > 0 ? (
            stats.currentGastos.map((g, i) => {
              const styles = getCategoryStyles(g.category);
              return (
                <button key={i} onClick={() => setSelectedGasto(g)} className="w-full flex justify-between items-center p-6 card-clickable bg-white/[0.03] border-white/[0.05]">
                  <div className="flex items-center gap-5 text-left overflow-hidden">
                    <div className={`flex-shrink-0 p-4 rounded-2xl ${styles.bg} ${styles.color}`}>{styles.icon}</div>
                    <div className="overflow-hidden">
                      <p className="font-black text-[15px] uppercase text-white truncate leading-tight">{g.comercio}</p>
                      <p className="text-[10px] font-bold text-brand-muted mt-1.5">{g.fecha}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <p className="text-xl font-black text-brand-success tracking-tighter italic">{Number(g.total).toFixed(2)}€</p>
                    <ArrowUpRight size={16} className="text-brand-muted opacity-30" />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-24 text-center card-premium bg-transparent border-dashed border-white/10 opacity-30">
                <p className="text-sm font-bold uppercase tracking-widest">{txt('home.no_records')}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardView;