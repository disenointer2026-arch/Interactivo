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
