import type { IVentaHistorialPort } from '@domain/ports/IVentaHistorialPort';
import type { ResumenVentaHistorial } from '@domain/types/POSState';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export class VentaHistorialAdapter implements IVentaHistorialPort {
  private token: string | null = null;
  setToken(token: string) { this.token = token; }

  async listar(): Promise<ResumenVentaHistorial[]> {
    const res = await fetch(`${API_BASE}/ventas`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    if (!res.ok) throw new Error('HISTORIAL_NO_DISPONIBLE');
    return res.json() as Promise<ResumenVentaHistorial[]>;
  }
}

export const ventaHistorialAdapter = new VentaHistorialAdapter();
