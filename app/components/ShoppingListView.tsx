"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Camera, Trash2, ListTodo, CheckCircle2, X, Check, Search, Loader2, Eraser, ChevronDown } from 'lucide-react';
import { searchLocalProducts } from '../../lib/products';
import { supabase } from '../../lib/supabase';
import ConfirmModal from './ConfirmModal';

interface ShoppingListViewProps {
  db: { lista: any[] };
  updateAndSync: (newDb: any) => Promise<void>;
  setPurchaseMode: (mode: string | null) => void;
  txt: (key: string) => string;
}

const ShoppingListView: React.FC<ShoppingListViewProps> = ({ db, updateAndSync, setPurchaseMode, txt }) => {
  const [newItemName, setNewItemName] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'info';
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (val: string) => {
    const upperVal = val.toUpperCase();
    setNewItemName(upperVal);

    if (val.length > 1) {
      setIsSearching(true);
      try {
        const res = await searchLocalProducts(upperVal);
        const sorted = [...res].sort((a, b) => a.nombre_base.length - b.nombre_base.length);
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

  const addToList = async (name?: string) => {
    const val = (name || newItemName).toUpperCase().trim();
    if (!val) return;

    const newItem = { name: val, checked: false, confirmed: false };
    const newDb = { 
      ...db, 
      lista: [...(db.lista || []), newItem] 
    };
    
    setNewItemName("");
    setSuggestions([]);
    await updateAndSync(newDb);

    try {
        const esNombreLimpio = val.length < 30 && !/[0-9]{3,}/.test(val);
        if (esNombreLimpio) {
            const fuzzyVal = val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Ñ/g, "N");
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

  const clearAll = () => {
    setConfirmConfig({
      isOpen: true,
      title: txt('modals.clear_list_title') || "¿LIMPIAR LISTA?",
      message: txt('modals.clear_list_msg'),
      type: 'danger',
      onConfirm: async () => {
        await updateAndSync({ ...db, lista: [] });
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const clearPending = () => {
    setConfirmConfig({
      isOpen: true,
      title: txt('modals.clear_pending_title') || "¿LIMPIAR PENDIENTES?",
      message: txt('modals.clear_pending_msg'),
      type: 'info',
      onConfirm: async () => {
        const onlyBought = db.lista.filter(li => li.confirmed);
        await updateAndSync({ ...db, lista: onlyBought });
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const pendingItems = db.lista.filter(li => !li.confirmed);
  const boughtItems = db.lista.filter(li => li.confirmed);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-24">
      
      {/* BARRA DE BÚSQUEDA UNIFICADA */}
      <div className="relative group z-[100]" ref={searchRef}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted/50">
          {isSearching ? <Loader2 size={18} className="animate-spin text-brand-primary" /> : <Search size={18} />}
        </div>
        <div className="relative">
          <input 
            value={newItemName} 
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addToList()}
            placeholder={txt('list.placeholder')} 
            className="input-premium pl-12 pr-14 shadow-2xl" 
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <button 
              onClick={() => addToList()} 
              className="p-2.5 lg:p-3 bg-brand-primary rounded-xl text-white shadow-lg active:scale-90 transition-all flex items-center justify-center"
            >
              <Plus size={20} strokeWidth={3}/>
            </button>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-3 card-premium !p-2 z-[200] border-brand-primary/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto no-scrollbar">
              {suggestions.map((s, idx) => (
                <button 
                  key={idx} 
                  onClick={() => addToList(s.nombre_base)} 
                  className="w-full text-left p-4 hover:bg-brand-primary/10 rounded-xl text-[11px] font-black uppercase flex justify-between items-center transition-colors"
                >
                  <span className="truncate">{s.nombre_base}</span>
                  <Plus size={14} className="text-brand-primary opacity-40 shrink-0" />
                </button>
              ))}
            </div>
            <button onClick={() => setSuggestions([])} className="w-full py-2 flex flex-col items-center justify-center opacity-20 hover:opacity-100 transition-opacity">
              <div className="w-10 h-1 bg-white/40 rounded-full mb-1" />
              <ChevronDown size={14} className="text-white" />
            </button>
          </div>
        )}
      </div>

      {/* ACCIONES RÁPIDAS PULIDAS */}
      {db.lista.length > 0 && (
        <div className="flex gap-3">
          <button onClick={() => setPurchaseMode('super')} className="btn-primary flex-[2.5] !py-4 shadow-lg !text-[11px] tracking-[0.2em] gap-2">
            <Camera size={18}/> {txt('list.scan_btn')}
          </button>
          
          {pendingItems.length > 0 && (
            <button onClick={clearPending} className="btn-secondary flex-1 !p-0 bg-brand-primary/5 border-brand-primary/10 text-brand-primary active:scale-95 transition-all">
                <Eraser size={18}/>
            </button>
          )}

          <button onClick={clearAll} className="btn-secondary w-14 !p-0 bg-brand-danger/10 text-brand-danger border-none active:scale-95 transition-all">
            <Trash2 size={20}/>
          </button>
        </div>
      )}

      {/* SECCIÓN: PENDIENTES */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <h3 className="text-small-caps">{txt('list.pending')} <span className="text-brand-primary ml-1 opacity-100">[{pendingItems.length}]</span></h3>
        </div>

        <div className="space-y-3">
          {pendingItems.length > 0 ? (
            pendingItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 group animate-in slide-in-from-right-2" style={{ animationDelay: `${i * 40}ms` }}>
                <button 
                  onClick={() => toggleCheck(item)}
                  className={`flex-1 flex items-center gap-4 p-5 rounded-[1.5rem] border transition-all ${
                    item.checked 
                    ? 'bg-brand-primary/5 border-brand-primary/20 opacity-50' 
                    : 'bg-brand-card border-white/[0.04] shadow-xl'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    item.checked ? 'bg-brand-primary border-brand-primary scale-90' : 'border-white/10 bg-white/5'
                  }`}>
                    {item.checked && <Check size={16} className="text-white" strokeWidth={4}/>}
                  </div>
                  <span className={`text-[12px] font-black uppercase tracking-tight truncate ${
                    item.checked ? 'line-through text-brand-muted' : 'text-white'
                  }`}>
                    {item.name}
                  </span>
                </button>
                <button onClick={() => removeItem(item)} className="p-4 text-brand-muted/20 hover:text-brand-danger hover:bg-brand-danger/5 rounded-2xl transition-all">
                  <X size={20}/>
                </button>
              </div>
            ))
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-white/[0.03] rounded-[3rem]">
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.4em] opacity-20 italic">
                  {txt('home.no_records')}
                </p>
            </div>
          )}
        </div>
      </section>

      {/* SECCIÓN: COMPRADOS */}
      {boughtItems.length > 0 && (
        <section className="pt-8 border-t border-white/[0.05]">
          <div className="flex items-center gap-2 px-1 mb-5">
            <CheckCircle2 size={14} className="text-brand-success/50" />
            <h3 className="text-small-caps !text-brand-success/50">{txt('list.bought')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {boughtItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-brand-success/[0.02] border border-brand-success/10 animate-in fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-success/40" />
                <span className="text-[10px] font-black uppercase tracking-tight text-brand-muted/60 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        confirmText={txt('modals.accept') || "ACEPTAR"}
        cancelText={txt('modals.cancel') || "CANCELAR"}
      />
    </div>
  );
};

export default ShoppingListView;
