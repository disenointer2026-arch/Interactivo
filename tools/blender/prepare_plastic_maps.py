# Prepara las texturas de "plástico" del equipo para usarlas en todos los modelos de la página.
#   blender -b --factory-startup --python prepare_plastic_maps.py -- <carpeta zip ScratchesLight001> <carpeta salida>
#
# - rugosidad.jpg: imperfection_0002_roughness_2k con la misma rampa de color del material
#   "cabeza" del equipo (0.084 → negro, 0.304 → gris, 0.567 → blanco), en gris a 1024 px.
# - rayones.jpg: ScratchesLight001_NRM_2K (normal map) a 1024 px.
import bpy, sys, os
import numpy as np

SRC, OUT = sys.argv[sys.argv.index('--') + 1:][:2]
os.makedirs(OUT, exist_ok=True)
SIZE = 1024
RAMP = [(0.084, 0.0), (0.304, 0.5), (0.567, 1.0)]


def load(path):
    img = bpy.data.images.load(path)
    img.colorspace_settings.name = 'Non-Color'
    img.scale(SIZE, SIZE)
    a = np.array(img.pixels[:], dtype=np.float32).reshape(SIZE, SIZE, 4)
    bpy.data.images.remove(img)
    return a


def save(a, name):
    img = bpy.data.images.new(name, SIZE, SIZE, alpha=False)
    img.colorspace_settings.name = 'Non-Color'
    img.pixels[:] = np.ascontiguousarray(a).ravel()
    img.filepath_raw = os.path.join(OUT, name)
    img.file_format = 'JPEG'
    bpy.context.scene.render.image_settings.quality = 88
    img.save()
    bpy.data.images.remove(img)


rough = load(os.path.join(SRC, 'imperfection_0002_2k_wvEb3Q', 'imperfection_0002_roughness_2k.jpg'))
v = rough[..., 0]
xs, ys = zip(*RAMP)
v = np.interp(v, xs, ys)
rough[..., 0] = rough[..., 1] = rough[..., 2] = v
rough[..., 3] = 1
save(rough, 'rugosidad.jpg')

nrm = load(os.path.join(SRC, 'ScratchesLight001', 'ScratchesLight001_NRM_2K.jpg'))
nrm[..., 3] = 1
save(nrm, 'rayones.jpg')
print('PLASTIC_OK', round(float(v.mean()), 3), round(float(v.min()), 3), round(float(v.max()), 3))
