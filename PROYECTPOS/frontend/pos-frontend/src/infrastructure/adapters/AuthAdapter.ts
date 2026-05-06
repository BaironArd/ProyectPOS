import type { IAuthPort } from '@domain/ports/IAuthPort';
import type { Sesion } from '@domain/types/POSState';
import { httpFetch } from './httpClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export class AuthAdapter implements IAuthPort {
  async login(usuario: string, contrasena: string): Promise<Sesion> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, contrasena }),
    });
    if (!res.ok) throw new Error('CREDENCIALES_INVALIDAS');
    const data = await res.json() as { data: { token: string; usuario: string; rol: string } };
    // Token almacenado en memoria via el store — NUNCA en localStorage (SPEC-009)
    return {
      usuario: data.data.usuario,
      rol: data.data.rol as 'CAJERO' | 'ADMIN',
      token: data.data.token,
    };
  }

  async logout(token: string): Promise<void> {
    await httpFetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

export const authAdapter = new AuthAdapter();
