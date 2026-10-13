/* ==========================================================================
   CONFIGURACIÓN DE LA ESCENA 3D
   Colores del ambiente, luces, cámara y modelos .glb opcionales.
   ========================================================================== */

export const SCENE = {
  // Si agregas modelos propios del ambiente, escribe aquí sus rutas (dentro de /static).
  // Si una ruta es null, se usa el placeholder procedural.
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

  lights: {
    sky: '#FFF4E0',
    ground: '#A9C98D',
    hemiIntensity: 1.5,
    key: '#FFE6C2',
    keyIntensity: 2.4,
    fill: '#D6E9FF',
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
      final: { pos: [1.3, 1.5, 5.4], target: [0, 0.95, 0] }
    }
  }
}
