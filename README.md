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
npm test
npm run test:watch
npm run check
npm run preview
```

`npm run check` ejecuta lint, pruebas y build. La auditoría de dependencias que llegan a producción
se ejecuta por separado con `npm audit --omit=dev`.

## Arquitectura

```text
src/
├── app/                  # Providers y enrutamiento principal
├── components/           # Componentes visuales reutilizables
│   ├── a11y/             # Navegación y accesibilidad
│   ├── courses/          # Componentes del catálogo
│   └── ui/               # Sistema de diseño
├── config/               # Variables, rutas y navegación
├── data/                 # Datos mock temporales
├── hooks/                # Integración entre React Query y servicios
├── layouts/              # Estructuras públicas, privadas y de autenticación
├── pages/                # Pantallas asociadas a rutas
├── services/             # Cliente HTTP y acceso a recursos de la API
├── types/                # Contratos TypeScript del dominio
├── utils/                # Persistencia temporal y utilidades puras
└── validations/          # Reglas inmediatas de formularios

tests/                    # Pruebas unitarias y de componentes con Vitest
docs/                     # Contrato de integración con el backend
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
- `/#/instructores/:instructorId`
- `/#/nosotros`
- `/#/contacto`
- `/#/dashboard`
- `/#/mis-cursos`
- `/#/certificados`
- `/#/certificados/:certificateId`
- `/#/perfil`
- `/#/aprender/:courseId/:lessonId?`
- `/#/iniciar-sesion`
- `/#/registro`
- `/#/recuperar-contrasena`

Se usa `HashRouter` porque el despliegue actual está configurado para GitHub Pages.

## Contrato con academix-backend

El contrato completo de autenticación, catálogo, perfiles, aula, progreso, reseñas y certificados
está documentado en [`docs/frontend-api-contract.md`](docs/frontend-api-contract.md). El backend
debe respetar el sobre `{ success, data | error, pagination? }` que valida `src/services/api.ts`.

## Calidad

GitHub Actions ejecuta automáticamente en cada pull request:

```bash
npm ci
npm run lint
npm test
npm run build
npm audit --omit=dev
```

La suite cubre validaciones de autenticación, navegación segura, paginación, persistencia mock,
filtrado de cursos y el sobre común del cliente HTTP.

## Reglas de integración

- No incluir `SUPABASE_SERVICE_ROLE_KEY` en este repositorio.
- No acceder directamente a PostgreSQL desde componentes React.
- Usar `src/services/api.ts` para toda comunicación HTTP.
- Mantener validación de UX en frontend y validación definitiva en backend.
- Mostrar estados de carga, error y resultados vacíos.
