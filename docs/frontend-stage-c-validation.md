# Validación de la Etapa C · Área del alumno

## Verificación automática

Detén Vite y cualquier otro proceso que esté utilizando `node_modules` antes de ejecutar:

```bash
npm ci
npm run check
npm audit --omit=dev
git diff --check
git status --short
```

Resultado esperado: 11 archivos de prueba y 43 pruebas aprobadas, además de lint, build y auditoría
de producción sin errores.

## Verificación manual

Con backend y frontend iniciados:

1. Inicia sesión y recarga una ruta privada; la sesión debe permanecer validada.
2. Abre `/#/perfil`, modifica nombre, teléfono, país o biografía y comprueba el mensaje de éxito.
3. Abre un curso no inscrito, confirma la inscripción y verifica que aparezca en `/#/mis-cursos`.
4. Si fuerzas una inscripción duplicada, la aplicación debe conservar la existente y abrir el aula.
5. Comprueba en el dashboard los cursos activos, completados, certificados y horas calculadas.
6. Abre `/#/certificados`; si la colección está vacía debe mostrarse una acción útil.
7. Abre un certificado y confirma emisor, algoritmo y firma del sistema.
8. Cierra sesión e inicia con otra cuenta; no deben aparecer datos privados de la cuenta anterior.

Las solicitudes protegidas deben ir a Express con `Authorization: Bearer`. No debe existir ninguna
solicitud del navegador a tablas, Auth o Storage de Supabase.
