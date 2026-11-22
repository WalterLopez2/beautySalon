import { describe, expect, it } from 'vitest';
import { esTelefonoValido, normalizarTelefono } from '../../src/compartido/dominio/telefono';

describe('telefono de Honduras', () => {
  it.each(['99990000', '9999-0000', '9999 0000', '+504 9999-0000', '(504) 9999.0000', '50499990000'])(
    '"%s" se guarda como 99990000',
    (escrito) => {
      expect(esTelefonoValido(escrito)).toBe(true);
      expect(normalizarTelefono(escrito)).toBe('99990000');
    },
  );

  it.each(['', '123', '9999000', '999900001', '+1 305 555 0100', '99990000abc', '+504 +504 99990000'])(
    'rechaza "%s"',
    (escrito) => {
      expect(esTelefonoValido(escrito)).toBe(false);
    },
  );
});
