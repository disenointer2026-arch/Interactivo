/* ==========================================================================
   CONTENIDO DEL SITIO
   Cambia aquí textos, testimonios, productos, precios y tiendas.
   No hace falta tocar el HTML ni la lógica.
   ========================================================================== */

export const SITE = {
  title: 'MINISO × Animal Crossing — Crea tu avatar',
  disclaimer: 'Prototipo académico de Diseño Interactivo. Colaboración ficticia sin relación comercial con MINISO ni con Nintendo. Las marcas mencionadas pertenecen a sus titulares.'
}

/* Navegación del encabezado de las pantallas internas (estudio, pedido, tarjeta…) */
export const NAV = [
  { label: 'Colaboración', section: 'colaboracion' },
  { label: 'Testimonios', section: 'testimonios' }
]

/* Secciones del sitio real de MINISO a las que apuntan el menú y el pie del inicio.
   Cambia aquí una dirección y se actualiza en los dos sitios. */
export const MINISO_LINKS = {
  marca: 'https://miniso.com/brand/index.html',
  productos: 'https://miniso.com/product/index.html',
  tiendas: 'https://miniso.com/shop/image_3.html',
  inversores: 'https://ir.miniso.com/',
  social: 'https://miniso.com/social/'
}

/* Navegación del encabezado del inicio. Todo lo que empieza por http sale a
   miniso.com y se abre en una pestaña nueva. */
export const HOME_NAV = [
  { label: 'Inicio', href: '#/' },
  { label: 'Marca', href: MINISO_LINKS.marca },
  { label: 'Productos', href: MINISO_LINKS.productos },
  { label: 'Tiendas', href: MINISO_LINKS.tiendas },
  { label: 'Inversores', href: MINISO_LINKS.inversores },
  { label: 'Responsabilidad social', href: MINISO_LINKS.social }
]

/* Anclas dentro del inicio (menú lateral del inicio) */
export const SECTIONS = [
  { label: 'La colaboración', section: 'colaboracion' },
  { label: 'Cómo funciona', section: 'como-funciona' },
  { label: 'Testimonios', section: 'testimonios' }
]

/* Menú lateral (según el sitemap) */
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
  banner: {
    src: 'images/hero-banner.webp',
    alt: 'Llaveros y figuras de la colaboración MINISO × Animal Crossing sobre un muelle de la isla, con Canela, Tom Nook y dos vecinos.',
    title: '¡Lleva la ternura de la isla a tu hogar!'
  },
  build: {
    title: 'Construye tu avatar. Hazlo tuyo.',
    text: 'Esta colaboración une el diseño práctico de MINISO con el espíritu relajado de Animal Crossing. Aquí no eliges un producto de un catálogo: lo diseñas tú.',
    text2: 'Elige su cabello, su ropa, sus accesorios y hasta quién lo acompaña. Cuando esté listo, lo convertimos en una figura que puedes tener en tus manos.',
    cta: '¡Hacer mi avatar!',
    hint: 'Arrastra para girarlo',
    dragHint: 'Mueve la visualización',
    /* Marca de agua detrás del texto */
    face: { src: 'images/cara-miniso.png' }
  },
  /* Banda con carrusel: añade o quita imágenes en "slides" */
  band: {
    kicker: 'MINISO × Animal Crossing',
    title: 'Participa en nuestra nueva colección.',
    cta: '¡Hacer mi avatar!',
    slides: [
      {
        src: 'images/lifestyle-pareja.jpg',
        alt: 'Dos personas sentadas muestran una mochila con un llavero de Canela y una figura personalizada en la mano.'
      },
      {
        src: 'images/coleccion-figuras.jpg',
        alt: 'Figuras y llaveros de la colección junto a una mochila verde menta con hojas estampadas.'
      }
    ]
  },
  island: {
    title: 'Cómo funciona',
    text: 'Cuatro pasos entre la primera decisión y la caja con ventana.',
    steps: [
      { title: 'Crea', text: 'Arma tu avatar pieza por pieza, desde la forma del cuerpo hasta sus orejas.' },
      { title: 'Transforma', text: 'Cada decisión cambia el avatar al instante. Prueba, deshaz y vuelve a probar.' },
      { title: 'Contempla', text: 'Gíralo, acércate y reconoce en él algo tuyo.' },
      { title: 'Materializa', text: 'Pide tu figura y genera tu tarjeta coleccionable.' }
    ]
  },
  testimonials: {
    title: 'Ellos te lo cuentan',
    cta: '¡Hacer mi avatar!'
  }
}

/* Personajes que se asoman por detrás del seto de abajo.
   x = posición horizontal en %, h = alto de la imagen, show = cuánto asoma (px),
   anim = sway | wave | bob, small = si también se ve en pantallas estrechas. */
export const PEEK = [
  { src: 'images/personajes/canela.png', alt: 'Canela', x: 19, h: 300, show: 196, anim: 'sway', delay: 0, small: true },
  { src: 'images/personajes/tom-nook.png', alt: 'Tom Nook', x: 32, h: 290, show: 186, anim: 'wave', delay: -0.8, small: true },
  { src: 'images/personajes/aldeana.png', alt: 'Aldeana con gafas', x: 45, h: 185, show: 152, anim: 'bob', delay: -2.2, small: false },
  { src: 'images/personajes/candres.png', alt: 'Candrés', x: 56, h: 285, show: 180, anim: 'wave', delay: -3.1, small: false },
  { src: 'images/personajes/wilbur.png', alt: 'Wilbur', x: 68, h: 260, show: 168, anim: 'sway', delay: -1.9, small: true }
]

/* Pie de página del inicio (columnas del sitemap + datos de contacto).
   Si una columna lleva "href", su título también es un enlace. */
export const FOOTER = {
  inquiriesLabel: 'Consultas de franquicia',
  email: 'Franchise@miniso.com',
  columns: [
    {
      title: 'Marca',
      href: MINISO_LINKS.marca,
      links: [{ label: 'Perfil de marca', href: MINISO_LINKS.marca }]
    },
    {
      title: 'Productos',
      href: MINISO_LINKS.productos,
      links: [
        { label: 'Colaboración IP', href: MINISO_LINKS.productos },
        { label: '¡Hacer mi avatar!', href: '#/personalizar' }
      ]
    },
    {
      title: 'Tiendas',
      href: MINISO_LINKS.tiendas,
      links: [{ label: 'Nuestras tiendas', href: MINISO_LINKS.tiendas }]
    },
    { title: 'Inversores', href: MINISO_LINKS.inversores, links: [] },
    { title: 'Responsabilidad social', href: MINISO_LINKS.social, links: [] }
  ],
  copyright: 'Copyright © 2026 · MINISO × Animal Crossing (colaboración ficticia)'
}

/* Testimonios: los retratos se renderizan en 3D a partir de estas configuraciones.
   Las personas son ficticias. */
export const TESTIMONIALS = [
  {
    name: 'Valentina', place: 'Cali',
    quote: 'Le puse mis gafas redondas y mi bufanda roja. Cuando llegó la figura, mi mamá dijo que era yo en miniatura.',
    avatar: { hair: 'bob', hairColor: '#3F3B33', accFace: 'roundglasses', accNeck: 'scarf', shirt: 'basic', shirtColor: '#F6F1E6', skin: '#FFAF7D', mouth: 'open', mouthColor: '#E0706A' }
  },
  {
    name: 'Andrés', place: 'Medellín',
    quote: 'Pensé que iba a tardar dos minutos y me quedé media hora probando peinados. La tarjeta la tengo de fondo de pantalla.',
    avatar: { hair: 'spiky', hairColor: '#C05333', shirt: 'hoodie', shirtColor: '#3A4A5A', accHead: 'headphones', skin: '#C6815D', eyes: 'big', eyeColor: '#9C7657' }
  },
  {
    name: 'Mariana', place: 'Bogotá',
    quote: 'Me encantó poder poner a mi gata. Es el regalo de cumpleaños más personal que le he dado a mi hermana.',
    avatar: { hair: 'long', hairColor: '#D2CA7F', shirt: 'dress', shirtColor: '#F2A7B8', companion: 'cat', skin: '#FFDCC6', eyes: 'happy', accHead: 'flower' }
  },
  {
    name: 'Samuel', place: 'Barranquilla',
    quote: 'Recogí mi pedido en la tienda y ya venía en una cajita con ventana. Se siente como un coleccionable de verdad.',
    avatar: { hair: 'curly', hairColor: '#3F3B33', shirt: 'polo', shirtColor: '#F6D365', skin: '#AF735C', accHead: 'strawhat', companion: 'shopbag' }
  },
  {
    name: 'Lucía', place: 'Pereira',
    quote: 'Nada de plantillas: cada decisión la tomé yo. Por eso se siente mío.',
    avatar: { hair: 'buns', hairColor: '#F89FAD', shirt: 'stripes', shirtColor: '#7FB3D5', skin: '#FFCCAB', accFace: 'blush', eyes: 'almond', eyeColor: '#9B97A2' }
  },
  {
    name: 'Tomás', place: 'Cartagena',
    quote: 'Hice uno para mí y otro para mi abuelo, con su sombrero y su perro. Los dos están en su repisa.',
    avatar: { hair: 'none', shirt: 'polo', shirtColor: '#F6F1E6', skin: '#AF735C', accHead: 'cap', companion: 'dog', accFace: 'roundglasses' }
  }
]

/* Productos físicos (precios ficticios en COP) */
export const PRODUCTS = [
  { id: 'figure', name: 'Figura', detail: 'Una figura de tu avatar con el llavero que se seleccionó, incluye una cadena para uso como llavero y una base de acrílico para su uso como figura coleccionable.', price: 89900, days: '7 a 10 días hábiles' }
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
  themes: [
    { id: 'spring', name: 'Primavera', from: '#DDF0D2', to: '#FFF4D6', leaf: '#7DB46C' },
    { id: 'beach', name: 'Playa', from: '#CFEAF2', to: '#FFF1D2', leaf: '#5FA3B8' },
    { id: 'autumn', name: 'Otoño', from: '#F8DDC0', to: '#FFF3DD', leaf: '#D08A43' },
    { id: 'night', name: 'Noche', from: '#C9CBEA', to: '#F3E9F7', leaf: '#7D7AB8' }
  ],
  series: 'Serie Isla 01'
}
