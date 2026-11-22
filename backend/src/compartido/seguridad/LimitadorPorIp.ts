// Limite por origen de red. En IPv6 lleva dos cuentas a la vez:
// - el /64 (un equipo o una casa), con el limite normal;
// - el /48 (una red completa), con mas holgura porque pueden ser varias
//   personas, pero con tope para que rotar de /64 no de intentos infinitos.
// `sujeto` separa cuentas dentro del mismo origen (por ejemplo, el usuario).

import { LimitadorDeIntentos, type ReglaDeLimite } from './LimitadorDeIntentos';
import { origenDeRed } from './origenDeRed';

const EQUIPOS_POR_RED = 5;

interface Cuenta {
  limitador: LimitadorDeIntentos;
  clave: string;
  holgura: number; // cuantas veces el limite de un equipo
}

export class LimitadorPorIp {
  private readonly regla: ReglaDeLimite;
  private readonly porEquipo: LimitadorDeIntentos;
  private readonly porRed: LimitadorDeIntentos;

  constructor(regla: ReglaDeLimite) {
    this.regla = regla;
    this.porEquipo = new LimitadorDeIntentos(regla);
    this.porRed = new LimitadorDeIntentos({ ...regla, intentos: regla.intentos * EQUIPOS_POR_RED });
  }

  exigirDisponible(ip: string, sujeto = '', intentos: number = this.regla.intentos): void {
    for (const { limitador, clave, holgura } of this.cuentasDe(ip, sujeto)) {
      limitador.exigirDisponible(clave, intentos * holgura);
    }
  }

  registrar(ip: string, sujeto = ''): void {
    for (const { limitador, clave } of this.cuentasDe(ip, sujeto)) limitador.registrar(clave);
  }

  // Revisa todas las cuentas antes de sumar en alguna.
  consumir(ip: string, sujeto = '', intentos: number = this.regla.intentos): void {
    this.exigirDisponible(ip, sujeto, intentos);
    this.registrar(ip, sujeto);
  }

  devolver(ip: string, sujeto = ''): void {
    for (const { limitador, clave } of this.cuentasDe(ip, sujeto)) limitador.devolver(clave);
  }

  reiniciar(ip: string, sujeto = ''): void {
    for (const { limitador, clave } of this.cuentasDe(ip, sujeto)) limitador.reiniciar(clave);
  }

  private cuentasDe(ip: string, sujeto: string): Cuenta[] {
    const { equipo, red } = origenDeRed(ip);
    const cuentas = [{ limitador: this.porEquipo, clave: `${sujeto}|${equipo}`, holgura: 1 }];
    if (red) cuentas.push({ limitador: this.porRed, clave: `${sujeto}|${red}`, holgura: EQUIPOS_POR_RED });
    return cuentas;
  }
}
