import { supabase } from "./supabase";

export const searchLocalProducts = async (query: string) => {
  if (query.length < 2) return [];
  const { data } = await supabase.from('productos')
    .select(`id, nombre_base, producto_detalles(ultimo_precio, ultimo_comercio, marca)`)
    .ilike('nombre_base', `%${query}%`).limit(5);
  return data || [];
};

export const getPricesForList = async (nombres: string[]) => {
  if (nombres.length === 0) return [];
  const { data } = await supabase.from('productos')
    .select(`nombre_base, producto_detalles (ultimo_precio, ultimo_comercio)`)
    .in('nombre_base', nombres);
  return data || [];
};

export const saveManualAlias = async (nombreTicket: string, nombreBase: string) => {
  try {
    const ticketUpper = nombreTicket.toUpperCase();
    let { data: prod } = await supabase.from('productos').select('id').eq('nombre_base', nombreBase).maybeSingle();
    if (!prod) {
      const { data: newP } = await supabase.from('productos').insert([{ nombre_base: nombreBase }]).select().single();
      prod = newP;
    }
    if (prod) {
      await supabase.from('producto_alias').upsert({ producto_id: prod.id, nombre_ticket: ticketUpper }, { onConflict: 'nombre_ticket' });
    }
  } catch (e) { console.error(e); }
};

export const syncProductWithSupabase = async (itemIA: any, comercio: string) => {
  try {
    const nombreTicket = (itemIA.nombre_ticket || "PRODUCTO").toUpperCase();
    const { data: alias } = await supabase.from('producto_alias').select('producto_id').eq('nombre_ticket', nombreTicket).maybeSingle();
    let pId = alias?.producto_id;
    if (!pId) {
      const { data: p } = await supabase.from('productos').select('id').ilike('nombre_base', `%${itemIA.nombre_base}%`).maybeSingle();
      pId = p?.id;
    }
    if (!pId) {
      const { data: n } = await supabase.from('productos').insert([{ nombre_base: itemIA.nombre_base }]).select().single();
      pId = n?.id;
      if (pId) await supabase.from('producto_alias').insert([{ producto_id: pId, nombre_ticket: nombreTicket }]);
    }
    if (!pId) return;
    const sub = parseFloat(itemIA.subtotal) || 0;
    const qty = parseFloat(itemIA.cantidad) || 1;
    await supabase.from('producto_detalles').upsert({
      producto_id: pId, tamano: 'Único', marca: 'Genérico',
      ultimo_precio: sub / qty, ultimo_comercio: comercio || "Tienda",
      fecha_actualizacion: new Date().toISOString()
    }, { onConflict: 'producto_id, tamano' });
  } catch (e) { console.error(e); }
};