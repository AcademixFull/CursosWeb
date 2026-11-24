# Academix Frontend

Frontend independiente de Academix, construido con React, TypeScript, Vite, Tailwind CSS y React Query.

Este repositorio contiene únicamente la interfaz. La lógica de negocio y el acceso a Supabase pertenecen a `academix-backend`; el frontend se conecta mediante la API REST configurada en `VITE_API_URL`.

## Requisitos

- Node.js 22 (la misma versión de Actions, Vercel y Render)
- npm

## Ejecución local

```bash
npm ci
cp .env.example .env
npm run dev
```

La integración real local usa:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_DATA_SOURCE=api
```

`VITE_DATA_SOURCE=mock` queda disponible únicamente para demostraciones aisladas.

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
- `/#/verificar-certificado/:credentialCode?`
- `/#/perfil`
- `/#/aprender/:courseId/:lessonId?`
- `/#/iniciar-sesion`
- `/#/registro`
- `/#/recuperar-contrasena`
- `/#/actualizar-contrasena` (destino de los enlaces de recuperación)
- `/#/panel-instructor` (solo Instructor)
- `/#/administracion` (solo Admin)
- `/#/autor/:courseId` (Admin o Instructor autorizado)

Se conserva `HashRouter` para las rutas de la aplicación. Vercel publica el proyecto desde `/`.

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

La suite cubre autenticación, navegación segura, paginación, persistencia mock, catálogo, área del
alumno, aula, progreso, recursos binarios protegidos, expiración de sesión, rate limiting,
recuperación de contraseña y el sobre común del cliente HTTP.

## Integración por etapas

Las Etapas A–F conectan autenticación, catálogo, área privada, aula, reseñas, certificados,
instructores y administración. El estado final está en
[`docs/frontend-integration-progress.md`](docs/frontend-integration-progress.md). Cada etapa se
valida antes de conectar la siguiente para aislar errores entre UI, API y datos.

## Reglas de integración

- No incluir `SUPABASE_SERVICE_ROLE_KEY` en este repositorio.
- No acceder directamente a PostgreSQL desde componentes React.
- Usar `src/services/api.ts` para toda comunicación HTTP.
- Mantener validación de UX en frontend y validación definitiva en backend.
- Mostrar estados de carga, error y resultados vacíos.
- Tratar los controles por rol del frontend como UX; Express vuelve a autorizar cada petición.

## Despliegue y versiones

- Web de producción: https://academix-web-three.vercel.app
- Vista previa de `dev`: https://academix-web-git-dev-marco-antonio-damian-ortizs-projects.vercel.app
- API en Render: https://academix-api-eioa.onrender.com/api/v1
- Disponibilidad de API y Supabase: `/api/v1/health/ready`

En Vercel, tanto Production como Preview usan estas variables públicas:

```env
VITE_API_URL=https://academix-api-eioa.onrender.com/api/v1
VITE_DATA_SOURCE=api
```

`vercel.json` instala con `npm ci`, ejecuta `npm run check` y publica `dist`.
GitHub Pages está despublicado. Los secretos de Supabase permanecen en Render.

Los cambios se revisan en `dev` y se integran a `main` mediante PR después de aprobar
`Frontend checks`. Vercel genera previews de desarrollo y producción desde `main`.
Render exige CI aprobado antes de desplegar la API. Slack recibe los pushes, PR,
pruebas y releases en `#dev-github`.

Release Please propone versiones y changelog al aprobar CI de `main`; al integrar
su PR se publica la release. La versión del frontend aparece en el pie de página y
en `/build-info.json`; la de la API aparece en `/api/v1/health`.

El secreto de Actions `RELEASE_PLEASE_TOKEN` debe estar disponible en los dos repositorios,
con permisos de escritura en Contents, Issues y Pull requests. Así los PR de versión
disparan CI nativo. Si falta el secreto se usa `GITHUB_TOKEN`: en ese caso un integrante
debe cerrar y reabrir el PR de versión para ejecutar el evento `pull_request`, porque
las comprobaciones de `workflow_dispatch` no satisfacen la protección de la rama.
Nunca se guarda el valor del token en archivos del repositorio.

Si una sesión abierta conserva una versión anterior, usar el aviso **Actualizar ahora**
y cerrar otras pestañas de la aplicación antes de aplicar la actualización.
