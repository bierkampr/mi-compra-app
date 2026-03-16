import { supabase } from "./supabase";

/**
 * Busca productos genéricos para "Mi Lista".
 * Consulta la tabla 'productos' donde están los nombres limpios (ej: Tomate, Leche).
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
 * Busca si un nombre del ticket ya tiene un alias genérico asignado en el sistema global.
 */
export const getBaseNameFromAlias = async (nombreTicket: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('producto_alias')
      .select('productos(nombre_base)')
      .eq('nombre_ticket', nombreTicket.toUpperCase())
      .maybeSingle();
    
    if (error) return null;
    // @ts-ignore
    return data?.productos?.nombre_base || null;
  } catch (e) {
    return null;
  }
};

/**
 * Guarda o actualiza la relación entre un nombre de ticket y un nombre genérico.
 * Esto alimenta la "inteligencia colectiva" de la app.
 */
export const saveManualAlias = async (nombreTicket: string, nombreBase: string) => {
  try {
    const ticketUpper = nombreTicket.toUpperCase().trim();
    const baseLimpia = nombreBase.trim();
    
    // 1. Buscamos el ID del genérico por su nombre (ej: 'Jugo')
    let { data: prod, error: errorSearch } = await supabase
      .from('productos')
      .select('id')
      .eq('nombre_base', baseLimpia)
      .maybeSingle();

    // 2. Si el genérico no existe (ej: usaste un nombre muy personal), lo creamos
    if (!prod) {
      const { data: newP, error: errorInsert } = await supabase
        .from('productos')
        .insert([{ nombre_base: baseLimpia, categoria: 'otros' }])
        .select()
        .single();
      
      if (errorInsert) throw errorInsert;
      prod = newP;
    }

    // 3. Creamos o actualizamos el alias en la tabla 'producto_alias'
    if (prod) {
      const { error: errorAlias } = await supabase.from('producto_alias').upsert({ 
        producto_id: prod.id, 
        nombre_ticket: ticketUpper 
      }, { onConflict: 'nombre_ticket' });
      
      if (errorAlias) throw errorAlias;
    }
  } catch (e) {
    console.error("Error al guardar alias inteligente:", e);
  }
};

/**
 * Sincronización final: guarda precios y asegura que los alias queden registrados.
 */
export const syncProductWithSupabase = async (itemIA: any, comercio: string) => {
  try {
    // 1. Primero registramos el alias (Ticket -> Base)
    await saveManualAlias(itemIA.nombre_ticket, itemIA.nombre_base);
    
    // 2. Buscamos el producto base para actualizar el precio histórico
    const { data: prod } = await supabase
      .from('productos')
      .select('id')
      .eq('nombre_base', itemIA.nombre_base)
      .maybeSingle();

    if (prod) {
      await supabase.from('producto_detalles').upsert({
        producto_id: prod.id,
        marca: 'Genérico',
        tamano: 'Único',
        ultimo_precio: (Number(itemIA.subtotal) / Number(itemIA.cantidad || 1)) || 0,
        ultimo_comercio: comercio,
        fecha_actualizacion: new Date().toISOString()
      }, { onConflict: 'producto_id, tamano' });
    }
  } catch (e) {
    console.error("Error en sincronización Supabase:", e);
  }
};