# Modelos del avatar (.glb)

Exportados desde `Modelos.Interactivo` con `tools/blender/export_models.py`
(Blender 3.6):

    blender -b --disable-autoexec --python tools/blender/export_models.py -- <carpeta con los .blend> static/models/avatar

- `cuerpo.glb`: torso, brazos y piernas. Origen en el suelo, entre los pies.
- `cabeza.glb`: cabeza y orejas. Origen en el centro de la cabeza.
- `ropa/*.glb`: prendas, alineadas al cuerpo (origen en el suelo).

El cuerpo y la cabeza se enlazan en `BASE_MODELS` y las prendas en el campo
`model` de cada opción, ambos en `src/data/avatarOptions.js`.

Reglas para que encajen:
- El script escala el personaje para que el centro de la cabeza quede a 1.4775 m.
  Si cambia la cabeza, actualiza `MODEL` en `src/three/avatarDims.js`
  (tamaño de la cabeza, mapa de la cara y manos).
- Los materiales que se llaman "Piel" se renombran a `skin` y toman el tono de
  piel elegido. Los demás conservan su textura.
- La rugosidad con ruido procedural (el aspecto de plástico) se hornea en una
  imagen dentro de cada .glb. El brillo final se ajusta con `PLASTIC` en
  `src/three/materials.js`.
- Si un archivo no existe o falla, se usa el placeholder procedural automáticamente.
