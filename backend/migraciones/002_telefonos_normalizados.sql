-- C4: los telefonos se guardan solo como 8 digitos, sin +504.
-- Si alguno no se puede convertir, la migracion falla y no cambia nada: hay
-- que corregirlo a mano, no adivinarlo.

UPDATE clientes
SET telefono = regexp_replace(regexp_replace(telefono, '\D', '', 'g'), '^504([0-9]{8})$', '\1');

ALTER TABLE clientes
  ADD CONSTRAINT clientes_telefono_formato CHECK (telefono ~ '^[0-9]{8}$');
