import type { ReporteCierre } from '../types/POSState';

export interface IReportePort {
  generarCierre(fechaDesde: string, fechaHasta: string): Promise<ReporteCierre>;
  exportarCSV(reporte: ReporteCierre): Promise<Blob>;
}
