# beautySalon 💇‍♀️

Sistema web de gestión de citas y clientas para un salón de belleza en Chamelecón, San Pedro Sula, Honduras.

**Código de verificación:** `LEARN-CAP-64CE7E9E`

## El problema

El salón llevaba todo (citas, clientas, cobros) en Excel y hojas sueltas. No había un orden único: las citas se cruzaban, era difícil saber cuánto se vendió en la semana y el negocio no tenía presencia pública para que nuevas clientas pudieran agendar.

## La solución

Una aplicación web con dos partes:

1. **Página pública**: las clientas ven los servicios y precios, y solicitan su cita eligiendo servicio, fecha y hora disponible.
2. **Panel interno (con login)**: la dueña ve la agenda del día, confirma o cancela citas, registra los servicios realizados, consulta el historial de cada clienta y el resumen de ingresos.

## Funcionalidades

- Catálogo de servicios con precios
- Solicitud de citas en línea
- Validación de horarios: no permite citas que se crucen
- Estados de cita: pendiente, confirmada, atendida, cancelada
- Historial por clienta
- Resumen de ingresos por día y por semana

## Tecnologías

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js + TypeScript
- **Base de datos:** PostgreSQL
- **Pruebas:** Vitest
- **Gestor de paquetes:** pnpm (workspace con `client/` y `server/`)
- **CI:** GitHub Actions

## Estructura del proyecto

```
beautySalon/
├── client/    # Aplicación React (página pública y panel interno)
├── server/    # API en Node.js
│   ├── src/   # Código y lógica de negocio
│   └── test/  # Pruebas automáticas
└── .github/workflows/ci.yml
```

## Cómo correrlo

Requisitos: Node.js 20 o superior, pnpm y PostgreSQL.

```bash
git clone https://github.com/WalterLopez2/beautySalon.git
cd beautySalon
pnpm install
```

Copiá `server/.env.example` a `server/.env` y completá tus datos de PostgreSQL. El archivo `.env` no se sube al repositorio.

```bash
pnpm dev:server   # API
pnpm dev:client   # Frontend
```

## Pruebas

```bash
pnpm test
```

Las pruebas viven en `server/test/` y se ejecutan automáticamente en cada push con GitHub Actions.


## Autor

Walter López, estudiante de Ingeniería en Software, CEUTEC.
