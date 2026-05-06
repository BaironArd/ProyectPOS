import type { IVentaHistorialPort } from '@domain/ports/IVentaHistorialPort';
import type { ResumenVentaHistorial } from '@domain/types/POSState';
import { httpFetch } from './httpClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export class VentaHistorialAdapter implements IVentaHistorialPort {
  async listar(): Promise<ResumenVentaHistorial[]> {
    const res = await httpFetch(`${API_BASE}/ventas?page=0&size=100`);
    if (!res.ok) throw new Error('HISTORIAL_NO_DISPONIBLE');
    const json = await res.json() as { data: { items: ResumenVentaHistorial[] } };
    return json.data.items ?? [];
  }
}

export const ventaHistorialAdapter = new VentaHistorialAdapter();
