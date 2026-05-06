import { usePOSStore } from '@application/store/usePOSStore';
import { formatearPrecio } from '@ui/utils/formato';
import styles from './OrderSummary.module.css';

export function OrderSummary() {
  const resumen = usePOSStore((s) => s.resumen);
  const estado = usePOSStore((s) => s.estado);
  const carrito = usePOSStore((s) => s.carrito);

  const visible = carrito.length > 0 && ['CARRITO_ACTIVO', 'CALCULANDO_PAGO', 'PROCESANDO'].includes(estado);
  if (!visible) return null;

  return (
    <div className={styles.wrapper} aria-label="Resumen de compra">
      <div className={styles.fila}>
        <span>Subtotal</span>
        <span>{formatearPrecio(resumen.subtotal)}</span>
      </div>
      <div className={styles.fila}>
        <span>IVA (19%)</span>
        <span>{formatearPrecio(resumen.iva)}</span>
      </div>
      <div className={styles.divisor} />
      <div className={`${styles.fila} ${styles.total}`}>
        <span>Total</span>
        <span>{formatearPrecio(resumen.total)}</span>
      </div>
    </div>
  );
}
