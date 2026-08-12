# Checklist de producción del frontend Academix

## Configuración

- [ ] `VITE_API_URL` apunta al prefijo HTTPS `/api/v1` del backend de producción.
- [ ] `VITE_DATA_SOURCE=api`; el modo mock no se usa en producción.
- [ ] No existen claves de Supabase ni credenciales PostgreSQL con prefijo `VITE_`.
- [ ] El backend permite por CORS únicamente los orígenes reales del frontend.
- [ ] Las URLs de confirmación y recuperación de Supabase apuntan al dominio desplegado.

## Seguridad y privacidad

- [ ] Alumno, Instructor y Admin se prueban con cuentas distintas.
- [ ] Los intentos cruzados de rol responden `403` desde Express.
- [ ] Una respuesta `401` elimina sesión y cachés privadas.
- [ ] Archivos del aula y de autoría atraviesan Express, nunca una URL pública de Storage.
- [ ] No se registran tokens, contraseñas, firmas completas ni datos sensibles en consola.

## Calidad y operación

- [ ] `npm ci && npm run check` pasa desde un clon limpio.
- [ ] `npm audit --omit=dev` reporta cero vulnerabilidades.
- [ ] Se prueban registro, confirmación, login, recuperación y logout en el dominio final.
- [ ] Se recorren catálogo → inscripción → aula → progreso → reseña → certificado.
- [ ] Se recorren autoría → revisión → publicación → archivo.
- [ ] Se verifican estados de red caída, 401, 403, 404, 409, 422, 429 y 500.
- [ ] El endpoint de readiness del backend está conectado al monitoreo del despliegue.

## Despliegue

- [ ] El host sirve correctamente `HashRouter` y el `base` configurado por Vite.
- [ ] HTTPS, encabezados de seguridad y política CSP se validan en el entorno final.
- [ ] Se conserva el commit desplegado y existe un procedimiento de rollback.
