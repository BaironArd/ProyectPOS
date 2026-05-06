import { usePOSStore } from '@application/store/usePOSStore';
import { useHistory } from '@application/hooks/useHistory';
import type { IVentaHistorialPort } from '@domain/ports/IVentaHistorialPort';
import { formatearPrecio, formatearFecha } from '@ui/utils/formato';
import styles from './SalesHistory.module.css';

interface Props {
  historialPort: IVentaHistorialPort;
  onDevolver?: (ventaId: string) => void;
}

export function SalesHistory({ historialPort, onDevolver }: Props) {
  const estado = usePOSStore((s) => s.estado);
  const historial = usePOSStore((s) => s.historial);
  const volverDeHistorial = usePOSStore((s) => s.volverDeHistorial);

  useHistory(historialPort);

  if (estado !== 'HISTORIAL') return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.titulo}>Historial de ventas</h2>
        <button className={styles.btnVolver} onClick={volverDeHistorial}>
          ← Volver
        </button>
      </div>

      {historial.length === 0 ? (
        <p className={styles.vacio}>No hay ventas registradas en este turno</p>
      ) : (
        <table className={styles.tabla} aria-label="Historial de ventas">
          <thead>
            <tr>
              <th>ID Venta</th>
              <th>Fecha / Hora</th>
              <th>Total</th>
              <th>Ítems</th>
              {onDevolver && <th>Acción</th>}
            </tr>
          </thead>
          <tbody>
            {historial.map((venta) => (
              <tr key={venta.ventaId}>
                <td>{venta.ventaId}</td>
                <td>{formatearFecha(venta.fechaHora)}</td>
                <td>{formatearPrecio(venta.total)}</td>
                <td>{venta.cantidadItems}</td>
                {onDevolver && (
                  <td>
                    <button
                      className={styles.btnDevolver}
                      onClick={() => onDevolver(venta.ventaId)}
                    >
                      Devolver
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
