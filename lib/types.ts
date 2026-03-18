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
  name: string;
  checked: boolean;
  confirmed: boolean;
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
