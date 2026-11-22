import { describe, expect, it, vi } from 'vitest';
import type { Consultor } from '../../src/compartido/baseDeDatos/baseDeDatos';
import { RepositorioCitas, type NuevaCita } from '../../src/compartido/citas/repositorioCitas';
import { Conflicto } from '../../src/compartido/errores';

// Agendar no comprueba de quien es el telefono, asi que un codigo solo puede
// dar acceso a la cita con la que se entrego, nunca a las demas de ese telefono.
// Estas pruebas no usan PostgreSQL: revisan la condicion que se le manda.
describe('RepositorioCitas: consulta publica con telefono y codigo', () => {
  async function consultaEnviada() {
    const query = vi.fn(async (_sql: string, _valores?: unknown[]) => ({ rows: [], rowCount: 0 }));
    await new RepositorioCitas({ query } as Consultor).listarPorTelefonoYCodigo('99990000', 'hash-del-codigo');

    const [sql, valores] = query.mock.calls[0];
    return { condicion: sql.replace(/\s+/g, ' ').split(' WHERE ').slice(1).join(' WHERE '), valores };
  }

  it('el codigo tiene que ser el de la misma cita que se devuelve', async () => {
    const { condicion } = await consultaEnviada();

    expect(condicion).toMatch(/^cl\.telefono = \$1 AND c\.codigo_hash = \$2 ORDER BY/);
  });

  it('el telefono y el hash viajan como parametros, no dentro del SQL', async () => {
    const { condicion, valores } = await consultaEnviada();

    expect(valores).toEqual(['99990000', 'hash-del-codigo']);
    expect(condicion).not.toContain('99990000');
  });
});

describe('RepositorioCitas: la base rechaza un cruce', () => {
  function repositorioQueFallaCon(code: string) {
    const query = vi.fn(async () => {
      throw Object.assign(new Error('rechazado por PostgreSQL'), { code });
    });
    return new RepositorioCitas({ query } as unknown as Consultor);
  }
  const nueva = { fecha: '2026-12-01', inicioMin: 600, duracionMin: 60 } as NuevaCita;

  it('lo explica como hora ocupada (409), no como error del servidor', async () => {
    await expect(repositorioQueFallaCon('23P01').crear(nueva)).rejects.toBeInstanceOf(Conflicto);
  });

  it('otros errores de la base no se disfrazan', async () => {
    await expect(repositorioQueFallaCon('42P01').crear(nueva)).rejects.toThrow('rechazado por PostgreSQL');
  });
});
