/* ==========================================================================
   CONFIGURACIÓN DE LA ESCENA 3D
   Colores del ambiente, luces, cámara y modelos .glb opcionales.
   ========================================================================== */

export const SCENE = {
  // Isla final (exportada con tools/blender/export_island.py): reemplaza todo el ambiente
  // procedural. Si es null o no carga, se usa la isla procedural de abajo.
  islandModel: 'models/environment/isla.glb',

  // Modelos sueltos opcionales para la isla procedural (rutas dentro de /static; null = procedural)
  environmentModels: {
    floor: null, // 'models/environment/floor.glb'
    plants: null, // 'models/environment/plants.glb'
    decorations: null // 'models/environment/decorations.glb'
  },

  colors: {
    grass: '#B8D78E',
    grassDark: '#9CC476',
    earth: '#C9955C',
    earthDark: '#A8773F',
    path: '#F4E8CB',
    wood: '#C99A63',
    woodDark: '#9E7143',
    foliage: ['#7DB46C', '#8CC37A', '#6BA35E'],
    trunk: '#8B5E3C',
    boxRed: '#E60012',
    boxBand: '#FFF6E6',
    flowers: ['#F6D365', '#F2A7B8', '#FFFFFF', '#E86A5C']
  },

  // Las tres luces con un leve tono cálido (también las usan los retratos de Snapshot.js)
  lights: {
    sky: '#FFF1DC', // hemisférica, arriba: crema
    ground: '#C8C08F', // hemisférica, abajo: rebote del pasto, más cálido que verde
    hemiIntensity: 1.5,
    key: '#FFE0BA', // sol: durazno
    keyIntensity: 2.4,
    fill: '#FFE9D2', // contraluz: antes azul frío, ahora melocotón muy claro
    fillIntensity: 0.7
  },

  // Encuadres de cámara: pos = posición de la cámara, target = punto al que mira
  camera: {
    fov: 32,
    minDistance: 2.1,
    maxDistance: 9,
    presets: {
      full: { pos: [0, 1.4, 6.1], target: [0, 0.95, 0] },
      body: { pos: [0, 1.1, 4.3], target: [0, 0.8, 0] },
      head: { pos: [0, 1.62, 3.5], target: [0, 1.4, 0] },
      showcase: { pos: [3.1, 2.5, 8.6], target: [0, 0.7, 0] },
      hero: { pos: [0, 2.5, 9.9], target: [0, 0.85, 0] },
      final: { pos: [1.3, 1.5, 5.4], target: [0, 0.95, 0] }
    }
  }
}
