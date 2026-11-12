# PWA y cursos sin conexión

## Aplicar el patch

El patch está preparado para el frontend del ZIP CursosWeb.zip proporcionado el 6 de noviembre de 2026: carpeta `CursosWeb/CursosWeb`, donde están `package.json` y `vite.config.ts`. Su rama original es `feat/frontend-courses-architecture`, con HEAD `539dced6002e66c88b3184bf922f4d811de82b0b`. El ZIP puede incluir cambios locales posteriores a ese commit; la base de este patch son sus archivos, no un checkout limpio de main.

Desde esa carpeta, con una copia de respaldo o una rama de trabajo:

```sh
git apply --check /ruta/academix-pwa-offline.patch
git apply --binary /ruta/academix-pwa-offline.patch
npm ci
npm test
npm run lint
npm run build
```

La rama main de GitHub consultada tiene diferencias anteriores al ZIP. Si `git apply --check` informa conflictos, usa la versión del ZIP o integra primero la rama de arquitectura correspondiente; no fuerces una aplicación parcial. El patch incluye el logo y no necesita instalar dependencias de producción adicionales. `fake-indexeddb` se añade únicamente para las pruebas.

## Archivo de manifiesto editable

El manifiesto está en `public/manifest.webmanifest`, con la misma extensión del ejemplo [PWA-Fundamentals](https://github.com/JJgithubUT/PWA-Fundamentals/blob/main/GuitarsApp4B/manifest.webmanifest). Puedes editar ahí el nombre, descripción, colores, iconos y modo de apertura. `index.html` lo enlaza con `rel="manifest"`; Vite lo copia sin cambios a `dist/manifest.webmanifest`. Ya no se genera una segunda definición dentro de `pwa.ts`.

`start_url: "./#/mis-cursos"` y `scope: "./"` respetan la instalación bajo `/CursosWeb/` y el enrutador del proyecto. Los iconos deben apuntar a archivos locales dentro de `public/`, por ejemplo `pwa/academix.svg`; la compilación los añade al almacenamiento de la aplicación y detecta sus cambios. No copies las rutas absolutas `/` del ejemplo, porque apuntarían fuera de la carpeta de Academix.

El manifiesto configura la aplicación instalada. `sw.js` permite abrirla sin internet, e IndexedDB conserva cursos y avance. Las variables del servidor que se describen abajo permiten consultar cursos reales y emitir certificados; no sustituyen al manifiesto y no se guardan dentro de él. Para probar solo la instalación puedes usar la configuración de demostración existente, sin inventar una dirección de servidor. Para cursos reales usa la URL real de tu backend.

Después de editar el manifiesto, ejecuta `npm run build` y publica todo `dist/`. La PWA puede instalarse desde el navegador; se mantiene oculta la franja superior solicitada. En desarrollo el archivo está disponible, pero la comprobación del modo offline completo debe hacerse con la compilación de producción.

## Configuración y publicación

Configura el frontend para usar el servidor real antes de compilar:

```dotenv
VITE_DATA_SOURCE=api
VITE_API_URL=https://TU-SERVIDOR/api/v1
```

Estas son variables públicas de compilación. En GitHub Actions deben estar disponibles en el paso `npm run build`; un archivo .env de tu PC no se envía automáticamente al servidor de compilación. Por ejemplo, usando una variable de repositorio VITE_API_URL:

```yaml
- run: npm run build
  env:
    VITE_DATA_SOURCE: api
    VITE_API_URL: ${{ vars.VITE_API_URL }}
```

Publica todo `dist/`, incluidos `sw.js`, `manifest.webmanifest`, `pwa/` y `assets/`. Se conserva la ruta `/CursosWeb/` de la configuración existente y el HashRouter. Si publicas en la raíz u otra subcarpeta, cambia `base` en `vite.config.ts` y vuelve a compilar. Usa HTTPS; localhost también sirve para probar. Un archivo abierto con doble clic o el servidor de desarrollo no prueba la instalación de producción:

```sh
npm run build
npm run preview
```

El backend del ZIP ya tiene las rutas de inscripción, contenido protegido, progreso y certificados. Debe funcionar con sus migraciones existentes aplicadas, incluida la emisión y firma de certificados al finalizar un curso elegible. No se modifica su validación ni se crean certificados en el dispositivo.

## Experiencia del estudiante

1. Inicia sesión con internet. La aplicación prepara automáticamente los cursos inscritos y sus archivos protegidos. También comienza la preparación tras una nueva inscripción.
2. Espera a que desaparezca el aviso de preparación de la aplicación y cada curso muestre **Disponible sin conexión** en Mis cursos. La primera descarga necesita internet y espacio suficiente.
3. Usa **Instalar Academix**. Si el navegador no ofrece el diálogo, abre su menú y elige instalar o agregar a inicio. En Safari usa Compartir → Agregar a inicio.
4. Sin internet, abre la app, entra a Mis cursos y estudia las lecciones y archivos descargados. Puedes marcar y desmarcar lecciones; la cola se guarda antes de indicar éxito.
5. Al reconectar con la app abierta, se sincroniza el progreso. Si la sesión venció o cerraste el navegador, inicia sesión nuevamente con la misma cuenta. El avance permanece hasta recibir confirmación del servidor.
6. Al completar un curso que admite certificado, abre **Certificados → Ver certificado → Imprimir / Guardar PDF**. El documento se obtiene del servidor una vez sincronizado el avance.

Los enlaces externos, páginas de terceros y videos alojados en servicios como YouTube necesitan internet. Se indica expresamente y el curso figura como descarga parcial. Para que un video, PDF u otro archivo quede disponible offline, debe estar cargado como recurso protegido descargable del curso. No se promete disponibilidad completa de un curso que dependa de enlaces externos.

**Sincronizar y actualizar descargas** reintenta avances rechazados y actualiza también los archivos. Se puede solicitar almacenamiento persistente al usar este botón; el navegador decide si lo concede. Las descargas automáticas se revisan al iniciar, reconectar o inscribirse; el reintento cada minuto solo sincroniza avances, evitando volver a descargar toda la biblioteca.

**Borrar descargas** elimina los datos locales de esa cuenta. La comprobación de que no hay cambios pendientes y el borrado se hacen en una única transacción. Si hay avance sin enviar, se conservan los datos y se pide sincronizar primero. Cerrar sesión explícitamente o cambiar de cuenta elimina el perfil local, las respuestas privadas, las descargas y la cola de la cuenta anterior. Sincroniza el avance antes de cerrar sesión si deseas conservarlo en el servidor. Una pérdida de conexión o la caducidad de credenciales conserva las descargas y el avance pendiente para reautenticar la misma cuenta. Las operaciones antiguas no pueden restaurar datos borrados aunque vuelva a iniciar sesión esa misma cuenta.

## Almacenamiento y sincronización

- El service worker guarda solo el HTML, los módulos JavaScript (incluidas las páginas cargadas bajo demanda), estilos e iconos de esta aplicación. No intercepta ni comparte respuestas privadas de la API.
- IndexedDB guarda biblioteca, lecciones, archivos y cola, separados por servidor, fuente de datos, ruta de la aplicación y usuario. El perfil de acceso offline no contiene el token. Cada pestaña conserva su identidad para impedir cambios de cuenta involuntarios entre pestañas.
- La cola conserva el último estado por lección y una revisión por cambio. Una respuesta antigua no elimina un cambio nuevo. Web Locks serializa la sincronización entre pestañas cuando está disponible.
- Los errores de red conservan los datos. Un error de autorización no se oculta usando una respuesta antigua. Si se confirma una revocación o eliminación se retira el contenido local afectado, conservando la cola para revisión. Una lección rechazada no bloquea los otros cursos.
- El servidor incluye la fecha de vencimiento de acceso en las descargas de suscripción. El dispositivo bloquea lecciones, archivos y nuevas marcas de avance cuando llega esa fecha; los cursos adquiridos individualmente tienen una vigencia explícita sin vencimiento. Las descargas antiguas sin información de vigencia requieren reconectar. Una revocación posterior a la última descarga solo puede conocerse al reconectar, y no permite retirar archivos que ya se exportaron del navegador.
- Una actualización del service worker espera a que se cierren las ventanas de la versión anterior; así no interrumpe las lecciones abiertas. La actualización muestra un aviso discreto con el botón Actualizar ahora. Si hay otras ventanas abiertas, pide cerrarlas antes de activar la nueva versión; así no rompe los módulos de otra lección. La cola en IndexedDB permanece. También puedes cerrar todas las ventanas de Academix y volver a abrirla.
- La sincronización se ejecuta con la app abierta; si está cerrada, se reanuda al abrirla. El navegador puede borrar almacenamiento por falta de espacio o si el usuario limpia los datos del sitio. No es una copia de respaldo del avance todavía no sincronizado.

## Validación de la entrega

- Suite completa: 138 pruebas, incluidas persistencia, aislamiento, repetición de cambios, revocación, borrado seguro, inicio de sesión offline y política del service worker.
- Compilación de producción y revisión estática.
- Navegador Microsoft Edge automatizado: manifest y criterios de instalación sin errores en un perfil nuevo de pruebas, arranque de páginas de lecciones desde el service worker, archivo protegido offline, dos lecciones completadas, cierre y reapertura de una ventana, reautenticación, envío de ambos cambios y pantalla de descarga del certificado. La red y las respuestas del servidor se simularon para que la prueba fuera reproducible. No se probó una base de datos real ni la instalación física en Android/iOS.
- Patch binario aplicado a una extracción limpia del ZIP y comparación de los archivos resultantes.

Referencias de plataforma: [service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers), [iconos de aplicación](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons).
