"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Check, X, Store, Calendar, Euro, Link, Loader2, AlertCircle, Sparkles, Hash } from 'lucide-react';
import { calculateMatchScore, groupRepeatedProducts } from '../../lib/utils';

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

  // 1. AGRUPACIÓN AL INICIO: Si el ticket viene de la IA, lo agrupamos automáticamente
  useEffect(() => {
    if (pendingGasto?.productos && !pendingGasto._isGrouped) {
      const grouped = groupRepeatedProducts(pendingGasto.productos);
      setPendingGasto({ ...pendingGasto, productos: grouped, _isGrouped: true });
      
      // Auto-expandir los que no tienen alias (donde nombre_base es igual al nombre_ticket)
      const autoExpand: number[] = [];
      grouped.forEach((p: any, i: number) => {
        if (p.nombre_base === p.nombre_ticket) autoExpand.push(i);
      });
      setExpandedIndices(autoExpand);
    }
  }, [pendingGasto, setPendingGasto]);

  const toggleExpand = (idx: number) => {
    setExpandedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const setAlias = (productIndex: number, listName: string) => {
    const newProds = [...pendingGasto.productos];
    newProds[productIndex].nombre_base = listName;
    setPendingGasto({ ...pendingGasto, productos: newProds });
    setExpandedIndices(prev => prev.filter(i => i !== productIndex));
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
          REVISAR COMPRA
        </h2>
        <button onClick={onCancel} className="btn-icon !bg-transparent border-none">
          <X size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1 no-scrollbar">
        {/* CABECERA: TIENDA, FECHA Y TOTAL */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 relative">
            <label className="text-small-caps ml-1 mb-1.5 block opacity-60">Comercio</label>
            <div className="relative">
              <input 
                value={pendingGasto.comercio} 
                onChange={e => setPendingGasto({...pendingGasto, comercio: e.target.value.toUpperCase()})}
                className="input-premium !py-3 !text-sm uppercase tracking-wider" 
              />
              <Store size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" />
            </div>
          </div>

          <div className="col-span-6">
            <label className="text-small-caps ml-1 mb-1.5 block opacity-60">Fecha</label>
            <input 
              value={pendingGasto.fecha} 
              onChange={e => setPendingGasto({...pendingGasto, fecha: e.target.value})}
              className="input-premium !py-3 !text-center !text-xs" 
            />
          </div>

          <div className="col-span-6">
            <label className="text-small-caps ml-1 mb-1.5 block opacity-60">Total (€)</label>
            <input 
              type="number" 
              value={pendingGasto.total} 
              onChange={e => setPendingGasto({...pendingGasto, total: e.target.value})}
              className="input-premium !py-3 !text-center !text-sm !text-brand-success font-black" 
            />
          </div>
        </div>

        {/* LISTADO DE PRODUCTOS */}
        <section className="space-y-2">
          <div className="flex justify-between items-center px-1 mb-2">
            <h3 className="text-small-caps">Ítems detectados</h3>
            <button 
              onClick={() => setIsManualExpanded(!isManualExpanded)}
              className="text-[9px] font-black uppercase text-brand-primary bg-brand-primary/5 px-3 py-1 rounded-full border border-brand-primary/10"
            >
              {isManualExpanded ? '- Cerrar' : '+ Añadir'}
            </button>
          </div>

          {isManualExpanded && (
            <div className="card-premium !p-3 bg-brand-primary/5 border-brand-primary/20 animate-in zoom-in-95 mb-4">
              <div className="flex gap-2 mb-2">
                <input placeholder="Producto..." className="bg-brand-bg/50 p-2.5 rounded-lg text-xs flex-1 outline-none border border-white/5 uppercase" value={manualProd.name} onChange={e => setManualProd({...manualProd, name: e.target.value})} />
                <input placeholder="0.00" type="number" className="bg-brand-bg/50 p-2.5 rounded-lg text-xs w-20 text-right outline-none border border-white/5 font-black text-brand-success" value={manualProd.price} onChange={e => setManualProd({...manualProd, price: e.target.value})} />
              </div>
              <button onClick={addManualItem} className="btn-primary !py-2 !text-[9px]">Aceptar e Intercambiar</button>
            </div>
          )}

          <div className="space-y-2 pb-10">
            {pendingGasto.productos?.map((p: any, i: number) => {
              const smartSuggestions = db.lista
                .filter(l => !l.confirmed)
                .map(l => ({ ...l, matchScore: calculateMatchScore(p.nombre_ticket, l.name) }))
                .sort((a, b) => b.matchScore - a.matchScore);

              const isExpanded = expandedIndices.includes(i);
              const hasAlias = p.nombre_base !== p.nombre_ticket;

              return (
                <div key={i} className={`flex flex-col transition-all duration-300 rounded-2xl border ${isExpanded ? 'bg-brand-primary/5 border-brand-primary/30 p-3' : 'bg-white/[0.02] border-white/[0.04] p-2'}`}>
                  <button 
                    onClick={() => toggleExpand(i)}
                    className="flex items-center gap-3 text-left w-full"
                  >
                    {/* CONTADOR DE CANTIDAD A LA IZQUIERDA */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                        <span className="text-[10px] font-black text-brand-primary">{p.cantidad || 1}x</span>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <p className={`text-[11px] font-black uppercase truncate leading-tight ${hasAlias ? 'text-brand-accent' : 'text-white'}`}>
                          {p.nombre_base}
                        </p>
                        {hasAlias && <Sparkles size={10} className="text-brand-accent flex-shrink-0" />}
                      </div>
                      <p className="text-[8px] font-bold text-brand-muted uppercase truncate mt-0.5 opacity-30 tracking-wider">
                        {p.nombre_ticket}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-xs font-black text-brand-success italic tracking-tighter">
                        {Number(p.subtotal).toFixed(2)}€
                      </p>
                      <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-brand-primary text-white' : 'bg-white/5 text-brand-muted'}`}>
                        <Link size={12} />
                      </div>
                    </div>
                  </button>

                  {/* PANEL DE VINCULACIÓN */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-brand-primary/10 animate-in slide-in-from-top-2">
                      <p className="text-[8px] font-black uppercase text-brand-primary mb-2 flex items-center gap-1 opacity-60">
                        <AlertCircle size={10} /> Vincular con tu lista:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {smartSuggestions.map((item, lIdx) => (
                          <button 
                            key={lIdx} 
                            onClick={() => setAlias(i, item.name)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                               item.matchScore > 0 
                               ? 'bg-brand-primary text-white shadow-lg border border-brand-primary/30' 
                               : 'bg-white/5 text-brand-muted border border-white/5'
                            }`}
                          >
                            {item.matchScore > 0 && <Sparkles size={10} />}
                            {item.name}
                          </button>
                        ))}
                        <button 
                          onClick={() => {
                            const n = prompt("Nombre genérico personalizado:");
                            if (n) setAlias(i, n);
                          }}
                          className="px-3 py-1.5 bg-brand-secondary/40 border border-white/10 rounded-lg text-[9px] font-black uppercase text-brand-muted"
                        >
                          + OTRO
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={onCancel} className="btn-secondary !bg-transparent border-none text-brand-danger !lowercase !text-[10px] opacity-60 font-black">
          descartar registro
        </button>
        <button 
          onClick={() => onSave(pendingGasto)} 
          disabled={loading}
          className="btn-primary !py-4 shadow-xl !bg-brand-success text-brand-bg"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <div className="flex items-center gap-2">
              <Check size={20} strokeWidth={4} />
              <span className="text-[11px] font-black tracking-widest uppercase">Guardar Compra</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewModal;