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
  }, [stats.currentGastos]);

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

  const renderDonutChart = () => {
    let cumulativePercent = 0;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="relative w-40 h-40 lg:w-56 lg:h-56 mx-auto flex items-center justify-center">
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
    <div className="space-y-5 lg:space-y-8 animate-in slide-in-from-bottom-4 duration-500 no-scrollbar">
      {/* SELECTOR DE MES */}
      <div className="flex items-center justify-between px-2 max-w-md mx-auto lg:max-w-none">
        <button onClick={() => changeMonth(-1)} className="btn-icon !p-1.5 border-none bg-white/5">
          <ChevronLeft size={18} />
        </button>
        <span className="text-[10px] lg:text-[12px] font-black uppercase tracking-[0.3em] text-white/90">
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
      <button 
        onClick={() => setShowBreakdown(!showBreakdown)}
        className={`w-full text-left relative overflow-hidden card-premium bg-gradient-to-br from-brand-primary to-[#4318BB] border-none shadow-[0_20px_40px_rgba(93,46,239,0.3)] active:scale-[0.98] transition-all duration-500 group ${
          showBreakdown ? '!p-4 lg:!p-8' : '!p-6 lg:!p-10'
        }`}
      >
        <div className="relative z-10 lg:flex lg:items-center lg:justify-between">
          <div>
            <div className="flex justify-between items-start mb-1 lg:mb-2">
              <p className="text-[9px] lg:text-[11px] font-black uppercase tracking-widest text-white/60">
                  {txt('home.monthly_spend')}
              </p>
              <TrendingUp size={showBreakdown ? 12 : 14} className="text-brand-accent opacity-50 lg:hidden" />
            </div>
            
            <h2 className={`font-black italic tracking-tighter text-white leading-none transition-all duration-500 ${
              showBreakdown ? 'text-3xl lg:text-5xl' : 'text-5xl lg:text-7xl'
            }`}>
              {stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
            </h2>
          </div>

          {!showBreakdown && (
            <div className="flex items-center gap-3 mt-4 lg:mt-0 animate-in fade-in duration-500">
              <div className="px-3 py-1 bg-white/10 rounded-full border border-white/5">
                <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-tighter text-white">
                  {stats.currentGastos.length} {txt('home.records')}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 ml-auto lg:ml-4 text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-brand-accent">
                <PieIcon size={16} />
                <span className="hidden lg:inline">{txt('home.analysis')}</span>
              </div>
            </div>
          )}
        </div>
        <div className="absolute -right-4 -bottom-4 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </button>

      {/* CONTENIDO DINÁMICO */}
      {!showBreakdown ? (
        <section className="space-y-3 lg:space-y-6">
          <div className="flex justify-between items-center px-1 mb-1">
            <h3 className="text-small-caps lg:text-xs">{txt('home.records')}</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-4">
            {stats.currentGastos.length > 0 ? (
              stats.currentGastos.map((g, i) => {
                const styles = getCategoryStyles(g.category);
                return (
                  <button 
                    key={i} 
                    onClick={() => setSelectedGasto(g)} 
                    className="w-full flex justify-between items-center p-3.5 lg:p-5 card-clickable bg-white/[0.03] border-white/[0.05]"
                  >
                    <div className="flex items-center gap-3.5 text-left overflow-hidden">
                      <div className={`flex-shrink-0 p-2.5 lg:p-3 rounded-xl ${styles.bg} ${styles.color}`}>
                        {styles.icon}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-black text-[11px] lg:text-[13px] uppercase text-white truncate leading-tight">
                          {g.comercio}
                        </p>
                        <p className="text-[9px] lg:text-[10px] font-bold text-brand-muted mt-0.5">{g.fecha}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-sm lg:text-base font-black text-brand-success tracking-tighter">
                        {Number(g.total).toFixed(2)}€
                      </p>
                      <ArrowUpRight size={12} className="text-brand-muted opacity-30" />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="lg:col-span-2 py-12 text-center card-premium bg-transparent border-dashed border-white/10">
                <p className="text-xs font-bold text-brand-muted uppercase tracking-widest">
                    {txt('home.no_records')}
                </p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="animate-in fade-in slide-in-from-top-4 duration-500 pb-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12">
            
            {/* COLUMNA IZQUIERDA: GRÁFICO */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center py-4 lg:py-0 border-b lg:border-b-0 lg:border-r border-white/5 mb-8 lg:mb-0">
              <h3 className="text-[9px] lg:text-[11px] font-black uppercase tracking-widest text-brand-muted text-center mb-6">{txt('home.chart_title')}</h3>
              {renderDonutChart()}
            </div>

            {/* COLUMNA DERECHA: DESGLOSES */}
            <div className="lg:col-span-7 space-y-8">
              {/* CATEGORÍAS */}
              <div className="space-y-4">
                  <h3 className="text-small-caps lg:text-xs">{txt('home.category_breakdown')}</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                    {statsPorCategoria.map(([cat, val], i) => {
                      const percentage = (val / stats.total) * 100;
                      const styles = getCategoryStyles(cat);
                      const isCustom = !['super', 'mini', 'dining', 'health', 'others'].includes(cat);
                      
                      return (
                        <div key={i} className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className={`${styles.color} p-1 bg-white/5 rounded-lg`}>
                                {styles.icon}
                              </div>
                              <span className="text-[10px] lg:text-[11px] font-black uppercase text-white/80">
                                {isCustom ? cat : txt(`scan.${cat}`)}
                              </span>
                            </div>
                            <span className="text-xs lg:text-sm font-black text-white">{val.toFixed(2)}€</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${percentage}%`, backgroundColor: styles.hex }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
              </div>

              {/* COMERCIOS */}
              <div className="space-y-4">
                  <h3 className="text-small-caps lg:text-xs">{txt('home.shop_breakdown')}</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {Object.entries(stats.porComercio)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, val], i) => {
                        const percentage = (val / stats.total) * 100;
                        return (
                          <div key={i} className="shop-row flex-col !items-start gap-2 bg-white/[0.01]">
                            <div className="flex justify-between w-full">
                              <span className="text-[10px] font-black uppercase text-white/60">{name}</span>
                              <span className="text-[10px] font-black text-brand-success">{val.toFixed(2)}€</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand-primary/40 rounded-full transition-all duration-1000" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
              </div>
            </div>

          </div>
        </section>
      )}
    </div>
  );
};

export default DashboardView;