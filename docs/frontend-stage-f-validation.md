# Validación de la Etapa F

Esta etapa cierra la integración funcional de Academix con paneles por rol. El parche es incremental
sobre las Etapas A–E y no modifica Supabase ni el backend.

## Verificación local

Con frontend y backend apagados:

```bash
npm ci
npm run check
npm audit --omit=dev
git diff --check
git status --short
```

Después, inicia ambos proyectos y verifica:

1. Un alumno es dirigido a `/#/dashboard` y no puede abrir los paneles de gestión.
2. Un instructor abre `/#/panel-instructor`, edita contenido y envía un borrador a revisión.
3. Un administrador abre `/#/administracion`, asigna roles/instructor y gestiona el flujo del curso.
4. Un archivo válido se carga desde autoría y queda accesible al alumno solo mediante Express.
5. Una cuenta sin rol adecuado recibe `403` del backend incluso si intenta llamar la URL manualmente.
6. Al cerrar sesión no quedan datos privados visibles al entrar con otra cuenta.

## Resultado esperado

- Lint sin errores.
- Todas las pruebas aprobadas.
- Build de Vite aprobado.
- `npm audit --omit=dev` sin vulnerabilidades de producción.
- `git diff --check` sin errores de espacios.

No ejecutar `npm audit fix` automáticamente: puede cambiar versiones mayores y debe evaluarse en un
trabajo separado si el reporte completo mantiene hallazgos solo de desarrollo.
