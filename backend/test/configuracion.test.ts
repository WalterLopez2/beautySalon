import { describe, expect, it } from 'vitest';
import { leerConfiguracion, leerConfiguracionDeBaseDeDatos } from '../src/configuracion';

const ENTORNO_MINIMO = { DB_NAME: 'beautysalon', DB_USER: 'salon' };

function sslCon(valor: string | undefined) {
  return leerConfiguracionDeBaseDeDatos({ ...ENTORNO_MINIMO, DB_SSL: valor }).ssl;
}

describe('SSL de la base de datos', () => {
  it('va apagado si DB_SSL no esta definida (base local)', () => {
    expect(sslCon(undefined)).toBe(false);
  });

  it('cifra la conexion y verifica el certificado con DB_SSL=true', () => {
    expect(sslCon('true')).toEqual({ rejectUnauthorized: true });
  });

  it('acepta mayusculas y espacios alrededor del valor', () => {
    expect(sslCon(' TRUE ')).toEqual({ rejectUnauthorized: true });
  });

  it('se apaga con DB_SSL=false', () => {
    expect(sslCon('false')).toBe(false);
  });

  it('no arranca si el valor tiene un error de tipeo', () => {
    expect(() => sslCon('ture')).toThrow('DB_SSL debe ser true o false');
  });
});

describe('SOLO_HTTPS', () => {
  function configuracionCon(variables: Record<string, string>) {
    return leerConfiguracion({ ...ENTORNO_MINIMO, TOKEN_SECRETO: 's'.repeat(32), ...variables });
  }

  it('va apagado si no esta definido (tu computadora)', () => {
    expect(configuracionCon({}).soloHttps).toBe(false);
  });

  it('acepta true detras de un proxy', () => {
    expect(configuracionCon({ SOLO_HTTPS: ' TRUE ', PROXIES_DE_CONFIANZA: '1' }).soloHttps).toBe(true);
  });

  it('no arranca si el valor tiene un error de tipeo', () => {
    expect(() => configuracionCon({ SOLO_HTTPS: 'ture' })).toThrow('SOLO_HTTPS debe ser true o false');
  });

  it('no arranca sin proxy de confianza: rechazaria todas las peticiones', () => {
    expect(() => configuracionCon({ SOLO_HTTPS: 'true' })).toThrow('PROXIES_DE_CONFIANZA');
  });
});
