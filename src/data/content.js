/* ==========================================================================
   CONTENIDO DEL SITIO
   Cambia aquí textos, testimonios, productos, precios y tiendas.
   No hace falta tocar el HTML ni la lógica.
   ========================================================================== */

export const SITE = {
  title: 'MINISO × Animal Crossing — Crea tu avatar',
  disclaimer: 'Prototipo académico de Diseño Interactivo. Colaboración ficticia sin relación comercial con MINISO ni con Nintendo. Las marcas mencionadas pertenecen a sus titulares.'
}

/* Secciones del sitio real de MINISO a las que apuntan el menú y el pie.
   Cambia aquí una dirección y se actualiza en los dos sitios. */
export const MINISO_LINKS = {
  colombia: 'https://www.miniso.co/',
  marca: 'https://miniso.com/brand/index.html',
  productos: 'https://miniso.com/product/index.html',
  tiendas: 'https://miniso.com/shop/image_3.html',
  inversores: 'https://ir.miniso.com/',
  social: 'https://miniso.com/social/'
}

/* Navegación del encabezado (todas las pantallas). Todo lo que empieza por http sale a
   miniso.com y se abre en una pestaña nueva. */
/* Encabezado: cada enlace baja a una sección del inicio (id de la sección) */
export const HOME_NAV = [
  { label: 'Inicio', section: 'inicio' },
  { label: 'Colaboración', section: 'colaboracion' },
  { label: 'Testimonios', section: 'testimonios' }
]

/* Enlaces a miniso.com (menú lateral) */
export const MINISO_NAV = [
  { label: 'Marca', href: MINISO_LINKS.marca },
  { label: 'Productos', href: MINISO_LINKS.productos },
  { label: 'Tiendas', href: MINISO_LINKS.tiendas },
  { label: 'Inversores', href: MINISO_LINKS.inversores },
  { label: 'Responsabilidad social', href: MINISO_LINKS.social }
]

/* Anclas dentro del inicio (menú lateral) */
export const SECTIONS = [
  { label: 'La colaboración', section: 'colaboracion' },
  { label: 'Testimonios', section: 'testimonios' }
]

/* Páginas informativas internas (#/info/…) */
export const MENU = [
  { id: 'marca', label: 'Marca' },
  { id: 'productos', label: 'Productos' },
  { id: 'tiendas', label: 'Tiendas' },
  { id: 'inversores', label: 'Inversores' },
  { id: 'responsabilidad', label: 'Responsabilidad social' }
]

export const INFO_PAGES = {
  marca: {
    title: 'Marca',
    body: 'Diseño cotidiano, precios amables y objetos que acompañan la vida diaria. Esta página es un espacio reservado dentro del prototipo para el contenido institucional de la marca.'
  },
  productos: {
    title: 'Productos',
    body: 'Aquí vivirá el catálogo general. Dentro de esta colaboración, el producto protagonista es el que tú diseñas: una figura de tu avatar que funciona como llavero o como coleccionable.'
  },
  tiendas: {
    title: 'Tiendas',
    body: 'Puedes recoger tu pedido en una tienda participante. En el prototipo, las tiendas aparecen como opciones de ejemplo durante el pedido.'
  },
  inversores: {
    title: 'Inversores',
    body: 'Espacio reservado para información corporativa. No forma parte del recorrido principal de la experiencia.'
  },
  responsabilidad: {
    title: 'Responsabilidad social',
    body: 'Las figuras de esta colaboración usan empaques reciclables y se fabrican bajo pedido para evitar inventario sobrante. Contenido de ejemplo para el prototipo.'
  }
}

/* ==========================================================================
   INICIO
   Las imágenes salen de static/images (se sirven desde la raíz: images/...).
   Cambia la ruta y el texto alternativo de cada banda aquí.
   ========================================================================== */
export const HOME = {
  /* Portada: la isla 3D girando sobre un texto grande de fondo */
  banner: {
    title: '¡Lleva la ternura de la isla a tu hogar!',
    word: 'Lo más nuevo',
    hint: 'Arrástrala para girarla',
    dragHint: 'Mueve la isla'
  },
  /* Texto de apertura, centrado bajo la portada */
  build: {
    title: '¡Tu mundo, tu estilo, tu personaje!',
    text: 'Cada persona tiene una forma única de expresarse y ahora puedes darle vida a través de tu propio avatar. MINISO × Animal Crossing te invita a explorar, combinar prendas, colores y accesorios para crear un personaje que refleje tus gustos, tu estilo y tu personalidad. Una experiencia que transforma una compra en algo más significativo: un producto con el que puedes sentirte identificado, representado y que, sobre todo, tenga algo de ti.',
    cta: '¡Hacer mi avatar!'
  },
  testimonials: {
    title: 'Ellos te lo cuentan',
    cta: '¡Hacer mi avatar!'
  }
}

/* Vecinos asomados por detrás del seto que abre el pie de página.
   x     = borde izquierdo, en % del ancho de la página
   xm/xs = dónde se coloca cuando se esconden los demás (hasta 1100 y 760 px)
   h     = alto de la imagen en px
   show  = cuánto se ve por encima de la línea de corte (lo de abajo lo tapa
           el seto); conviene dejar la cara bien por encima de las hojas
   anim  = sway (se mece) | bob (sube y baja) | greet (se mece y da un brinco)
   tier  = always (siempre) | mid (desde 760 px) | wide (desde 1100 px) */
export const PEEK = [
  { src: 'images/personajes/canela.png', alt: 'Canela', x: 2, xs: 3, h: 330, show: 230, anim: 'sway', delay: 0, tier: 'always' },
  { src: 'images/personajes/tom-nook.png', alt: 'Tom Nook', x: 14, xm: 22, h: 300, show: 212, anim: 'greet', delay: -0.8, tier: 'mid' },
  { src: 'images/personajes/candres.png', alt: 'Candrés', x: 26, h: 315, show: 222, anim: 'bob', delay: -2.2, tier: 'wide' },
  { src: 'images/personajes/porter.png', alt: 'Estibaldo', x: 54, h: 340, show: 238, anim: 'greet', delay: -4.6, tier: 'wide' },
  { src: 'images/personajes/kappn.png', alt: 'Capitán', x: 75, xm: 58, h: 310, show: 218, anim: 'sway', delay: -1.9, tier: 'mid' },
  { src: 'images/personajes/wilbur.png', alt: 'Wilbur', x: 87, xm: 80, xs: 60, h: 295, show: 208, anim: 'bob', delay: -3.3, tier: 'always' }
]

/* Pie de página (columnas del sitemap + datos de contacto).
   Si una columna lleva "href", su título también es un enlace. */
export const FOOTER = {
  inquiriesLabel: 'Consultas de franquicia',
  email: 'Franchise@miniso.com',
  /* El pie repite el mismo menú: las secciones del encabezado (HOME_NAV) y los
     enlaces a miniso.com del menú lateral (MINISO_NAV). Ver renderFooter. */
  navTitle: 'La colaboración',
  brandTitle: 'MINISO',
  copyright: 'Copyright © 2026 · MINISO × Animal Crossing (colaboración ficticia)'
}

/* Testimonios: los retratos se renderizan en 3D a partir de estas configuraciones.
   Las personas son ficticias. */
export const TESTIMONIALS = [
  {
    name: 'Valentina', place: 'Cali',
    quote: 'Le puse mis gafas redondas y el pelo con ondas, igualito al mío. Cuando llegó la figura, mi mamá dijo que era yo en miniatura.',
    avatar: { hair: 'ondas', hairColor: '#3F3B33', accHead: 'gafas-redondas', shirt: 'camisa', shirtColor: '#F6F1E6', skin: '#FFAF7D', mouth: 'teeth' }
  },
  {
    name: 'Andrés', place: 'Medellín',
    quote: 'Pensé que iba a tardar dos minutos y me quedé media hora probando peinados. La tarjeta la tengo de fondo de pantalla.',
    avatar: { hair: 'picos', hairColor: '#C05333', shirt: 'chaqueta', shirtColor: '#3A4A5A', accHead: 'audifonos', skin: '#C6815D', eyes: 'lashes', eyeColor: '#9C7657' }
  },
  {
    name: 'Mariana', place: 'Bogotá',
    quote: 'Le armé una a mi hermana, con el pelo largo, una flor y el tulipán de charm. Es el regalo de cumpleaños más personal que le he dado.',
    avatar: { hair: 'largo', hairColor: '#D2CA7F', shirt: 'vestido', shirtColor: '#F2A7B8', companion: 'tulipan', skin: '#FFDCC6', eyes: 'happy', accHead: 'flor' }
  },
  {
    name: 'Samuel', place: 'Barranquilla',
    quote: 'Le puse sombrero, chaqueta de jean y un regalo de charm. La figura llegó con su cadena y su base de acrílico, y se siente como un coleccionable de verdad.',
    avatar: { hair: 'afro', hairColor: '#3F3B33', shirt: 'chaqueta-2', shirtColor: '#F6D365', skin: '#AF735C', accHead: 'sombrero', companion: 'regalo' }
  },
  {
    name: 'Lucía', place: 'Pereira',
    quote: 'Nada de plantillas: elegí cada detalle, hasta el color de las colitas. Por eso se siente mío.',
    avatar: { hair: 'colitas', hairColor: '#F89FAD', shirt: 'camisa-2', shirtColor: '#7FB3D5', skin: '#FFCCAB', eyes: 'lashesTop', eyeColor: '#9B97A2' }
  },
  {
    name: 'Tomás', place: 'Cartagena',
    quote: 'Hice uno para mí y otro para mi abuelo, con su gorra y su guitarra de charm. Los dos están en su repisa.',
    avatar: { hair: 'none', shirt: 'manga-larga', shirtColor: '#F6F1E6', skin: '#AF735C', accHead: 'gorra', companion: 'guitarra' }
  }
]

/* Avatares que se turnan en la portada (uno por segundo) para mostrar que el
   producto es personalizable. Las claves que faltan toman el valor por defecto. */
export const HERO_AVATARS = [
  { hair: 'afro', hairColor: '#5A3932', skin: '#C6815D', accHead: 'gafas-sol', shirt: 'camisa-2', shirtColor: '#F2E4C4', pants: 'short', pantsColor: '#8FB4E3', shoes: 'sandalias', shoesColor: '#F7F5F0', nose: 'dot', mouth: 'smile' },
  { hair: 'largo', hairColor: '#66C7B4', skin: '#FFDCC6', accHead: 'flor', shirt: 'vestido', shirtColor: '#2B2B2E', pants: 'falda', pantsColor: '#F7F2E8', shoes: 'zapatos-2', shoesColor: '#F7F5F0', eyes: 'lashes', eyeColor: '#E8508A', nose: 'button', mouth: 'teeth' },
  { hair: 'ondas', hairColor: '#814142', skin: '#FFC08A', accHead: 'audifonos', shirt: 'chaqueta-2', shirtColor: '#5F86A8', pants: 'jean', pantsColor: '#3B3B3F', shoes: 'zapatos', shoesColor: '#F7F5F0', eyes: 'soft', eyeColor: '#9C7657', nose: 'triangle', mouth: 'cat' },
  { hair: 'colitas', hairColor: '#3F3B33', skin: '#FFD8B5', accHead: 'audifonos', shirt: 'chaqueta', shirtColor: '#2B2B2E', pants: 'short', pantsColor: '#8FB4E3', shoes: 'zapatos-2', shoesColor: '#F7F5F0', eyes: 'lashes', eyeColor: '#9C7657', nose: 'dot', mouth: 'cat' },
  { hair: 'none', skin: '#FFD8B5', accHead: 'gafas-redondas', shirt: 'camisa', shirtColor: '#F6F1E6', pants: 'overol', pantsColor: '#6F96C8', shoes: 'zapatos', shoesColor: '#F7F5F0', eyes: 'classic', eyeColor: '#8FA17B', nose: 'triangle', mouth: 'cat' },
  { hair: 'flequillo', hairColor: '#F89FAD', skin: '#FFD8B5', accHead: 'balaca', shirt: 'camisa', shirtColor: '#F6D032', pants: 'jean', pantsColor: '#3B3B3F', shoes: 'sandalias', shoesColor: '#E8C9A0', eyes: 'lashesTop', eyeColor: '#9C7657', nose: 'dot', mouth: 'smile' }
]

/* Productos físicos (precios ficticios en COP) */
export const PRODUCTS = [
  { id: 'figure', name: 'Figura', detail: 'Una figura de tu avatar con el charm que se seleccionó, incluye una cadena para uso como llavero y una base de acrílico para su uso como figura coleccionable. Mide 17 cm de alto con la base, que tiene 10 cm de diámetro; la cadena mide 7 cm y el charm unos 4 cm.', price: 89900, days: '7 a 10 días hábiles' }
]

export const SHIPPING = { cost: 9900, freeFrom: 150000 }

export const STORES = {
  Cali: ['MINISO Chipichape', 'MINISO Unicentro', 'MINISO Jardín Plaza'],
  Bogotá: ['MINISO Andino', 'MINISO Titán Plaza', 'MINISO Unicentro Bogotá'],
  Medellín: ['MINISO Santafé', 'MINISO El Tesoro'],
  Barranquilla: ['MINISO Buenavista'],
  Pereira: ['MINISO Parque Arboleda'],
  Cartagena: ['MINISO Caribe Plaza']
}

export const BANKS = ['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA', 'Banco de Occidente', 'Nequi']

/* Tarjeta coleccionable */
export const CARD = {
  months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  /* Plantillas SVG de static/images/tarjetas. from/to = muestra del selector (fondo y
     franja inferior); accent = color del número, el mismo de la plantilla */
  themes: [
    { id: 'hoja', name: 'Hoja', svg: 'images/tarjetas/hoja.svg', from: '#A9B15E', to: '#1B3204', accent: '#6A7E37' },
    { id: 'cereza', name: 'Cereza', svg: 'images/tarjetas/cereza.svg', from: '#EF92AE', to: '#AB214F', accent: '#E62F82' },
    { id: 'oceano', name: 'Océano', svg: 'images/tarjetas/oceano.svg', from: '#AEDEF4', to: '#0969A5', accent: '#04BCE0' },
    { id: 'sol', name: 'Sol', svg: 'images/tarjetas/sol.svg', from: '#FAC900', to: '#D8590C', accent: '#F08C00' },
    { id: 'fosil', name: 'Fósil', svg: 'images/tarjetas/fosil.svg', from: '#DDAA7F', to: '#582B25', accent: '#9F7976' }
  ]
}
