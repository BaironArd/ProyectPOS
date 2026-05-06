import type { Sesion } from '../types/POSState';

export interface IAuthPort {
  login(usuario: string, contrasena: string): Promise<Sesion>;
  logout(token: string): Promise<void>;
}
