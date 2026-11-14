type ValorSQL = string | number | null;

interface ClienteRow {
  id: number;
  nombre: string;
  telefono: string;
  correo: string | null;
  creado_en: Date | string;
}

interface ResultadoConsulta {
  rows: ClienteRow[];
  rowCount: number | null;
}

export interface BaseDeDatosClientes {
  query(sql: string, valores?: ValorSQL[]): Promise<ResultadoConsulta>;
}

export interface DatosCliente {
  nombre: string;
  telefono: string;
  correo?: string | null;
}

export class Cliente {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly telefono: string,
    public readonly correo: string | null,
    public readonly creadoEn: Date,
  ) {}
}

function validarDatos(datos: DatosCliente): DatosCliente {
  const nombre = datos.nombre.trim();
  const telefono = datos.telefono.trim();
  const correo = datos.correo?.trim() || null;

  if (!nombre) {
    throw new Error('El nombre de la clienta es obligatorio.');
  }
  if (!telefono) {
    throw new Error('El teléfono de la clienta es obligatorio.');
  }
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw new Error('El correo electrónico no es válido.');
  }

  return { nombre, telefono, correo };
}

function convertirCliente(row: ClienteRow): Cliente {
  return new Cliente(
    row.id,
    row.nombre,
    row.telefono,
    row.correo,
    row.creado_en instanceof Date ? row.creado_en : new Date(row.creado_en),
  );
}

export class RepositorioClientes {
  constructor(private readonly baseDeDatos: BaseDeDatosClientes) {}

  async crearTabla(): Promise<void> {
    await this.baseDeDatos.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL,
        telefono VARCHAR(30) NOT NULL,
        correo VARCHAR(254),
        creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  async crear(datos: DatosCliente): Promise<Cliente> {
    const cliente = validarDatos(datos);
    const resultado = await this.baseDeDatos.query(
      `INSERT INTO clientes (nombre, telefono, correo)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, telefono, correo, creado_en`,
      [cliente.nombre, cliente.telefono, cliente.correo ?? null],
    );

    const fila = resultado.rows[0];
    if (!fila) {
      throw new Error('No se pudo crear la clienta en la base de datos.');
    }
    return convertirCliente(fila);
  }

  async obtenerPorId(id: number): Promise<Cliente | null> {
    this.validarId(id);
    const resultado = await this.baseDeDatos.query(
      `SELECT id, nombre, telefono, correo, creado_en
       FROM clientes
       WHERE id = $1`,
      [id],
    );
    const fila = resultado.rows[0];
    return fila ? convertirCliente(fila) : null;
  }

  async listar(): Promise<Cliente[]> {
    const resultado = await this.baseDeDatos.query(
      `SELECT id, nombre, telefono, correo, creado_en
       FROM clientes
       ORDER BY nombre ASC, id ASC`,
    );
    return resultado.rows.map(convertirCliente);
  }

  async buscarPorTelefono(telefono: string): Promise<Cliente | null> {
    const telefonoNormalizado = telefono.trim();
    if (!telefonoNormalizado) {
      throw new Error('El teléfono de la clienta es obligatorio.');
    }

    const resultado = await this.baseDeDatos.query(
      `SELECT id, nombre, telefono, correo, creado_en
       FROM clientes
       WHERE telefono = $1`,
      [telefonoNormalizado],
    );
    const fila = resultado.rows[0];
    return fila ? convertirCliente(fila) : null;
  }

  async actualizar(id: number, datos: DatosCliente): Promise<Cliente | null> {
    this.validarId(id);
    const cliente = validarDatos(datos);
    const resultado = await this.baseDeDatos.query(
      `UPDATE clientes
       SET nombre = $1, telefono = $2, correo = $3
       WHERE id = $4
       RETURNING id, nombre, telefono, correo, creado_en`,
      [cliente.nombre, cliente.telefono, cliente.correo ?? null, id],
    );
    const fila = resultado.rows[0];
    return fila ? convertirCliente(fila) : null;
  }

  async eliminar(id: number): Promise<boolean> {
    this.validarId(id);
    const resultado = await this.baseDeDatos.query(
      'DELETE FROM clientes WHERE id = $1',
      [id],
    );
    return resultado.rowCount !== null && resultado.rowCount > 0;
  }

  private validarId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('El identificador de la clienta debe ser un entero positivo.');
    }
  }
}
