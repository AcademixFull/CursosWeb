# Validación de la Etapa E · Reseñas y verificación pública

## Verificación automática

Detén Vite y cualquier otro proceso que esté utilizando `node_modules` antes de ejecutar:

```bash
npm ci
npm run check
npm audit --omit=dev
git diff --check
git status --short
```

Resultado esperado: 15 archivos de prueba y 59 pruebas aprobadas, además de lint, build y auditoría
de producción sin errores.

## Verificación manual de reseñas

1. Inicia sesión con un alumno que haya finalizado un curso.
2. Abre el detalle del curso y publica una reseña de 1 a 5 estrellas con 10–2000 caracteres.
3. Comprueba que la nueva reseña aparezca en la primera página y cambien promedio y cantidad.
4. Verifica que la opción de publicar desaparezca después de crearla.
5. Fuerza una publicación duplicada; el frontend debe reconocer `REVIEW_ALREADY_EXISTS`.
6. Con un curso sin terminar debe mostrarse que necesitas completarlo antes de opinar.

## Verificación manual de certificados

1. Abre `/#/verificar-certificado` sin iniciar sesión.
2. Prueba un código incompleto; no debe enviarse ninguna petición.
3. Introduce una credencial real con formato `ACX-AAAA-XXXXXXXXXXXX`.
4. Comprueba el estado “Certificado válido”, destinatario, curso, fecha, emisor, algoritmo y firma.
5. Abre el mismo enlace en una ventana privada; debe seguir funcionando sin autenticación.
6. Prueba una credencial inexistente o revocada y confirma que no se renderice un certificado.
7. Desde `/#/certificados` y su detalle, abre la verificación pública y confirma que conserva el
   código exacto.

Todas las consultas deben ir al dominio de Express. El navegador no debe consultar tablas ni Auth
de Supabase directamente.
