/**
 * Cliente HTTP centralizado que:
 * 1. Agrega el token JWT en cada petición (SPEC-009)
 * 2. Detecta 401 y dispara logout automático (sesión expirada)
 */

import { usePOSStore } from '@application/store/usePOSStore';

export async function httpFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const sesion = usePOSStore.getState().sesion;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (sesion?.token) {
    headers['Authorization'] = `Bearer ${sesion.token}`;
  }

  const res = await fetch(url, { ...options, headers });

  // SPEC-009: si el token expiró, redirigir automáticamente a LOGIN
  if (res.status === 401) {
    usePOSStore.getState().logout();
  }

  return res;
}
