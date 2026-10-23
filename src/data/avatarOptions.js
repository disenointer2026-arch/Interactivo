/* ==========================================================================
   OPCIONES DE PERSONALIZACIÓN DEL AVATAR
   --------------------------------------------------------------------------
   Este es el archivo principal para agregar, quitar o renombrar opciones.

   Cada CATEGORÍA (pestaña del panel) contiene GRUPOS.
   Cada GRUPO controla una "clave" del avatar (key) y puede ser:
     - type: 'options' → piezas con miniatura (cabello, camiseta, gafas…)
     - type: 'colors'  → muestras de color (tono de piel, color de cabello…)
     - type: 'images'  → botones hechos con una imagen propia (option.image,
                         ruta dentro de /static); al elegirse llevan el contorno rojo

   Cada OPCIÓN de tipo 'options' acepta:
     id         → identificador único dentro del grupo (obligatorio)
     name       → texto visible para la persona usuaria
     model      → (opcional) ruta a un .glb dentro de /static. Si existe, se carga
                  ese modelo; si falla o es null, se usa el placeholder procedural.
     builder    → (opcional) nombre del placeholder procedural a usar.
                  Si no se indica, se usa el mismo id.
     thumbnail  → (opcional) ruta a una imagen dentro de /static. Si es null,
                  la miniatura se renderiza automáticamente con Three.js.

   Ejemplo para reemplazar el cabello corto por un modelo propio:
     { id: 'short', name: 'Corto', model: 'models/avatar/hair_01.glb', thumbnail: 'images/hair_01.jpg' }
   ========================================================================== */

/* ---------- Paletas ---------- */
export const SKIN_TONES = [
  { id: '#FFDCC6', name: 'Porcelana' },
  { id: '#FFD8B5', name: 'Marfil' },
  { id: '#FFCCAB', name: 'Durazno' },
  { id: '#FFC08A', name: 'Albaricoque' },
  { id: '#FFAF7D', name: 'Miel' },
  { id: '#E18D60', name: 'Canela' },
  { id: '#C6815D', name: 'Caramelo' },
  { id: '#AF735C', name: 'Cacao' }
]

export const HAIR_COLORS = [
  { id: '#3F3B33', name: 'Negro' },
  { id: '#5A3932', name: 'Castaño' },
  { id: '#814142', name: 'Caoba' },
  { id: '#C05333', name: 'Cobrizo' },
  { id: '#F2CF37', name: 'Dorado' },
  { id: '#D2CA7F', name: 'Rubio' },
  { id: '#959092', name: 'Gris' },
  { id: '#CECCBA', name: 'Platino' },
  { id: '#448AD7', name: 'Azul' },
  { id: '#9CB8C5', name: 'Azul grisáceo' },
  { id: '#858840', name: 'Oliva' },
  { id: '#66C7B4', name: 'Turquesa' },
  { id: '#EB5352', name: 'Rojo' },
  { id: '#F58454', name: 'Naranja' },
  { id: '#DA98D0', name: 'Lila' },
  { id: '#F89FAD', name: 'Rosa' }
]

export const EYE_COLORS = [
  { id: '#616972', name: 'Pizarra' },
  { id: '#9C7657', name: 'Café' },
  { id: '#49ACB2', name: 'Turquesa' },
  { id: '#8FA17B', name: 'Musgo' },
  { id: '#527EDA', name: 'Azul' },
  { id: '#9B97A2', name: 'Gris' }
]

/* ---------- Categorías ----------
   tab:    botón de la pestaña → icono SVG (en static/images/ui) y tema de color.
           Las pestañas 'yellow' seguidas se agrupan dentro del contenedor amarillo.
   camera: encuadre al abrir la categoría ('full' | 'head' | 'body')
   thumb:  cómo se genera la miniatura automática
           'full' → avatar completo · 'bust' → busto/rostro · 'part' → solo la pieza */
export const CATEGORIES = [
  {
    id: 'body',
    label: 'Tono de piel',
    tab: { icon: 'boton-tonodepiel.svg', theme: 'yellow' },
    camera: 'full',
    groups: [
      { key: 'skin', label: 'Tono de piel', type: 'colors', options: SKIN_TONES }
    ]
  },
  {
    id: 'hair',
    label: 'Peinado',
    tab: { icon: 'boton-cabello.svg', theme: 'yellow' },
    camera: 'head',
    groups: [
      {
        key: 'hair', label: 'Estilo', type: 'options', thumb: 'bust',
        options: [
          { id: 'none', name: 'Sin cabello' },
          { id: 'short', name: 'Corto' },
          { id: 'bangs', name: 'Flequillo' },
          { id: 'spiky', name: 'Puntas' },
          { id: 'pompadour', name: 'Tupé' },
          { id: 'curly', name: 'Rizado' },
          { id: 'bob', name: 'Bob' },
          { id: 'ponytail', name: 'Cola de caballo' },
          { id: 'buns', name: 'Moños' },
          { id: 'long', name: 'Largo' }
        ]
      },
      { key: 'hairColor', label: 'Color', type: 'colors', options: HAIR_COLORS }
    ]
  },
  {
    id: 'eyes',
    label: 'Ojos',
    tab: { icon: 'boton-ojos.svg', theme: 'yellow' },
    camera: 'head',
    groups: [
      {
        // Cuatro por fila, en el orden de los botones del diseño
        key: 'eyes', label: 'Ojos', type: 'images', columns: 4,
        options: [
          { id: 'lashes', name: 'Con pestaña', image: 'images/ui/botones-ojos-01.png' },
          { id: 'classic', name: 'Clásicos', image: 'images/ui/botones-ojos-02.png' },
          { id: 'lashesTop', name: 'Pestañas arriba', image: 'images/ui/botones-ojos-03.png' },
          { id: 'sleepy', name: 'Soñolientos', image: 'images/ui/botones-ojos-04.png' },
          { id: 'soft', name: 'Suaves', image: 'images/ui/botones-ojos-08.png' },
          { id: 'brow', name: 'Con ceja', image: 'images/ui/botones-ojos-07.png' },
          { id: 'lashesBottom', name: 'Pestañas abajo', image: 'images/ui/botones-ojos-06.png' },
          { id: 'happy', name: 'Sonrientes', image: 'images/ui/botones-ojos-05.png' }
        ]
      },
      { key: 'eyeColor', label: 'Color de ojos', type: 'colors', options: EYE_COLORS }
    ]
  },
  {
    id: 'mouthNose',
    label: 'Boca y nariz',
    tab: { icon: 'boton-narizboca.svg', theme: 'yellow' },
    camera: 'head',
    groups: [
      {
        key: 'nose', label: 'Nariz', type: 'images',
        options: [
          { id: 'triangle', name: 'Triangular', image: 'images/ui/botones_nariz_boca_triangular-01.png' },
          { id: 'dot', name: 'Redonda', image: 'images/ui/botones_nariz_boca_redonda-02.png' },
          { id: 'button', name: 'Cuadrada', image: 'images/ui/botones_nariz_boca_cuadrada-03.png' }
        ]
      },
      {
        key: 'mouth', label: 'Boca', type: 'images',
        options: [
          { id: 'smile', name: 'Sonrisa', image: 'images/ui/botones_nariz_boca_sonrisa-04.png' },
          { id: 'cat', name: 'Gato', image: 'images/ui/botones_nariz_boca_gato-05.png' },
          { id: 'teeth', name: 'Dientes', image: 'images/ui/botones_nariz_boca_dientes-06.png' }
        ]
      }
    ]
  },
  {
    id: 'clothes',
    label: 'Ropa',
    tab: { icon: 'boton-ropa.svg', theme: 'blue' },
    camera: 'body',
    groups: [
      {
        /* model: prenda .glb · builder: placeholder si el modelo no carga
           hides: grupos que se ocultan al usarla (para que los modelos no se atraviesen) */
        key: 'shirt', label: 'Parte superior', type: 'options', thumb: 'part',
        options: [
          { id: 'camisa', name: 'Camiseta manzana', model: 'models/avatar/ropa/camisa.glb', builder: 'basic' },
          { id: 'camisa-2', name: 'Camiseta estrella', model: 'models/avatar/ropa/camisa-2.glb', builder: 'stamp' },
          { id: 'manga-larga', name: 'Manga larga', model: 'models/avatar/ropa/manga-larga.glb', builder: 'hoodie' },
          { id: 'chaqueta', name: 'Chaqueta negra', model: 'models/avatar/ropa/chaqueta.glb', builder: 'hoodie' },
          { id: 'chaqueta-2', name: 'Chaqueta de jean', model: 'models/avatar/ropa/chaqueta-2.glb', builder: 'polo' },
          { id: 'vestido', name: 'Vestido', model: 'models/avatar/ropa/vestido.glb', builder: 'dress' }
        ]
      },
      {
        key: 'pants', label: 'Parte inferior', type: 'options', thumb: 'part',
        options: [
          { id: 'jean', name: 'Jean', model: 'models/avatar/ropa/jean.glb', builder: 'jeans' },
          { id: 'short', name: 'Short', model: 'models/avatar/ropa/short.glb', builder: 'shorts' },
          { id: 'falda', name: 'Falda', model: 'models/avatar/ropa/falda.glb', builder: 'skirt' },
          { id: 'overol', name: 'Overol', model: 'models/avatar/ropa/overol.glb', builder: 'overalls', hides: ['shirt'] }
        ]
      },
      {
        key: 'shoes', label: 'Zapatos', type: 'options', thumb: 'part',
        options: [
          { id: 'sneakers', name: 'Tenis' },
          { id: 'boots', name: 'Botas' },
          { id: 'sandals', name: 'Sandalias' }
        ]
      }
    ]
  },
  {
    id: 'objects',
    label: 'Llavero',
    tab: { icon: 'boton-llavero.svg', theme: 'green' },
    camera: 'full',
    groups: [
      {
        key: 'companion', label: 'Llavero', type: 'options', thumb: 'part',
        options: [
          { id: 'none', name: 'Nada' },
          { id: 'shopbag', name: 'Bolsa MINISO' },
          { id: 'mug', name: 'Taza' },
          { id: 'bouquet', name: 'Ramo de flores' },
          { id: 'leafumbrella', name: 'Sombrilla de hoja' },
          { id: 'balloon', name: 'Globo' },
          { id: 'cat', name: 'Gatito' },
          { id: 'dog', name: 'Perrito' },
          { id: 'bird', name: 'Pajarito' }
        ]
      }
    ]
  }
]

/* ---------- Avatar por defecto (también se usa al "Reiniciar") ----------
   Las claves que no tienen grupo en CATEGORIES (bodyType, colores de ropa y
   accesorios) no son editables: siempre conservan el valor de aquí. */
export const DEFAULT_AVATAR = {
  bodyType: 'standard',
  skin: '#FFD8B5',
  hair: 'short',
  hairColor: '#5A3932',
  eyes: 'classic',
  eyeColor: '#9C7657',
  nose: 'button',
  mouth: 'smile',
  mouthColor: '#6B3A2E',
  ears: 'round',
  shirt: 'camisa',
  shirtColor: '#9ACB8A',
  pants: 'jean',
  pantsColor: '#4A6FA5',
  shoes: 'sneakers',
  shoesColor: '#F7F5F0',
  accHead: 'none',
  accFace: 'none',
  accNeck: 'none',
  companion: 'none'
}

/* ---------- Piezas fijas del personaje modelado ----------
   Cuerpo y cabeza (con orejas) vienen de static/models/avatar. null deja el slot
   vacío. Si se quitan estas rutas, el avatar vuelve a las piezas procedurales. */
export const BASE_MODELS = {
  body: 'models/avatar/cuerpo.glb',
  head: 'models/avatar/cabeza.glb',
  ears: null
}

/* ---------- Utilidades de consulta (no es necesario editarlas) ---------- */
const GROUP_INDEX = {}
CATEGORIES.forEach(cat => cat.groups.forEach(g => { GROUP_INDEX[g.key] = { ...g, category: cat.id } }))

export function getGroup (key) {
  return GROUP_INDEX[key]
}

export function getOption (key, id) {
  const g = GROUP_INDEX[key]
  if (!g) return null
  return g.options.find(o => o.id === id) || null
}

export function getOptionName (key, id) {
  const o = getOption(key, id)
  return o ? o.name : id
}

/** Devuelve un avatar válido: completa claves faltantes y descarta valores inexistentes. */
export function sanitizeAvatar (data) {
  const out = { ...DEFAULT_AVATAR }
  if (!data || typeof data !== 'object') return out
  Object.keys(DEFAULT_AVATAR).forEach(key => {
    if (data[key] !== undefined && getOption(key, data[key])) out[key] = data[key]
  })
  return out
}

/** Grupos ocultos por la ropa elegida (p. ej. el overol oculta la parte superior). */
export function hiddenKeys (state) {
  const hidden = new Set()
  Object.keys(GROUP_INDEX).forEach(key => {
    const o = getOption(key, state[key])
    if (o && o.hides) o.hides.forEach(h => hidden.add(h))
  })
  return hidden
}

/** Al elegir algo en un grupo oculto, la prenda que lo tapaba vuelve a la de por defecto
    (elegir una camiseta con el overol puesto cambia el overol por el jean). */
export function resolveHides (state, key) {
  const out = { ...state }
  Object.keys(GROUP_INDEX).forEach(k => {
    const o = getOption(k, out[k])
    if (k !== key && o && o.hides && o.hides.includes(key)) out[k] = DEFAULT_AVATAR[k]
  })
  return out
}

/** Avatar aleatorio para el botón "Sorpréndeme". */
export function randomAvatar () {
  const out = { ...DEFAULT_AVATAR }
  Object.keys(GROUP_INDEX).forEach(key => {
    const opts = GROUP_INDEX[key].options
    out[key] = opts[Math.floor(Math.random() * opts.length)].id
  })
  return out
}
