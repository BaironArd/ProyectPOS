import { usePOSStore } from '@application/store/usePOSStore';
import { useRefund } from '@application/hooks/useRefund';
import type { IDevolucionPort } from '@domain/ports/IDevolucionPort';
import { formatearPrecio } from '@ui/utils/formato';
import styles from './RefundPanel.module.css';

interface Props {
  devolucionPort: IDevolucionPort;
}

export function RefundPanel({ devolucionPort }: Props) {
  const estado = usePOSStore((s) => s.estado);
  const ventaIdActual = usePOSStore((s) => s.ventaIdActual);
  const resumen = usePOSStore((s) => s.resumen);
  const setEstado = usePOSStore((s) => s.setEstado);

  const { procesar, procesando, devolucion } = useRefund(devolucionPort);

  if (estado !== 'DEVOLUCION') return null;

  if (devolucion) {
    return (
      <div className={styles.exito}>
        <p>✅ Devolución procesada. Devolver <strong>{formatearPrecio(devolucion.montoDevuelto)}</strong> al cliente.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.titulo}>Devolución de venta</h2>
      <div className={styles.resumen}>
        <p><strong>ID Venta:</strong> {ventaIdActual ?? '—'}</p>
        <p><strong>Monto a devolver:</strong> {formatearPrecio(resumen.total)}</p>
      </div>
      <div className={styles.acciones}>
        <button
          className={styles.btnConfirmar}
          onClick={() => ventaIdActual && procesar(ventaIdActual)}
          disabled={procesando || !ventaIdActual}
          aria-busy={procesando}
        >
          {procesando ? 'Procesando...' : 'Confirmar devolución'}
        </button>
        <button
          className={styles.btnCancelar}
          onClick={() => setEstado('IDLE')}
          disabled={procesando}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
