# Integración frontend → backend de Academix

Este seguimiento traduce la guía completa de endpoints a entregas verificables. La arquitectura es
siempre `React → Express → Supabase`: React no contiene claves de Supabase ni consulta tablas o
Storage directamente.

## Estado

| Etapa | Alcance | Estado |
|---|---|---|
| A | Cliente HTTP, autenticación, sesión y recuperación de contraseña | Validada: 30 pruebas, lint y build |
| B | Catálogo, categorías, instructores y reseñas públicas | Validada: 37 pruebas, lint y build |
| C | Perfil, inscripciones, progreso general y certificados del alumno | Validada: 43 pruebas, lint y build |
| D | Aula virtual, recursos binarios protegidos y progreso por lección | Validada: 51 pruebas, lint y build |
| E | Reseñas completas y verificación pública de certificados | Validada: 59 pruebas, lint y build |
| F | Flujos de Instructor, Authoring y Administración | Implementada; pendiente de validación local |

## Etapa A

Endpoints conectados:

| Método | Endpoint | Pantalla o responsabilidad |
|---|---|---|
| POST | `/auth/register` | Registro y aviso de confirmación por correo |
| POST | `/auth/login` | Inicio de sesión y almacenamiento temporal del JWT |
| POST | `/auth/logout` | Cierre remoto y limpieza local garantizada |
| GET | `/auth/me` | Validación de la sesión al arrancar React |
| POST | `/auth/password-reset` | Solicitud neutral para evitar enumerar cuentas |
| PATCH | `/auth/password` | Contraseña nueva con token de recuperación |

Comportamiento transversal terminado:

- `Authorization: Bearer` se agrega en un único cliente HTTP.
- `204 No Content` se acepta sin intentar parsear JSON.
- `401` limpia sesión, caché de estudiante y caché del aula.
- `429` conserva `Retry-After`; todos los errores conservan `x-request-id` cuando existe.
- Las rutas privadas esperan la validación inicial de `/auth/me` antes de decidir si redirigen.
- El enlace de recuperación se captura antes de `HashRouter`; el token nunca se entrega al SDK de
  Supabase ni se conserva como sesión normal.

## Configuración local requerida

Frontend:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_DATA_SOURCE=api
```

Backend:

```env
FRONTEND_URL=http://localhost:5173
PASSWORD_RESET_REDIRECT_URL=http://localhost:5173/CursosWeb/
```

No se documentan ni se solicitan claves privadas. La autenticación queda cerrada y no se modifica
en las siguientes etapas salvo que una validación revele un defecto.

## Etapa B

Endpoints conectados:

| Método | Endpoint | Pantalla o responsabilidad |
|---|---|---|
| GET | `/categories` | Filtros reales del catálogo |
| GET | `/courses` | Búsqueda, filtros y paginación reproducible por URL |
| GET | `/courses/:courseId` | Detalle público del curso |
| GET | `/courses/:courseId/related` | Cursos relacionados |
| GET | `/instructors/:instructorId` | Perfil público del instructor |
| GET | `/instructors/:instructorId/courses` | Cursos publicados del instructor |
| GET | `/courses/:courseId/reviews` | Reseñas públicas paginadas |
| POST | `/courses/:courseId/reviews` | Refresco de reseñas, promedio y catálogo |

Comportamiento terminado:

- El modo API no presenta categorías mock cuando Express falla o devuelve una colección vacía.
- Búsqueda, categoría, nivel, página y límite quedan representados en la URL del catálogo.
- Solo se envían al backend los filtros con valor; `all` no forma parte de la consulta REST.
- Detalle, relacionados e identificadores de instructor se codifican con `encodeURIComponent`.
- Las reseñas tienen estados de carga, error, vacío y paginación accesible.
- Publicar una reseña invalida las consultas relacionadas para usar los cálculos del backend como
  fuente de verdad.

La validación detallada está en
[`docs/frontend-stage-b-validation.md`](frontend-stage-b-validation.md).

## Etapa C

Endpoints conectados:

| Método | Endpoint | Pantalla o responsabilidad |
|---|---|---|
| GET | `/users/me` | Perfil privado y rol vigente |
| PATCH | `/users/me` | Actualización de campos permitidos |
| POST | `/courses/:courseId/enrollments` | Inscripción y conflicto duplicado |
| GET | `/users/me/courses` | Dashboard y biblioteca del alumno |
| GET | `/users/me/certificates` | Listado de credenciales emitidas |
| GET | `/users/me/certificates/:certificateId` | Documento e integridad de la firma |

Comportamiento terminado:

- Las cachés privadas incluyen el identificador del usuario y se eliminan al cerrar sesión.
- El formulario de perfil coincide con los límites del contrato backend y presenta sus errores.
- La inscripción real deja de describirse como una simulación cuando la fuente es API.
- El conflicto `409 ENROLLMENT_ALREADY_EXISTS` refresca la biblioteca y lleva al aula existente.
- Dashboard, cursos y certificados distinguen carga, error, colección vacía y filtros sin resultados.
- El certificado presenta emisor, algoritmo y firma entregados por Express; React no firma datos.

La validación detallada está en
[`docs/frontend-stage-c-validation.md`](frontend-stage-c-validation.md).

## Etapa D

Endpoints conectados:

| Método | Endpoint | Pantalla o responsabilidad |
|---|---|---|
| GET | `/users/me/courses/:courseId/learning` | Árbol de módulos, lecciones, contenido y progreso |
| PATCH | `/lessons/:lessonId/progress` | Marcar una lección completada o pendiente |
| GET | `/lessons/:lessonId/resources/:resourceId/content` | Reproducción o descarga autenticada |

Comportamiento terminado:

- El aula elimina el reproductor simulado y presenta el contenido real de cada lección.
- La ausencia de lecciones, un acceso denegado y los errores del backend tienen estados explícitos.
- Los recursos se ordenan, identifican como obligatorios y distinguen enlaces de archivos privados.
- Los enlaces externos se limitan a HTTP/HTTPS.
- Los archivos siempre atraviesan Express con `Authorization: Bearer`; no se expone Storage.
- Imágenes, audio, video y PDF tienen vista integrada; los demás formatos se descargan.
- El progreso se puede completar o desmarcar y actualiza las cachés privadas relacionadas.
- Las rutas sin lección seleccionan la primera pendiente y la navegación anterior/siguiente conserva
  el curso actual.

La validación detallada está en
[`docs/frontend-stage-d-validation.md`](frontend-stage-d-validation.md).

## Etapa E

Endpoints conectados:

| Método | Endpoint | Pantalla o responsabilidad |
|---|---|---|
| GET | `/courses/:courseId/reviews` | Listado público paginado y detección de reseña propia |
| POST | `/courses/:courseId/reviews` | Publicación por alumno que finalizó el curso |
| GET | `/certificates/verify/:credentialCode` | Validación pública de credencial y firma |

Comportamiento terminado:

- El formulario de reseñas coincide con el contrato de 1–5 estrellas y 10–2000 caracteres.
- Una publicación actualiza detalle, promedio, catálogo y páginas de reseñas.
- `REVIEW_ALREADY_EXISTS` cierra el diálogo y evita volver a ofrecer una publicación duplicada.
- La verificación pública funciona con o sin sesión desde una URL compartible.
- El código se normaliza y valida antes de llamar al backend.
- Solo `valid: true` presenta el certificado; los estados inexistente, revocado o inconsistente se
  muestran como errores y permiten reintentar.
- La página presenta el documento, emisor, algoritmo y firma entregados por Express.
- El pie, la lista privada y el detalle del certificado enlazan a la verificación pública.

La validación detallada está en
[`docs/frontend-stage-e-validation.md`](frontend-stage-e-validation.md).

## Etapa F

Endpoints conectados:

| Área | Endpoints |
|---|---|
| Usuarios | `GET /admin/users`, `PATCH /admin/users/:id/roles`, `GET /admin/instructors`, `PUT /admin/instructors/:id` |
| Catálogo admin | categorías, opciones, creación/edición, asignación, publicación y archivo de cursos |
| Moderación | listado administrativo y cambio de visibilidad de reseñas |
| Instructor | cursos asignados, edición y envío a revisión |
| Autoría | contenido, módulos, lecciones, recursos y archivos privados de curso |

Comportamiento terminado:

- Cada rol aterriza en su panel y las rutas rechazan perfiles incompatibles.
- El frontend no considera esa redirección una frontera de seguridad: Express valida el JWT y el
  rol en todas las operaciones.
- El administrador gestiona usuarios, roles, instructores, cursos, categorías y reseñas.
- El instructor organiza el contenido de sus cursos en borrador y los envía a revisión.
- Los archivos de hasta 25 MB se envían como binario a Express; el navegador no conoce Storage.
- Al cerrar sesión también se elimina la caché de gestión.

La validación está en [`docs/frontend-stage-f-validation.md`](frontend-stage-f-validation.md) y la
salida a producción en [`docs/frontend-production-checklist.md`](frontend-production-checklist.md).
# Etapa G

Se estabilizaron categorías, autoría, confirmación de correo y solicitudes de instructor.

## Corrección de contacto e información personal

- El formulario público deja de ser una demostración y usa
  `POST /contact/messages` con estados de envío, éxito y error.
- El panel de instructor incorpora `Mi información`, que reutiliza
  `GET/PATCH /users/me` sin mezclar datos personales con la administración de
  cursos.
