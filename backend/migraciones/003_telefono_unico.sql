-- C7: una sola ficha por telefono.
-- Si ya hay repetidos se detiene sin borrar nada: juntar fichas es una
-- decision de una persona, no de una migracion.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM clientes GROUP BY telefono HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Hay clientas con el telefono repetido. Hay que unir sus fichas antes de migrar.';
  END IF;
END
$$;

ALTER TABLE clientes
  ADD CONSTRAINT clientes_telefono_unico UNIQUE (telefono);
