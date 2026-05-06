import type { Devolucion } from '../types/POSState';

export interface IDevolucionPort {
  procesar(ventaId: string): Promise<Devolucion>;
}
