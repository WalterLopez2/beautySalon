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
}

export class LimitadorPorIp {
  private readonly porEquipo: LimitadorDeIntentos;
  private readonly porRed: LimitadorDeIntentos;

  constructor(regla: ReglaDeLimite) {
    this.porEquipo = new LimitadorDeIntentos(regla);
    this.porRed = new LimitadorDeIntentos({ ...regla, intentos: regla.intentos * EQUIPOS_POR_RED });
  }

  exigirDisponible(ip: string, sujeto = ''): void {
    for (const { limitador, clave } of this.cuentasDe(ip, sujeto)) limitador.exigirDisponible(clave);
  }

  registrar(ip: string, sujeto = ''): void {
    for (const { limitador, clave } of this.cuentasDe(ip, sujeto)) limitador.registrar(clave);
  }

  // Revisa todas las cuentas antes de sumar en alguna.
  consumir(ip: string, sujeto = ''): void {
    this.exigirDisponible(ip, sujeto);
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
    const cuentas = [{ limitador: this.porEquipo, clave: `${sujeto}|${equipo}` }];
    if (red) cuentas.push({ limitador: this.porRed, clave: `${sujeto}|${red}` });
    return cuentas;
  }
}
