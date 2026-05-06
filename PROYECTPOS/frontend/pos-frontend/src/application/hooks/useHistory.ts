import { useEffect } from 'react';
import { usePOSStore } from '@application/store/usePOSStore';
import type { IVentaHistorialPort } from '@domain/ports/IVentaHistorialPort';

export function useHistory(historialPort: IVentaHistorialPort) {
  const estado = usePOSStore((s) => s.estado);
  const setHistorial = usePOSStore((s) => s.setHistorial);
  const setError = usePOSStore((s) => s.setError);

  useEffect(() => {
    if (estado !== 'HISTORIAL') return;

    historialPort.listar()
      .then(setHistorial)
      .catch(() =>
        setError({ codigo: 'HISTORIAL_NO_DISPONIBLE', mensaje: 'No se pudo cargar el historial de ventas.' })
      );
  }, [estado, historialPort, setHistorial, setError]);
}
