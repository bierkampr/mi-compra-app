/* --- ARCHIVO: lib/products.ts --- */
import { supabase } from "./supabase";

/**
 * BUSCADOR PARA "MI LISTA"
 * Busca en el catálogo maestro forzando mayúsculas y ordena por longitud del nombre.
 */
export const searchLocalProducts = async (query: string) => {
  if (query.length < 2) return [];
  
  // Estandarizamos la búsqueda a Mayúsculas
  const upperQuery = query.toUpperCase().trim();

  try {
    const { data, error } = await supabase.from('productos')
      .select(`id, nombre_base`)
      .ilike('nombre_base', `%${upperQuery}%`)
      .limit(30); // Pedimos margen para el ordenamiento manual

    if (error) throw error;

    // ORDENAMIENTO POR LONGITUD: Los más cortos primero para prioridad visual
    return (data || []).sort((a, b) => a.nombre_base.length - b.nombre_base.length);
  } catch (e) {
    console.error("Error en búsqueda de productos:", e);
    return [];
  }
};

/**
 * BUSCADOR DE ALIAS (Diccionario Inteligente)
 * Busca si un nombre sucio de ticket ya tiene un alias limpio asignado.
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
 * REGISTRO DE APRENDIZAJE (Vínculo Ticket -> Lista)
 * BLINDAJE: Evita que nombres idénticos al ticket (sucios) entren al catálogo maestro.
 * FUSIÓN: Busca por nombre existente antes de crear uno nuevo.
 */
export const saveManualAlias = async (nombreTicket: string, nombreBase: string) => {
  try {
    // REGLA DE ORO: Todo a MAYÚSCULAS y LIMPIO
    const ticketUpper = nombreTicket.toUpperCase().trim();
    const baseUpper = nombreBase.toUpperCase().trim();
    
    if (!ticketUpper || !baseUpper) return;
    
    // Si el nombre base es igual al del ticket, es "ruido de supermercado".
    // No permitimos que esto ensucie la tabla maestra de 'productos'.
    if (ticketUpper === baseUpper) {
       console.log("Blindaje activado: Ignorando nombre sucio para el catálogo maestro.");
       return;
    }

    // 1. Intentar buscar el producto por NOMBRE (Fusión automática para evitar duplicados)
    let { data: prod } = await supabase
      .from('productos')
      .select('id')
      .eq('nombre_base', baseUpper)
      .maybeSingle();

    // 2. Si el producto no existe en el catálogo maestro, lo creamos (siempre en Mayúsculas)
    if (!prod) {
      const { data: newP, error: errorInsert } = await supabase
        .from('productos')
        .insert([{ nombre_base: baseUpper, categoria: 'OTROS' }])
        .select()
        .single();
      
      if (!errorInsert) prod = newP;
    }

    // 3. Vincular el alias en la tabla de aprendizaje (Diccionario Inteligente)
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
 * Procesa productos detectados por la IA para actualizar el diccionario global.
 */
export const syncProductWithSupabase = async (itemIA: any, comercio: string) => {
  try {
    // Forzamos la limpieza y mayúsculas delegando en saveManualAlias
    await saveManualAlias(itemIA.nombre_ticket, itemIA.nombre_base);
    
    const baseUpper = itemIA.nombre_base.toUpperCase().trim();

    // Buscamos el ID (solo si superó el blindaje anterior)
    const { data: prod } = await supabase
      .from('productos')
      .select('id')
      .eq('nombre_base', baseUpper)
      .maybeSingle();

    if (prod) {
      const subtotal = Number(itemIA.subtotal) || 0;
      const cantidad = Number(itemIA.cantidad) || 1;
      
      // Actualizamos el histórico de precios (Mayúsculas)
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
    console.error("Error en sincronización silenciosa:", e);
  }
};