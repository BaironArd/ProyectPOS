import type { IVentaPort, ConfirmarVentaPayload, ConfirmarVentaResult } from '@domain/ports/IVentaPort';
import { httpFetch } from './httpClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export class VentaAdapter implements IVentaPort {
  async confirmar(payload: ConfirmarVentaPayload): Promise<ConfirmarVentaResult> {
    const body = {
      items: payload.carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })),
      montoPagado: payload.total,
      idempotencyKey: payload.idempotencyKey,
      usuarioCajero: payload.usuarioCajero,
      metodoPago: payload.metodoPago,
      pagos: payload.pagos.map(p => ({ metodo: p.metodo, monto: p.monto, referencia: p.referencia })),
    };
    const res = await httpFetch(`${API_BASE}/ventas`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('CONFIRMACION_FALLIDA');
    const data = await res.json() as { data: { ventaId: string } };
    return { ok: true, ventaId: data.data.ventaId };
  }
}

export const ventaAdapter = new VentaAdapter();
