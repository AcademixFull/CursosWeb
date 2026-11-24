# Validación de la Etapa B · Catálogo público

## Verificación automática

Con Vite y otros procesos Node detenidos:

```bash
npm ci
npm run check
npm audit --omit=dev
git diff --check
git status --short
```

Resultado esperado de esta entrega: 9 archivos de prueba y 37 pruebas aprobadas, además de lint,
build y auditoría de producción sin errores.

## Verificación manual

1. Inicia `academix-backend` en `http://localhost:3000`.
2. Confirma en el frontend `VITE_API_URL=http://localhost:3000/api/v1` y
   `VITE_DATA_SOURCE=api`.
3. Inicia React y abre `http://localhost:5173/CursosWeb/#/cursos`.
4. Comprueba que las categorías provienen de `GET /categories` y que un fallo ofrece reintento sin
   insertar mocks.
5. Busca, selecciona categoría y nivel, y cambia de página. La URL debe conservar los filtros.
6. Abre un curso y confirma detalle, instructor, relacionados y reseñas paginadas.
7. Con un curso completado, publica una reseña y comprueba que cambian el listado, promedio y
   conteo después del refresco de consultas.

El navegador debe comunicarse únicamente con Express. No debe aparecer ninguna solicitud directa
a `*.supabase.co`, tablas `public.*` ni al bucket de Storage.
