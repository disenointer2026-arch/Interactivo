# MINISO × Animal Crossing — Crea tu avatar

Prototipo web de alta fidelidad para una colaboración **ficticia** entre MINISO y Animal Crossing
(proyecto académico de Diseño Interactivo). El centro de la experiencia es la personalización de un
avatar 3D modular; alrededor de ella se construye el recorrido completo:

**Descubrir → Explorar → Crear → Transformar → Contemplar → Materializar**

## Requisitos y ejecución

- Node.js 18 o superior.

```bash
npm install      # instala three, gsap y vite
npm run dev      # servidor local con recarga (http://localhost:5173)
npm run build    # versión final en /dist (se puede subir a cualquier hosting estático)
npm run preview  # previsualiza la versión de /dist
```

Dependencias: `three` (escena, OrbitControls, GLTFLoader), `gsap` (animaciones y ScrollTrigger)
y `vite` (desarrollo). No usa frameworks de interfaz: HTML, CSS y JavaScript modular.

## Mapa del sitio (rutas por hash)

| Ruta | Pantalla |
|---|---|
| `#/` | Inicio: hero con avatar 3D, colaboración, productos, testimonios y CTAs |
| `#/personalizar` | Estudio 3D + modal "¿Cómo funciona?" (solo la primera vez; reabrir con el botón ?) |
| `#/listo` | "¡Tu avatar está listo!": avatar grande, nombre, resumen y dos caminos equivalentes |
| `#/pedido` | Producto → inicio de sesión opcional → datos y entrega/recogida → pago simulado |
| `#/confirmacion` | "¡Tu pedido está listo!" con número de pedido |
| `#/tarjeta` | Tarjeta coleccionable generada del avatar + "¡Tu tarjeta está lista!" + compartir |
| `#/info/:id` | Páginas del menú: marca, productos, tiendas, inversores, responsabilidad |

Se usa hash (`#/`) para que funcione en cualquier servidor estático sin configuración.

## Estructura

```
miniso-ac/
├── package.json · vite.config.js
├── src/
│   ├── index.html            estructura base (header, main, footer, fuentes)
│   ├── script.js             punto de entrada: registra las rutas
│   ├── style.css             sistema de diseño completo y responsive
│   ├── data/                 ← lo que más vas a editar
│   │   ├── avatarOptions.js  categorías, opciones, colores y avatar por defecto
│   │   ├── content.js        textos, testimonios, productos, precios, tiendas, tarjeta
│   │   └── sceneConfig.js    colores de la isla, luces, cámaras, modelos del ambiente
│   ├── components/           una vista por archivo (home, customizer, final, order,
│   │                         confirmation, card, cardRenderer, info) + piezas de UI
│   ├── three/                todo lo 3D
│   │   ├── Stage.js          renderer único compartido entre inicio, estudio y vista final
│   │   ├── Avatar.js         avatar modular por "slots" y transiciones entre piezas
│   │   ├── Environment.js    isla flotante (placeholder procedural)
│   │   ├── Snapshot.js       segundo renderer: miniaturas y retratos en PNG
│   │   ├── PartLoader.js     carga .glb con respaldo al placeholder
│   │   ├── avatarDims.js     proporciones de cada tipo de cuerpo
│   │   ├── materials.js      materiales por rol (skin, hair, shirt…)
│   │   └── parts/            placeholders low-poly: body, hair, face, clothes,
│   │                         accessories, companions
│   └── utils/                estado (store), router, almacenamiento, sonidos, iconos
└── static/                   se copia tal cual: models/, textures/, images/, audio/
```

**Flujo de datos:** Interfaz → `store` (estado + historial) → `Avatar` 3D. La interfaz nunca toca
Three.js directamente: cambia el estado y el avatar reacciona. Por eso deshacer/rehacer, aleatorio
y reiniciar funcionan igual para todas las piezas.

## Reemplazar los modelos 3D

Todas las piezas actuales son placeholders procedurales low-poly. Para usar modelos propios:

1. Exporta cada pieza como `.glb` y cópiala en `static/models/avatar/` o `static/models/accessories/`.
2. En `src/data/avatarOptions.js`, escribe la ruta en el campo `model` de la opción:
   ```js
   { id: 'long', name: 'Largo', model: 'models/avatar/hair_long.glb' }
   ```
3. Convenciones para que encaje (detalle en `static/models/*/README.md`):
   - Unidades en metros; la cabeza estándar tiene radio 0.5.
   - Piezas de cabeza (cabello, ojos, nariz, boca, orejas, gorros, gafas): origen en el **centro de la cabeza**.
   - Piezas de cuerpo (cuerpo, ropa, zapatos, cuello, acompañantes): origen en el **suelo**.
   - Nombra los materiales `skin`, `hair`, `eye`, `mouth`, `shirt`, `pants` o `shoes` y se
     recolorean con los selectores de color. Otros materiales conservan su color.
4. Si un archivo falla o no existe, se usa el placeholder y el prototipo sigue funcionando.

El ambiente se reemplaza en `src/data/sceneConfig.js` → `environmentModels`.

## Agregar opciones de personalización

En `src/data/avatarOptions.js`:

- **Nueva pieza** (con modelo propio): agrega un objeto al grupo correspondiente.
  ```js
  { id: 'mohawk', name: 'Cresta', model: 'models/avatar/hair_mohawk.glb' }
  ```
  Sin modelo, indica con `builder` qué placeholder existente usar (por ejemplo `builder: 'spiky'`).
- **Nuevo color:** agrega `{ id: '#HEX', name: 'Nombre' }` a la paleta (`HAIR_COLORS`, `CLOTH_COLORS`…).
- **Miniatura propia:** campo `thumbnail: 'images/archivo.png'`. Si no se indica, se renderiza sola.
- **Nueva categoría o grupo:** agrega un objeto a `CATEGORIES` y su clave a `DEFAULT_AVATAR`.
  Si es un slot nuevo, regístralo en `SLOTS` de `src/three/Avatar.js`.

## Cambiar textos, colores y contenido

- **Textos, testimonios, productos, precios, costo de envío, tiendas, bancos y datos de la tarjeta:**
  `src/data/content.js`. Los retratos de los testimonios se generan desde su configuración de avatar.
- **Colores, tipografías, radios y sombras:** variables de `:root` al inicio de `src/style.css`.
- **Colores de la isla, luces y encuadres de cámara:** `src/data/sceneConfig.js`.
- **Pasos del modal de instrucciones:** `STEPS` en `src/components/instructions.js`.
- **Diseño de la tarjeta coleccionable:** `src/components/cardRenderer.js` (canvas 750 × 1050 px).

## Accesibilidad y rendimiento

- Navegación completa con teclado: pestañas y opciones con flechas, `Ctrl+Z` / `Ctrl+Y` en el estudio,
  foco visible, modales con `<dialog>` nativo (Escape cierra) y enlace para saltar al contenido.
- La selección no depende solo del color: borde rojo más grueso y marca de verificación.
- Etiquetas en todos los campos, errores de validación asociados a cada campo y avisos con `aria-live`.
- Respeta `prefers-reduced-motion`. Los sonidos son sintetizados y se pueden desactivar.
- Un solo renderer para la escena principal, geometría low-poly, pixel ratio limitado a 2 y
  miniaturas en caché.

## Notas del prototipo

- El pedido, el inicio de sesión, el pago y las redes sociales son **simulaciones**: no se envía nada.
- La creación, el nombre y el último pedido se guardan en `localStorage` de este navegador.
- No se usan logotipos, personajes ni recursos oficiales de MINISO ni de Nintendo: el cruce de marcas
  es tipográfico y la tarjeta tiene un diseño propio. El pie de página incluye el aviso académico.
