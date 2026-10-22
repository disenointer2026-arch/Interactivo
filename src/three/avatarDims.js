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

/* Medidas del personaje modelado (static/models/avatar), tomadas en Blender
   al exportar. Su cabeza es más pequeña y ovalada que la procedural:
   - headFit: escala que lleva la cabeza procedural (radio 0.5 × headScale) al
     tamaño de la del modelo. El cabello y los rasgos se construyen con las medidas
     procedurales y luego se ajustan con esta escala.
   - face: profundidad real de la cara (z hacia adelante) en una cuadrícula de
     5 cm, desde x = -0.30 y y = -0.30 (relativo al centro de la cabeza). */
export const MODEL = {
  headY: 1.4775,
  headHalf: [0.4196, 0.3984, 0.4228],
  hands: [[0.624, 0.70, 0], [-0.624, 0.70, 0]],
  face: {
    x0: -0.3,
    y0: -0.3,
    step: 0.05,
    rows: [
      [0.174, 0.251, 0.297, 0.329, 0.347, 0.357, 0.363, 0.357, 0.347, 0.330, 0.297, 0.250, 0.174],
      [0.261, 0.315, 0.351, 0.373, 0.387, 0.394, 0.398, 0.394, 0.387, 0.374, 0.351, 0.314, 0.258],
      [0.301, 0.348, 0.375, 0.394, 0.406, 0.412, 0.415, 0.413, 0.406, 0.395, 0.376, 0.349, 0.299],
      [0.307, 0.353, 0.381, 0.400, 0.411, 0.417, 0.420, 0.418, 0.411, 0.401, 0.382, 0.353, 0.305],
      [0.304, 0.341, 0.369, 0.388, 0.401, 0.408, 0.412, 0.408, 0.401, 0.389, 0.369, 0.341, 0.304],
      [0.302, 0.339, 0.362, 0.379, 0.395, 0.400, 0.404, 0.400, 0.395, 0.380, 0.363, 0.339, 0.303],
      [0.295, 0.337, 0.358, 0.375, 0.389, 0.394, 0.398, 0.395, 0.389, 0.376, 0.359, 0.338, 0.295],
      [0.287, 0.327, 0.350, 0.369, 0.383, 0.391, 0.392, 0.392, 0.383, 0.369, 0.350, 0.326, 0.288],
      [0.270, 0.310, 0.341, 0.358, 0.372, 0.381, 0.385, 0.381, 0.373, 0.359, 0.342, 0.310, 0.271],
      [0.244, 0.287, 0.317, 0.339, 0.351, 0.357, 0.366, 0.357, 0.351, 0.340, 0.318, 0.287, 0.244],
      [0.204, 0.259, 0.293, 0.315, 0.329, 0.335, 0.342, 0.336, 0.330, 0.316, 0.293, 0.259, 0.203],
      [0.146, 0.212, 0.249, 0.277, 0.295, 0.304, 0.310, 0.304, 0.294, 0.278, 0.251, 0.212, 0.147]
    ]
  }
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

/** Ajusta las medidas al personaje modelado: altura de la cabeza, escala de
    los rasgos (headFit), mapa de la cara y posición de las manos. */
export function fitToModel (d) {
  const [hx, hy, hz] = MODEL.headHalf
  const arms = d.arms.map((a, i) => ({ ...a, hand: new THREE.Vector3(...MODEL.hands[i]) }))
  return {
    ...d,
    headY: MODEL.headY,
    headTop: MODEL.headY + hy,
    headFit: [hx / (d.headR * d.headScale[0]), hy / (d.headR * d.headScale[1]), hz / (d.headR * d.headScale[2])],
    face: MODEL.face,
    arms
  }
}
