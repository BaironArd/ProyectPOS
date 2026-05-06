import type { ItemCarrito, PagoItem, MetodoPago } from '../types/POSState';

export interface ConfirmarVentaPayload {
  carrito: ItemCarrito[];
  total: number;
  metodoPago: MetodoPago;
  pagos: PagoItem[];
  idempotencyKey: string;
  usuarioCajero?: string;
}

export interface ConfirmarVentaResult {
  ok: boolean;
  ventaId: string;
}

export interface IVentaPort {
  confirmar(payload: ConfirmarVentaPayload): Promise<ConfirmarVentaResult>;
}
