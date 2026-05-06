import { usePOSStore } from '@application/store/usePOSStore';
import type { IAuthPort } from '@domain/ports/IAuthPort';
import { useAuth } from '@application/hooks/useAuth';
import styles from './Header.module.css';

interface Props {
  authPort: IAuthPort;
}

export function Header({ authPort }: Props) {
  const sesion = usePOSStore((s) => s.sesion);
  const carrito = usePOSStore((s) => s.carrito);
  const verHistorial = usePOSStore((s) => s.verHistorial);
  const setEstado = usePOSStore((s) => s.setEstado);
  const estado = usePOSStore((s) => s.estado);
  const { logout } = useAuth(authPort);

  const itemsCarrito = carrito.length;

  // Solo bloquear navegación durante PROCESANDO (venta en curso) o CALCULANDO_PAGO
  const navegacionBloqueada = estado === 'PROCESANDO' || estado === 'CALCULANDO_PAGO';

  return (
    <header className={styles.header}>
      <div className={styles.marca}>
        <span className={styles.titulo}>Punto de Venta</span>
      </div>

      <nav className={styles.nav}>
        {sesion?.rol === 'ADMIN' && (
          <>
            <button
              className={`${styles.btnNav} ${estado === 'INVENTARIO' ? styles.activo : ''}`}
              onClick={() => setEstado('INVENTARIO')}
              disabled={navegacionBloqueada}
              aria-label="Ir a Inventario"
            >
              📦 Inventario
            </button>
            <button
              className={`${styles.btnNav} ${estado === 'REPORTES' ? styles.activo : ''}`}
              onClick={() => setEstado('REPORTES')}
              disabled={navegacionBloqueada}
              aria-label="Ir a Reportes"
            >
              📊 Reportes
            </button>
          </>
        )}

        <button
          className={`${styles.btnNav} ${estado === 'HISTORIAL' ? styles.activo : ''}`}
          onClick={verHistorial}
          disabled={navegacionBloqueada}
          aria-label="Ver historial de ventas"
        >
          🕐 Historial
          {itemsCarrito > 0 && (
            <span className={styles.badge}>{itemsCarrito}</span>
          )}
        </button>

        <div className={styles.usuario}>
          <span className={styles.nombreUsuario}>{sesion?.usuario}</span>
          <span className={`${styles.rol} ${sesion?.rol === 'ADMIN' ? styles.rolAdmin : styles.rolCajero}`}>
            {sesion?.rol}
          </span>
        </div>

        <button className={styles.btnLogout} onClick={logout} aria-label="Cerrar sesión">
          Cerrar sesión
        </button>
      </nav>
    </header>
  );
}
