import type { IVentaPort, ConfirmarVentaPayload, ConfirmarVentaResult } from '@domain/ports/IVentaPort';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export class VentaAdapter implements IVentaPort {
  private token: string | null = null;

  setToken(token: string) { this.token = token; }

  async confirmar(payload: ConfirmarVentaPayload): Promise<ConfirmarVentaResult> {
    const res = await fetch(`${API_BASE}/ventas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('CONFIRMACION_FALLIDA');
    return res.json() as Promise<ConfirmarVentaResult>;
  }
}

export const ventaAdapter = new VentaAdapter();
