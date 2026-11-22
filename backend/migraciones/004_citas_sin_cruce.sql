-- La base no acepta dos citas que se pisen, aunque el codigo tenga un error.
-- int4range(600, 660) es de 10:00 a 11:00 sin incluir las 11:00: una cita
-- pegada a otra si se permite. Solo cuentan los estados que ocupan la hora.
--
-- btree_gist viene con PostgreSQL y la puede activar la duena de la base.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE citas
  ADD CONSTRAINT citas_sin_cruce EXCLUDE USING gist (
    fecha WITH =,
    int4range(inicio_min, inicio_min + duracion_min) WITH &&
  ) WHERE (estado IN ('pendiente', 'confirmada', 'atendida'));
