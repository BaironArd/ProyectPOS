import { useState } from 'react';
import { usePOSStore } from '@application/store/usePOSStore';
import { useReports } from '@application/hooks/useReports';
import type { IReportePort } from '@domain/ports/IReportePort';
import { formatearPrecio } from '@ui/utils/formato';
import styles from './ReportsPanel.module.css';

interface Props { reportePort: IReportePort; }

export function ReportsPanel({ reportePort }: Props) {
  const estado = usePOSStore((s) => s.estado);
  const setEstado = usePOSStore((s) => s.setEstado);
  const { reporte, cargando, generar, exportarCSV } = useReports(reportePort);

  const hoy = new Date().toISOString().slice(0, 10);
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);

  if (estado !== 'REPORTES') return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.titulo}>Reportes de cierre</h2>
        <button className={styles.btnVolver} onClick={() => setEstado('IDLE')}>← Volver</button>
      </div>

      <div className={styles.filtros}>
        <label className={styles.label}>Desde</label>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={styles.inputFecha} />
        <label className={styles.label}>Hasta</label>
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={styles.inputFecha} />
        <button className={styles.btnGenerar} onClick={() => generar(desde, hasta)} disabled={cargando}>
          {cargando ? 'Generando...' : 'Generar'}
        </button>
      </div>

      {/* SPEC-013: sin ventas en el período */}
      {reporte && reporte.totalVentas === 0 && (
        <p className={styles.vacio}>Sin ventas en el período seleccionado</p>
      )}

      {reporte && reporte.totalVentas > 0 && (
        <>
          <div className={styles.resumen}>
            <div className={styles.stat}><span>Total ventas</span><strong>{reporte.totalVentas}</strong></div>
            <div className={styles.stat}><span>Devueltas</span><strong>{reporte.totalDevueltas}</strong></div>
            <div className={styles.stat}><span>Monto bruto</span><strong>{formatearPrecio(reporte.montoTotal)}</strong></div>
            <div className={styles.stat}><span>Devuelto</span><strong>{formatearPrecio(reporte.montoDevuelto)}</strong></div>
            <div className={`${styles.stat} ${styles.neto}`}><span>Monto neto</span><strong>{formatearPrecio(reporte.montoNeto)}</strong></div>
          </div>

          <h3 className={styles.subtitulo}>Por cajero</h3>
          <table className={styles.tabla}>
            <thead><tr><th>Cajero</th><th>Ventas</th><th>Monto</th></tr></thead>
            <tbody>
              {reporte.ventasPorCajero.map((v) => (
                <tr key={v.usuario}><td>{v.usuario}</td><td>{v.ventas}</td><td>{formatearPrecio(v.monto)}</td></tr>
              ))}
            </tbody>
          </table>

          <button className={styles.btnCSV} onClick={exportarCSV}>⬇ Exportar CSV</button>
        </>
      )}

      {!reporte && !cargando && (
        <p className={styles.vacio}>Selecciona un rango de fechas y haz clic en Generar</p>
      )}
    </div>
  );
}
