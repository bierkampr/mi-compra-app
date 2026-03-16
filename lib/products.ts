import { supabase } from "./supabase";

/**
 * BUSCADOR PARA "MI LISTA"
 * Consulta la tabla 'productos' para sugerir nombres genéricos.
 */
export const searchLocalProducts = async (query: string) => {
  if (query.length < 2) return [];
  try {
    const { data, error } = await supabase.from('productos')
      .select(`id, nombre_base`)
      .ilike('nombre_base', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("Error en búsqueda de productos:", e);
    return [];
  }
};

/**
 * BUSCADOR DE ALIAS (Diccionario Inteligente)
 * Mira si un texto de ticket ya fue vinculado antes a un nombre base.
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
 * Si el nombre genérico no existe, lo crea. Luego crea el alias.
 */
export const saveManualAlias = async (nombreTicket: string, nombreBase: string) => {
  try {
    const ticketUpper = nombreTicket.toUpperCase().trim();
    const baseLimpia = nombreBase.trim();
    if (!ticketUpper || !baseLimpia) return;
    
    // 1. Buscamos el ID del nombre base (ej: 'Jugo')
    let { data: prod } = await supabase
      .from('productos')
      .select('id')
      .eq('nombre_base', baseLimpia)
      .maybeSingle();

    // 2. Si el nombre base no existe en el catálogo, lo insertamos
    if (!prod) {
      const { data: newP, error: errorInsert } = await supabase
        .from('productos')
        .insert([{ nombre_base: baseLimpia, categoria: 'otros' }])
        .select()
        .single();
      
      if (errorInsert) throw errorInsert;
      prod = newP;
    }

    // 3. Creamos la relación en la tabla de alias
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
 * Actualiza alias y precios históricos.
 */
export const syncProductWithSupabase = async (itemIA: any, comercio: string) => {
  try {
    // 1. Registrar el vínculo para que la App aprenda
    await saveManualAlias(itemIA.nombre_ticket, itemIA.nombre_base);
    
    // 2. Actualizar precio en la tabla de detalles
    const { data: prod } = await supabase
      .from('productos')
      .select('id')
      .eq('nombre_base', itemIA.nombre_base)
      .maybeSingle();

    if (prod) {
      const subtotal = Number(itemIA.subtotal) || 0;
      const cantidad = Number(itemIA.cantidad) || 1;
      
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