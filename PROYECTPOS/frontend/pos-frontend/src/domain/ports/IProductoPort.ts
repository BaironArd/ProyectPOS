import type { Producto } from '../types/POSState';

export interface IProductoPort {
  buscar(query: string): Promise<Producto[]>;
}
