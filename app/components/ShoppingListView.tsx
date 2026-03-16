"use client";
import React, { useState } from 'react';
import { Plus, Camera, Trash2, ListTodo, CheckCircle2, X, Check, Search, Loader2 } from 'lucide-react';
import { searchLocalProducts } from '@/lib/products';

interface ShoppingListViewProps {
  db: { lista: any[] };
  updateAndSync: (newDb: any) => Promise<void>;
  setPurchaseMode: (mode: 'super' | 'mini' | 'manual' | null) => void;
  txt: (key: string) => string;
}

const ShoppingListView: React.FC<ShoppingListViewProps> = ({ db, updateAndSync, setPurchaseMode, txt }) => {
  const [newItemName, setNewItemName] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (val: string) => {
    setNewItemName(val);
    if (val.length > 1) {
      setIsSearching(true);
      const res = await searchLocalProducts(val);
      setSuggestions(res);
      setIsSearching(false);
    } else {
      setSuggestions([]);
    }
  };

  const addToList = async (name?: string) => {
    const val = name || newItemName;
    if (!val.trim()) return;

    const newDb = { 
      ...db, 
      lista: [...(db.lista || []), { name: val.trim(), checked: false, confirmed: false }] 
    };
    setNewItemName("");
    setSuggestions([]);
    await updateAndSync(newDb);
  };

  const toggleCheck = async (item: any) => {
    const newList = db.lista.map(li => 
      li === item ? { ...li, checked: !li.checked } : li
    );
    await updateAndSync({ ...db, lista: newList });
  };

  const removeItem = async (item: any) => {
    const newList = db.lista.filter(li => li !== item);
    await updateAndSync({ ...db, lista: newList });
  };

  const clearList = async () => {
    if (confirm(txt('modals.clear_list_msg'))) {
      await updateAndSync({ ...db, lista: [] });
    }
  };

  const pendingItems = db.lista.filter(li => !li.confirmed);
  const boughtItems = db.lista.filter(li => li.confirmed);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-10">
      {/* BARRA DE BÚSQUEDA Y AGREGADO */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-primary transition-colors">
          {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </div>
        <input 
          value={newItemName} 
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addToList()}
          placeholder={txt('list.placeholder')} 
          className="input-premium pl-12 pr-14 !rounded-2xl" 
        />
        <button 
          onClick={() => addToList()} 
          className="absolute right-2 top-2 p-2.5 bg-brand-primary rounded-xl text-white shadow-lg active:scale-90 transition-all"
        >
          <Plus size={20} strokeWidth={3}/>
        </button>

        {/* SUGERENCIAS FLOTANTES */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 card-premium !p-1.5 z-50 border-brand-primary/30 shadow-2xl animate-in fade-in zoom-in-95">
            {suggestions.map((s, idx) => (
              <button 
                key={idx} 
                onClick={() => addToList(s.nombre_base)} 
                className="w-full text-left p-3.5 hover:bg-brand-primary/10 rounded-xl text-[10px] font-black uppercase border-b border-white/[0.03] last:border-none flex justify-between items-center"
              >
                {s.nombre_base}
                <Plus size={14} className="text-brand-primary opacity-40" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ACCIONES DE LISTA */}
      {db.lista.length > 0 && (
        <div className="flex gap-2.5">
          <button 
            onClick={() => setPurchaseMode('super')} 
            className="btn-primary flex-1 py-3.5 !text-[10px] tracking-widest gap-2 shadow-none"
          >
            <Camera size={18}/> {txt('list.scan_btn')}
          </button>
          <button 
            onClick={clearList} 
            className="btn-secondary w-14 !p-0 bg-brand-danger/10 text-brand-danger border-none active:bg-brand-danger active:text-white"
          >
            <Trash2 size={20}/>
          </button>
        </div>
      )}

      {/* SECCIÓN PENDIENTES */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <ListTodo size={14} className="text-brand-primary" />
          <h3 className="text-small-caps">{txt('list.pending')} ({pendingItems.length})</h3>
        </div>

        <div className="space-y-2">
          {pendingItems.length > 0 ? (
            pendingItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <button 
                  onClick={() => toggleCheck(item)}
                  className={`flex-1 flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
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
                <button 
                  onClick={() => removeItem(item)} 
                  className="p-3 text-brand-muted/20 hover:text-brand-danger active:scale-90 transition-all"
                >
                  <X size={18}/>
                </button>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-[10px] font-bold text-brand-muted uppercase tracking-widest opacity-30">
              Nada pendiente
            </p>
          )}
        </div>
      </section>

      {/* SECCIÓN COMPRADOS (DENSIDAD ALTA) */}
      {boughtItems.length > 0 && (
        <section className="pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 px-1 mb-4">
            <CheckCircle2 size={14} className="text-brand-success" />
            <h3 className="text-small-caps !text-brand-success opacity-80">{txt('list.bought')}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {boughtItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-success/[0.03] border border-brand-success/10">
                <Check size={12} className="text-brand-success flex-shrink-0" strokeWidth={4}/>
                <span className="text-[9px] font-black uppercase tracking-tight text-brand-muted truncate">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ShoppingListView;