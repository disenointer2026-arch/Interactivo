import * as THREE from 'three'

/* Proporciones de cada tipo de cuerpo.
   Todas las piezas se construyen a partir de estas medidas, por eso la ropa
   y los accesorios se adaptan automáticamente al cambiar el tipo de cuerpo. */
export const BODY_TYPES = {
  standard: { torsoR: 0.27, torsoH: 0.26, legLen: 0.30, armLen: 0.30, headR: 0.5 },
  round: { torsoR: 0.33, torsoH: 0.22, legLen: 0.26, armLen: 0.28, headR: 0.5 },
  tall: { torsoR: 0.25, torsoH: 0.38, legLen: 0.42, armLen: 0.37, headR: 0.48 },
  mini: { torsoR: 0.24, torsoH: 0.18, legLen: 0.2, armLen: 0.24, headR: 0.53 }
}

export function computeDims (type) {
  const b = BODY_TYPES[type] || BODY_TYPES.standard
  const shoeH = 0.09
  const hipY = shoeH + b.legLen
  const torsoBottom = hipY - b.torsoR * 0.35
  const torsoY = torsoBottom + b.torsoR + b.torsoH / 2
  const torsoTop = torsoY + b.torsoH / 2 + b.torsoR
  const shoulderY = torsoY + b.torsoH / 2 + b.torsoR * 0.35
  const headScale = [1, 0.9, 0.93]
  const headY = torsoTop + b.headR * headScale[1] * 0.78
  const armR = 0.062
  const armAngle = 0.42

  const arms = [1, -1].map(side => {
    const shoulder = new THREE.Vector3(side * b.torsoR * 0.92, shoulderY, 0)
    const dir = new THREE.Vector3(side * Math.sin(armAngle), -Math.cos(armAngle), 0)
    const hand = shoulder.clone().addScaledVector(dir, b.armLen + armR * 0.9)
    return { side, shoulder, dir, hand, angle: side * armAngle }
  })

  return {
    ...b,
    type,
    shoeH,
    hipY,
    torsoBottom,
    torsoY,
    torsoTop,
    shoulderY,
    headY,
    headScale,
    headTop: headY + b.headR * headScale[1],
    armR,
    arms,
    legX: b.torsoR * 0.42,
    legR: Math.max(0.07, b.torsoR * 0.3),
    chestZ: b.torsoR * 0.88,
    earX: b.headR * headScale[0] * 0.97,
    earY: -0.03
  }
}
