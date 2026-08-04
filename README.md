# Academix Frontend

Frontend independiente de Academix, construido con React, TypeScript, Vite, Tailwind CSS y React Query.

Este repositorio contiene únicamente la interfaz. La lógica de negocio y el acceso a Supabase pertenecen a `academix-backend`; el frontend se conecta mediante la API REST configurada en `VITE_API_URL`.

## Requisitos

- Node.js 20 o superior
- npm

## Ejecución local

```bash
npm ci
cp .env.example .env
npm run dev
```

Mientras el backend de cursos no esté disponible, conserva:

```env
VITE_DATA_SOURCE=mock
```

Para consumir la API:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_DATA_SOURCE=api
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Arquitectura

```text
src/
├── app/                  # Providers y enrutamiento principal
├── components/           # Componentes visuales reutilizables
│   └── courses/          # Componentes del catálogo
├── config/               # Variables, rutas y navegación
├── data/                 # Datos mock temporales
├── hooks/                # Integración entre React Query y servicios
├── pages/                # Pantallas asociadas a rutas
├── services/             # Cliente HTTP y acceso a recursos de la API
└── types/                # Contratos TypeScript del dominio
```

El flujo de datos del catálogo es:

```text
Página → Hook de React Query → Servicio de cursos → Mock o API REST
```

Los componentes no llaman `fetch` ni Supabase directamente. Al conectar el backend se cambia `VITE_DATA_SOURCE` a `api`; las pantallas no necesitan reescribirse.

## Rutas actuales

- `/#/`
- `/#/cursos`
- `/#/cursos/:courseId`
- `/#/nosotros`
- `/#/contacto`
- `/#/dashboard`

Se usa `HashRouter` porque el despliegue actual está configurado para GitHub Pages.

## Contrato esperado del catálogo

```http
GET /api/v1/courses?search=&category=&level=&page=1&limit=12
GET /api/v1/courses/:id
GET /api/v1/courses/:id/related
```

Las respuestas deben respetar el sobre común del backend:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 0,
    "totalPages": 1
  }
}
```

## Reglas de integración

- No incluir `SUPABASE_SERVICE_ROLE_KEY` en este repositorio.
- No acceder directamente a PostgreSQL desde componentes React.
- Usar `src/services/api.ts` para toda comunicación HTTP.
- Mantener validación de UX en frontend y validación definitiva en backend.
- Mostrar estados de carga, error y resultados vacíos.
