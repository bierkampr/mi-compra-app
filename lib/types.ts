export interface Product {
  cantidad: number;
  nombre_ticket: string;
  nombre_base: string;
  subtotal: number;
}

export interface Gasto {
  comercio: string;
  fecha: string; // DD/MM/YYYY
  total: number;
  category: string;
  photoIds: string[];
  productos: Product[];
  usedList?: boolean;
}

export interface ListItem {
  name: string;           // Nombre del producto (nombre_base)
  checked: boolean;      // Si está marcado como comprado
  confirmed: boolean;     // Si fue confirmado en un gasto
  nombre_ticket?: string; // Nombre del ticket (solo si confirmed)
  precio_actual?: number; // Precio unitario actual (solo si confirmed)
  ultimo_precio?: number; // Último precio histórico
  ultimo_comercio?: string; // Último comercio
}

export interface AppDB {
  gastos: Gasto[];
  lista: ListItem[];
  customCategories: string[];
}

export interface UserState {
  name: string;
  loggedIn: boolean;
  token: string;
}
