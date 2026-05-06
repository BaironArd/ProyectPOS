import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { POSApp } from './ui/POSApp';

// Adaptadores de producción (conectan al backend real)
import { authAdapter } from './infrastructure/adapters/AuthAdapter';
import { productoAdapter } from './infrastructure/adapters/ProductoAdapter';
import { ventaAdapter } from './infrastructure/adapters/VentaAdapter';
import { ventaHistorialAdapter } from './infrastructure/adapters/VentaHistorialAdapter';
import { devolucionAdapter } from './infrastructure/adapters/DevolucionAdapter';
import { inventarioAdapter } from './infrastructure/adapters/InventarioAdapter';
import { reporteAdapter } from './infrastructure/adapters/ReporteAdapter';
import { impresionAdapter } from './infrastructure/adapters/ImpresionAdapter';

import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el elemento #root');

createRoot(root).render(
  <StrictMode>
    <POSApp
      authPort={authAdapter}
      productoPort={productoAdapter}
      ventaPort={ventaAdapter}
      historialPort={ventaHistorialAdapter}
      devolucionPort={devolucionAdapter}
      inventarioPort={inventarioAdapter}
      reportePort={reporteAdapter}
      impresionPort={impresionAdapter}
    />
  </StrictMode>
);
