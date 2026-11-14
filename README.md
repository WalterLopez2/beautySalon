# beautySalon 💇‍♀️

Sistema web de gestión de citas y clientas para un salón de belleza en Chamelecón, San Pedro Sula, Honduras.

**Código de verificación:** `LEARN-CAP-64CE7E9E`

## El problema

El salón llevaba todo (citas, clientas, cobros) en Excel y hojas sueltas. No había un orden único: las citas se cruzaban, era difícil saber cuánto se vendió en la semana y el negocio no tenía presencia pública para que nuevas clientas pudieran agendar.

## La solución

Una aplicación web con dos vistas:

1. **Vista de la clienta (pública)**: ve los servicios y precios, y agenda su cita eligiendo servicio, fecha y una hora disponible. Al agendar recibe un **código de consulta** para ver sus citas después.
2. **Vista de la dueña (`/panel`, con login)**: administra todo el salón: agenda, clientas, servicios, horario, días libres e ingresos.

## Funcionalidades

**Para la clienta**
- Catálogo de servicios con precios y duración
- Agenda en línea que solo ofrece horas realmente libres
- "Mis citas" con teléfono + código de consulta

**Para la dueña**
- Agenda del día: confirmar, cancelar y marcar citas como atendidas
- Estados de cita: pendiente → confirmada → atendida (o cancelada)
- Catálogo de servicios: crear, editar y pausar
- Horario semanal, intervalo entre turnos, zona horaria y máximo de citas pendientes por clienta
- Días libres y horas bloqueadas, con aviso de las citas afectadas
- Historial por clienta y resumen de ingresos por día y por semana

**Nada está fijo en el código:** horarios, servicios, precios y reglas los configura la dueña desde el panel. Mientras no configure su horario, el salón aparece cerrado.

## Estado actual

| Parte | Estado |
|---|---|
| Backend (API, reglas, seguridad, base de datos) | ✅ Completo y probado |
| Frontend: lógica de las dos vistas (dominio, casos de uso, hooks) | ✅ Listo |
| Frontend: login de la dueña | ✅ Funciona, sin diseño todavía |
| Frontend: pantallas del panel y de la vista pública | 🚧 En construcción |

## Seguridad

- Contraseñas cifradas con scrypt y sesiones con tokens firmados (HMAC).
- Cerrar sesión o cambiar la contraseña invalida todos los tokens anteriores.
- Límite de intentos de login y de citas por IP (responde 429).
- El historial de una clienta requiere teléfono **y** código; en la base solo se guarda el hash del código.
- Dos clientas no pueden tomar la misma hora: agendar es una transacción con el día bloqueado.
- Encabezados de seguridad en todas las respuestas y sin caché en el panel.

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

El archivo `.env` no se sube al repositorio.

### 2. Crear las tablas

Con la base de datos y el usuario ya creados en PostgreSQL:

```bash
pnpm db:preparar
```

Crea las tablas que falten y no carga datos. Se puede correr las veces que haga falta.

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

En el `.env` del servidor:

- `PROXIES_DE_CONFIANZA=1` (o la cantidad de proxies delante de la API), para que los límites por IP funcionen detrás del hosting.
- `SOLO_HTTPS=true` cuando la API se sirva por HTTPS.

En el hosting del frontend:

- Servir `index.html` en `/panel` (la app decide qué vista mostrar).
- Enviar un encabezado `Content-Security-Policy` para la página.

## Autor

Walter López, estudiante de Ingeniería en Software, CEUTEC.
