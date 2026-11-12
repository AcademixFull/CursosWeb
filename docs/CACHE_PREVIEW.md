# Caché, cuentas y sincronización local

El catálogo solicita diez resultados por página mediante la API. La clave de consulta incluye filtros, página y límite; el servidor aplica filtros y paginación antes de responder. TanStack Query reutiliza respuestas válidas, deduplica solicitudes simultáneas y actualiza datos vencidos en segundo plano. El catálogo y los destacados son metadatos públicos: nunca autorizan inscripciones ni acceso a recursos protegidos.

La configuración pública se concentra en `src/config/env.ts`. Sus valores predeterminados son:

| Variable | Valor | Uso |
| --- | --- | --- |
| VITE_CATALOG_TTL_MS | 60000 | Frescura del catálogo |
| VITE_FEATURED_TTL_MS | 30000 | Frescura de destacados |
| VITE_LIBRARY_TTL_MS | 30000 | Frescura de biblioteca/propiedad |
| VITE_QUERY_GC_MS | 300000 | Eliminación de consultas inactivas |
| VITE_QUERY_MAX_INACTIVE | 80 | Máximo de respuestas inactivas, con expulsión LRU |

Las consultas visibles o en curso se conservan hasta que dejen de usarse. No hay una copia persistente del catálogo completo. Las descargas elegidas para estudiar sin conexión pertenecen a IndexedDB y tienen un ciclo separado del caché temporal. Sus contenidos están separados por servidor y usuario.

Las claves privadas incorporan identidad y, cuando corresponde, rol. El cierre de sesión explícito o un cambio de cuenta cancela lecturas, elimina consultas privadas y borra los datos offline de la cuenta anterior, incluida su cola de avance. Una generación de sesión impide escrituras tardías incluso si la misma cuenta inicia sesión inmediatamente después. La pérdida de red o la caducidad de una credencial conserva el contenido offline y su avance pendiente; no concede credenciales nuevas ni permisos del servidor.

Los cursos obtenidos mediante suscripción incluyen `accessExpiresAt` calculado por el backend. Las lecciones, archivos y nuevas marcas de avance offline se bloquean al llegar a esa fecha, conservando el avance pendiente. Un curso adquirido individualmente incluye `null` explícito y conserva su acceso permanente según las reglas del servidor. Las descargas antiguas que no contienen este campo exigen reconectar y actualizarse antes de abrirlas. Sin conexión no se puede conocer una revocación hecha después de la última descarga; al reconectar, el servidor vuelve a comprobar el acceso y una respuesta 403/404 no se sustituye por contenido antiguo. Los archivos ya exportados y el contenido que una persona ya leyó no se pueden retirar retroactivamente mediante una caché del navegador.

Publicar, retirar, restaurar o editar cursos y moderar reseñas invalida el catálogo público. El backend mantiene su propia caché pública acotada, con `CATALOG_CACHE_TTL_MS=30000` y `CATALOG_CACHE_MAX_ITEMS=128`. Las mutaciones exitosas relevantes invalidan esta caché; las respuestas privadas siguen usando `Cache-Control: no-store`.

La migración `20261109010000_catalog_cache.sql` agrega `cursos.visible_destacados` sin excluir registros actuales. El campo de API `featuredVisible` permite a un administrador de Academix excluir un curso del ranking. PostgreSQL ordena por inscripciones activas/finalizadas y devuelve como máximo cinco identificadores; el servidor hidrata únicamente esos cursos. No se descargan todas las inscripciones al proceso de Node para ordenarlas. Debe aplicarse esta migración antes de arrancar el backend actualizado. Los cambios externos a la API se reflejan al vencer el TTL; una instancia no distribuye invalidaciones de memoria a otras instancias.

## Desarrollo y preview

1. Configura una misma fuente de datos en el archivo local de entorno: `VITE_DATA_SOURCE=api` y la URL correcta de `VITE_API_URL`. Estas variables son públicas y quedan incorporadas en el build.
2. Ejecuta `npm run dev`: escucha exclusivamente en 5173 y falla si ese puerto está ocupado.
3. Ejecuta `npm run preview`: su paso previo vuelve a compilar y luego escucha exclusivamente en 4173. Un fallo de compilación impide arrancar un preview antiguo. Si un preview anterior sigue abierto, ciérralo antes de iniciar el nuevo.
4. Compara `/CursosWeb/build-info.json` en ambos puertos. `sourceVersion` debe coincidir cuando código y variables públicas son iguales; no incluye credenciales ni valores de entorno en texto legible. Tras cambiar archivos o variables, vuelve a compilar; tras cambiar variables, reinicia también desarrollo.
5. El backend debe permitir explícitamente ambos orígenes en `FRONTEND_URL=http://localhost:5173,http://localhost:4173`. Para probar con una API aislada, suministra esa misma URL al iniciar desarrollo y al compilar preview; no cambies las credenciales reales.

El service worker mantiene abiertas las lecciones de la versión anterior hasta que puedan actualizarse sin romper otra ventana. Un aviso independiente permite activar la actualización y recargar cuando solo queda una ventana. El HTML de preview se revalida; los recursos compilados tienen nombres con huellas de contenido. El identificador consultado con una petición de red permite detectar un navegador que todavía está ejecutando una versión anterior.

GitHub Pages usa las variables públicas de repositorio `VITE_DATA_SOURCE`, `VITE_API_URL` y opcionalmente `VITE_MAPBOX_TOKEN`. En modo API el build falla si falta una URL HTTPS pública, evitando publicar por accidente una conexión a localhost. Para una demostración aislada debe configurarse expresamente `VITE_DATA_SOURCE=mock`.
