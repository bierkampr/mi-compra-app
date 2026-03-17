"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Camera, Trash2, ListTodo, CheckCircle2, X, Check, Search, Loader2, Eraser, ChevronDown } from 'lucide-react';
import { searchLocalProducts } from '../../lib/products';
import { supabase } from '../../lib/supabase';

interface ShoppingListViewProps {
  db: { lista: any[] };
  updateAndSync: (newDb: any) => Promise<void>;
  setPurchaseMode: (mode: 'super' | 'mini' | 'dining' | 'health' | 'others' | 'manual' | null) => void;
  txt: (key: string) => string;
}

const ShoppingListView: React.FC<ShoppingListViewProps> = ({ db, updateAndSync, setPurchaseMode, txt }) => {
  const [newItemName, setNewItemName] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Referencia para detectar clics fuera del área de búsqueda
  const searchRef = useRef<HTMLDivElement>(null);

  // Efecto para cerrar las sugerencias al tocar en cualquier parte vacía de la pantalla
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Búsqueda dinámica:
   * - Convierte a mayúsculas.
   * - Ordena por longitud (más corto primero).
   * - Evita duplicados visuales.
   */
  const handleSearch = async (val: string) => {
    const upperVal = val.toUpperCase();
    setNewItemName(upperVal);

    if (val.length > 1) {
      setIsSearching(true);
      try {
        const res = await searchLocalProducts(upperVal);
        
        // Reforzamos el ordenamiento por longitud para la interfaz
        const sorted = [...res].sort((a, b) => a.nombre_base.length - b.nombre_base.length);
        
        // Filtramos duplicados por clave normalizada (Fuzzy visual)
        const uniqueRes = Array.from(new Map(sorted.map(item => {
            const fuzzyKey = item.nombre_base.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Ñ/g, "N");
            return [fuzzyKey, item];
        })).values());

        setSuggestions(uniqueRes);
      } catch (e) {
        console.error("Error searching products:", e);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  /**
   * Añade el ítem a la lista local (Drive) en Mayúsculas.
   * Si es un nombre "limpio", lo registra en el catálogo global de Supabase 
   * verificando primero que no exista un duplicado (acentos/Ñ).
   */
  const addToList = async (name?: string) => {
    const val = (name || newItemName).toUpperCase().trim();
    if (!val) return;

    // 1. Actualización inmediata en Google Drive (Local Cache)
    const newItem = { name: val, checked: false, confirmed: false };
    const newDb = { 
      ...db, 
      lista: [...(db.lista || []), newItem] 
    };
    
    setNewItemName("");
    setSuggestions([]);
    await updateAndSync(newDb);

    // 2. Registro inteligente en Supabase (Blindaje)
    try {
        const esNombreLimpio = val.length < 30 && !/[0-9]{3,}/.test(val);
        
        if (esNombreLimpio) {
            const fuzzyVal = val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Ñ/g, "N");
            
            // Verificamos existencia global antes de insertar para evitar duplicados
            const { data: existentes } = await supabase.from('productos').select('id, nombre_base');
            
            const existeFuzzy = existentes?.some(p => {
                const pFuzzy = p.nombre_base.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Ñ/g, "N");
                return pFuzzy === fuzzyVal;
            });

            if (!existeFuzzy) {
                await supabase.from('productos').insert([{ nombre_base: val, categoria: 'OTROS' }]);
            }
        }
    } catch (e) {
        console.warn("Sincronización silenciosa con Supabase falló.");
    }
  };

  const toggleCheck = async (item: any) => {
    const newList = db.lista.map(li => li === item ? { ...li, checked: !li.checked } : li);
    await updateAndSync({ ...db, lista: newList });
  };

  const removeItem = async (item: any) => {
    const newList = db.lista.filter(li => li !== item);
    await updateAndSync({ ...db, lista: newList });
  };

  const clearAll = async () => {
    if (confirm(txt('modals.clear_list_msg'))) {
      await updateAndSync({ ...db, lista: [] });
    }
  };

  const clearPending = async () => {
    if (confirm(txt('modals.clear_pending_msg'))) {
      const onlyBought = db.lista.filter(li => li.confirmed);
      await updateAndSync({ ...db, lista: onlyBought });
    }
  };

  const pendingItems = db.lista.filter(li => !li.confirmed);
  const boughtItems = db.lista.filter(li => li.confirmed);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-20">
      {/* BARRA DE BÚSQUEDA CON DETECTOR DE CLIC FUERA */}
      <div className="relative group z-[100]" ref={searchRef}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted">
          {isSearching ? <Loader2 size={18} className="animate-spin text-brand-primary" /> : <Search size={18} />}
        </div>
        <input 
          value={newItemName} 
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addToList()}
          placeholder={txt('list.placeholder')} 
          className="input-premium pl-12 pr-14 !rounded-2xl shadow-xl uppercase" 
        />
        <button onClick={() => addToList()} className="absolute right-2 top-2 p-2.5 bg-brand-primary rounded-xl text-white shadow-lg active:scale-90 transition-all">
          <Plus size={20} strokeWidth={3}/>
        </button>

        {/* CONTENEDOR DE SUGERENCIAS CON TIRADOR (HANDLE) */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 card-premium !p-1.5 z-[200] border-brand-primary/30 shadow-[0_25px_60px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto no-scrollbar">
              {suggestions.map((s, idx) => (
                <button 
                  key={idx} 
                  onClick={() => addToList(s.nombre_base)} 
                  className="w-full text-left p-4 hover:bg-brand-primary/10 rounded-xl text-[10px] font-black uppercase border-b border-white/[0.03] last:border-none flex justify-between items-center transition-colors"
                >
                  <span className="truncate">{s.nombre_base}</span>
                  <Plus size={14} className="text-brand-primary opacity-40 shrink-0" />
                </button>
              ))}
            </div>
            
            {/* TIRADOR DE CIERRE DISCRETO (ESTILO BOTTOM SHEET) */}
            <button 
              onClick={() => setSuggestions([])}
              className="w-full py-2 flex flex-col items-center justify-center gap-0.5 opacity-30 hover:opacity-100 transition-opacity"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full" />
              <ChevronDown size={14} className="text-white" />
            </button>
          </div>
        )}
      </div>

      {/* ACCIONES RÁPIDAS */}
      {db.lista.length > 0 && (
        <div className="flex gap-2.5">
          <button onClick={() => setPurchaseMode('super')} className="btn-primary flex-[2.5] py-4 !text-[10px] tracking-widest gap-2 shadow-none">
            <Camera size={18}/> {txt('list.scan_btn')}
          </button>
          
          {pendingItems.length > 0 && (
            <button onClick={clearPending} className="btn-secondary flex-1 !p-0 bg-brand-primary/5 border-brand-primary/10 text-brand-primary active:scale-95 transition-all">
                <Eraser size={18}/>
                <span className="text-[7px] font-black uppercase">{txt('list.clear_pending')}</span>
            </button>
          )}

          <button onClick={clearAll} className="btn-secondary w-12 !p-0 bg-brand-danger/10 text-brand-danger border-none active:scale-95 transition-all">
            <Trash2 size={20}/>
          </button>
        </div>
      )}

      {/* SECCIÓN: PENDIENTES */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <ListTodo size={14} className="text-brand-primary" />
          <h3 className="text-small-caps">{txt('list.pending')} ({pendingItems.length})</h3>
        </div>

        <div className="space-y-2">
          {pendingItems.length > 0 ? (
            pendingItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 group animate-in slide-in-from-left-2" style={{ animationDelay: `${i * 50}ms` }}>
                <button 
                  onClick={() => toggleCheck(item)}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                    item.checked 
                    ? 'bg-brand-primary/5 border-brand-primary/20 opacity-60' 
                    : 'bg-brand-card border-white/[0.05] shadow-sm'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                    item.checked ? 'bg-brand-primary border-brand-primary' : 'border-brand-secondary bg-brand-bg'
                  }`}>
                    {item.checked && <Check size={14} className="text-white" strokeWidth={4}/>}
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-tight truncate ${
                    item.checked ? 'line-through text-brand-muted' : 'text-white/90'
                  }`}>
                    {item.name}
                  </span>
                </button>
                <button onClick={() => removeItem(item)} className="p-3 text-brand-muted/10 hover:text-brand-danger hover:bg-brand-danger/5 rounded-xl transition-all">
                  <X size={18}/>
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-white/[0.02] rounded-[2.5rem]">
                <p className="text-[9px] font-black text-brand-muted uppercase tracking-[0.3em] opacity-20">
                  {txt('home.no_records')}
                </p>
            </div>
          )}
        </div>
      </section>

      {/* SECCIÓN: COMPRADOS (EN GRID) */}
      {boughtItems.length > 0 && (
        <section className="pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 px-1 mb-4">
            <CheckCircle2 size={14} className="text-brand-success" />
            <h3 className="text-small-caps !text-brand-success opacity-80">{txt('list.bought')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {boughtItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-brand-success/[0.03] border border-brand-success/10 animate-in fade-in">
                <Check size={12} className="text-brand-success flex-shrink-0" strokeWidth={4}/>
                <span className="text-[9px] font-black uppercase tracking-tight text-brand-muted truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ShoppingListView;