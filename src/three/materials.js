import * as THREE from 'three'

/* Relación entre "roles" de material y claves de color del avatar.
   Cualquier material con userData.role = 'hair' se pinta con config.hairColor, etc.
   En modelos .glb: nombra el material en Blender con el rol (p. ej. "hair" o "shirt_main")
   y el color elegido por la persona se aplicará automáticamente. */
export const ROLE_TO_KEY = {
  skin: 'skin',
  hair: 'hairColor',
  eye: 'eyeColor',
  mouth: 'mouthColor',
  shirt: 'shirtColor',
  pants: 'pantsColor',
  shoes: 'shoesColor'
}

export const KEY_TO_ROLE = Object.fromEntries(Object.entries(ROLE_TO_KEY).map(([r, k]) => [k, r]))

/** Color final de un rol, aplicando un sombreado (shade < 1 oscurece, > 1 aclara). */
export function roleColor (hex, shade = 1) {
  const c = new THREE.Color(hex)
  if (shade < 1) c.multiplyScalar(shade)
  else if (shade > 1) c.lerp(new THREE.Color('#ffffff'), Math.min(1, shade - 1))
  return c
}

/* Cielo para los reflejos de los modelos. Sus materiales traen la rugosidad
   horneada desde Blender (puntitos brillantes que dan el aspecto de plástico).
   En Blender esos puntos brillan porque reflejan el sol del cielo (Sky Texture),
   así que aquí se imita: degradado azul → lila claro con un sol muy intenso. */
let sky = null
export function skyTexture () {
  if (sky) return sky
  const W = 128
  const H = 64
  const data = new Float32Array(W * H * 4)
  const top = new THREE.Color('#8FAAD3')
  const horizon = new THREE.Color('#E6E2EE')
  const ground = new THREE.Color('#9AA68C')
  const sun = new THREE.Vector3(0.45, 0.6, 0.65).normalize() // arriba, a la derecha y al frente
  const c = new THREE.Color()
  const dir = new THREE.Vector3()
  for (let y = 0; y < H; y++) {
    const v = 1 - (y + 0.5) / H // 1 = cenit, 0 = nadir
    const theta = v * Math.PI - Math.PI / 2
    if (v > 0.5) c.copy(horizon).lerp(top, Math.pow((v - 0.5) * 2, 0.7))
    else c.copy(horizon).lerp(ground, Math.min(1, (0.5 - v) * 4))
    for (let x = 0; x < W; x++) {
      const phi = ((x + 0.5) / W) * Math.PI * 2 - Math.PI / 2
      dir.set(Math.cos(theta) * Math.cos(phi), Math.sin(theta), -Math.cos(theta) * Math.sin(phi))
      const glow = Math.pow(Math.max(0, dir.dot(sun)), 350) * 40
      const i = (y * W + x) * 4
      data[i] = c.r + glow
      data[i + 1] = c.g + glow * 0.97
      data[i + 2] = c.b + glow * 0.9
      data[i + 3] = 1
    }
  }
  sky = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType)
  sky.mapping = THREE.EquirectangularReflectionMapping
  sky.magFilter = sky.minFilter = THREE.LinearFilter
  sky.needsUpdate = true
  return sky
}

/* Aspecto plástico del avatar: ajusta estos dos valores para más o menos brillo.
   roughness solo se aplica a los modelos (su rugosidad horneada es casi toda mate). */
export const PLASTIC = { roughness: 0.6, env: 0.5 }

/** Kit de materiales para los constructores de piezas. */
export function createMaterialKit (config) {
  return {
    role (role, { shade = 1, rough = 0.78, map = null, side = THREE.FrontSide } = {}) {
      const m = new THREE.MeshStandardMaterial({
        color: roleColor(config[ROLE_TO_KEY[role]] || '#ffffff', shade),
        roughness: rough,
        metalness: 0,
        map,
        side
      })
      // Mismo cielo que los modelos, para que piel, cabello y rasgos se vean iguales
      m.envMap = skyTexture()
      m.envMapIntensity = PLASTIC.env
      m.userData.role = role
      m.userData.shade = shade
      return m
    },
    fixed (hex, { rough = 0.8, metal = 0, side = THREE.FrontSide, opacity = 1, flat = false } = {}) {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(hex),
        roughness: rough,
        metalness: metal,
        side,
        transparent: opacity < 1,
        opacity,
        flatShading: flat
      })
    }
  }
}
