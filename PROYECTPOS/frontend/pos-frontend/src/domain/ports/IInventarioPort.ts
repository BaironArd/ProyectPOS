import type { Producto } from '../types/POSState';

export interface NuevoProducto {
  nombre: string;
  precio: number;
  stock: number;
  categoria?: string;
}

export interface IInventarioPort {
  listar(): Promise<Producto[]>;
  crear(producto: NuevoProducto): Promise<Producto>;
  actualizar(id: number, cambios: Partial<Producto>): Promise<Producto>;
  toggleActivo(id: number): Promise<Producto>;
}
