import { useEffect } from 'react';
import { usePOSStore } from '@application/store/usePOSStore';

// Ports
import type { IAuthPort } from '@domain/ports/IAuthPort';
import type { IProductoPort } from '@domain/ports/IProductoPort';
import type { IVentaPort } from '@domain/ports/IVentaPort';
import type { IVentaHistorialPort } from '@domain/ports/IVentaHistorialPort';
import type { IDevolucionPort } from '@domain/ports/IDevolucionPort';
import type { IInventarioPort } from '@domain/ports/IInventarioPort';
import type { IReportePort } from '@domain/ports/IReportePort';
import type { IImpresionPort } from '@domain/ports/IImpresionPort';

// Components
import { LoginForm } from './components/LoginForm/LoginForm';
import { Header } from './components/Header/Header';
import { ErrorBanner } from './components/ErrorBanner/ErrorBanner';
import { SearchBar } from './components/SearchBar/SearchBar';
import { ProductList } from './components/ProductList/ProductList';
import { Cart } from './components/Cart/Cart';
import { OrderSummary } from './components/OrderSummary/OrderSummary';
import { PaymentPanel } from './components/PaymentPanel/PaymentPanel';
import { SalesHistory } from './components/SalesHistory/SalesHistory';
import { RefundPanel } from './components/RefundPanel/RefundPanel';
import { InventoryPanel } from './components/InventoryPanel/InventoryPanel';
import { ReportsPanel } from './components/ReportsPanel/ReportsPanel';
import { ReceiptButton } from './components/ReceiptButton/ReceiptButton';

import styles from './POSApp.module.css';

interface Props {
  authPort: IAuthPort;
  productoPort: IProductoPort;
  ventaPort: IVentaPort;
  historialPort: IVentaHistorialPort;
  devolucionPort: IDevolucionPort;
  inventarioPort: IInventarioPort;
  reportePort: IReportePort;
  impresionPort: IImpresionPort;
}

export function POSApp({
  authPort,
  productoPort,
  ventaPort,
  historialPort,
  devolucionPort,
  inventarioPort,
  reportePort,
  impresionPort,
}: Props) {
  const estado = usePOSStore((s) => s.estado);
  const sesion = usePOSStore((s) => s.sesion);
  const resumen = usePOSStore((s) => s.resumen);
  const ventaIdActual = usePOSStore((s) => s.ventaIdActual);
  const cambio = usePOSStore((s) => s.cambio);
  const setEstado = usePOSStore((s) => s.setEstado);
  const resetVenta = usePOSStore((s) => s.resetVenta);

  // Auto-retorno a IDLE tras 3s en VENTA_COMPLETA
  useEffect(() => {
    if (estado !== 'VENTA_COMPLETA') return;
    const timer = setTimeout(() => resetVenta(), 3000);
    return () => clearTimeout(timer);
  }, [estado, resetVenta]);

  // Pantalla de login
  if (!sesion || estado === 'LOGIN') {
    return <LoginForm authPort={authPort} />;
  }

  const enFlujoVenta = ['IDLE', 'BUSCANDO', 'RESULTADOS', 'CARRITO_ACTIVO', 'CALCULANDO_PAGO', 'PROCESANDO', 'VENTA_COMPLETA', 'ERROR'].includes(estado);

  return (
    <div className={styles.app}>
      <Header authPort={authPort} />

      <main className={styles.main}>
        <ErrorBanner />

        {/* Paneles especiales */}
        {estado === 'HISTORIAL' && (
          <SalesHistory
            historialPort={historialPort}
            onDevolver={(ventaId) => {
              setEstado('DEVOLUCION');
              usePOSStore.getState().setVentaIdActual(ventaId);
            }}
          />
        )}

        {estado === 'DEVOLUCION' && <RefundPanel devolucionPort={devolucionPort} />}
        {estado === 'INVENTARIO' && <InventoryPanel inventarioPort={inventarioPort} />}
        {estado === 'REPORTES' && <ReportsPanel reportePort={reportePort} />}

        {/* Pantalla de venta completada */}
        {estado === 'VENTA_COMPLETA' && (
          <div className={styles.ventaCompleta}>
            <div className={styles.exito}>
              <span className={styles.exitoIcono}>✅</span>
              <h2>¡Venta completada!</h2>
              <p className={styles.cambioTexto}>Cambio: <strong>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cambio)}</strong></p>
              <p className={styles.ventaId}>ID: {ventaIdActual}</p>
            </div>
            <div className={styles.accionesVenta}>
              <ReceiptButton impresionPort={impresionPort} />
              <button className={styles.btnDevolver} onClick={() => setEstado('DEVOLUCION')}>
                Devolver venta
              </button>
              <button className={styles.btnNuevaVenta} onClick={resetVenta}>
                Nueva venta
              </button>
            </div>
          </div>
        )}

        {/* Flujo principal de venta */}
        {enFlujoVenta && estado !== 'VENTA_COMPLETA' && (
          <div className={styles.flujoVenta}>
            <div className={styles.columnaIzq}>
              <SearchBar productoPort={productoPort} />
              <ProductList />
            </div>
            <div className={styles.columnaDer}>
              <Cart />
              <OrderSummary />
              <PaymentPanel ventaPort={ventaPort} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
