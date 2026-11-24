# Validación de la Etapa D · Aula virtual

## Verificación automática

Detén Vite y cualquier otro proceso que esté utilizando `node_modules` antes de ejecutar:

```bash
npm ci
npm run check
npm audit --omit=dev
git diff --check
git status --short
```

Resultado esperado: 13 archivos de prueba y 51 pruebas aprobadas, además de lint, build y auditoría
de producción sin errores.

## Verificación manual

Con backend y frontend iniciados:

1. Inicia sesión con un alumno inscrito y abre `/#/mis-cursos`.
2. Entra al aula; una URL sin `lessonId` debe llevar a la primera lección pendiente.
3. Confirma que se muestren descripción, contenido, módulos y recursos devueltos por Express.
4. Marca una lección como completada y comprueba el nuevo porcentaje en el aula y la biblioteca.
5. Vuelve a marcarla como pendiente y confirma que el backend restaure el estado en progreso.
6. Abre un enlace externo; debe usar una pestaña nueva y únicamente HTTP/HTTPS.
7. Abre un PDF, imagen, audio o video privado; debe aparecer dentro del aula después de descargarlo.
8. Abre un documento no reproducible y comprueba que ofrece una descarga con nombre de archivo.
9. Prueba con un usuario no inscrito; Express debe responder `403` y el aula debe mostrar el error.
10. Cierra sesión mientras el aula está abierta; un nuevo acceso debe dirigirte al inicio de sesión.

En DevTools, los recursos privados deben solicitarse a
`/api/v1/lessons/:lessonId/resources/:resourceId/content` con `Authorization: Bearer`. No debe
existir ninguna solicitud del navegador al dominio de Storage de Supabase.
