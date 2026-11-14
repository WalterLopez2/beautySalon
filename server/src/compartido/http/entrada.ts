// Lectura validada de lo que llega por HTTP (body, query, params). Cada
// funcion devuelve el dato ya con su tipo o lanza `DatosInvalidos` con un
// mensaje claro. Asi las rutas no repiten validaciones ni usan `any`.

import { esEstadoCita, type EstadoCita } from '../dominio/citas';
import { diasEntre, esFechaValida, esHoraValida } from '../dominio/fechas';
import { DatosInvalidos } from '../errores';

export type Objeto = Record<string, unknown>;

type Lecturas<T> = { [Campo in keyof T]: () => T[Campo] };

// Lee varios campos y junta TODOS los errores en uno solo, para que el
// formulario pueda marcar todo lo que esta mal de una vez y no de a uno.
export function leerCampos<T>(lecturas: Lecturas<T>): T {
  const resultado = {} as T;
  const errores: string[] = [];

  for (const campo of Object.keys(lecturas) as (keyof T)[]) {
    try {
      resultado[campo] = lecturas[campo]();
    } catch (error) {
      if (!(error instanceof DatosInvalidos)) throw error;
      errores.push(...error.errores);
    }
  }

  if (errores.length > 0) {
    throw new DatosInvalidos(errores);
  }
  return resultado;
}

export function leerObjeto(valor: unknown, campo: string): Objeto {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw new DatosInvalidos([`Faltan los datos de ${campo}.`]);
  }
  return valor as Objeto;
}

export function leerTexto(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new DatosInvalidos([`El campo "${campo}" es obligatorio.`]);
  }
  return valor.trim();
}

export function leerTextoOpcional(valor: unknown, campo: string): string | null {
  if (valor === undefined || valor === null || valor === '') return null;
  if (typeof valor !== 'string') {
    throw new DatosInvalidos([`El campo "${campo}" debe ser texto.`]);
  }
  return valor.trim() || null;
}

// Acepta numeros o texto numerico, porque los params y la query siempre
// llegan como texto ("/clientas/7").
export function leerIdentificador(valor: unknown, campo: string): number {
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (typeof numero !== 'number' || !Number.isInteger(numero) || numero <= 0) {
    throw new DatosInvalidos([`El campo "${campo}" debe ser un numero entero positivo.`]);
  }
  return numero;
}

export function leerFecha(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || !esFechaValida(valor)) {
    throw new DatosInvalidos([`El campo "${campo}" debe ser una fecha con formato YYYY-MM-DD.`]);
  }
  return valor;
}

export function leerHora(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || !esHoraValida(valor)) {
    throw new DatosInvalidos([`El campo "${campo}" debe ser una hora con formato HH:MM.`]);
  }
  return valor;
}

export function leerEstadoCita(valor: unknown): EstadoCita {
  if (!esEstadoCita(valor)) {
    throw new DatosInvalidos(['El estado debe ser pendiente, confirmada, atendida o cancelada.']);
  }
  return valor;
}

export function leerEnteroPositivo(valor: unknown, campo: string): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor <= 0) {
    throw new DatosInvalidos([`El campo "${campo}" debe ser un numero entero mayor a cero.`]);
  }
  return valor;
}

export function leerMonto(valor: unknown, campo: string): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
    throw new DatosInvalidos([`El campo "${campo}" debe ser un monto igual o mayor a cero.`]);
  }
  return Math.round(valor * 100) / 100; // centavos, como guarda NUMERIC(10, 2)
}

export function leerBooleano(valor: unknown, campo: string): boolean {
  if (typeof valor !== 'boolean') {
    throw new DatosInvalidos([`El campo "${campo}" debe ser verdadero o falso.`]);
  }
  return valor;
}

export function leerLista(valor: unknown, campo: string): unknown[] {
  if (!Array.isArray(valor)) {
    throw new DatosInvalidos([`El campo "${campo}" debe ser una lista.`]);
  }
  return valor;
}

export function leerHoraOpcional(valor: unknown, campo: string): string | null {
  if (valor === undefined || valor === null || valor === '') return null;
  return leerHora(valor, campo);
}

export interface RangoDeFechas {
  desde: string;
  hasta: string;
}

// Rango cerrado [desde, hasta] con un tope de dias, para que nadie pida por
// error (o a proposito) anos enteros de datos en una sola consulta.
export function leerRangoDeFechas(desdeCrudo: unknown, hastaCrudo: unknown, diasMaximos: number): RangoDeFechas {
  const { desde, hasta } = leerCampos<RangoDeFechas>({
    desde: () => leerFecha(desdeCrudo, 'desde'),
    hasta: () => leerFecha(hastaCrudo, 'hasta'),
  });
  const dias = diasEntre(desde, hasta);

  if (dias < 0) {
    throw new DatosInvalidos(['La fecha "desde" debe ser anterior o igual a "hasta".']);
  }
  if (dias > diasMaximos) {
    throw new DatosInvalidos([`Solo se pueden consultar hasta ${diasMaximos} dias a la vez.`]);
  }
  return { desde, hasta };
}
