import { describe, expect, it, vi } from 'vitest';
import { DemasiadosIntentos, NoAutorizado } from '../../src/compartido/errores';
import { LimitadorDeIntentos } from '../../src/compartido/seguridad/LimitadorDeIntentos';
import { LimitadorPorIp } from '../../src/compartido/seguridad/LimitadorPorIp';
import { cifrarContrasena, verificarContrasena } from '../../src/duena/autenticacion/contrasenas';
import { IniciarSesion } from '../../src/duena/autenticacion/IniciarSesion';
import type { Usuaria } from '../../src/duena/autenticacion/repositorioUsuarias';
import { EmisorDeTokens } from '../../src/duena/autenticacion/tokens';
import { CerrarSesion, VerificarSesion } from '../../src/duena/autenticacion/VerificarSesion';

const SECRETO = 'una-clave-secreta-de-pruebas-de-32-caracteres';
const UNA_HORA = 60 * 60 * 1000;
const IP = '203.0.113.7';

describe('contrasenas', () => {
  it('verifica la contrasena correcta y rechaza la incorrecta', async () => {
    const hash = await cifrarContrasena('contrasena-segura');

    expect(hash).not.toContain('contrasena-segura');
    await expect(verificarContrasena('contrasena-segura', hash)).resolves.toBe(true);
    await expect(verificarContrasena('otra-cosa', hash)).resolves.toBe(false);
  });

  it('genera hashes distintos para la misma contrasena', async () => {
    expect(await cifrarContrasena('igual')).not.toBe(await cifrarContrasena('igual'));
  });

  it('rechaza un hash con formato desconocido', async () => {
    await expect(verificarContrasena('x', 'md5$abc')).resolves.toBe(false);
  });
});

describe('EmisorDeTokens', () => {
  it('verifica un token que el mismo emitio', () => {
    const tokens = new EmisorDeTokens(SECRETO, UNA_HORA);
    const { token } = tokens.emitir(1, 'Delmy', 0);

    expect(tokens.verificar(token)).toMatchObject({ usuariaId: 1, nombre: 'Delmy', version: 0 });
  });

  it('rechaza un token vencido', () => {
    let ahora = 0;
    const tokens = new EmisorDeTokens(SECRETO, UNA_HORA, () => ahora);
    const { token } = tokens.emitir(1, 'Delmy', 0);

    ahora = UNA_HORA;
    expect(() => tokens.verificar(token)).toThrow(NoAutorizado);
  });

  it('rechaza un token con el contenido alterado', () => {
    const tokens = new EmisorDeTokens(SECRETO, UNA_HORA);
    const [, firma] = tokens.emitir(1, 'Delmy', 0).token.split('.');
    const contenidoFalso = Buffer.from(
      JSON.stringify({ usuariaId: 1, nombre: 'Delmy', version: 0, expiraEn: Date.now() + 1e10 }),
    ).toString('base64url');

    expect(() => tokens.verificar(`${contenidoFalso}.${firma}`)).toThrow(NoAutorizado);
  });

  it('rechaza un token firmado con otra clave', () => {
    const { token } = new EmisorDeTokens(`${SECRETO}-otra`, UNA_HORA).emitir(1, 'Delmy', 0);

    expect(() => new EmisorDeTokens(SECRETO, UNA_HORA).verificar(token)).toThrow(NoAutorizado);
  });

  it('rechaza basura', () => {
    expect(() => new EmisorDeTokens(SECRETO, UNA_HORA).verificar('no-es-un-token')).toThrow(NoAutorizado);
  });
});

describe('IniciarSesion', () => {
  async function crearCaso() {
    const delmy: Usuaria = {
      id: 1,
      usuario: 'delmy',
      nombre: 'Delmy',
      hashContrasena: await cifrarContrasena('contrasena-segura'),
      versionSesion: 4,
    };
    const tokens = new EmisorDeTokens(SECRETO, UNA_HORA);
    const caso = new IniciarSesion({
      usuarias: { buscarPorUsuario: async (usuario) => (usuario === 'delmy' ? delmy : null) },
      tokens,
      limites: {
        porUsuario: new LimitadorPorIp({ intentos: 3, ventanaMs: UNA_HORA }),
        porIp: new LimitadorPorIp({ intentos: 5, ventanaMs: UNA_HORA }),
      },
    });
    return { caso, tokens };
  }

  it('devuelve un token con la version de sesion actual de la usuaria', async () => {
    const { caso, tokens } = await crearCaso();

    const sesion = await caso.ejecutar({ usuario: 'delmy', contrasena: 'contrasena-segura' }, IP);

    expect(sesion.nombre).toBe('Delmy');
    expect(tokens.verificar(sesion.token).version).toBe(4);
  });

  it('da el mismo mensaje si falla el usuario o la contrasena', async () => {
    const { caso } = await crearCaso();

    await expect(caso.ejecutar({ usuario: 'delmy', contrasena: 'equivocada' }, IP)).rejects.toThrow(
      'Usuario o contrasena incorrectos.',
    );
    await expect(caso.ejecutar({ usuario: 'nadie', contrasena: 'x' }, IP)).rejects.toThrow(
      'Usuario o contrasena incorrectos.',
    );
  });

  it('bloquea tras varios fallos, incluso si despues acierta la contrasena', async () => {
    const { caso } = await crearCaso();
    for (let intento = 0; intento < 3; intento++) {
      await expect(caso.ejecutar({ usuario: 'delmy', contrasena: 'mal' }, IP)).rejects.toBeInstanceOf(NoAutorizado);
    }

    await expect(caso.ejecutar({ usuario: 'delmy', contrasena: 'contrasena-segura' }, IP)).rejects.toBeInstanceOf(
      DemasiadosIntentos,
    );
  });

  it('el bloqueo de una IP no afecta a la duena desde otra IP', async () => {
    const { caso } = await crearCaso();
    for (let intento = 0; intento < 3; intento++) {
      await expect(caso.ejecutar({ usuario: 'delmy', contrasena: 'mal' }, IP)).rejects.toBeInstanceOf(NoAutorizado);
    }

    await expect(caso.ejecutar({ usuario: 'delmy', contrasena: 'contrasena-segura' }, '198.51.100.1')).resolves
      .toBeDefined();
  });

  it('bloquea una IP que prueba muchas cuentas distintas', async () => {
    const { caso } = await crearCaso();
    for (let intento = 0; intento < 5; intento++) {
      await expect(caso.ejecutar({ usuario: `cuenta${intento}`, contrasena: 'x' }, IP)).rejects.toBeInstanceOf(
        NoAutorizado,
      );
    }

    await expect(caso.ejecutar({ usuario: 'delmy', contrasena: 'contrasena-segura' }, IP)).rejects.toBeInstanceOf(
      DemasiadosIntentos,
    );
  });

  it('el limite por usuario aguanta intentos simultaneos', async () => {
    const { caso } = await crearCaso();

    const resultados = await Promise.allSettled(
      Array.from({ length: 30 }, () => caso.ejecutar({ usuario: 'delmy', contrasena: 'mal' }, IP)),
    );

    expect(rechazadosCon(resultados, NoAutorizado)).toBe(3); // solo estos llegaron a probar la contrasena
    expect(rechazadosCon(resultados, DemasiadosIntentos)).toBe(27);
  });

  it('el limite por IP aguanta intentos simultaneos con cuentas distintas', async () => {
    const { caso } = await crearCaso();

    const resultados = await Promise.allSettled(
      Array.from({ length: 30 }, (_, i) => caso.ejecutar({ usuario: `cuenta${i}`, contrasena: 'x' }, IP)),
    );

    expect(rechazadosCon(resultados, NoAutorizado)).toBe(5);
    expect(rechazadosCon(resultados, DemasiadosIntentos)).toBe(25);
  });

  it('la contrasena correcta en medio de una rafaga ya bloqueada no entra', async () => {
    const { caso } = await crearCaso();
    const contrasenas = ['mal', 'mal', 'mal', 'contrasena-segura'];

    const resultados = await Promise.allSettled(
      contrasenas.map((contrasena) => caso.ejecutar({ usuario: 'delmy', contrasena }, IP)),
    );

    expect(resultados[3]).toMatchObject({ status: 'rejected', reason: expect.any(DemasiadosIntentos) });
  });

  it('los logins correctos no gastan el limite de la IP', async () => {
    const { caso } = await crearCaso();

    for (let vez = 0; vez < 7; vez++) {
      await expect(caso.ejecutar({ usuario: 'delmy', contrasena: 'contrasena-segura' }, IP)).resolves.toBeDefined();
    }
  });

  it('un login correcto no borra los fallos anteriores de la IP', async () => {
    const { caso } = await crearCaso();
    const fallar = (usuario: string) => caso.ejecutar({ usuario, contrasena: 'x' }, IP);
    for (const usuario of ['a', 'b', 'c', 'd']) await expect(fallar(usuario)).rejects.toBeInstanceOf(NoAutorizado);

    await caso.ejecutar({ usuario: 'delmy', contrasena: 'contrasena-segura' }, IP);

    await expect(fallar('e')).rejects.toBeInstanceOf(NoAutorizado);
    await expect(fallar('f')).rejects.toBeInstanceOf(DemasiadosIntentos);
  });

  it('cambiar de IPv6 dentro de la misma red no evade el limite', async () => {
    const { caso } = await crearCaso();

    const resultados = await Promise.allSettled(
      Array.from({ length: 30 }, (_, i) =>
        caso.ejecutar({ usuario: 'delmy', contrasena: 'mal' }, `2001:db8:0:1::${(i + 1).toString(16)}`),
      ),
    );

    expect(rechazadosCon(resultados, NoAutorizado)).toBe(3);
    expect(rechazadosCon(resultados, DemasiadosIntentos)).toBe(27);
  });

  it('una caida de la base de datos no bloquea a la duena', async () => {
    const buscarPorUsuario = vi.fn(async (): Promise<Usuaria | null> => {
      throw new Error('base caida');
    });
    const caso = new IniciarSesion({
      usuarias: { buscarPorUsuario },
      tokens: new EmisorDeTokens(SECRETO, UNA_HORA),
      limites: {
        porUsuario: new LimitadorPorIp({ intentos: 2, ventanaMs: UNA_HORA }),
        porIp: new LimitadorPorIp({ intentos: 2, ventanaMs: UNA_HORA }),
      },
    });

    for (let vez = 0; vez < 4; vez++) {
      await expect(caso.ejecutar({ usuario: 'delmy', contrasena: 'x' }, IP)).rejects.toThrow('base caida');
    }
  });
});

function rechazadosCon(resultados: PromiseSettledResult<unknown>[], tipo: new (...args: never[]) => Error): number {
  return resultados.filter((r) => r.status === 'rejected' && r.reason instanceof tipo).length;
}

describe('VerificarSesion y CerrarSesion', () => {
  function crearEscenario() {
    let versionGuardada = 0;
    const versiones = {
      versionDeSesion: vi.fn(async () => versionGuardada),
      revocarSesiones: vi.fn(async () => {
        versionGuardada++;
      }),
    };
    const tokens = new EmisorDeTokens(SECRETO, UNA_HORA);
    return { tokens, verificar: new VerificarSesion(tokens, versiones), cerrar: new CerrarSesion(versiones) };
  }

  it('acepta un token vigente cuya version coincide', async () => {
    const { tokens, verificar } = crearEscenario();

    await expect(verificar.ejecutar(tokens.emitir(1, 'Delmy', 0).token)).resolves.toMatchObject({ usuariaId: 1 });
  });

  it('al cerrar sesion, el token deja de servir aunque no haya vencido', async () => {
    const { tokens, verificar, cerrar } = crearEscenario();
    const { token } = tokens.emitir(1, 'Delmy', 0);

    await cerrar.ejecutar(await verificar.ejecutar(token));

    await expect(verificar.ejecutar(token)).rejects.toBeInstanceOf(NoAutorizado);
  });
});

describe('LimitadorDeIntentos', () => {
  it('libera la clave cuando los intentos viejos salen de la ventana', () => {
    let ahora = 0;
    const limitador = new LimitadorDeIntentos({ intentos: 2, ventanaMs: 1000 }, () => ahora);
    limitador.consumir('ip');
    limitador.consumir('ip');

    expect(() => limitador.consumir('ip')).toThrow(DemasiadosIntentos);

    ahora = 1001;
    expect(() => limitador.consumir('ip')).not.toThrow();
  });

  it('si bajan el tope, dice cuanto falta de verdad para poder reintentar', () => {
    let ahora = 0;
    const limitador = new LimitadorDeIntentos({ intentos: 5, ventanaMs: 10_000 }, () => ahora);
    for (ahora = 0; ahora < 3000; ahora += 1000) limitador.registrar('ip');

    try {
      limitador.exigirDisponible('ip', 1);
      expect.fail('deberia haber fallado');
    } catch (error) {
      expect((error as DemasiadosIntentos).segundosParaReintentar).toBe(9); // hasta que salga el ultimo
    }
  });

  it('indica cuantos segundos esperar', () => {
    const limitador = new LimitadorDeIntentos({ intentos: 1, ventanaMs: 30_000 }, () => 0);
    limitador.consumir('ip');

    try {
      limitador.consumir('ip');
      expect.fail('deberia haber fallado');
    } catch (error) {
      expect((error as DemasiadosIntentos).segundosParaReintentar).toBe(30);
    }
  });
});
