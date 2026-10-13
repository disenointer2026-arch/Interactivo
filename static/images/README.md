# images

Archivos estáticos opcionales. Todo lo que pongas en `static/` se sirve desde la raíz
(por ejemplo `static/images/archivo.png` → `images/archivo.png`).
- Miniaturas propias: guarda PNG cuadrados aquí y escribe la ruta en el campo `thumbnail` de la opción.

## Imágenes del inicio

Las rutas y los textos alternativos se editan en `src/data/content.js` (objeto `HOME`).
Para cambiar una imagen basta con reemplazar el archivo conservando el nombre:

| Archivo | Dónde aparece | Proporción recomendada |
|---|---|---|
| `hero-banner.webp` | Banner superior (a todo el ancho) | muy apaisada, ~2.5:1; en móvil se recorta hacia el logotipo |
| `llavero-avatar.jpg` | Tarjeta "Así llega a tus manos", junto al visor 3D | cuadrada o apaisada suave |
| `lifestyle-pareja.jpg` | Banda fotográfica "De la isla a tu día a día" | 16:9, con las caras en el tercio superior |
| `coleccion-figuras.jpg` | Segundo slide de la banda | 16:9 |
| `cara-miniso.png` | Marca de agua detrás de "Construye tu avatar" | cuadrada, con fondo transparente |
| `logo-miniso.png` | Logotipo del encabezado | vertical, con fondo transparente |
| `personajes/*.png` | Personajes asomados sobre el seto | recorte con fondo transparente |

Los personajes (posición, tamaño y cuánto asoman) se configuran en la lista `PEEK`
de `src/data/content.js`.
