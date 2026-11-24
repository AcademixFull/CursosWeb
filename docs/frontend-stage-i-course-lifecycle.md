# Etapa I — ciclo de vida de cursos

- El administrador puede restaurar un curso archivado como borrador.
- El contenido conservado vuelve a estar disponible después de restaurarlo.
- Un curso archivado no muestra acciones inválidas de edición o publicación.
- El instructor puede crear un borrador propio desde **Mis cursos**.
- El backend asigna automáticamente el curso nuevo al instructor creador.
- El instructor completa el contenido y lo envía a revisión; solo el administrador publica.

No se crean tablas ni se eliminan registros. Restaurar modifica el estado del
mismo curso de `Archivado` a `Borrador` y vuelve a marcarlo como activo.
