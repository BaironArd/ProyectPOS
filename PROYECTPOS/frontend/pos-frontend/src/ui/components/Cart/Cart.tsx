import { usePOSStore } from '@application/store/usePOSStore';
import { formatearPrecio } from '@ui/utils/formato';
import styles from './Cart.module.css';

export function Cart() {
  const carrito = usePOSStore((s) => s.carrito);
  const estado = usePOSStore((s) => s.estado);
  const modificarCantidad = usePOSStore((s) => s.modificarCantidad);
  const eliminarDelCarrito = usePOSStore((s) => s.eliminarDelCarrito);
  const setEstado = usePOSStore((s) => s.setEstado);

  // No mostrar controles de edición durante el pago o procesando
  const soloLectura = estado === 'CALCULANDO_PAGO' || estado === 'PROCESANDO';

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.titulo}>
        Carrito
        {carrito.length > 0 && (
          <span className={styles.contador}>{carrito.length} ítem{carrito.length !== 1 ? 's' : ''}</span>
        )}
      </h3>

      {carrito.length === 0 ? (
        <p className={styles.vacio}>El carrito está vacío. Busca un producto para agregarlo.</p>
      ) : (
        <>
          <table className={styles.tabla} aria-label="Carrito de compras">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio unit.</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
                {!soloLectura && <th>Eliminar</th>}
              </tr>
            </thead>
            <tbody>
              {carrito.map((item) => (
                <tr key={item.productoId}>
                  <td>{item.nombre}</td>
                  <td>{formatearPrecio(item.precioUnitario)}</td>
                  <td>
                    {soloLectura ? (
                      <span>{item.cantidad}</span>
                    ) : (
                      <div className={styles.cantidadControles}>
                        <button
                          className={styles.btnCantidad}
                          onClick={() => modificarCantidad(item.productoId, item.cantidad - 1)}
                          aria-label={`Reducir cantidad de ${item.nombre}`}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={item.stockDisponible}
                          value={item.cantidad}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 0) {
                              modificarCantidad(item.productoId, val);
                            }
                          }}
                          className={styles.inputCantidad}
                          aria-label={`Cantidad de ${item.nombre}`}
                        />
                        <button
                          className={styles.btnCantidad}
                          onClick={() => modificarCantidad(item.productoId, item.cantidad + 1)}
                          disabled={item.cantidad >= item.stockDisponible}
                          aria-label={`Aumentar cantidad de ${item.nombre}`}
                          title={item.cantidad >= item.stockDisponible ? `Stock máximo: ${item.stockDisponible}` : ''}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </td>
                  <td>{formatearPrecio(item.subtotal)}</td>
                  {!soloLectura && (
                    <td>
                      <div className={styles.accionesItem}>
                        <button
                          className={styles.btnEliminar}
                          onClick={() => eliminarDelCarrito(item.productoId)}
                          aria-label={`Eliminar ${item.nombre} del carrito`}
                        >
                          ✕
                        </button>
                        {item.cantidad >= item.stockDisponible && (
                          <span className={styles.stockAgotado} title="Stock máximo alcanzado">⚠️</span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {estado === 'CARRITO_ACTIVO' && (
            <button
              className={styles.btnProceder}
              onClick={() => setEstado('CALCULANDO_PAGO')}
            >
              Proceder al pago
            </button>
          )}

          {estado === 'CALCULANDO_PAGO' && (
            <button
              className={styles.btnVolver}
              onClick={() => setEstado('CARRITO_ACTIVO')}
            >
              ← Volver al carrito
            </button>
          )}
        </>
      )}
    </div>
  );
}
