import type { IDevolucionPort } from '@domain/ports/IDevolucionPort';
import type { Devolucion } from '@domain/types/POSState';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export class DevolucionAdapter implements IDevolucionPort {
  private token: string | null = null;
  setToken(token: string) { this.token = token; }

  async procesar(ventaId: string): Promise<Devolucion> {
    const res = await fetch(`${API_BASE}/ventas/${ventaId}/devolucion`, {
      method: 'POST',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    if (!res.ok) throw new Error('DEVOLUCION_FALLIDA');
    return res.json() as Promise<Devolucion>;
  }
}

export const devolucionAdapter = new DevolucionAdapter();
