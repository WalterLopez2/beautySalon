import { describe, expect, it } from 'vitest';
import { prepararInformacion, type InformacionDelSalon } from '../../src/compartido/dominio/informacionDelSalon';
import { DatosInvalidos } from '../../src/compartido/errores';

const informacion: InformacionDelSalon = {
  nombre: 'Salon de prueba',
  marca: null,
  eslogan: null,
  descripcion: null,
  telefono: '+504 9999-0000',
};

describe('informacion del salon', () => {
  it('guarda el WhatsApp en el mismo formato que el resto de telefonos', () => {
    expect(prepararInformacion(informacion).telefono).toBe('99990000');
  });

  it('el telefono es opcional', () => {
    expect(prepararInformacion({ ...informacion, telefono: null }).telefono).toBeNull();
  });

  it('rechaza un telefono invalido', () => {
    expect(() => prepararInformacion({ ...informacion, telefono: '123' })).toThrow(DatosInvalidos);
  });
});
