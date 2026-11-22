import { describe, expect, it } from 'vitest';
import { DemasiadosIntentos } from '../../src/compartido/errores';
import { LimitadorPorIp } from '../../src/compartido/seguridad/LimitadorPorIp';
import { origenDeRed } from '../../src/compartido/seguridad/origenDeRed';

describe('origenDeRed', () => {
  it('una IPv4 es un equipo', () => {
    expect(origenDeRed('203.0.113.7')).toEqual({ equipo: '203.0.113.7' });
  });

  it.each([
    '2001:db8:1:2::1',
    '2001:0DB8:0001:0002:ffff:ffff:ffff:ffff',
    '2001:db8:1:2:0:0:0:9%eth0',
    '2001:db8:1:2::192.0.2.1',
  ])('%s cae en su /64 y su /48, se escriba como se escriba', (ip) => {
    expect(origenDeRed(ip)).toEqual({ equipo: '2001:db8:1:2::/64', red: '2001:db8:1::/48' });
  });

  it('completa los ceros que "::" abrevia', () => {
    expect(origenDeRed('2001:db8::1')).toEqual({ equipo: '2001:db8:0:0::/64', red: '2001:db8:0::/48' });
    expect(origenDeRed('::1')).toEqual({ equipo: '0:0:0:0::/64', red: '0:0:0::/48' });
    expect(origenDeRed('2001:db8:1:2::')).toEqual({ equipo: '2001:db8:1:2::/64', red: '2001:db8:1::/48' });
  });

  it.each(['::ffff:203.0.113.7', '::FFFF:cb00:7107', '0:0:0:0:0:ffff:203.0.113.7'])(
    '%s es la misma IPv4 203.0.113.7',
    (ip) => {
      expect(origenDeRed(ip)).toEqual({ equipo: '203.0.113.7' });
    },
  );

  it.each(['', 'desconocida', '203.0.113.7:5050', '2001:db8:::1'])('"%s" no estrena un cupo propio', (ip) => {
    expect(origenDeRed(ip)).toEqual({ equipo: 'desconocido' });
  });
});

describe('LimitadorPorIp', () => {
  const crear = () => new LimitadorPorIp({ intentos: 2, ventanaMs: 60_000 });

  it('cambiar de direccion dentro del mismo /64 no da intentos nuevos', () => {
    const limitador = crear();
    limitador.consumir('2001:db8:1:2::1');
    limitador.consumir('2001:db8:1:2::2');

    expect(() => limitador.consumir('2001:db8:1:2::3')).toThrow(DemasiadosIntentos);
  });

  it('rotar de /64 dentro del mismo /48 tiene un tope de cinco equipos', () => {
    const limitador = crear();
    for (let n = 0; n < 10; n++) limitador.consumir(`2001:db8:1:${n}::1`);

    expect(() => limitador.consumir('2001:db8:1:99::1')).toThrow(DemasiadosIntentos);
    expect(() => limitador.consumir('2001:db8:2::1')).not.toThrow();
  });

  it('un equipo bloqueado no gasta el cupo de su red', () => {
    const limitador = crear();
    for (let n = 0; n < 30; n++) {
      try {
        limitador.consumir('2001:db8:1:2::1');
      } catch {
        // bloqueado, como se espera
      }
    }

    expect(() => limitador.consumir('2001:db8:1:3::1')).not.toThrow();
  });

  it('cada sujeto (usuario) lleva su propia cuenta', () => {
    const limitador = crear();
    limitador.consumir('203.0.113.7', 'ana');
    limitador.consumir('203.0.113.7', 'ana');

    expect(() => limitador.consumir('203.0.113.7', 'ana')).toThrow(DemasiadosIntentos);
    expect(() => limitador.consumir('203.0.113.7', 'delmy')).not.toThrow();
  });

  it('devolver deshace el intento en el equipo y en la red', () => {
    const limitador = crear();
    for (let n = 0; n < 30; n++) {
      const ip = `2001:db8:1:${n}::1`;
      limitador.consumir(ip);
      limitador.devolver(ip);
    }

    expect(() => limitador.consumir('2001:db8:1:99::1')).not.toThrow();
  });
});
