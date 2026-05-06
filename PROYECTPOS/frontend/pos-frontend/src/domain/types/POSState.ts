export type EstadoUI =
  | 'LOGIN'
  | 'IDLE'
  | 'BUSCANDO'
  | 'RESULTADOS'
  | 'CARRITO_ACTIVO'
  | 'CALCULANDO_PAGO'
  | 'PROCESANDO'
  | 'VENTA_COMPLETA'
  | 'HISTORIAL'
  | 'DEVOLUCION'
  | 'INVENTARIO'
  | 'REPORTES'
  | 'ERROR';

export type Rol = 'CAJERO' | 'ADMIN';

export type MetodoPago =
  | 'EFECTIVO'
  | 'TARJETA_DEBITO'
  | 'TARJETA_CREDITO'
  | 'TRANSFERENCIA'
  | 'MIXTO';

export interface PagoItem {
  metodo: Exclude<MetodoPago, 'MIXTO'>;
  monto: number;
  referencia?: string;
}

export interface ItemCarrito {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Resumen {
  subtotal: number;
  iva: number;
  total: number;
}

export interface ErrorUI {
  codigo: string;
  mensaje: string;
}

export interface Sesion {
  usuario: string;
  rol: Rol;
  token: string;
}

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  activo?: boolean;
}

export interface ResumenVentaHistorial {
  ventaId: string;
  fechaHora: string;
  total: number;
  cantidadItems: number;
}

export interface Devolucion {
  ventaId: string;
  montoDevuelto: number;
  estado: 'DEVUELTA' | 'PENDIENTE';
}

export interface VentasPorCajero {
  usuario: string;
  ventas: number;
  monto: number;
}

export interface ReporteCierre {
  fechaDesde: string;
  fechaHasta: string;
  totalVentas: number;
  totalDevueltas: number;
  montoTotal: number;
  montoDevuelto: number;
  montoNeto: number;
  ventasPorCajero: VentasPorCajero[];
}

export interface POSState {
  estado: EstadoUI;
  sesion: Sesion | null;
  query: string;
  productos: Producto[];
  carrito: ItemCarrito[];
  resumen: Resumen;
  metodoPago: MetodoPago | null;
  pagos: PagoItem[];
  montoPagado: number;
  cambio: number;
  historial: ResumenVentaHistorial[];
  estadoPrevio: EstadoUI | null;
  error: ErrorUI | null;
  ventaIdActual: string | null;
}
