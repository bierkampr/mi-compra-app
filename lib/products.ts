/* --- ARCHIVO: lib/products.ts --- */
import { supabase } from "./supabase";

/**
 * BUSCADOR PARA "MI LISTA"
 * Busca en el catálogo maestro y ordena por longitud del nombre (más cortos primero).
 */
export const searchLocalProducts = async (query: string) => {
  if (query.length < 2) return [];
  try {
    const { data, error } = await supabase.from('productos')
      .select(`id, nombre_base`)
      .ilike('nombre_base', `%${query}%`)
      .limit(20); // Pedimos un poco más para poder ordenar bien en JS

    if (error) throw error;

    // ORDENAR POR LONGITUD: El plan de "Leche" antes que "Leche Desnatada"
    return (data || []).sort((a, b) => a.nombre_base.length - b.nombre_base.length);
  } catch (e) {
    console.error("Error en búsqueda de productos:", e);
    return [];
  }
};

/**
 * BUSCADOR DE ALIAS (Diccionario Inteligente)
 * Mira si un texto sucio de ticket ya fue vinculado antes a un nombre limpio.
 */
export const getBaseNameFromAlias = async (nombreTicket: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('producto_alias')
      .select('productos(nombre_base)')
      .eq('nombre_ticket', nombreTicket.toUpperCase().trim())
      .maybeSingle();
    
    if (error) return null;
    // @ts-ignore
    return data?.productos?.nombre_base || null;
  } catch (e) {
    return null;
  }
};

/**
 * REGISTRO DE APRENDIZAJE (Vínculo Ticket -> Lista)
 * BLINDAJE: Solo crea productos nuevos si el alias es distinto al nombre del ticket.
 */
export const saveManualAlias = async (nombreTicket: string, nombreBase: string) => {
  try {
    const ticketUpper = nombreTicket.toUpperCase().trim();
    const baseLimpia = nombreBase.trim();
    
    if (!ticketUpper || !baseLimpia) return;
    
    // REGLA DE ORO: Si el nombre base es igual al del ticket, es "nombre sucio".
    // No queremos que este nombre sucio cree un producto nuevo en el catálogo maestro.
    const esNombreSucio = ticketUpper === baseLimpia.toUpperCase();

    // 1. Buscamos si el nombre base ya existe en el catálogo limpio
    let { data: prod } = await supabase
      .from('productos')
      .select('id')
      .eq('nombre_base', baseLimpia)
      .maybeSingle();

    // 2. Si no existe y NO ES SUCIO, lo creamos como nuevo producto maestro
    if (!prod && !esNombreSucio) {
      const { data: newP, error: errorInsert } = await supabase
        .from('productos')
        .insert([{ nombre_base: baseLimpia, categoria: 'otros' }])
        .select()
        .single();
      
      if (!errorInsert) prod = newP;
    }

    // 3. Si tenemos un producto maestro (viejo o recién creado), guardamos el alias
    // Esto nutre el diccionario para que la IA aprenda sin ensuciar la lista de "Mi Compra"
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
 * Actualiza alias y precios. Solo si hay un producto maestro vinculado.
 */
export const syncProductWithSupabase = async (itemIA: any, comercio: string) => {
  try {
    // Intentamos guardar el alias siguiendo las reglas de blindaje
    await saveManualAlias(itemIA.nombre_ticket, itemIA.nombre_base);
    
    // Buscamos el ID del producto (solo si existe en el catálogo limpio)
    const { data: prod } = await supabase
      .from('productos')
      .select('id')
      .eq('nombre_base', itemIA.nombre_base)
      .maybeSingle();

    if (prod) {
      const subtotal = Number(itemIA.subtotal) || 0;
      const cantidad = Number(itemIA.cantidad) || 1;
      
      // Guardamos histórico de precios solo para productos limpios
      await supabase.from('producto_detalles').upsert({
        producto_id: prod.id,
        marca: 'Genérico',
        tamano: 'Único',
        ultimo_precio: subtotal / cantidad,
        ultimo_comercio: comercio,
        fecha_actualizacion: new Date().toISOString()
      }, { onConflict: 'producto_id, tamano' });
    }
  } catch (e) {
    console.error("Error en syncProductWithSupabase:", e);
  }
};