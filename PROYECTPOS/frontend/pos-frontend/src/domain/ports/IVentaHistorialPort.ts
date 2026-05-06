import type { ResumenVentaHistorial } from '../types/POSState';

export interface IVentaHistorialPort {
  listar(): Promise<ResumenVentaHistorial[]>;
}
