"use client";
import React, { useState, useMemo } from 'react';
import { Check, X, Store, Calendar, Euro, Plus, Link, Loader2, AlertCircle } from 'lucide-react';

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
  const [linkingIdx, setLinkingIdx] = useState<number | null>(null);

  // Lógica de comercios previos
  const filteredComercios = useMemo(() => {
    const search = String(pendingGasto.comercio || "").toUpperCase();
    if (search.length < 2) return [];
    const anteriores = Array.from(new Set(db.gastos.map(g => String(g.comercio).toUpperCase())));
    return anteriores.filter(c => c.includes(search) && c !== search);
  }, [pendingGasto.comercio, db.gastos]);

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

  const setAlias = (productIndex: number, listName: string) => {
    const newProds = [...pendingGasto.productos];
    newProds[productIndex].nombre_base = listName;
    setPendingGasto({ ...pendingGasto, productos: newProds });
    setLinkingIdx(null);
  };

  return (
    <div className="modal-content-full !pb-6 flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-fluid-lg font-black italic tracking-tighter text-brand-primary uppercase">
          {txt('review.title')}
        </h2>
        <button onClick={onCancel} className="btn-icon !bg-transparent border-none">
          <X size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {/* INFO COMERCIO Y TOTAL (COMPACTO) */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 relative">
            <label className="text-small-caps ml-1 mb-1.5 block opacity-60">{txt('review.shop')}</label>
            <div className="relative">
              <input 
                value={pendingGasto.comercio} 
                onChange={e => setPendingGasto({...pendingGasto, comercio: e.target.value.toUpperCase()})}
                onFocus={() => setShowComercioSuggestions(true)}
                className="input-premium !py-3 !text-sm uppercase tracking-wider" 
              />
              <Store size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" />
              
              {showComercioSuggestions && filteredComercios.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 card-premium z-[1100] !p-1 border-brand-primary/20 shadow-2xl">
                  {filteredComercios.map((c, i) => (
                    <button 
                      key={i} 
                      onClick={() => { setPendingGasto({...pendingGasto, comercio: c}); setShowComercioSuggestions(false); }} 
                      className="w-full text-left p-3 hover:bg-brand-primary/10 rounded-xl text-[10px] font-black text-white uppercase"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-6">
            <label className="text-small-caps ml-1 mb-1.5 block opacity-60">{txt('review.date')}</label>
            <div className="relative">
              <input 
                value={pendingGasto.fecha} 
                onChange={e => setPendingGasto({...pendingGasto, fecha: e.target.value})}
                className="input-premium !py-3 !text-center !text-xs" 
              />
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted opacity-40" />
            </div>
          </div>

          <div className="col-span-6">
            <label className="text-small-caps ml-1 mb-1.5 block opacity-60">{txt('review.total')}</label>
            <div className="relative">
              <input 
                type="number" 
                value={pendingGasto.total} 
                onChange={e => setPendingGasto({...pendingGasto, total: e.target.value})}
                className="input-premium !py-3 !text-center !text-sm !text-brand-success font-black" 
              />
              <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-success opacity-40" />
            </div>
          </div>
        </div>

        {/* LISTA DE PRODUCTOS (ALTA DENSIDAD) */}
        <section className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-small-caps">{txt('review.products')}</h3>
            <button 
              onClick={() => setIsManualExpanded(!isManualExpanded)}
              className="text-[9px] font-black uppercase text-brand-primary bg-brand-primary/5 px-3 py-1 rounded-full border border-brand-primary/10"
            >
              {isManualExpanded ? '- Cerrar' : '+ Añadir'}
            </button>
          </div>

          {isManualExpanded && (
            <div className="card-premium !p-3 bg-brand-primary/5 border-brand-primary/20 animate-in zoom-in-95">
              <div className="flex gap-2 mb-2">
                <input 
                  placeholder="Producto..." 
                  className="bg-brand-bg/50 p-2.5 rounded-lg text-xs flex-1 outline-none border border-white/5 uppercase" 
                  value={manualProd.name}
                  onChange={e => setManualProd({...manualProd, name: e.target.value})}
                />
                <input 
                  placeholder="0.00" 
                  type="number"
                  className="bg-brand-bg/50 p-2.5 rounded-lg text-xs w-20 text-right outline-none border border-white/5 font-black text-brand-success" 
                  value={manualProd.price}
                  onChange={e => setManualProd({...manualProd, price: e.target.value})}
                />
              </div>
              <button onClick={addManualItem} className="btn-primary !py-2 !text-[9px]">Aceptar</button>
            </div>
          )}

          <div className="space-y-1.5">
            {pendingGasto.productos.map((p: any, i: number) => (
              <div key={i} className="flex flex-col p-2.5 bg-white/[0.02] border border-white/[0.04] rounded-xl relative overflow-hidden">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 overflow-hidden">
                    {/* Nombre detectado vs Nombre mapeado */}
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <p className="text-[10px] font-black uppercase text-white truncate leading-tight">
                        {p.nombre_base}
                      </p>
                      {p.nombre_base !== p.nombre_ticket && (
                        <div className="bg-brand-accent/10 px-1.5 py-0.5 rounded text-[7px] font-black text-brand-accent uppercase flex-shrink-0">
                          Alias
                        </div>
                      )}
                    </div>
                    <p className="text-[8px] font-bold text-brand-muted uppercase truncate mt-0.5 opacity-40">
                      Ticket: {p.nombre_ticket}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-black text-brand-success italic tracking-tighter">
                      {Number(p.subtotal).toFixed(2)}€
                    </p>
                    <button 
                      onClick={() => setLinkingIdx(linkingIdx === i ? null : i)}
                      className={`p-1.5 rounded-lg transition-colors ${linkingIdx === i ? 'bg-brand-primary text-white' : 'bg-white/5 text-brand-muted'}`}
                    >
                      <Link size={14} />
                    </button>
                  </div>
                </div>

                {/* MINI-SELECTOR DE ALIAS (Vincular con lista) */}
                {linkingIdx === i && (
                  <div className="mt-2 pt-2 border-t border-white/5 animate-in slide-in-from-top-2">
                    <p className="text-[8px] font-black uppercase text-brand-primary mb-2 flex items-center gap-1">
                      <AlertCircle size={10} /> Vincular con tu lista:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {db.lista.filter(l => !l.confirmed).map((item, lIdx) => (
                        <button 
                          key={lIdx} 
                          onClick={() => setAlias(i, item.name)}
                          className="px-2 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-md text-[8px] font-black uppercase text-white hover:bg-brand-primary hover:text-white transition-all"
                        >
                          {item.name}
                        </button>
                      ))}
                      <button 
                        onClick={() => {
                          const n = prompt("Nuevo nombre base:");
                          if (n) setAlias(i, n);
                        }}
                        className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[8px] font-black uppercase text-brand-muted"
                      >
                        + Otro
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FOOTER ACCIONES */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button 
          onClick={onCancel} 
          className="btn-secondary !bg-transparent border-none text-brand-danger !lowercase !text-[10px] opacity-60"
        >
          {txt('review.discard')}
        </button>
        <button 
          onClick={() => onSave(pendingGasto)} 
          disabled={loading}
          className="btn-primary !py-4 shadow-xl !bg-brand-success"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <div className="flex items-center gap-2">
              <Check size={20} strokeWidth={4} />
              <span className="text-[11px] tracking-widest">{txt('review.finish')}</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewModal;