import type { IDevolucionPort } from '@domain/ports/IDevolucionPort';
import type { Devolucion } from '@domain/types/POSState';
import { httpFetch } from './httpClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export class DevolucionAdapter implements IDevolucionPort {
  async procesar(ventaId: string): Promise<Devolucion> {
    const res = await httpFetch(`${API_BASE}/ventas/${ventaId}/devolucion`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json() as { error: { codigo: string } };
      throw new Error(err.error?.codigo ?? 'DEVOLUCION_FALLIDA');
    }
    const json = await res.json() as { data: { ventaId: string; montoDevuelto: number; estado: string } };
    return {
      ventaId: json.data.ventaId,
      montoDevuelto: json.data.montoDevuelto,
      estado: json.data.estado as 'DEVUELTA' | 'PENDIENTE',
    };
  }
}

export const devolucionAdapter = new DevolucionAdapter();
