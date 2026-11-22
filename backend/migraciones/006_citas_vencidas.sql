-- N5: una cita que nadie confirmo a tiempo queda "vencida" y libera su hora.
-- No se usa "cancelada" para no contarle una cancelacion a la clienta.
-- citas_sin_cruce no cambia: solo mira los estados que ocupan la hora.

ALTER TABLE citas DROP CONSTRAINT citas_estado_check;

ALTER TABLE citas
  ADD CONSTRAINT citas_estado_check
  CHECK (estado IN ('pendiente', 'confirmada', 'atendida', 'cancelada', 'vencida'));
