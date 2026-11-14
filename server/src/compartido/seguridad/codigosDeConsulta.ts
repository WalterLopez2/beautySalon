// Codigo privado que recibe la clienta al agendar. Con su telefono + este
// codigo puede ver sus citas; con solo el telefono, no.
//
// En la base se guarda solo el hash (SHA-256): si alguien llegara a leer la
// tabla, no podria usar los codigos.

import { createHash, randomInt } from 'node:crypto';

// Sin letras ni numeros que se confunden al dictarlos (0/O, 1/I/L).
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LONGITUD = 10; // 31^10 ≈ 8 x 10^14 combinaciones

export function generarCodigoDeConsulta(): string {
  return Array.from({ length: LONGITUD }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');
}

// La clienta puede escribirlo con espacios, guiones o en minusculas.
export function normalizarCodigo(codigo: string): string {
  return codigo.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function hashDeCodigo(codigo: string): string {
  return createHash('sha256').update(normalizarCodigo(codigo)).digest('hex');
}
