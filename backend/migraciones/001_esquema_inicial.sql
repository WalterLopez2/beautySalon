-- Las tablas del sistema, tal como eran antes de usar migraciones.
--
-- IF NOT EXISTS solo va en esta: asi una base que ya existia la adopta sin
-- perder nada. Las siguientes migraciones no lo necesitan.

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  correo VARCHAR(254),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS servicios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE,
  descripcion TEXT,
  precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
  duracion_min INTEGER NOT NULL CHECK (duracion_min > 0),
  categoria VARCHAR(60),
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- El orden importa: citas apunta a clientes y servicios.
CREATE TABLE IF NOT EXISTS citas (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes (id),
  servicio_id INTEGER NOT NULL REFERENCES servicios (id),
  fecha DATE NOT NULL,
  inicio_min INTEGER NOT NULL CHECK (inicio_min BETWEEN 0 AND 1439),
  duracion_min INTEGER NOT NULL CHECK (duracion_min > 0),
  precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
  estado VARCHAR(12) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'confirmada', 'atendida', 'cancelada')),
  codigo_hash CHAR(64) NOT NULL,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS citas_fecha_idx ON citas (fecha);
CREATE INDEX IF NOT EXISTS citas_cliente_idx ON citas (cliente_id);

-- Una sola fila: la llave siempre es TRUE.
CREATE TABLE IF NOT EXISTS configuracion_salon (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  zona_horaria VARCHAR(64) NOT NULL,
  intervalo_min INTEGER NOT NULL CHECK (intervalo_min BETWEEN 5 AND 240),
  max_citas_pendientes INTEGER NOT NULL CHECK (max_citas_pendientes BETWEEN 1 AND 50)
);

CREATE TABLE IF NOT EXISTS horario_semanal (
  dia_semana SMALLINT PRIMARY KEY CHECK (dia_semana BETWEEN 1 AND 7),
  apertura_min INTEGER NOT NULL CHECK (apertura_min BETWEEN 0 AND 1439),
  cierre_min INTEGER NOT NULL CHECK (cierre_min BETWEEN 1 AND 1440),
  CHECK (apertura_min < cierre_min)
);

CREATE TABLE IF NOT EXISTS bloqueos (
  id SERIAL PRIMARY KEY,
  desde DATE NOT NULL,
  hasta DATE NOT NULL,
  inicio_min INTEGER CHECK (inicio_min BETWEEN 0 AND 1439),
  fin_min INTEGER CHECK (fin_min BETWEEN 1 AND 1440),
  motivo VARCHAR(200),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (desde <= hasta),
  CHECK (
    (inicio_min IS NULL AND fin_min IS NULL) OR
    (inicio_min IS NOT NULL AND fin_min IS NOT NULL AND inicio_min < fin_min)
  )
);
CREATE INDEX IF NOT EXISTS bloqueos_rango_idx ON bloqueos (desde, hasta);

CREATE TABLE IF NOT EXISTS usuarias (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(60) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  hash_contrasena TEXT NOT NULL,
  version_sesion INTEGER NOT NULL DEFAULT 0,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
