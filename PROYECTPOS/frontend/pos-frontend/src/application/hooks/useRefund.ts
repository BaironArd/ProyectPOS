import { useState } from 'react';
import { usePOSStore } from '@application/store/usePOSStore';
import type { IDevolucionPort } from '@domain/ports/IDevolucionPort';
import type { Devolucion } from '@domain/types/POSState';

export function useRefund(devolucionPort: IDevolucionPort) {
  const [procesando, setProcesando] = useState(false);
  const [devolucion, setDevolucion] = useState<Devolucion | null>(null);

  const setEstado = usePOSStore((s) => s.setEstado);
  const setError = usePOSStore((s) => s.setError);

  async function procesar(ventaId: string) {
    setProcesando(true);
    try {
      const result = await devolucionPort.procesar(ventaId);
      setDevolucion(result);
      setEstado('IDLE');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la devolución';
      setError({ codigo: 'DEVOLUCION_FALLIDA', mensaje: `No se pudo procesar la devolución: ${msg}` });
    } finally {
      setProcesando(false);
    }
  }

  return { procesar, procesando, devolucion };
}
