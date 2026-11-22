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

describe('Produccion', () => {
  const ENTORNO = { ...ENTORNO_MINIMO, TOKEN_SECRETO: 's'.repeat(32) };
  const HTTPS_COMPLETO = { SOLO_HTTPS: 'true', PROXIES_DE_CONFIANZA: '1' };

  it.each(['production', ' Production '])('con NODE_ENV="%s" no arranca sin HTTPS', (NODE_ENV) => {
    expect(() => leerConfiguracion({ ...ENTORNO, NODE_ENV })).toThrow('En produccion SOLO_HTTPS');
  });

  it('con `pnpm start` no arranca sin HTTPS, aunque falte NODE_ENV', () => {
    expect(() => leerConfiguracion(ENTORNO, { iniciadaParaProduccion: true })).toThrow('En produccion SOLO_HTTPS');
  });

  it('apagar SOLO_HTTPS a proposito tampoco sirve en produccion', () => {
    const entorno = { ...ENTORNO, NODE_ENV: 'production', SOLO_HTTPS: 'false' };

    expect(() => leerConfiguracion(entorno)).toThrow('En produccion SOLO_HTTPS');
  });

  it('arranca en produccion con HTTPS configurado', () => {
    const configuracion = leerConfiguracion({ ...ENTORNO, ...HTTPS_COMPLETO }, { iniciadaParaProduccion: true });

    expect(configuracion.soloHttps).toBe(true);
  });

  it('en desarrollo sigue arrancando sin HTTPS', () => {
    expect(leerConfiguracion({ ...ENTORNO, NODE_ENV: 'development' }).soloHttps).toBe(false);
  });
});

describe('Direccion donde escucha la API', () => {
  function direccionCon(DIRECCION_DE_ESCUCHA?: string) {
    return leerConfiguracion({ ...ENTORNO_MINIMO, TOKEN_SECRETO: 's'.repeat(32), DIRECCION_DE_ESCUCHA }).direccion;
  }

  it('por defecto solo esta computadora', () => {
    expect(direccionCon()).toBe('127.0.0.1');
    expect(direccionCon('  ')).toBe('127.0.0.1');
  });

  it.each(['0.0.0.0', '::', '10.0.0.5'])('se puede abrir a proposito en %s', (direccion) => {
    expect(direccionCon(direccion)).toBe(direccion);
  });

  it.each(['localhost', '999.1.1.1', '0.0.0.0:3000'])('no arranca con "%s"', (direccion) => {
    expect(() => direccionCon(direccion)).toThrow('DIRECCION_DE_ESCUCHA debe ser una direccion IP');
  });
});

describe('Tiempos maximos con la base de datos', () => {
  it('no espera para siempre ni al conectar ni al consultar', () => {
    const { connectionTimeoutMillis, query_timeout } = leerConfiguracionDeBaseDeDatos(ENTORNO_MINIMO);

    expect(connectionTimeoutMillis).toBe(5_000);
    expect(query_timeout).toBe(10_000);
  });
});
