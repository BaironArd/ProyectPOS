import { create } from 'zustand';
import type {
  POSState,
  EstadoUI,
  ItemCarrito,
  MetodoPago,
  PagoItem,
  Sesion,
  ErrorUI,
  ResumenVentaHistorial,
  Producto,
} from '@domain/types/POSState';
import { calcularResumen, calcularCambio, calcularSubtotal } from '@domain/calculadora';

// ---------------------------------------------------------------------------
// Transiciones válidas de la máquina de estados
// ---------------------------------------------------------------------------
const TRANSICIONES_VALIDAS: Partial<Record<EstadoUI, EstadoUI[]>> = {
  LOGIN: ['IDLE'],
  IDLE: ['BUSCANDO', 'HISTORIAL', 'INVENTARIO', 'REPORTES', 'LOGIN', 'ERROR'],
  BUSCANDO: ['RESULTADOS', 'IDLE', 'ERROR'],
  RESULTADOS: ['CARRITO_ACTIVO', 'BUSCANDO', 'IDLE', 'HISTORIAL', 'INVENTARIO', 'REPORTES', 'ERROR'],
  CARRITO_ACTIVO: ['CALCULANDO_PAGO', 'RESULTADOS', 'HISTORIAL', 'INVENTARIO', 'REPORTES', 'ERROR'],
  CALCULANDO_PAGO: ['PROCESANDO', 'CARRITO_ACTIVO', 'ERROR'],
  PROCESANDO: ['VENTA_COMPLETA', 'ERROR'],
  VENTA_COMPLETA: ['IDLE', 'DEVOLUCION', 'ERROR'],
  HISTORIAL: ['IDLE', 'RESULTADOS', 'DEVOLUCION', 'INVENTARIO', 'REPORTES', 'ERROR'],
  DEVOLUCION: ['IDLE', 'ERROR'],
  INVENTARIO: ['IDLE', 'HISTORIAL', 'REPORTES', 'ERROR'],
  REPORTES: ['IDLE', 'HISTORIAL', 'INVENTARIO', 'ERROR'],
  ERROR: ['IDLE'],
};

function transicionValida(desde: EstadoUI, hacia: EstadoUI): boolean {
  return TRANSICIONES_VALIDAS[desde]?.includes(hacia) ?? false;
}

// ---------------------------------------------------------------------------
// Estado inicial
// ---------------------------------------------------------------------------
const estadoInicial: POSState = {
  estado: 'LOGIN',
  sesion: null,
  query: '',
  productos: [],
  carrito: [],
  resumen: { subtotal: 0, iva: 0, total: 0 },
  metodoPago: null,
  pagos: [],
  montoPagado: 0,
  cambio: 0,
  historial: [],
  estadoPrevio: null,
  error: null,
  ventaIdActual: null,
};

// ---------------------------------------------------------------------------
// Acciones del store
// ---------------------------------------------------------------------------
interface POSActions {
  // Estado UI
  setEstado: (estado: EstadoUI) => void;

  // Búsqueda
  setQuery: (query: string) => void;
  setProductos: (productos: Producto[]) => void;

  // Carrito
  agregarAlCarrito: (producto: Producto) => void;
  modificarCantidad: (productoId: number, cantidad: number) => void;
  eliminarDelCarrito: (productoId: number) => void;

  // Pago
  setMontoPagado: (monto: number) => void;
  setMetodoPago: (metodo: MetodoPago) => void;
  agregarPago: (pago: PagoItem) => void;
  eliminarPago: (index: number) => void;
  actualizarPago: (index: number, pago: PagoItem) => void;
  resetPagos: () => void;

  // Venta
  setVentaIdActual: (ventaId: string) => void;
  resetVenta: () => void;

  // Historial
  setHistorial: (historial: ResumenVentaHistorial[]) => void;
  verHistorial: () => void;
  volverDeHistorial: () => void;

  // Auth
  login: (sesion: Sesion) => void;
  logout: () => void;

  // Errores
  setError: (error: ErrorUI) => void;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const usePOSStore = create<POSState & POSActions>((set, get) => ({
  ...estadoInicial,

  // --- Estado UI ---
  setEstado: (nuevoEstado) => {
    const { estado } = get();
    if (!transicionValida(estado, nuevoEstado)) return; // transición inválida: ignorar
    set({ estado: nuevoEstado });
  },

  // --- Búsqueda ---
  setQuery: (query) => set({ query }),

  setProductos: (productos) => set({ productos }),

  // --- Carrito ---
  agregarAlCarrito: (producto) => {
    const { carrito, estado } = get();
    if (producto.stock === 0) return;

    const existente = carrito.find((i) => i.productoId === producto.id);
    let nuevoCarrito: ItemCarrito[];

    if (existente) {
      nuevoCarrito = carrito.map((i) =>
        i.productoId === producto.id
          ? { ...i, cantidad: i.cantidad + 1, subtotal: calcularSubtotal(i.precioUnitario, i.cantidad + 1) }
          : i
      );
    } else {
      nuevoCarrito = [
        ...carrito,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          cantidad: 1,
          precioUnitario: producto.precio,
          subtotal: producto.precio,
        },
      ];
    }

    const resumen = calcularResumen(nuevoCarrito);
    const nuevoEstado: EstadoUI = estado === 'RESULTADOS' ? 'CARRITO_ACTIVO' : estado;

    set({ carrito: nuevoCarrito, resumen, estado: nuevoEstado });
  },

  modificarCantidad: (productoId, cantidad) => {
    const { carrito } = get();

    if (cantidad <= 0) {
      // Eliminar ítem
      const nuevoCarrito = carrito.filter((i) => i.productoId !== productoId);
      const resumen = calcularResumen(nuevoCarrito);
      const nuevoEstado: EstadoUI = nuevoCarrito.length === 0 ? 'RESULTADOS' : 'CARRITO_ACTIVO';
      set({ carrito: nuevoCarrito, resumen, estado: nuevoEstado });
      return;
    }

    const nuevoCarrito = carrito.map((i) =>
      i.productoId === productoId
        ? { ...i, cantidad, subtotal: calcularSubtotal(i.precioUnitario, cantidad) }
        : i
    );
    const resumen = calcularResumen(nuevoCarrito);
    set({ carrito: nuevoCarrito, resumen });
  },

  eliminarDelCarrito: (productoId) => {
    const { carrito } = get();
    const nuevoCarrito = carrito.filter((i) => i.productoId !== productoId);
    const resumen = calcularResumen(nuevoCarrito);
    const nuevoEstado: EstadoUI = nuevoCarrito.length === 0 ? 'RESULTADOS' : 'CARRITO_ACTIVO';
    set({ carrito: nuevoCarrito, resumen, estado: nuevoEstado });
  },

  // --- Pago ---
  setMontoPagado: (monto) => {
    const { resumen } = get();
    const cambio = calcularCambio(monto, resumen.total);
    set({ montoPagado: monto, cambio });
  },

  setMetodoPago: (metodo) => set({ metodoPago: metodo, pagos: [] }),

  agregarPago: (pago) => {
    const { pagos } = get();
    set({ pagos: [...pagos, pago] });
  },

  eliminarPago: (index) => {
    const { pagos } = get();
    set({ pagos: pagos.filter((_, i) => i !== index) });
  },

  actualizarPago: (index, pago) => {
    const { pagos } = get();
    set({ pagos: pagos.map((p, i) => (i === index ? pago : p)) });
  },

  resetPagos: () => set({ pagos: [], metodoPago: null, montoPagado: 0, cambio: 0 }),

  // --- Venta ---
  setVentaIdActual: (ventaId) => set({ ventaIdActual: ventaId }),

  resetVenta: () =>
    set({
      carrito: [],
      resumen: { subtotal: 0, iva: 0, total: 0 },
      query: '',
      productos: [],
      metodoPago: null,
      pagos: [],
      montoPagado: 0,
      cambio: 0,
      ventaIdActual: null,
      estado: 'IDLE',
    }),

  // --- Historial ---
  setHistorial: (historial) => set({ historial }),

  verHistorial: () => {
    const { estado } = get();
    // Guardar estado previo para poder volver — funciona desde cualquier estado autenticado
    const estadosNoNavegables: EstadoUI[] = ['LOGIN', 'PROCESANDO'];
    if (estadosNoNavegables.includes(estado)) return;
    set({ estadoPrevio: estado, estado: 'HISTORIAL' });
  },

  volverDeHistorial: () => {
    const { estadoPrevio } = get();
    set({ estado: estadoPrevio ?? 'IDLE', estadoPrevio: null });
  },

  // --- Auth ---
  login: (sesion) => set({ sesion, estado: 'IDLE' }),

  logout: () =>
    set({
      ...estadoInicial,
      estado: 'LOGIN',
    }),

  // --- Errores ---
  setError: (error) => set({ error, estado: 'ERROR' }),

  clearError: () => {
    const { estadoPrevio } = get();
    set({ error: null, estado: estadoPrevio ?? 'IDLE', estadoPrevio: null });
  },
}));
