-- N4: cada cita recuerda el nombre que escribieron al agendarla. Agendar no
-- comprueba de quien es el telefono, asi que ese nombre puede no ser el de la
-- ficha y la duena necesita ver los dos. Las citas viejas toman el de la ficha.

ALTER TABLE citas ADD COLUMN nombre_escrito VARCHAR(120);

UPDATE citas SET nombre_escrito = clientes.nombre
FROM clientes
WHERE clientes.id = citas.cliente_id;

ALTER TABLE citas ALTER COLUMN nombre_escrito SET NOT NULL;
