/* --- ARCHIVO: lib/products.ts --- */
import { supabase } from "./supabase";

/**
 * BUSCADOR PARA "MI LISTA"
 * Es tolerante: busca por coincidencia exacta y también sustituyendo Ñ por N.
 * Ordena por longitud (más corto primero).
 */
export const searchLocalProducts = async (query: string) => {
  if (query.length < 2) return [];
  const upperQuery = query.toUpperCase().trim();
  const fuzzyQuery = upperQuery.replace(/Ñ/g, 'N');

  try {
    const { data, error } = await supabase.from('productos')
      .select(`id, nombre_base`)
      .or(`nombre_base.ilike.%${upperQuery}%, nombre_base.ilike.%${fuzzyQuery}%`)
      .limit(30);

    if (error) throw error;

    // Ordenamiento por longitud: "PIÑA" antes que "PIÑA EN ALMIBAR"
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
 * REGISTRO DE APRENDIZAJE Y FUSIÓN Ñ/N
 * Si el nombre no existe (ni con Ñ ni con N), lo crea. 
 * Si existe, vincula el nombre del ticket a ese ID existente.
 */
export const saveManualAlias = async (nombreTicket: string, nombreBase: string) => {
  try {
    const ticketUpper = nombreTicket.toUpperCase().trim();
    const baseUpper = nombreBase.toUpperCase().trim();
    
    if (!ticketUpper || !baseUpper) return;
    
    // Blindaje: si el nombre base es igual al del ticket, es un nombre sucio, no lo metemos al catálogo
    if (ticketUpper === baseUpper) return;

    // Clave para detectar duplicados de Ñ/N
    const fuzzyBase = baseUpper.replace(/Ñ/g, 'N');

    // 1. Buscamos si ya existe el producto (exacto o fuzzy)
    let { data: productosExistentes } = await supabase
      .from('productos')
      .select('id, nombre_base')
      .or(`nombre_base.eq.${baseUpper}, nombre_base.ilike.${fuzzyBase}`);

    let prod = productosExistentes?.[0];

    // Si existen versiones con y sin Ñ, preferimos la que tiene Ñ
    if (productosExistentes && productosExistentes.length > 1) {
        prod = productosExistentes.find(p => p.nombre_base.includes('Ñ')) || productosExistentes[0];
    }

    // 2. Si realmente es nuevo (no hay ni exacto ni fuzzy), lo creamos
    if (!prod) {
      const { data: newP, error: errorInsert } = await supabase
        .from('productos')
        .insert([{ nombre_base: baseUpper, categoria: 'OTROS' }])
        .select()
        .single();
      
      if (!errorInsert) prod = newP;
    }

    // 3. Guardamos el alias apuntando al maestro
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

    // Registramos alias y maestro
    await saveManualAlias(ticketUpper, baseUpper);
    
    const fuzzyBase = baseUpper.replace(/Ñ/g, 'N');

    // Recuperamos el ID para guardar el detalle de precio
    const { data: productos } = await supabase
      .from('productos')
      .select('id')
      .or(`nombre_base.eq.${baseUpper}, nombre_base.ilike.${fuzzyBase}`);

    const prod = productos?.[0];

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