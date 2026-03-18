"use client";
import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Store, 
  Search, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  PlusCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  History,
  Calendar,
  ListTodo
} from 'lucide-react';

import { calculateMatchScore, groupRepeatedProducts } from '../../lib/utils';
import { searchLocalProducts, getLastPrice } from '../../lib/products';

interface ReviewModalProps {
  pendingGasto: any;
  setPendingGasto: (g: any) => void;
  onSave: (g: any) => void;
  onCancel: () => void;
  loading: boolean;
  db: { lista: any[], gastos: any[] };
  txt: (key: string) => string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ 
  pendingGasto, setPendingGasto, onSave, onCancel, loading, db, txt 
}) => {
  const [isManualExpanded, setIsManualExpanded] = useState(false);
  const [manualProd, setManualProd] = useState({ name: '', qty: 1, price: "" });
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);
  
  const [extraSearchTerm, setExtraSearchTerm] = useState("");
  const [extraSuggestions, setExtraSuggestions] = useState<any[]>([]);
  const [isSearchingExtra, setIsSearchingExtra] = useState(false);
  const [showExtraSearchIdx, setShowExtraSearchIdx] = useState<number | null>(null);

  const [historyPrices, setHistoryPrices] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (pendingGasto?.productos && !pendingGasto._isGrouped) {
      const grouped = groupRepeatedProducts(pendingGasto.productos);
      setPendingGasto({ ...pendingGasto, productos: grouped, _isGrouped: true });
      
      const autoExpand: number[] = [];
      grouped.forEach((p: any, i: number) => {
        if (p.nombre_base.toUpperCase() === p.nombre_ticket.toUpperCase()) autoExpand.push(i);
      });
      setExpandedIndices(autoExpand);
      loadAllHistory(grouped);
    }
  }, [pendingGasto, setPendingGasto]);

  const loadAllHistory = async (products: any[]) => {
    const prices: Record<string, number | null> = {};
    for (const p of products) {
      if (p.nombre_base) {
        const lastP = await getLastPrice(p.nombre_base);
        prices[p.nombre_base.toUpperCase()] = lastP;
      }
    }
    setHistoryPrices(prices);
  };

  const limpiarBusqueda = () => {
    setShowExtraSearchIdx(null);
    setExtraSearchTerm("");
    setExtraSuggestions([]);
    setIsSearchingExtra(false);
  };

  const toggleExpand = (idx: number) => {
    limpiarBusqueda();
    setExpandedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleExtraSearch = async (val: string) => {
    const upperVal = val.toUpperCase();
    setExtraSearchTerm(upperVal);
    if (val.length > 1) {
      setIsSearchingExtra(true);
      const res = await searchLocalProducts(upperVal);
      setExtraSuggestions(res);
      setIsSearchingExtra(false);
    } else {
      setExtraSuggestions([]);
    }
  };

  const setAlias = async (productIndex: number, cleanName: string) => {
    const newProds = [...pendingGasto.productos];
    const upperClean = cleanName.toUpperCase().trim();
    newProds[productIndex].nombre_base = upperClean;
    
    setPendingGasto({ ...pendingGasto, productos: newProds });
    const lastP = await getLastPrice(upperClean);
    setHistoryPrices(prev => ({ ...prev, [upperClean]: lastP }));
    setExpandedIndices(prev => prev.filter(i => i !== productIndex));
    limpiarBusqueda();
  };

  const addManualItem = () => {
    if (!manualProd.name) return;
    const p = parseFloat(manualProd.price) || 0;
    const newProduct = { 
      nombre_ticket: manualProd.name.toUpperCase().trim(), 
      nombre_base: manualProd.name.toUpperCase().trim(), 
      cantidad: manualProd.qty, 
      subtotal: p * manualProd.qty 
    };
    const updatedProducts = groupRepeatedProducts([...pendingGasto.productos, newProduct]);
    setPendingGasto({
      ...pendingGasto,
      productos: updatedProducts
    });
    loadAllHistory(updatedProducts);
    setManualProd({ name: '', qty: 1, price: "" });
    setIsManualExpanded(false);
  };

  const renderPriceComparison = (nombreBase: string, subtotal: number, cantidad: number) => {
    const currentPrice = subtotal / (cantidad || 1);
    const oldPrice = historyPrices[nombreBase.toUpperCase()];

    if (oldPrice === undefined || oldPrice === null) {
      return (
        <div className="flex items-center gap-1 opacity-20">
          <History size={8} />
          <span className="text-[7px] font-bold uppercase">{txt('review.no_history')}</span>
        </div>
      );
    }

    const diff = currentPrice - oldPrice;
    const threshold = 0.01;

    if (diff > threshold) {
      return (
        <div className="flex items-center gap-0.5 text-brand-danger animate-in fade-in zoom-in">
          <TrendingUp size={10} />
          <span className="text-[8px] font-black uppercase">{txt('review.price_up')}</span>
        </div>
      );
    } else if (diff < -threshold) {
      return (
        <div className="flex items-center gap-0.5 text-brand-success animate-in fade-in zoom-in">
          <TrendingDown size={10} />
          <span className="text-[8px] font-black uppercase">{txt('review.price_down')}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-0.5 text-brand-muted opacity-40">
          <Minus size={10} />
          <span className="text-[8px] font-black uppercase">{txt('review.price_same')}</span>
        </div>
      );
    }
  };

  return (
    <div className="modal-content-full !pb-0 flex flex-col animate-in slide-in-from-bottom duration-500 no-scrollbar">
      
      {/* HEADER PULIDO */}
      <header className="flex justify-between items-center px-8 pt-8 pb-4 shrink-0">
        <div className="flex flex-col">
            <h2 className="text-xl font-black italic tracking-tighter text-brand-primary uppercase leading-none">
              {txt('review.title')}
            </h2>
            <p className="text-[8px] font-bold text-brand-muted uppercase tracking-[0.3em] mt-1.5">Verificación de Inteligencia Artificial</p>
        </div>
        <button onClick={onCancel} className="btn-icon !bg-white/5 border-none">
          <X size={20} />
        </button>
      </header>

      {/* CUERPO CON SCROLL */}
      <div className="flex-1 overflow-y-auto px-8 space-y-8 no-scrollbar pb-32">
        
        {/* INFO PRINCIPAL */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <div className="relative group">
              <label className="text-small-caps ml-1 mb-2 block">{txt('review.label_shop')}</label>
              <div className="relative">
                <input value={pendingGasto.comercio} onChange={e => setPendingGasto({...pendingGasto, comercio: e.target.value.toUpperCase()})} className="input-premium pr-12" />
                <Store size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted/40 group-focus-within:text-brand-primary transition-colors" />
              </div>
            </div>
          </div>
          <div className="col-span-6">
            <label className="text-small-caps ml-1 mb-2 block">{txt('review.label_date')}</label>
            <div className="relative">
                <input value={pendingGasto.fecha} onChange={e => setPendingGasto({...pendingGasto, fecha: e.target.value})} className="input-premium !text-center !pr-4" />
                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted/20" />
            </div>
          </div>
          <div className="col-span-6">
            <label className="text-small-caps ml-1 mb-2 block">{txt('review.label_total')}</label>
            <div className="relative">
                <input type="number" value={pendingGasto.total} onChange={e => setPendingGasto({...pendingGasto, total: e.target.value})} className="input-premium !text-center !text-brand-success !pr-4" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-success/40 font-black text-xs">€</span>
            </div>
          </div>
        </div>

        {/* LISTADO DE PRODUCTOS */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-small-caps">{txt('review.products_title')} <span className="text-brand-primary opacity-100">[{pendingGasto.productos?.length || 0}]</span></h3>
            <button onClick={() => setIsManualExpanded(!isManualExpanded)} className="text-[10px] font-black uppercase text-brand-primary bg-brand-primary/5 px-4 py-2 rounded-xl border border-brand-primary/10 active:scale-95 transition-all">
              {isManualExpanded ? txt('review.close_btn') : `+ ${txt('review.add_btn')}`}
            </button>
          </div>

          {isManualExpanded && (
            <div className="card-premium !p-4 bg-brand-primary/5 border-brand-primary/20 animate-in zoom-in-95 shadow-none">
              <div className="flex gap-3 mb-3">
                <input autoFocus placeholder={txt('review.placeholder_prod')} className="bg-brand-bg/50 p-3 rounded-xl text-sm flex-1 outline-none border border-white/5 uppercase font-bold" value={manualProd.name} onChange={e => setManualProd({...manualProd, name: e.target.value})} />
                <input placeholder={txt('review.placeholder_price')} type="number" className="bg-brand-bg/50 p-3 rounded-xl text-sm w-24 text-right outline-none border border-white/5 font-black text-brand-success" value={manualProd.price} onChange={e => setManualProd({...manualProd, price: e.target.value})} />
              </div>
              <button onClick={addManualItem} className="btn-primary !py-3">{txt('review.manual_ok')}</button>
            </div>
          )}

          <div className="space-y-2.5">
            {pendingGasto.productos?.map((p: any, i: number) => {
              const smartSuggestions = db.lista
                .filter(l => !l.confirmed)
                .map(l => ({ ...l, matchScore: calculateMatchScore(p.nombre_ticket, l.name) }))
                .sort((a, b) => b.matchScore - a.matchScore);

              const isExpanded = expandedIndices.includes(i);
              const hasCleanAlias = p.nombre_base.toUpperCase() !== p.nombre_ticket.toUpperCase();

              return (
                <div key={i} className={`flex flex-col transition-all duration-500 rounded-2xl border ${isExpanded ? 'bg-brand-primary/5 border-brand-primary/30 p-4' : 'bg-white/[0.02] border-white/[0.04] p-3'}`}>
                  <button onClick={() => toggleExpand(i)} className="flex items-center gap-4 text-left w-full group">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-brand-primary text-white' : 'bg-brand-primary/10 text-brand-primary'}`}>
                        <span className="text-[11px] font-black">{p.cantidad || 1}x</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <p className={`text-[12px] font-black uppercase truncate leading-tight transition-colors ${hasCleanAlias ? 'text-brand-accent' : 'text-white/60 italic group-hover:text-white/80'}`}>
                            {p.nombre_base}
                        </p>
                        {hasCleanAlias && <Sparkles size={12} className="text-brand-accent animate-pulse shrink-0" />}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1 opacity-40">
                        <p className="text-[8px] font-bold text-brand-muted uppercase truncate max-w-[100px]">{p.nombre_ticket}</p>
                        {renderPriceComparison(p.nombre_base, p.subtotal, p.cantidad)}
                      </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-brand-success tracking-tighter italic">{Number(p.subtotal).toFixed(2)}€</p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-3 space-y-4">
                      <div className="flex items-center gap-2">
                        <ListTodo size={12} className="text-brand-primary" />
                        <p className="text-[9px] font-black uppercase tracking-wider text-brand-primary/60">{txt('review.link_list')}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {smartSuggestions.map((item, lIdx) => (
                          <button key={lIdx} onClick={() => setAlias(i, item.name)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${item.matchScore > 0 ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white/5 text-brand-muted border border-white/5 hover:bg-white/10'}`}>
                            {item.name}
                          </button>
                        ))}
                        
                        {showExtraSearchIdx !== i ? (
                            <button 
                                onClick={() => {
                                    setExtraSearchTerm("");
                                    setExtraSuggestions([]);
                                    setShowExtraSearchIdx(i);
                                }} 
                                className="px-4 py-2 bg-brand-secondary/40 rounded-xl text-[10px] font-black text-brand-muted flex items-center gap-2 border border-white/5 hover:bg-brand-secondary/60 transition-colors"
                            >
                                <Search size={12} /> {txt('review.other_btn')}
                            </button>
                        ) : (
                            <div className="w-full space-y-3 animate-in zoom-in-95 mt-2">
                                <div className="relative">
                                    <input autoFocus value={extraSearchTerm} onChange={(e) => handleExtraSearch(e.target.value)} placeholder={txt('review.search_placeholder')} className="w-full bg-brand-bg/80 border border-brand-primary/40 p-3 rounded-xl text-xs uppercase font-bold outline-none shadow-inner" />
                                    {isSearchingExtra && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-primary" />}
                                </div>
                                
                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar p-1">
                                    {extraSuggestions.map((s, sIdx) => (
                                        <button key={sIdx} onClick={() => setAlias(i, s.nombre_base)} className="px-3 py-1.5 bg-brand-primary/20 rounded-lg text-[9px] font-black text-white uppercase border border-brand-primary/30 hover:bg-brand-primary/40 transition-colors">
                                            {s.nombre_base}
                                        </button>
                                    ))}

                                    {extraSearchTerm.length > 2 && (
                                        <button 
                                            onClick={() => setAlias(i, extraSearchTerm)}
                                            className="w-full p-4 bg-brand-accent/5 border border-brand-accent/20 rounded-2xl flex items-center justify-center gap-3 text-brand-accent active:scale-95 transition-all mt-2"
                                        >
                                            <PlusCircle size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Registrar como: {extraSearchTerm}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* FOOTER ACCIONES CON BLUR SUTIL */}
      <div className="shrink-0 p-8 bg-brand-bg/80 backdrop-blur-xl border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            <button onClick={onCancel} className="btn-secondary !bg-brand-danger/5 border-none !text-brand-danger !lowercase !text-[11px] font-black hover:bg-brand-danger/10">
                {txt('review.discard_btn')}
            </button>
            <button onClick={() => onSave(pendingGasto)} disabled={loading} className="btn-primary !py-5 shadow-2xl !bg-brand-success !text-brand-bg group">
                {loading ? <Loader2 className="animate-spin" /> : (
                    <div className="flex items-center gap-3 transition-transform group-active:scale-90">
                        <CheckCircle2 size={24} />
                        <span className="text-[12px] font-black tracking-widest uppercase">{txt('review.save_btn')}</span>
                    </div>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
