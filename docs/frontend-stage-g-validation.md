# Etapa G — estabilización posterior a integración

Esta etapa corrige hallazgos de uso real del panel:

- categorías activas e inactivas visibles y reactivables;
- nombres de roles y estados presentados en español;
- selector claro entre subir archivo y usar enlace;
- botón específico para elegir video y límite visible de 25 MB;
- acciones para guardar, salir y enviar un curso a revisión;
- confirmación de correo capturada antes de `HashRouter`, sin página 404;
- solicitud de instructor con aprobación administrativa.

La carga sigue el flujo navegador → Express → Supabase. El frontend no contiene
claves privadas ni consulta tablas directamente.

## Validación manual

1. Inicia backend y frontend.
2. En Administración → Categorías, desactiva y vuelve a activar una categoría.
3. Como instructor, elige Video, pulsa **Elegir video** y sube un MP4 menor a 25 MB.
4. Pulsa **Finalizar y enviar a revisión**.
5. Registra una cuenta desde un enlace nuevo y confirma el correo: debe abrir
   `#/cuenta-confirmada`.
6. Como alumno abre **Quiero enseñar**, envía la solicitud y apruébala desde
   Administración → Solicitudes.

En Supabase, agrega `http://localhost:5173/CursosWeb/` a Auth → URL Configuration
→ Redirect URLs. En producción agrega también la URL exacta desplegada.
