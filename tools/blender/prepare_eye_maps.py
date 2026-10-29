# Prepara los mapas UV de los ojos para la página (zip "mapas-uv-ojos").
#   blender -b --factory-startup --python prepare_eye_maps.py -- <carpeta mapas-uv-ojos> <carpeta salida>
#
# Los PNG originales miden 4280 × 4271 y el dibujo ocupa solo la zona de los ojos del mapa
# UV de la cabeza. Por cada estilo se guarda ese recorte (escalado) en tres capas:
#   N-base.png   blanco, contorno, pestañas/ceja/párpado (la imagen original)
#   N-iris.png   el iris en blanco con su transparencia (la página le pone el color de ojos)
#   N-lineas.png solo contorno, pestañas y párpado (sin el blanco), para dibujarlos encima
#                del iris: así el párpado tapa el iris como en el juego
# El estilo 8 (Sonrientes) es el 7 (Soñolientos) volteado de arriba abajo.
import bpy, sys, os, json
import numpy as np

SRC, OUT = sys.argv[sys.argv.index('--') + 1:][:2]
os.makedirs(OUT, exist_ok=True)
W, H = 4280, 4271
X0, Y0, CW, CH = 2640, 3140, 960, 560   # recorte (pixeles, origen arriba a la izquierda)
SCALE = 0.6                             # 576 × 336 px


def load(name):
    img = bpy.data.images.load(os.path.join(SRC, name))
    a = np.array(img.pixels[:], dtype=np.float32).reshape(img.size[1], img.size[0], 4)[::-1]  # filas de arriba abajo
    bpy.data.images.remove(img)
    return a[Y0:Y0 + CH, X0:X0 + CW]


def resize(a):
    h, w = int(CH * SCALE), int(CW * SCALE)
    ys = (np.arange(h) + 0.5) / SCALE
    xs = (np.arange(w) + 0.5) / SCALE
    # promedio de bloques (mejor que vecino más cercano para reducir)
    out = np.zeros((h, w, 4), np.float32)
    k = int(np.ceil(1 / SCALE))
    for dy in range(k):
        for dx in range(k):
            yy = np.clip((ys - 0.5 + (dy + 0.5) / k / SCALE).astype(int), 0, CH - 1)
            xx = np.clip((xs - 0.5 + (dx + 0.5) / k / SCALE).astype(int), 0, CW - 1)
            px = a[yy][:, xx]
            out[..., :3] += px[..., :3] * px[..., 3:4]
            out[..., 3] += px[..., 3]
    alpha = out[..., 3:4]
    out[..., :3] = np.where(alpha > 0, out[..., :3] / np.maximum(alpha, 1e-6), 0)
    out[..., 3] /= k * k
    return out


def save(a, name):
    h, w = a.shape[:2]
    img = bpy.data.images.new(name, w, h, alpha=True)
    img.pixels[:] = np.ascontiguousarray(a[::-1]).ravel()
    img.filepath_raw = os.path.join(OUT, name)
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)


def flip_rows(a):
    """Voltea de arriba abajo alrededor del centro del dibujo (no del recorte)."""
    rows = np.where(a[..., 3].max(axis=1) > 0.05)[0]
    cy = (rows.min() + rows.max()) / 2
    out = np.zeros_like(a)
    for y in range(a.shape[0]):
        src = int(round(2 * cy - y))
        if 0 <= src < a.shape[0]:
            out[y] = a[src]
    return out


info = {'crop': [X0 / W, Y0 / H, CW / W, CH / H], 'centers': {}}
for n in range(1, 9):
    if n <= 7:
        base, iris = load(f'ojos-{n}.png'), load(f'pupilas-{n}.png')
    else:
        base, iris = flip_rows(load('ojos-7.png')), flip_rows(load('pupilas-7.png'))
    base, iris = resize(base), resize(iris)
    # Iris blanco: la página lo tiñe con el color de ojos elegido
    iris[..., :3] = 1
    # Líneas: el blanco del ojo se vuelve transparente (los bordes se suavizan)
    lines = base.copy()
    white = np.clip((base[..., :3].min(axis=2) - 0.72) / 0.25, 0, 1)
    lines[..., 3] *= 1 - white
    save(base, f'{n}-base.png')
    save(iris, f'{n}-iris.png')
    save(lines, f'{n}-lineas.png')
    rows = np.where(base[..., 3].max(axis=1) > 0.05)[0]
    info['centers'][n] = round(float((rows.min() + rows.max()) / 2 / base.shape[0]), 4)

with open(os.path.join(OUT, 'ojos.json'), 'w', encoding='utf-8') as f:
    json.dump(info, f, indent=1)
print('EYES_OK', json.dumps(info))
