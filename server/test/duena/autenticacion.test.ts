import { describe, expect, it } from 'vitest';
import { NoAutorizado } from '../../src/compartido/errores';
import { cifrarContrasena, verificarContrasena } from '../../src/duena/autenticacion/contrasenas';
import { IniciarSesion } from '../../src/duena/autenticacion/IniciarSesion';
import type { Usuaria } from '../../src/duena/autenticacion/repositorioUsuarias';
import { EmisorDeTokens } from '../../src/duena/autenticacion/tokens';

const SECRETO = 'una-clave-secreta-de-pruebas-de-32-caracteres';
const UNA_HORA = 60 * 60 * 1000;

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
    const { token } = tokens.emitir(1, 'Delmy');

    expect(tokens.verificar(token)).toMatchObject({ usuariaId: 1, nombre: 'Delmy' });
  });

  it('rechaza un token vencido', () => {
    let ahora = 0;
    const tokens = new EmisorDeTokens(SECRETO, UNA_HORA, () => ahora);
    const { token } = tokens.emitir(1, 'Delmy');

    ahora = UNA_HORA;
    expect(() => tokens.verificar(token)).toThrow(NoAutorizado);
  });

  it('rechaza un token con el contenido alterado', () => {
    const tokens = new EmisorDeTokens(SECRETO, UNA_HORA);
    const [, firma] = tokens.emitir(1, 'Delmy').token.split('.');
    const contenidoFalso = Buffer.from(
      JSON.stringify({ usuariaId: 1, nombre: 'Delmy', expiraEn: Date.now() + 1e10 }),
    ).toString('base64url');

    expect(() => tokens.verificar(`${contenidoFalso}.${firma}`)).toThrow(NoAutorizado);
  });

  it('rechaza un token firmado con otra clave', () => {
    const { token } = new EmisorDeTokens(`${SECRETO}-otra`, UNA_HORA).emitir(1, 'Delmy');

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
    };
    const usuarias = { buscarPorUsuario: async (usuario: string) => (usuario === 'delmy' ? delmy : null) };
    return new IniciarSesion(usuarias, new EmisorDeTokens(SECRETO, UNA_HORA));
  }

  it('devuelve token, nombre y vencimiento con credenciales correctas', async () => {
    const sesion = await (await crearCaso()).ejecutar({ usuario: 'delmy', contrasena: 'contrasena-segura' });

    expect(sesion.nombre).toBe('Delmy');
    expect(sesion.token).toContain('.');
    expect(new Date(sesion.expiraEn).getTime()).toBeGreaterThan(Date.now());
  });

  it('da el mismo mensaje si falla el usuario o la contrasena', async () => {
    const caso = await crearCaso();

    const malaContrasena = caso.ejecutar({ usuario: 'delmy', contrasena: 'equivocada' });
    const usuarioInexistente = caso.ejecutar({ usuario: 'nadie', contrasena: 'contrasena-segura' });

    await expect(malaContrasena).rejects.toThrow('Usuario o contrasena incorrectos.');
    await expect(usuarioInexistente).rejects.toThrow('Usuario o contrasena incorrectos.');
  });
});
