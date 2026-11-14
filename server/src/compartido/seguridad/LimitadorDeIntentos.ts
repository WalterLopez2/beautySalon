// Cuenta intentos por "clave" (una IP, un usuario...) dentro de una ventana
// de tiempo. Al llegar al limite, rechaza con `DemasiadosIntentos` hasta que
// los intentos viejos salen de la ventana.
//
// Vive en memoria: es suficiente para un solo servidor. Si algun dia la API
// corre en varias instancias, este es el unico lugar a cambiar (por ejemplo,
// para guardar los contadores en la base de datos o en Redis).

import { DemasiadosIntentos } from '../errores';

export interface ReglaDeLimite {
  intentos: number;
  ventanaMs: number;
}

// Limpia claves viejas cada tanto para que la memoria no crezca sin fin.
const CLAVES_ANTES_DE_LIMPIAR = 10_000;

export class LimitadorDeIntentos {
  private readonly regla: ReglaDeLimite;
  private readonly ahora: () => number;
  private readonly registros = new Map<string, number[]>();

  constructor(regla: ReglaDeLimite, ahora: () => number = Date.now) {
    this.regla = regla;
    this.ahora = ahora;
  }

  // Falla si la clave ya llego al limite. No cuenta un intento nuevo.
  exigirDisponible(clave: string): void {
    const recientes = this.recientes(clave);
    if (recientes.length >= this.regla.intentos) {
      const liberaEn = recientes[0] + this.regla.ventanaMs - this.ahora();
      throw new DemasiadosIntentos(Math.max(1, Math.ceil(liberaEn / 1000)));
    }
  }

  registrar(clave: string): void {
    this.limpiarSiHaceFalta();
    this.registros.set(clave, [...this.recientes(clave), this.ahora()]);
  }

  // exigirDisponible + registrar: para limitar pedidos, no solo fallos.
  consumir(clave: string): void {
    this.exigirDisponible(clave);
    this.registrar(clave);
  }

  // Tras un login correcto, los fallos anteriores ya no cuentan.
  reiniciar(clave: string): void {
    this.registros.delete(clave);
  }

  private recientes(clave: string): number[] {
    const limite = this.ahora() - this.regla.ventanaMs;
    return (this.registros.get(clave) ?? []).filter((momento) => momento > limite);
  }

  private limpiarSiHaceFalta(): void {
    if (this.registros.size < CLAVES_ANTES_DE_LIMPIAR) return;
    for (const clave of this.registros.keys()) {
      if (this.recientes(clave).length === 0) this.registros.delete(clave);
    }
  }
}
