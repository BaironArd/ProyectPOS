import { useState } from 'react';
import { usePOSStore } from '@application/store/usePOSStore';
import type { IVentaPort } from '@domain/ports/IVentaPort';

export function usePayment(ventaPort: IVentaPort) {
  const [procesando, setProcesando] = useState(false);

  const resumen = usePOSStore((s) => s.resumen);
  const carrito = usePOSStore((s) => s.carrito);
  const metodoPago = usePOSStore((s) => s.metodoPago);
  const pagos = usePOSStore((s) => s.pagos);
  const montoPagado = usePOSStore((s) => s.montoPagado);
  const setEstado = usePOSStore((s) => s.setEstado);
  const setError = usePOSStore((s) => s.setError);
  const setVentaIdActual = usePOSStore((s) => s.setVentaIdActual);
  const resetVenta = usePOSStore((s) => s.resetVenta);

  async function confirmarVenta() {
    if (procesando) return;
    if (!metodoPago) return;

    setProcesando(true);
    setEstado('PROCESANDO');

    try {
      const result = await ventaPort.confirmar({
        carrito,
        total: resumen.total,
        metodoPago,
        pagos,
      });

      if (result.ok) {
        setVentaIdActual(result.ventaId);
        setEstado('VENTA_COMPLETA');
      } else {
        throw new Error('CONFIRMACION_FALLIDA');
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al confirmar la venta';
      setError({ codigo: 'CONFIRMACION_FALLIDA', mensaje: `No se pudo confirmar la venta: ${mensaje}` });
    } finally {
      setProcesando(false);
    }
  }

  function nuevaVenta() {
    resetVenta();
  }

  const puedeConfirmar =
    !procesando &&
    metodoPago !== null &&
    (metodoPago === 'EFECTIVO'
      ? montoPagado >= resumen.total
      : metodoPago === 'MIXTO'
      ? pagos.reduce((s, p) => s + p.monto, 0) >= resumen.total
      : montoPagado >= resumen.total);

  return { confirmarVenta, nuevaVenta, procesando, puedeConfirmar };
}
