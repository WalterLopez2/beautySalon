# beautySalon 💇‍♀️

Sistema web de gestión de citas y clientas para un salón de belleza en Chamelecón, San Pedro Sula, Honduras.

**Código de verificación:** `LEARN-CAP-64CE7E9E`

## El problema

El salón llevaba todo (citas, clientas, cobros) en Excel y hojas sueltas. No había un orden único: las citas se cruzaban, era difícil saber cuánto se vendió en la semana y el negocio no tenía presencia pública para que nuevas clientas pudieran agendar.

## La solución

Una aplicación web con dos vistas:

1. **Vista de la clienta (pública)**: ve los servicios y precios, y agenda su cita eligiendo servicio, fecha y una hora disponible. Al agendar recibe un **código de consulta** para ver esa cita después.
2. **Vista de la dueña (`/panel`, con login)**: administra todo el salón: agenda, clientas, servicios, horario, días libres e ingresos.

## Funcionalidades

**Para la clienta**
- Catálogo de servicios con precios y duración
- Agenda en línea que solo ofrece horas realmente libres, con la anticipación que define la dueña
- Avisos de carga, error (con reintento) y salón cerrado, y página adaptada a celular
- "Mis citas" con teléfono + código de consulta (cada cita tiene su propio código)

**Para la dueña**
- Agenda del día: confirmar, cancelar y marcar citas como atendidas
- Estados de cita: pendiente → confirmada → atendida (o cancelada). Una pendiente que no se confirma en el plazo que define la dueña queda vencida y libera su hora
- Lista de solicitudes por confirmar de todos los días, con aviso de teléfono sin verificar
- Catálogo de servicios: crear, editar y pausar
- Mi salón: nombre, nombre corto, eslogan, descripción y WhatsApp de la página pública
- Horario semanal, intervalo entre turnos, zona horaria y reglas de reserva: máximo de citas por clienta, días de anticipación, horas para confirmar y citas por conexión al día
- Días libres y horas bloqueadas, con aviso de las citas afectadas
- Historial por clienta y resumen de ingresos por día y por semana

**El salón lo configura la dueña:** nombre, textos, contacto, horarios, servicios, precios y reglas de reserva salen del panel. En el código solo quedan las protecciones técnicas (intentos de login, tamaños máximos, tiempos de espera) y el país (lempiras y teléfonos de Honduras). Mientras no configure su horario, el salón aparece cerrado.

## Estado actual

| Parte | Estado |
|---|---|
| Backend (API, reglas, seguridad, base de datos) | ✅ Completo y probado |
| Frontend: lógica de las dos vistas (dominio, casos de uso, hooks) | ✅ Listo |
| Frontend: login de la dueña | ✅ Funciona, sin diseño todavía |
| Frontend: pantallas del panel y de la vista pública | 🚧 En construcción |

## Seguridad

- Contraseñas cifradas con scrypt y sesiones con tokens firmados (HMAC), guardados en una cookie `HttpOnly`, `SameSite=Strict`, solo para `/api/panel`. Las acciones del panel exigen además un encabezado propio contra CSRF.
- Cerrar sesión o cambiar la contraseña invalida todos los tokens anteriores.
- Límite de intentos de login y de citas por IP (responde 429), también con peticiones simultáneas.
- Con `SOLO_HTTPS=true`, la API rechaza lo que llegue por HTTP plano, menos `/api/salud`.
- Ver una cita requiere teléfono **y** código, y cada código muestra solo su cita; en la base solo se guarda el hash del código.
- Dos clientas no pueden tomar la misma hora: agendar es una transacción con el día bloqueado y, además, la base rechaza citas que se crucen.
- Un teléfono es una sola clienta (8 dígitos de Honduras, con o sin +504) y su máximo de citas se respeta también con peticiones simultáneas.
- Encabezados de seguridad en todas las respuestas y sin caché en el panel ni en las citas.
- La página compilada trae una `Content-Security-Policy` estricta: solo carga scripts, estilos e imágenes del propio sitio y solo habla con su API. Dificulta que un script inyectado se ejecute o mande datos a otro servidor, pero es una capa más, no una garantía. Se arma en `frontend/seguridad/politicaDeContenido.ts`.

## Tecnologías

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js + Express + TypeScript
- **Base de datos:** PostgreSQL 18
- **Pruebas:** Vitest
- **Gestor de paquetes:** pnpm (workspace con `frontend/` y `backend/`)
- **CI:** GitHub Actions

## Estructura del proyecto

Cada parte está separada en lo que es de la clienta, lo que es de la dueña y lo que comparten.

```
beautySalon/
├── frontend/              # Aplicación React
│   └── src/
│       ├── clienta/       # Vista pública
│       ├── duena/         # Panel de la dueña (/panel)
│       └── compartido/    # Dominio, HTTP, tipos y utilidades comunes
├── backend/               # API en Node.js
│   ├── administracion/    # SQL que corre quien administra PostgreSQL, una vez
│   ├── migraciones/       # Cambios de la base, numerados
│   ├── src/
│   │   ├── clienta/       # Rutas públicas y casos de uso de la clienta
│   │   ├── duena/         # Login, panel y configuración del salón
│   │   ├── compartido/    # Base de datos, reglas del negocio y seguridad
│   │   └── scripts/       # db:preparar y crear-duena
│   └── test/              # Pruebas automáticas
└── .github/workflows/ci.yml
```

## Cómo correrlo

Requisitos: Node.js 22 o superior, pnpm y PostgreSQL 18.

```bash
git clone https://github.com/WalterLopez2/beautySalon.git
cd beautySalon
pnpm install
```

### 1. Configurar el backend

Copiá `backend/.env.example` a `backend/.env` y completá tus datos de PostgreSQL y un `TOKEN_SECRETO` (mínimo 32 caracteres). Para generar uno:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

El archivo `.env` no se sube al repositorio. Nunca pongas datos reales en `backend/.env.example`: es una plantilla pública y el CI falla si alguna variable sensible (usuario, contraseña, secretos) trae un valor. Podés revisarlo antes de subir cambios con `pnpm verificar:secretos`.

Si alguna vez se sube un secreto real por error, hay que cambiarlo (contraseña de la base de datos, `TOKEN_SECRETO`): borrarlo del archivo no lo saca del historial de git.

### 2. Crear o actualizar las tablas

Con la base de datos y el usuario ya creados en PostgreSQL:

```bash
pnpm db:preparar
```

Aplica las migraciones que falten y no carga datos. Se puede correr las veces que haga falta, y **hay que correrlo cada vez que bajes cambios con archivos nuevos en `backend/migraciones/`**.

Una migración es un archivo SQL con un cambio de la base. Para crear una:

1. Creá `backend/migraciones/NNN_que_cambia.sql` con el número siguiente.
2. Corré `pnpm db:preparar`.

Nunca edites una que ya se aplicó: el comando se detiene y lo avisa. Si algo quedó mal, se corrige con una migración nueva.

Además, una sola vez y con el usuario `postgres`, conviene correr `backend/administracion/asegurar-postgres.sql` (el comando está dentro del archivo): cierra PostgreSQL a la red y le pone tiempos máximos.

### 3. Crear la cuenta de la dueña

La contraseña va en una variable de entorno, no como argumento, para que no quede en el historial de la terminal (mínimo 10 caracteres):

```bash
# Windows (CMD)
set DUENA_CONTRASENA=una-clave-segura
pnpm crear-duena delmy "Delmy"
set DUENA_CONTRASENA=

# macOS / Linux
DUENA_CONTRASENA="una-clave-segura" pnpm crear-duena delmy "Delmy"
```

Correrlo de nuevo con el mismo usuario cambia la contraseña y cierra todas las sesiones abiertas.

### 4. Levantar el proyecto

En dos terminales:

```bash
pnpm dev:backend    # API en http://localhost:3000/api
pnpm dev:frontend   # Web en http://localhost:5173
```

- Vista de la clienta: http://localhost:5173
- Panel de la dueña: http://localhost:5173/panel

En desarrollo, Vite reenvía `/api` al backend, así que el frontend no necesita saber su dirección.

## Pruebas

```bash
pnpm test
```

Las pruebas viven en `backend/test/` y usan dobles en lugar de PostgreSQL, así que no necesitan una base de datos. En cada push, GitHub Actions corre las pruebas del backend y revisa los tipos, el lint y el build del frontend.

## Antes de publicar

Arrancá la API con `pnpm --filter backend start`: ese comando (igual que `NODE_ENV=production`) no deja arrancar sin HTTPS.

En el `.env` del servidor:

- `PROXIES_DE_CONFIANZA=1` (o la cantidad de proxies delante de la API), para que los límites por IP funcionen detrás del hosting.
- `SOLO_HTTPS=true` cuando la API se sirva por HTTPS. Necesita `PROXIES_DE_CONFIANZA` de 1 o más; si no, la API no arranca.
- `DIRECCION_DE_ESCUCHA`: por defecto `127.0.0.1` (proxy en la misma máquina). Hostings como Render o contenedores piden `0.0.0.0`.
- El puerto de la API solo debe ser alcanzable a través del proxy: quien llegue directo podría falsificar su IP y el protocolo (`X-Forwarded-*`).
- `DB_SSL=true` cuando PostgreSQL esté en otro servidor, para que los datos de las clientas viajen cifrados entre la API y la base. Se verifica el certificado del servidor, así que el proveedor debe usar uno válido.

En el hosting del frontend:

- Redirigir HTTP a HTTPS, para que nadie llegue a escribir datos en una página sin cifrar.
- Servir `index.html` en `/panel` (la app decide qué vista mostrar).
- Servir la API en el **mismo dominio**, bajo `/api` (con un proxy o rewrite). La sesión es una cookie y la API no habilita CORS: desde otro dominio no funciona.
- La `Content-Security-Policy` ya viene dentro de `index.html` al compilar (`pnpm build`).
- Enviar el encabezado `Content-Security-Policy: frame-ancestors 'none'` (o `X-Frame-Options: DENY`), para que nadie meta la página dentro de un `<iframe>`. Esa regla no se puede poner en `index.html`: tiene que venir del hosting.

## Autor

Walter López, estudiante de Ingeniería en Software, CEUTEC.
