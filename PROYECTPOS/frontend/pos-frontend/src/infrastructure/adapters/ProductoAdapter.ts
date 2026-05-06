import type { IProductoPort } from '@domain/ports/IProductoPort';
import type { Producto } from '@domain/types/POSState';
import { httpFetch } from './httpClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export class ProductoAdapter implements IProductoPort {
  async buscar(query: string): Promise<Producto[]> {
    const res = await httpFetch(
      `${API_BASE}/productos?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) throw new Error('LOAD_FAILED');
    const data = await res.json() as { data: Producto[] };
    return data.data;
  }
}

export const productoAdapter = new ProductoAdapter();
