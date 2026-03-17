/* --- ARCHIVO: lib/products.ts --- */
import { supabase } from "./supabase";

/**
 * Normaliza un texto para comparaciones (quita acentos y Ñ)
 */
const toFuzzy = (txt: string) => {
  return txt.toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ñ/g, "N")
    .trim();
};

/**
 * BUSCADOR PARA "MI LISTA"
 * Busca ignorando acentos/Ñ y ordena por longitud (más corto primero).
 */
export const searchLocalProducts = async (query: string) => {
  if (query.length < 2) return [];
  const upperQuery = query.toUpperCase().trim();
  const fuzzyQuery = toFuzzy(upperQuery);

  try {
    const { data, error } = await supabase.from('productos')
      .select(`id, nombre_base`)
      .or(`nombre_base.ilike.%${upperQuery}%, nombre_base.ilike.%${fuzzyQuery}%`)
      .limit(30);

    if (error) throw error;

    // Ordenamos por longitud: "PIÑA" antes que "PIÑA NATURAL"
    return (data || []).sort((a, b) => a.nombre_base.length - b.nombre_base.length);
  } catch (e) {
    console.error("Error en búsqueda:", e);
    return [];
  }
};

/**
 * BUSCADOR DE ALIAS (Diccionario Inteligente)
 */
export const getBaseNameFromAlias = async (nombreTicket: string): Promise<string | null> => {
  try {
    const ticketUpper = nombreTicket.toUpperCase().trim();
    const { data, error } = await supabase
      .from('producto_alias')
      .select('productos(nombre_base)')
      .eq('nombre_ticket', ticketUpper)
      .maybeSingle();
    
    if (error) return null;
    // @ts-ignore
    return data?.productos?.nombre_base || null;
  } catch (e) {
    return null;
  }
};

/**
 * REGISTRO DE APRENDIZAJE Y FUSIÓN TOTAL
 */
export const saveManualAlias = async (nombreTicket: string, nombreBase: string) => {
  try {
    const ticketUpper = nombreTicket.toUpperCase().trim();
    const baseUpper = nombreBase.toUpperCase().trim();
    
    if (!ticketUpper || !baseUpper) return;
    
    // Blindaje contra nombres sucios
    if (ticketUpper === baseUpper) return;

    const fuzzyBase = toFuzzy(baseUpper);

    // 1. Buscamos si ya existe (Fuzzy)
    let { data: existentes } = await supabase.from('productos').select('id, nombre_base');
    let prod = existentes?.find(p => toFuzzy(p.nombre_base) === fuzzyBase);

    // 2. Si es nuevo, crear
    if (!prod) {
      const { data: newP, error: errorInsert } = await supabase
        .from('productos')
        .insert([{ nombre_base: baseUpper, categoria: 'OTROS' }])
        .select()
        .single();
      
      if (!errorInsert) prod = newP;
    }

    // 3. Vincular alias
    if (prod) {
      await supabase.from('producto_alias').upsert({ 
        producto_id: prod.id, 
        nombre_ticket: ticketUpper 
      }, { onConflict: 'nombre_ticket' });
    }
  } catch (e) {
    console.error("Error en saveManualAlias:", e);
  }
};

/**
 * SINCRONIZACIÓN POST-COMPRA
 */
export const syncProductWithSupabase = async (itemIA: any, comercio: string) => {
  try {
    const baseUpper = itemIA.nombre_base.toUpperCase().trim();
    const ticketUpper = itemIA.nombre_ticket.toUpperCase().trim();

    await saveManualAlias(ticketUpper, baseUpper);
    
    const fuzzyBase = toFuzzy(baseUpper);
    const { data: existentes } = await supabase.from('productos').select('id, nombre_base');
    const prod = existentes?.find(p => toFuzzy(p.nombre_base) === fuzzyBase);

    if (prod) {
      const subtotal = Number(itemIA.subtotal) || 0;
      const cantidad = Number(itemIA.cantidad) || 1;
      
      await supabase.from('producto_detalles').upsert({
        producto_id: prod.id,
        marca: 'GENERICO',
        tamano: 'UNICO',
        ultimo_precio: subtotal / cantidad,
        ultimo_comercio: comercio.toUpperCase().trim(),
        fecha_actualizacion: new Date().toISOString()
      }, { onConflict: 'producto_id, tamano' });
    }
  } catch (e) {
    console.error("Error en sincronización:", e);
  }
};