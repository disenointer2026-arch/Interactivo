import { bodyParts } from './body.js'
import { hairParts } from './hair.js'
import { eyeParts, noseParts, mouthParts } from './face.js'
import { shirtParts, pantsParts, shoeParts } from './clothes.js'
import { headAccParts, faceAccParts, neckAccParts } from './accessories.js'
import { companionParts } from './companions.js'

/* Registro de placeholders procedurales por "slot".
   La clave de cada constructor coincide con el id (o el campo builder)
   de la opción en src/data/avatarOptions.js. */
export const BUILDERS = {
  body: bodyParts.body,
  head: bodyParts.head,
  ears: bodyParts.ears,
  hair: hairParts,
  eyes: eyeParts,
  nose: noseParts,
  mouth: mouthParts,
  shirt: shirtParts,
  pants: pantsParts,
  shoes: shoeParts,
  accHead: headAccParts,
  accFace: faceAccParts,
  accNeck: neckAccParts,
  companion: companionParts
}
