import type { ItemCarrito, Resumen } from './types/POSState';

export const IVA_RATE = 0.19;

export function calcularResumen(carrito: ItemCarrito[]): Resumen {
  const subtotal = carrito.reduce((acc, item) => acc + item.subtotal, 0);
  const iva = Math.round(subtotal * IVA_RATE);
  const total = subtotal + iva;
  return { subtotal, iva, total };
}

export function calcularCambio(montoPagado: number, total: number): number {
  return montoPagado - total;
}

export function calcularSubtotal(precio: number, cantidad: number): number {
  return precio * cantidad;
}
