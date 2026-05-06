import { useEffect } from 'react';
import { usePOSStore } from '@application/store/usePOSStore';
import { usePayment } from '@application/hooks/usePayment';
import type { IVentaPort } from '@domain/ports/IVentaPort';
import type { MetodoPago, PagoItem } from '@domain/types/POSState';
import { formatearPrecio } from '@ui/utils/formato';
import styles from './PaymentPanel.module.css';

const METODOS: { value: Exclude<MetodoPago, 'MIXTO'>; label: string }[] = [
  { value: 'EFECTIVO', label: '💵 Efectivo' },
  { value: 'TARJETA_DEBITO', label: '💳 Débito' },
  { value: 'TARJETA_CREDITO', label: '💳 Crédito' },
  { value: 'TRANSFERENCIA', label: '🏦 Transferencia' },
];

interface Props {
  ventaPort: IVentaPort;
}

export function PaymentPanel({ ventaPort }: Props) {
  const estado = usePOSStore((s) => s.estado);
  const resumen = usePOSStore((s) => s.resumen);
  const metodoPago = usePOSStore((s) => s.metodoPago);
  const pagos = usePOSStore((s) => s.pagos);
  const montoPagado = usePOSStore((s) => s.montoPagado);
  const cambio = usePOSStore((s) => s.cambio);
  const setMetodoPago = usePOSStore((s) => s.setMetodoPago);
  const setMontoPagado = usePOSStore((s) => s.setMontoPagado);
  const agregarPago = usePOSStore((s) => s.agregarPago);
  const eliminarPago = usePOSStore((s) => s.eliminarPago);

  const { confirmarVenta, procesando, puedeConfirmar } = usePayment(ventaPort);

  // Seleccionar EFECTIVO por defecto al abrir el panel
  useEffect(() => {
    if (estado === 'CALCULANDO_PAGO' && !metodoPago) {
      setMetodoPago('EFECTIVO');
    }
  }, [estado, metodoPago, setMetodoPago]);

  if (estado !== 'CALCULANDO_PAGO' && estado !== 'PROCESANDO') return null;

  const esMixto = metodoPago === 'MIXTO';
  const esEfectivo = metodoPago === 'EFECTIVO';
  const sumaPagos = pagos.reduce((s, p) => s + p.monto, 0);
  const montoInsuficiente = esEfectivo
    ? montoPagado < resumen.total
    : esMixto
    ? sumaPagos < resumen.total
    : montoPagado < resumen.total;

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.titulo}>Método de pago</h3>

      {/* Selector de método */}
      <div className={styles.metodos}>
        {METODOS.map((m) => (
          <button
            key={m.value}
            className={`${styles.btnMetodo} ${metodoPago === m.value ? styles.activo : ''}`}
            onClick={() => setMetodoPago(m.value)}
            disabled={procesando}
          >
            {m.label}
          </button>
        ))}
        <button
          className={`${styles.btnMetodo} ${metodoPago === 'MIXTO' ? styles.activo : ''}`}
          onClick={() => setMetodoPago('MIXTO')}
          disabled={procesando}
        >
          🔀 Mixto
        </button>
      </div>

      {/* Pago simple (efectivo / tarjeta / transferencia) */}
      {!esMixto && metodoPago && (
        <div className={styles.campoMonto}>
          <label className={styles.label}>
            {esEfectivo ? 'Monto recibido' : 'Monto'}
          </label>
          <input
            type="number"
            min={0}
            value={montoPagado || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setMontoPagado(isNaN(val) || val < 0 ? 0 : val);
            }}
            className={styles.input}
            placeholder="0"
            disabled={procesando}
            aria-label="Monto de pago"
          />
          {esEfectivo && (
            <p className={`${styles.cambio} ${montoInsuficiente ? styles.insuficiente : styles.suficiente}`}>
              {montoInsuficiente
                ? `Monto insuficiente (faltan ${formatearPrecio(resumen.total - montoPagado)})`
                : `Cambio: ${formatearPrecio(cambio)}`}
            </p>
          )}
        </div>
      )}

      {/* Pago mixto */}
      {esMixto && (
        <div className={styles.mixto}>
          {pagos.map((pago, idx) => (
            <div key={idx} className={styles.filaPago}>
              <select
                value={pago.metodo}
                onChange={(e) => {
                  const nuevos = [...pagos];
                  nuevos[idx] = { ...pago, metodo: e.target.value as PagoItem['metodo'] };
                  // reemplazar via eliminar + agregar no es ideal; usamos store directamente
                }}
                className={styles.selectMetodo}
                disabled={procesando}
              >
                {METODOS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                value={pago.monto || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const nuevos = [...pagos];
                  nuevos[idx] = { ...pago, monto: isNaN(val) ? 0 : val };
                  // actualizar via store
                }}
                className={styles.inputMixto}
                placeholder="0"
                disabled={procesando}
              />
              <button
                className={styles.btnEliminarPago}
                onClick={() => eliminarPago(idx)}
                disabled={procesando}
                aria-label="Eliminar pago"
              >✕</button>
            </div>
          ))}
          <button
            className={styles.btnAgregarPago}
            onClick={() => agregarPago({ metodo: 'EFECTIVO', monto: 0 })}
            disabled={procesando}
          >
            + Agregar pago
          </button>
          <p className={`${styles.cambio} ${montoInsuficiente ? styles.insuficiente : styles.suficiente}`}>
            {montoInsuficiente
              ? `Faltan ${formatearPrecio(resumen.total - sumaPagos)}`
              : `Cubierto ✓`}
          </p>
        </div>
      )}

      <button
        className={styles.btnConfirmar}
        onClick={confirmarVenta}
        disabled={!puedeConfirmar || procesando}
        aria-busy={procesando}
      >
        {procesando ? 'Procesando...' : 'Confirmar venta'}
      </button>
    </div>
  );
}
