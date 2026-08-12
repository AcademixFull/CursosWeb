# Contrato frontend ↔ backend de Academix

Este documento define el contrato que `academix-backend` deberá implementar para conectar el
frontend terminado. Supabase no se consume directamente desde React: autenticación, autorización,
reglas de negocio y persistencia pasan por el backend.

## Configuración

- URL base local: `http://localhost:3000/api/v1`
- Variable del frontend: `VITE_API_URL`
- `VITE_DATA_SOURCE=mock` mantiene la demostración aislada.
- `VITE_DATA_SOURCE=api` activa las solicitudes reales.
- Los nombres JSON se entregan en `camelCase`; el backend transforma las columnas `snake_case` de
  PostgreSQL.

## Sobre común

Éxito:

```json
{ "success": true, "data": {} }
```

Colección paginada:

```json
{
  "success": true,
  "data": [],
  "pagination": { "page": 1, "limit": 12, "total": 0, "totalPages": 1 }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos inválidos.",
    "fields": { "email": "El correo no es válido." }
  }
}
```

## Autenticación

El frontend no recibe claves de Supabase. En la primera integración, `academix-backend` utilizará
Supabase Auth y devolverá el contrato `AuthSession` que ya consume React:

```json
{
  "user": {
    "id": "uuid",
    "fullName": "Nombre",
    "email": "correo@ejemplo.com",
    "role": "student"
  },
  "accessToken": "jwt",
  "expiresAt": "2026-08-10T20:00:00.000Z"
}
```

El token se envía como `Authorization: Bearer <token>`. El backend debe verificarlo con Supabase
Auth antes de toda operación protegida y nunca debe confiar en el rol enviado por el navegador.

| Método | Ruta | Auth | Respuesta `data` |
|---|---|---:|---|
| POST | `/auth/login` | No | `AuthSession` |
| POST | `/auth/register` | No | `AuthSession` |
| POST | `/auth/logout` | Sí | `null` o `204` |
| GET | `/auth/me` | Sí | `{ user: AuthUser }` |
| POST | `/auth/password-reset` | No | `null` o `204` |
| PATCH | `/auth/password` | Token de recuperación | `null` o `204` |

Al iniciar la aplicación, una sesión almacenada se valida con `GET /auth/me`. Una respuesta `401`
elimina el token y los datos privados en caché; una falla temporal de red no destruye la sesión.
El backend actual no expone refresh token, por lo que al expirar el JWT el usuario inicia sesión de
nuevo.

Supabase redirige la recuperación a `http://localhost:5173/CursosWeb/`. Antes de iniciar
`HashRouter`, React captura `type=recovery` y `access_token`, borra esos parámetros visibles y abre
`/#/actualizar-contrasena`. Ese token queda aislado en `sessionStorage` y solo se envía a
`PATCH /auth/password`; el frontend nunca crea un cliente de Supabase.

El cliente también conserva `x-request-id` y `Retry-After` dentro de `ApiError`. Los errores `429`
no se reintentan automáticamente para evitar agravar el límite del backend.

## Catálogo e instructores

Con `VITE_DATA_SOURCE=api`, las categorías, cursos, instructores y reseñas públicas proceden de
Express. Los filtros con valor se reflejan en la URL de `/#/cursos`; `page` y `limit` siempre se
envían al backend. El frontend no utiliza categorías mock como respaldo silencioso ante errores.

| Método | Ruta | Auth | Respuesta `data` |
|---|---|---:|---|
| GET | `/categories` | No | `CourseCategory[]` |
| GET | `/courses?search=&category=&level=&page=1&limit=12` | No | `CourseSummary[]` + paginación |
| GET | `/courses/:courseId` | No | `CourseDetail` |
| GET | `/courses/:courseId/related` | No | `CourseSummary[]` |
| GET | `/instructors/:instructorId` | No | `InstructorDetail` |
| GET | `/instructors/:instructorId/courses` | No | `CourseSummary[]` |
| GET | `/courses/:courseId/reviews?page=1&limit=5` | No | `CourseReview[]` + paginación |

Después de `POST /courses/:courseId/reviews`, React invalida el detalle, el listado paginado de
reseñas y el catálogo para volver a obtener el promedio y el conteo calculados por el backend.

## Estudiante y perfil

| Método | Ruta | Auth | Respuesta `data` |
|---|---|---:|---|
| GET | `/users/me` | Sí | `UserProfile` |
| PATCH | `/users/me` | Sí | `UserProfile` |
| GET | `/users/me/courses` | Sí | `EnrollmentSummary[]` |
| POST | `/courses/:courseId/enrollments` | Sí | `EnrollmentSummary` |

Una inscripción duplicada responde `409 ENROLLMENT_ALREADY_EXISTS`. El backend determina el
usuario desde el token y aplica una restricción única por `user_id + course_id`.

Las consultas privadas de React Query incluyen el identificador del usuario en su clave. Así, los
cursos, certificados, perfil y datos del aula de una cuenta no se reutilizan al iniciar otra sesión.
Ante `ENROLLMENT_ALREADY_EXISTS`, React refresca la biblioteca y permite continuar al aula sin
crear una relación duplicada.

## Aula y progreso

`GET /users/me/courses/:courseId/learning` es el endpoint agregado requerido por la pantalla del
aula. Debe verificar la inscripción y devolver en una sola respuesta curso, módulos, lecciones y
progreso para evitar una cascada de solicitudes.

| Método | Ruta | Auth | Respuesta `data` |
|---|---|---:|---|
| GET | `/users/me/courses/:courseId/learning` | Sí | `LearningCourse` |
| PATCH | `/lessons/:lessonId/progress` | Sí | `null` o `204` |
| GET | `/lessons/:lessonId/resources/:resourceId/content` | Sí | Archivo binario |

Body de progreso:

```json
{ "completed": true }
```

Cada lección incorpora `content` y `resources`. Los enlaces externos solo se abren si usan HTTP o
HTTPS. Los archivos privados se solicitan a Express con el JWT y el `contentPath` devuelto por el
backend; React nunca construye una URL de Storage ni recibe su ruta interna. Imágenes, audio, video
y PDF se muestran desde un `Blob` temporal, que se revoca al cambiar de recurso o desmontar la
vista. Otros formatos conservan una descarga autenticada.

El progreso permite `{ "completed": true }` y `{ "completed": false }`. Después de actualizarlo,
el frontend vuelve a consultar el aula y sincroniza biblioteca, dashboard y certificados con el
estado calculado por el backend.

## Reseñas y certificados

| Método | Ruta | Auth | Respuesta `data` |
|---|---|---:|---|
| POST | `/courses/:courseId/reviews` | Sí | `CourseReview` |
| GET | `/users/me/certificates` | Sí | `CertificateSummary[]` |
| GET | `/users/me/certificates/:certificateId` | Sí | `CertificateDetail` |
| GET | `/certificates/verify/:credentialCode` | No | `VerifiedCertificate` |

Solo un estudiante que cumpla la regla de finalización puede publicar una reseña. El backend emite
el certificado al alcanzar los criterios del curso y genera un `credentialCode` único.

La reseña contiene una calificación entera de 1 a 5 y un comentario de 10 a 2000 caracteres. Un
duplicado responde `409 REVIEW_ALREADY_EXISTS`; React cierra el formulario, actualiza las reseñas y
deja de ofrecer una segunda publicación. `403 COURSE_COMPLETION_REQUIRED` conserva el mensaje del
backend para explicar por qué la operación no está disponible.

`CertificateDetail` incorpora `issuerName`, `systemSignature`, `signatureAlgorithm` y
`verificationPath`. El frontend presenta esos valores emitidos y verificados por Express; nunca
genera ni recalcula la firma en el navegador.

La ruta pública `/#/verificar-certificado/:credentialCode?` acepta únicamente el formato
`ACX-AAAA-XXXXXXXXXXXX`, normaliza el código y consulta Express sin JWT. Solo presenta un documento
cuando el backend devuelve `valid: true`; una credencial inexistente, revocada o con firma
inconsistente muestra el error correspondiente y nunca expone correo ni identificadores internos.

## Códigos esperados

- `200`: consulta o actualización correcta.
- `201`: inscripción, registro o reseña creada.
- `204`: operación correcta sin cuerpo.
- `400`: JSON o parámetros inválidos.
- `401`: sesión ausente o inválida.
- `403`: usuario sin autorización para el recurso.
- `404`: recurso inexistente.
- `409`: duplicidad o conflicto de estado.
- `422`: validación semántica.
- `500`: error interno sin detalles sensibles.

Los tipos completos están en `src/types/`. Cualquier cambio futuro en este contrato debe actualizar
los tipos, servicios, pruebas y documentación en el mismo pull request.

## Instructor, autoría y administración

Todas estas rutas requieren `Authorization: Bearer`. Express es la autoridad final del rol; ocultar
una pantalla en React no otorga ni revoca permisos.

| Rol | Método y ruta | Uso |
|---|---|---|
| Instructor | `GET /instructor/courses` | Cursos asignados |
| Instructor | `PATCH /instructor/courses/:courseId` | Metadatos permitidos |
| Instructor | `POST /instructor/courses/:courseId/submit` | Enviar borrador a revisión |
| Admin/Instructor | `GET /authoring/courses/:courseId/content` | Árbol editable |
| Admin/Instructor | `POST/PATCH /authoring/...` | Módulos, lecciones y recursos |
| Admin/Instructor | `POST /authoring/courses/:courseId/files` | Archivo binario privado, máximo 25 MB |
| Admin | `GET /admin/users` y `PATCH /admin/users/:userId/roles` | Usuarios y roles |
| Admin | `GET /admin/instructors` y `PUT /admin/instructors/:userId` | Perfiles de instructor |
| Admin | `POST/PATCH /admin/categories` | Categorías |
| Admin | `GET/POST/PATCH /admin/courses` | Gestión de cursos |
| Admin | `PUT /admin/courses/:courseId/instructor` | Asignación |
| Admin | `POST /admin/courses/:courseId/publish|archive` | Flujo editorial |
| Admin | `GET /admin/reviews` y `PATCH /admin/reviews/:reviewId/moderation` | Moderación |

La carga binaria conserva el tipo MIME real y agrega `x-file-name`. La respuesta incluye un
identificador de archivo, que luego se asocia al recurso mediante el endpoint de autoría.
