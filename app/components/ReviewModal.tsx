"use client";
import React, { useState, useEffect } from 'react';
import { Check, X, Store, Search, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

// Importaciones de lógica centralizada
import { calculateMatchScore, groupRepeatedProducts } from '../../lib/utils';
import { searchLocalProducts } from '../../lib/products';

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

  // Efecto para agrupar productos y auto-expandir aquellos que no tienen alias (nombres sucios)
  useEffect(() => {
    if (pendingGasto?.productos && !pendingGasto._isGrouped) {
      const grouped = groupRepeatedProducts(pendingGasto.productos);
      setPendingGasto({ ...pendingGasto, productos: grouped, _isGrouped: true });
      
      const autoExpand: number[] = [];
      grouped.forEach((p: any, i: number) => {
        // Si el nombre base es igual al del ticket, marcamos para expandir (invita a limpiar el nombre)
        if (p.nombre_base === p.nombre_ticket) autoExpand.push(i);
      });
      setExpandedIndices(autoExpand);
    }
  }, [pendingGasto, setPendingGasto]);

  const toggleExpand = (idx: number) => {
    setExpandedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
    setShowExtraSearchIdx(null);
    setExtraSearchTerm("");
    setExtraSuggestions([]);
  };

  const handleExtraSearch = async (val: string) => {
    setExtraSearchTerm(val);
    if (val.length > 1) {
      setIsSearchingExtra(true);
      const res = await searchLocalProducts(val);
      // Ya vienen ordenados por longitud desde lib/products.ts
      setExtraSuggestions(res);
      setIsSearchingExtra(false);
    } else {
      setExtraSuggestions([]);
    }
  };

  const setAlias = (productIndex: number, listName: string) => {
    const newProds = [...pendingGasto.productos];
    newProds[productIndex].nombre_base = listName;
    setPendingGasto({ ...pendingGasto, productos: newProds });
    setExpandedIndices(prev => prev.filter(i => i !== productIndex));
    setShowExtraSearchIdx(null);
  };

  const addManualItem = () => {
    if (!manualProd.name) return;
    const p = parseFloat(manualProd.price) || 0;
    const newProduct = { 
      nombre_ticket: manualProd.name.toUpperCase(), 
      nombre_base: manualProd.name, 
      cantidad: manualProd.qty, 
      subtotal: p * manualProd.qty 
    };
    setPendingGasto({
      ...pendingGasto,
      productos: groupRepeatedProducts([...pendingGasto.productos, newProduct])
    });
    setManualProd({ name: '', qty: 1, price: "" });
    setIsManualExpanded(false);
  };

  return (
    <div className="modal-content-full !pb-6 flex flex-col animate-in slide-in-from-bottom duration-500 no-scrollbar">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-fluid-lg font-black italic tracking-tighter text-brand-primary uppercase">
          {txt('review.title')}
        </h2>
        <button onClick={onCancel} className="btn-icon !bg-transparent border-none">
          <X size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1 no-scrollbar pb-20">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 relative">
            <label className="text-small-caps ml-1 mb-1.5 block opacity-60">{txt('review.label_shop')}</label>
            <div className="relative">
              <input value={pendingGasto.comercio} onChange={e => setPendingGasto({...pendingGasto, comercio: e.target.value.toUpperCase()})} className="input-premium !py-3 !text-sm uppercase" />
              <Store size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" />
            </div>
          </div>
          <div className="col-span-6">
            <label className="text-small-caps ml-1 mb-1.5 block opacity-60">{txt('review.label_date')}</label>
            <input value={pendingGasto.fecha} onChange={e => setPendingGasto({...pendingGasto, fecha: e.target.value})} className="input-premium !py-3 !text-center !text-xs" />
          </div>
          <div className="col-span-6">
            <label className="text-small-caps ml-1 mb-1.5 block opacity-60">{txt('review.label_total')}</label>
            <input type="number" value={pendingGasto.total} onChange={e => setPendingGasto({...pendingGasto, total: e.target.value})} className="input-premium !py-3 !text-center !text-sm !text-brand-success font-black" />
          </div>
        </div>

        <section className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-small-caps">{txt('review.products_title')}</h3>
            <button onClick={() => setIsManualExpanded(!isManualExpanded)} className="text-[9px] font-black uppercase text-brand-primary bg-brand-primary/5 px-3 py-1 rounded-full border border-brand-primary/10">
              {isManualExpanded ? `- ${txt('review.close_btn')}` : `+ ${txt('review.add_btn')}`}
            </button>
          </div>

          {isManualExpanded && (
            <div className="card-premium !p-3 bg-brand-primary/5 border-brand-primary/20 animate-in zoom-in-95 mb-4">
              <div className="flex gap-2 mb-2">
                <input placeholder={txt('review.placeholder_prod')} className="bg-brand-bg/50 p-2.5 rounded-lg text-xs flex-1 outline-none border border-white/5 uppercase" value={manualProd.name} onChange={e => setManualProd({...manualProd, name: e.target.value})} />
                <input placeholder={txt('review.placeholder_price')} type="number" className="bg-brand-bg/50 p-2.5 rounded-lg text-xs w-20 text-right outline-none border border-white/5 font-black text-brand-success" value={manualProd.price} onChange={e => setManualProd({...manualProd, price: e.target.value})} />
              </div>
              <button onClick={addManualItem} className="btn-primary !py-2 !text-[9px]">{txt('review.manual_ok')}</button>
            </div>
          )}

          <div className="space-y-2">
            {pendingGasto.productos?.map((p: any, i: number) => {
              const smartSuggestions = db.lista
                .filter(l => !l.confirmed)
                .map(l => ({ ...l, matchScore: calculateMatchScore(p.nombre_ticket, l.name) }))
                .sort((a, b) => b.matchScore - a.matchScore);

              const isExpanded = expandedIndices.includes(i);
              
              // REGLA VISUAL: Un producto tiene alias si el nombre base es distinto al del ticket
              const hasCleanAlias = p.nombre_base.toUpperCase() !== p.nombre_ticket.toUpperCase();

              return (
                <div key={i} className={`flex flex-col transition-all duration-300 rounded-2xl border ${isExpanded ? 'bg-brand-primary/5 border-brand-primary/30 p-3' : 'bg-white/[0.02] border-white/[0.04] p-2'}`}>
                  <button onClick={() => toggleExpand(i)} className="flex items-center gap-3 text-left w-full">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                        <span className="text-[10px] font-black text-brand-primary">{p.cantidad || 1}x</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <p className={`text-[11px] font-black uppercase truncate leading-tight ${hasCleanAlias ? 'text-brand-accent' : 'text-white/60 italic'}`}>
                            {p.nombre_base}
                        </p>
                        {hasCleanAlias && <Sparkles size={10} className="text-brand-accent flex-shrink-0" />}
                      </div>
                      <p className="text-[8px] font-bold text-brand-muted uppercase truncate mt-0.5 opacity-30">{p.nombre_ticket}</p>
                    </div>
                    <p className="text-xs font-black text-brand-success italic">{Number(p.subtotal).toFixed(2)}€</p>
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-brand-primary/10 animate-in slide-in-from-top-2 space-y-3">
                      <p className="text-[8px] font-black uppercase text-brand-primary opacity-60">{txt('review.link_list')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {smartSuggestions.map((item, lIdx) => (
                          <button key={lIdx} onClick={() => setAlias(i, item.name)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${item.matchScore > 0 ? 'bg-brand-primary text-white' : 'bg-white/5 text-brand-muted border border-white/5'}`}>
                            {item.name}
                          </button>
                        ))}
                        
                        {showExtraSearchIdx !== i ? (
                            <button onClick={() => setShowExtraSearchIdx(i)} className="px-3 py-1.5 bg-brand-secondary/40 rounded-lg text-[9px] font-black text-brand-muted flex items-center gap-1">
                                <Search size={10} /> {txt('review.other_btn')}
                            </button>
                        ) : (
                            <div className="w-full space-y-2 animate-in zoom-in-95">
                                <input autoFocus value={extraSearchTerm} onChange={(e) => handleExtraSearch(e.target.value)} placeholder={txt('review.search_placeholder')} className="w-full bg-brand-bg/50 border border-brand-primary/30 p-2 rounded-xl text-[10px] uppercase font-bold outline-none" />
                                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto no-scrollbar">
                                    {extraSuggestions.map((s, sIdx) => (
                                        <button key={sIdx} onClick={() => setAlias(i, s.nombre_base)} className="px-2 py-1 bg-brand-primary/20 rounded-lg text-[8px] font-black text-white uppercase">
                                            {s.nombre_base}
                                        </button>
                                    ))}
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

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-brand-bg via-brand-bg to-transparent">
        <div className="grid grid-cols-2 gap-3">
            <button onClick={onCancel} className="btn-secondary !bg-brand-danger/5 border-none text-brand-danger !lowercase !text-[10px] font-black">{txt('review.discard_btn')}</button>
            <button onClick={() => onSave(pendingGasto)} disabled={loading} className="btn-primary !py-4 shadow-xl !bg-brand-success text-brand-bg">
            {loading ? <Loader2 className="animate-spin" /> : <div className="flex items-center gap-2"><CheckCircle2 size={20} /><span className="text-[11px] font-black tracking-widest uppercase">{txt('review.save_btn')}</span></div>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;