# Modelos del ambiente (.glb)

`isla.glb` es la isla final (zip "isla"), exportada con:

    blender -b --disable-autoexec --python tools/blender/export_island.py -- <carpeta del personaje> <carpeta de la isla> static/models/environment/isla.glb

Recibe la misma escala que el personaje y el lugar del avatar queda en el origen.
Se enlaza en `islandModel` de `src/data/sceneConfig.js`; si no carga, la página usa
la isla procedural de `src/three/Environment.js`.
