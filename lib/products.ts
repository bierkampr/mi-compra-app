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
 * OBTIENE EL ÚLTIMO PRECIO REGISTRADO
 * Se usa en la fase de revisión para comparar si el producto subió o bajó.
 */
export const getLastPrice = async (nombreBase: string): Promise<number | null> => {
  try {
    const fuzzyBase = toFuzzy(nombreBase);
    
    // 1. Buscamos el ID del producto por su nombre base
    const { data: prod } = await supabase
      .from('productos')
      .select('id, nombre_base')
      .filter('nombre_base', 'ilike', nombreBase)
      .maybeSingle();

    if (!prod) return null;

    // 2. Buscamos en detalles el último precio registrado
    const { data: detalle, error } = await supabase
      .from('producto_detalles')
      .select('ultimo_precio')
      .eq('producto_id', prod.id)
      .order('fecha_actualizacion', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !detalle) return null;
    return detalle.ultimo_precio;
  } catch (e) {
    console.error("Error al obtener precio histórico:", e);
    return null;
  }
};

/**
 * OBTIENE EL ÚLTIMO PRECIO REGISTRADO (BATCH)
 * Versión optimizada que evita el problema N+1.
 */
export const getBatchPriceHistory = async (productNames: string[]): Promise<Record<string, number | null>> => {
  if (!productNames.length) return {};
  
  try {
    const upperNames = Array.from(new Set(productNames.map(n => n.toUpperCase().trim())));
    
    // 1. Buscamos todos los productos que coincidan con los nombres base
    const { data: prods, error: errProds } = await supabase
      .from('productos')
      .select('id, nombre_base')
      .in('nombre_base', upperNames);

    if (errProds || !prods || prods.length === 0) return {};

    const prodIds = prods.map(p => p.id);
    const idToName: Record<string, string> = {};
    prods.forEach(p => idToName[p.id] = p.nombre_base.toUpperCase());

    // 2. Buscamos el último precio para cada ID de producto encontrado
    const { data: detalles, error: errDetalles } = await supabase
      .from('producto_detalles')
      .select('producto_id, ultimo_precio, fecha_actualizacion')
      .in('producto_id', prodIds)
      .order('fecha_actualizacion', { ascending: false });

    if (errDetalles || !detalles) return {};

    // Mapeamos solo el más reciente para cada producto
    const results: Record<string, number | null> = {};
    upperNames.forEach(name => results[name] = null);

    detalles.forEach(d => {
      const name = idToName[d.producto_id];
      if (name && results[name] === null) {
        results[name] = d.ultimo_precio;
      }
    });

    return results;
  } catch (e) {
    console.error("Error en batch price history:", e);
    return {};
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
 * Actualiza el catálogo global y los precios de referencia.
 */
export const syncProductWithSupabase = async (itemIA: any, comercio: string) => {
  try {
    const baseUpper = itemIA.nombre_base.toUpperCase().trim();
    const ticketUpper = itemIA.nombre_ticket.toUpperCase().trim();

    // Guardamos el alias primero (IA Aprendizaje)
    await saveManualAlias(ticketUpper, baseUpper);
    
    const fuzzyBase = toFuzzy(baseUpper);
    const { data: existentes } = await supabase.from('productos').select('id, nombre_base');
    const prod = existentes?.find(p => toFuzzy(p.nombre_base) === fuzzyBase);

    if (prod) {
      const subtotal = Number(itemIA.subtotal) || 0;
      const cantidad = Number(itemIA.cantidad) || 1;
      const precioUnitario = subtotal / cantidad;
      
      // Upsert en detalles: Si ya existe para ese tamaño/id, actualiza el precio y fecha
      await supabase.from('producto_detalles').upsert({
        producto_id: prod.id,
        marca: 'GENERICO',
        tamano: 'UNICO',
        ultimo_precio: precioUnitario,
        ultimo_comercio: comercio.toUpperCase().trim(),
        fecha_actualizacion: new Date().toISOString()
      }, { onConflict: 'producto_id, tamano' });
    }
  } catch (e) {
    console.error("Error en sincronización:", e);
  }
};