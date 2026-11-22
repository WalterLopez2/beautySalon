-- Nada del negocio queda fijo en el codigo: lo maneja la duena desde el panel.
--
-- Sin DEFAULT a proposito: un salon nuevo no hereda valores que nadie eligio.
-- El UPDATE solo aplica a un salon YA configurado, para que siga funcionando
-- con las reglas que tenia hasta hoy; la duena puede cambiarlas.

ALTER TABLE configuracion_salon
  ADD COLUMN dias_de_anticipacion INTEGER,
  ADD COLUMN horas_para_confirmar INTEGER,
  ADD COLUMN citas_por_conexion_al_dia INTEGER;

UPDATE configuracion_salon
SET dias_de_anticipacion = 60, horas_para_confirmar = 24, citas_por_conexion_al_dia = 5;

ALTER TABLE configuracion_salon
  ALTER COLUMN dias_de_anticipacion SET NOT NULL,
  ALTER COLUMN horas_para_confirmar SET NOT NULL,
  ALTER COLUMN citas_por_conexion_al_dia SET NOT NULL,
  ADD CONSTRAINT configuracion_salon_anticipacion_check CHECK (dias_de_anticipacion BETWEEN 1 AND 365),
  ADD CONSTRAINT configuracion_salon_confirmacion_check CHECK (horas_para_confirmar BETWEEN 1 AND 720),
  ADD CONSTRAINT configuracion_salon_conexion_check CHECK (citas_por_conexion_al_dia BETWEEN 1 AND 50);

-- Lo que la pagina publica muestra del salon. Una sola fila, como configuracion_salon.
CREATE TABLE informacion_salon (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  nombre VARCHAR(80) NOT NULL,
  marca VARCHAR(24),
  eslogan VARCHAR(120),
  descripcion VARCHAR(300),
  telefono VARCHAR(8) CHECK (telefono ~ '^[0-9]{8}$')
);
