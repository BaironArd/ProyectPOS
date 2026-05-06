import { usePOSStore } from '@application/store/usePOSStore';
import styles from './ErrorBanner.module.css';

export function ErrorBanner() {
  const estado = usePOSStore((s) => s.estado);
  const error = usePOSStore((s) => s.error);
  const clearError = usePOSStore((s) => s.clearError);

  if (estado !== 'ERROR' || !error) return null;

  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      <div className={styles.contenido}>
        <span className={styles.icono}>⚠️</span>
        <p className={styles.mensaje}>{error.mensaje}</p>
      </div>
      <div className={styles.acciones}>
        <button className={styles.btnCerrar} onClick={clearError} aria-label="Cerrar error">
          ✕
        </button>
      </div>
    </div>
  );
}
