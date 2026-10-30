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
  { id: '#AF735C', name: 'Cacao' },
  // Tonos de fantasía (como en el juego): "Sorpréndeme" no los elige nunca
  { id: '#FBF8F0', name: 'Nube', fantasy: true },
  { id: '#A9C48F', name: 'Hoja', fantasy: true },
  { id: '#8EC5F2', name: 'Cielo', fantasy: true },
  { id: '#A89CF6', name: 'Lavanda', fantasy: true }
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
  { id: '#9B97A2', name: 'Gris' },
  // Colores de fantasía (como en el juego): "Sorpréndeme" no los elige nunca
  { id: '#E8508A', name: 'Fucsia', fantasy: true },
  { id: '#F08A4B', name: 'Mandarina', fantasy: true },
  { id: '#F5C24B', name: 'Dorado', fantasy: true },
  { id: '#E98CE6', name: 'Orquídea', fantasy: true },
  { id: '#C9C3DE', name: 'Perla', fantasy: true },
  { id: '#5CC2A8', name: 'Menta', fantasy: true }
]

/* Los llaveros quedan en el suelo, detrás del personaje y un poco a su izquierda
   (a la derecha vista de frente), girados hacia la cámara. Se aplica en Avatar.js. */
const KEYCHAIN_SPOT = { position: [0.46, 0, -0.34], rotation: [0, -0.45, 0] }
/* La balaca, el moño y la flor se modelaron sobre la cabeza sin cabello: se agrandan
   un poco desde el centro de la cabeza para que queden por encima del peinado.
   La balaca crece solo hacia arriba y se estrecha un poco (x, y, z): el modelo es más
   ancho que la cabeza y, si se abriera a los lados, flotaría */
const OVER_HAIR = { scale: 1.08 }
const BAND_FIT = {
  scale: [0.95, 1.05, 1.02],
  // Con el afro se inclina ~10° y sube un poco más, para caer en un hueco entre los rizos
  byHair: { afro: { rotation: [0.17, 0, 0], scale: [0.95, 1.1, 1.02] } }
}
// Los audífonos quedan como están, salvo con el afro: el arco sube y se inclina un poco
// hacia adelante para pasar por encima de los rizos
const HEADPHONES_FIT = { byHair: { afro: { rotation: [-0.1, 0, 0], scale: [1, 1.18, 1] } } }

/* Las narices son naranjas, como en sus botones (entre #EA6032 y #F1935F); no
   cambian con el tono de piel */
const NOSE_ORANGE = '#EC713F'
/* Achica una nariz desde donde toca la cara (altura y, superficie a z = 0.40), para que
   siga pegada a ella. La cuadrada y la redonda eran más grandes que en el juego */
function noseScale (s, y, z = 0.4) {
  return { scale: s, position: [0, y * (1 - s), z * (1 - s)] }
}

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
        // Miniaturas casi de perfil y un poco desde arriba, para ver moños, colas y la forma del peinado
        key: 'hair', label: 'Estilo', type: 'options', thumb: 'bust', thumbView: { angle: 1.3, elevation: 0.22 },
        options: [
          { id: 'none', name: 'Sin cabello' },
          { id: 'corto', name: 'Corto', model: 'models/avatar/cabello/corto.glb', builder: 'short' },
          { id: 'flequillo', name: 'Flequillo', model: 'models/avatar/cabello/flequillo.glb', builder: 'bangs' },
          { id: 'picos', name: 'Picos', model: 'models/avatar/cabello/picos.glb', builder: 'spiky' },
          { id: 'ondas', name: 'Ondas', model: 'models/avatar/cabello/ondas.glb', builder: 'bob' },
          { id: 'afro', name: 'Afro', model: 'models/avatar/cabello/afro.glb', builder: 'curly' },
          { id: 'colitas', name: 'Colitas', model: 'models/avatar/cabello/colitas.glb', builder: 'buns' },
          { id: 'largo', name: 'Largo', model: 'models/avatar/cabello/largo.glb', builder: 'long' }
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
          { id: 'triangle', name: 'Triangular', image: 'images/ui/botones_nariz_boca_triangular-01.png', model: 'models/avatar/nariz/triangular.glb', color: NOSE_ORANGE },
          { id: 'dot', name: 'Redonda', image: 'images/ui/botones_nariz_boca_redonda-02.png', model: 'models/avatar/nariz/redonda.glb', color: NOSE_ORANGE, place: noseScale(0.68, -0.058) },
          { id: 'button', name: 'Cuadrada', image: 'images/ui/botones_nariz_boca_cuadrada-03.png', model: 'models/avatar/nariz/cuadrada.glb', color: NOSE_ORANGE, place: noseScale(0.72, -0.066) }
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
          { id: 'zapatos', name: 'Zapatos negros', model: 'models/avatar/zapatos/zapatos.glb', builder: 'sneakers' },
          { id: 'zapatos-2', name: 'Zapatos azules', model: 'models/avatar/zapatos/zapatos-2.glb', builder: 'sneakers' },
          { id: 'botas', name: 'Botas', model: 'models/avatar/zapatos/botas.glb', builder: 'boots' },
          { id: 'sandalias', name: 'Sandalias', model: 'models/avatar/zapatos/sandalias.glb', builder: 'sandals' }
        ]
      },
      {
        // Un accesorio a la vez (gorros, gafas, audífonos…), todos sobre la cabeza.
        // hairCut: altura del borde del sombrero sobre el centro de la cabeza; el pelo que
        // queda por encima se oculta (va debajo del sombrero, como en el juego)
        key: 'accHead', label: 'Accesorios', type: 'options', thumb: 'part',
        options: [
          { id: 'none', name: 'Sin accesorio' },
          { id: 'gorra', name: 'Gorra', model: 'models/avatar/accesorios/gorra.glb', hairCut: 0.2 },
          { id: 'sombrero', name: 'Sombrero', model: 'models/avatar/accesorios/sombrero.glb', hairCut: 0.21 },
          { id: 'balaca', name: 'Balaca', model: 'models/avatar/accesorios/balaca.glb', place: BAND_FIT },
          { id: 'mono', name: 'Moño', model: 'models/avatar/accesorios/mono.glb', place: OVER_HAIR },
          { id: 'flor', name: 'Flor', model: 'models/avatar/accesorios/flor.glb', place: OVER_HAIR },
          { id: 'audifonos', name: 'Audífonos', model: 'models/avatar/accesorios/audifonos.glb', place: HEADPHONES_FIT },
          { id: 'gafas', name: 'Gafas', model: 'models/avatar/accesorios/gafas.glb' },
          { id: 'gafas-redondas', name: 'Gafas redondas', model: 'models/avatar/accesorios/gafas-redondas.glb' },
          { id: 'gafas-sol', name: 'Gafas de sol', model: 'models/avatar/accesorios/gafas-sol.glb' }
        ]
      }
    ]
  },
  {
    id: 'objects',
    label: 'Charm',
    tab: { icon: 'boton-llavero.svg', theme: 'green' },
    camera: 'full',
    groups: [
      {
        key: 'companion', label: 'Charm', type: 'options', thumb: 'part',
        options: [
          { id: 'none', name: 'Nada' },
          { id: 'bolsa-dinero', name: 'Bolsa de dinero', model: 'models/avatar/llaveros/bolsa-dinero.glb', place: KEYCHAIN_SPOT },
          { id: 'guitarra', name: 'Guitarra', model: 'models/avatar/llaveros/guitarra.glb', place: KEYCHAIN_SPOT },
          { id: 'moneda', name: 'Moneda', model: 'models/avatar/llaveros/moneda.glb', place: KEYCHAIN_SPOT },
          { id: 'nota-musical', name: 'Nota musical', model: 'models/avatar/llaveros/nota-musical.glb', place: KEYCHAIN_SPOT },
          { id: 'regalo', name: 'Regalo', model: 'models/avatar/llaveros/regalo.glb', place: KEYCHAIN_SPOT },
          { id: 'tulipan', name: 'Tulipán', model: 'models/avatar/llaveros/tulipan.glb', place: KEYCHAIN_SPOT }
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
  hair: 'corto',
  hairColor: '#5A3932',
  eyes: 'brow',
  eyeColor: '#9C7657',
  nose: 'triangle',
  mouth: 'smile',
  mouthColor: '#5F4C45',
  ears: 'round',
  shirt: 'camisa',
  shirtColor: '#9ACB8A',
  pants: 'short',
  pantsColor: '#4A6FA5',
  shoes: 'zapatos',
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
    (elegir una camiseta con el overol puesto cambia el overol por el short). */
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
    const opts = GROUP_INDEX[key].options.filter(o => !o.fantasy)
    out[key] = opts[Math.floor(Math.random() * opts.length)].id
  })
  return out
}
