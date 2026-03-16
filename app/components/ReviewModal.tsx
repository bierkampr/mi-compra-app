/* --- ARCHIVO: components/ReviewModal.tsx (Actualizado) --- */

"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Check, X, Store, Calendar, Euro, Link, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { calculateMatchScore } from '@/lib/utils';

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
  const [showComercioSuggestions, setShowComercioSuggestions] = useState(false);
  const [isManualExpanded, setIsManualExpanded] = useState(false);
  const [manualProd, setManualProd] = useState({ name: '', qty: 1, price: "" });
  
  // Guardamos qué productos tienen el panel de vinculación abierto
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  // Efecto inicial: Auto-expandir si el producto no tiene un alias claro
  useEffect(() => {
    if (pendingGasto?.productos) {
      const autoExpand: number[] = [];
      pendingGasto.productos.forEach((p: any, i: number) => {
        // Si el nombre base es igual al del ticket, es que no encontró alias previo
        // O si no hay productos en la lista que coincidan mucho
        if (p.nombre_base === p.nombre_ticket) {
          autoExpand.push(i);
        }
      });
      setExpandedIndices(autoExpand);
    }
  }, []);

  const toggleExpand = (idx: number) => {
    setExpandedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const setAlias = (productIndex: number, listName: string) => {
    const newProds = [...pendingGasto.productos];
    newProds[productIndex].nombre_base = listName;
    setPendingGasto({ ...pendingGasto, productos: newProds });
    // Al seleccionar uno, cerramos ese panel
    setExpandedIndices(prev => prev.filter(i => i !== productIndex));
  };

  const addManualItem = () => {
    if (!manualProd.name) return;
    const p = parseFloat(manualProd.price) || 0;
    setPendingGasto({
      ...pendingGasto,
      productos: [
        ...pendingGasto.productos, 
        { 
          nombre_ticket: manualProd.name.toUpperCase(), 
          nombre_base: manualProd.name, 
          cantidad: manualProd.qty, 
          subtotal: p * manualProd.qty 
        }
      ]
    });
    setManualProd({ name: '', qty: 1, price: "" });
    setIsManualExpanded(false);
  };

  return (
    <div className="modal-content-full !pb-6 flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-fluid-lg font-black italic tracking-tighter text-brand-primary uppercase">
          REVISAR GASTO
        </h2>
        <button onClick={onCancel} className="btn-icon !bg-transparent border-none">
          <X size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {/* INFO COMERCIO Y TOTAL */}
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

        {/* LISTA DE PRODUCTOS */}
        <section className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-small-caps">Productos detectados</h3>
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
              <button onClick={addManualItem} className="btn-primary !py-2 !text-[9px]">Aceptar</button>
            </div>
          )}

          <div className="space-y-2">
            {pendingGasto.productos.map((p: any, i: number) => {
              // Lógica de Inteligencia: Ordenar sugerencias por coincidencia de palabras
              const smartSuggestions = db.lista
                .filter(l => !l.confirmed)
                .map(l => ({ ...l, matchScore: calculateMatchScore(p.nombre_ticket, l.name) }))
                .sort((a, b) => b.matchScore - a.matchScore);

              const isExpanded = expandedIndices.includes(i);

              return (
                <div key={i} className={`flex flex-col transition-all duration-300 rounded-2xl border ${isExpanded ? 'bg-brand-primary/5 border-brand-primary/30 p-3' : 'bg-white/[0.02] border-white/[0.04] p-2.5'}`}>
                  {/* FILA CLICKABLE COMPLETA */}
                  <button 
                    onClick={() => toggleExpand(i)}
                    className="flex justify-between items-start gap-3 text-left w-full"
                  >
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <p className={`text-[11px] font-black uppercase truncate leading-tight ${p.nombre_base !== p.nombre_ticket ? 'text-brand-accent' : 'text-white'}`}>
                          {p.nombre_base}
                        </p>
                        {p.nombre_base !== p.nombre_ticket && <Sparkles size={10} className="text-brand-accent" />}
                      </div>
                      <p className="text-[8px] font-bold text-brand-muted uppercase truncate mt-0.5 opacity-40">
                        {p.nombre_ticket}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-xs font-black text-brand-success italic tracking-tighter">
                        {Number(p.subtotal).toFixed(2)}€
                      </p>
                      <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-brand-primary text-white' : 'bg-white/5 text-brand-muted'}`}>
                        <Link size={14} />
                      </div>
                    </div>
                  </button>

                  {/* PANEL DE VINCULACIÓN INTELIGENTE */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-brand-primary/10 animate-in slide-in-from-top-2">
                      <p className="text-[8px] font-black uppercase text-brand-primary mb-2 flex items-center gap-1">
                        <AlertCircle size={10} /> Vincular con un ítem de tu lista:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {smartSuggestions.map((item, lIdx) => (
                          <button 
                            key={lIdx} 
                            onClick={() => setAlias(i, item.name)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                               item.matchScore > 0 
                               ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 border border-brand-primary/30' 
                               : 'bg-white/5 text-brand-muted border border-white/5'
                            }`}
                          >
                            {item.matchScore > 0 && <Sparkles size={10} />}
                            {item.name}
                          </button>
                        ))}
                        <button 
                          onClick={() => {
                            const n = prompt("Nombre personalizado para este producto:");
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

      {/* FOOTER ACCIONES */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={onCancel} className="btn-secondary !bg-transparent border-none text-brand-danger !lowercase !text-[10px] opacity-60">
          descartar
        </button>
        <button 
          onClick={() => onSave(pendingGasto)} 
          disabled={loading}
          className="btn-primary !py-4 shadow-xl !bg-brand-success text-brand-bg"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <div className="flex items-center gap-2">
              <Check size={20} strokeWidth={4} />
              <span className="text-[11px] font-black tracking-widest uppercase">Finalizar Registro</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewModal;