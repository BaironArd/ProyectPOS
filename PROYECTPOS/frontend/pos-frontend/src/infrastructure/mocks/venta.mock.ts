import type { IVentaPort, ConfirmarVentaPayload, ConfirmarVentaResult } from '@domain/ports/IVentaPort';

let ventaCounter = 1;

export class VentaMock implements IVentaPort {
  async confirmar(_payload: ConfirmarVentaPayload): Promise<ConfirmarVentaResult> {
    await new Promise((r) => setTimeout(r, 500));
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const ventaId = `VNT-${fecha}-${String(ventaCounter++).padStart(3, '0')}`;
    return { ok: true, ventaId };
  }
}

export const ventaMock = new VentaMock();
