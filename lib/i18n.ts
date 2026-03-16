const translations: any = {
  es: {
    common: { save: "Guardar", cancel: "Cancelar", close: "Cerrar", delete: "Eliminar", loading: "Procesando...", offline: "Sin conexión", back: "Volver" },
    auth: { title: "Gestiona tus gastos", subtitle: "La forma más inteligente de controlar tu dinero con IA.", login_btn: "Entrar con Google" },
    nav: { home: "Inicio", add: "Añadir", list: "Lista" },
    home: { monthly_spend: "Gasto Mensual", records: "Registros", no_gastos: "No hay registros este mes", shop_breakdown: "Gasto por comercio", view_analysis: "Toca para ver desglose" },
    list: { placeholder: "¿Qué necesitas comprar?", scan_btn: "Escanear Ticket", clear_btn: "Limpiar Lista", pending: "Pendientes", bought: "Comprado" },
    scan: { title: "Cargar Ticket", add_photo: "+ Añadir Foto", process: "Procesar con IA ⚡", super: "Supermercado", mini: "Mini Market", manual: "Manual" },
    review: { title: "Revisar Gasto", shop: "Comercio", date: "Fecha", total: "Total (€)", add_manual: "Añadir producto manual", finish: "Finalizar Registro", discard: "Descartar" },
    settings: { title: "Ajustes", user: "Usuario", export: "Exportar CSV", logout: "Cerrar Sesión" },
    modals: {
  delete_confirm: "¿Eliminar este registro?",
  link_list_title: "¿VINCULAR CON LISTA?",
  link_list_msg: "TIENES UNA LISTA DE COMPRAS PENDIENTE. ¿QUIERES QUE LA IA MARQUE LOS PRODUCTOS ENCONTRADOS?",
  yes_link: "SÍ, VINCULAR", // <--- Faltaba esta
  no_link: "NO, SOLO TICKET", // <--- Faltaba esta
  clear_list_msg: "¿Limpiar toda la lista?",
  finish_list_confirm: "¿Dar por finalizada la compra?"
},
    ai: {
      prompt: `Actúa como un experto extractor de datos de tickets.
      LISTA DE PRODUCTOS ESPERADOS: [{{lista}}].
      FECHA ACTUAL: {{fecha}}.

      REGLAS CRÍTICAS:
      1. "comercio": Debe ser un STRING (texto plano), nunca un objeto. Ejemplo: "SPAR".
      2. Si el ticket es un comprobante de tarjeta sin productos, devuelve "productos": [].
      3. "nombre_base": Usa el nombre de la LISTA DE PRODUCTOS ESPERADOS si coincide exactamente.
      4. "total": Solo el número final pagado.

      FORMATO JSON ESTRICTO:
      {
        "comercio": "string",
        "fecha": "DD/MM/AAAA",
        "total": number,
        "productos": [
          { "cantidad": number, "nombre_ticket": "string", "nombre_base": "string", "subtotal": number }
        ]
      }`
    }
  }
};

export const getSystemLanguage = (): string => {
  if (typeof window === 'undefined') return 'es';
  const lang = navigator.language.split('-')[0];
  return translations[lang] ? lang : 'es';
};

export const t = (path: string, lang: string): string => {
  const keys = path.split('.');
  let result = translations[lang] || translations['es'];
  for (const key of keys) {
    if (result && result[key]) result = result[key];
    else return path.toUpperCase();
  }
  return result;
};