import type { IReportePort } from '@domain/ports/IReportePort';
import type { ReporteCierre } from '@domain/types/POSState';
import { httpFetch } from './httpClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export class ReporteAdapter implements IReportePort {
  async generarCierre(fechaDesde: string, fechaHasta: string): Promise<ReporteCierre> {
    const res = await httpFetch(
      `${API_BASE}/reportes/cierre?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`
    );
    if (!res.ok) throw new Error('REPORTE_ERROR');
    const json = await res.json() as { data: ReporteCierre };
    return json.data;
  }

  async exportarCSV(reporte: ReporteCierre): Promise<Blob> {
    const lineas = [
      'Desde,Hasta,Total Ventas,Total Devueltas,Monto Total,Monto Devuelto,Monto Neto',
      `${reporte.fechaDesde},${reporte.fechaHasta},${reporte.totalVentas},${reporte.totalDevueltas},${reporte.montoTotal},${reporte.montoDevuelto},${reporte.montoNeto}`,
      '', 'Cajero,Ventas,Monto',
      ...reporte.ventasPorCajero.map((v) => `${v.usuario},${v.ventas},${v.monto}`),
    ];
    return new Blob([lineas.join('\n')], { type: 'text/csv;charset=utf-8;' });
  }
}

export const reporteAdapter = new ReporteAdapter();
