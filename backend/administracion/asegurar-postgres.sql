-- Asegura el servidor de PostgreSQL y la base `beautysalon`.
--
-- No es una migracion: lo corre UNA vez quien administra PostgreSQL (usuario
-- postgres), porque la cuenta de la app no tiene, ni debe tener, ese permiso.
-- No borra ni cambia datos. Desde la carpeta del proyecto, en PowerShell:
--
--   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d postgres -v ON_ERROR_STOP=1 -f backend/administracion/asegurar-postgres.sql
--
-- La primera linea necesita reiniciar el servicio. En PowerShell como administrador:
--
--   Restart-Service postgresql-x64-18
--
-- Si tu base tiene otro nombre, cambia `beautysalon` abajo.

-- 1. PostgreSQL solo atiende a esta computadora, no a la red. Afecta a todo el
--    servidor: si la base va en otra maquina que la API, no corras esta linea.
ALTER SYSTEM SET listen_addresses = 'localhost';

-- 2. Otras cuentas del servidor no entran a esta base. Su duena (la app) sigue entrando.
REVOKE CONNECT ON DATABASE beautysalon FROM PUBLIC;

-- 3. Nada espera para siempre: ni una consulta, ni un candado, ni una transaccion abandonada.
ALTER DATABASE beautysalon SET statement_timeout = '10s';
ALTER DATABASE beautysalon SET lock_timeout = '5s';
ALTER DATABASE beautysalon SET idle_in_transaction_session_timeout = '15s';
