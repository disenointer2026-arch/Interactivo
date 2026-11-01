# Exporta el soporte de la portada (base acrílica + llavero) a .glb.
# Uso (Blender 4.x, sin interfaz):
#   blender -b "Personaje.para.pagina.principal.blend" --disable-autoexec \
#           --python export_soporte.py -- <archivo_salida.glb>
#
# El archivo original trae tres colecciones: "personaje" (el muñeco modelado),
# "base" (el disco de acrílico) y "llavero" (anillo, seguro y las dos cadenas).
# El personaje NO se exporta: en la página se usa el avatar modular, que cambia
# en cada carga. Lo que sí se exporta se lleva a la escala y al origen del avatar
# de la página, de modo que al montarlo en la escena 3D encaje sin ajustes:
#   · origen (0, 0, 0) = entre los pies del avatar
#   · misma escala que el avatar (centro de la cabeza a 1,4465 m)
import bpy, sys, os
from mathutils import Vector

TARGET_HEAD_Y = 1.4465   # centro de la cabeza del avatar de la página (avatarDims.js)
KEEP = ('base', 'llavero')
CHAR = 'personaje'


def bbox(objs):
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c)
            lo = Vector((min(lo.x, p.x), min(lo.y, p.y), min(lo.z, p.z)))
            hi = Vector((max(hi.x, p.x), max(hi.y, p.y), max(hi.z, p.z)))
    return lo, hi


def meshes(collection_name):
    col = bpy.data.collections.get(collection_name)
    return [o for o in col.all_objects if o.type == 'MESH'] if col else []


def main():
    out = sys.argv[sys.argv.index('--') + 1]

    person = meshes(CHAR)
    head = next((o for o in person if o.name.startswith('cabeza')), None)
    if not person or not head:
        raise SystemExit('No encuentro la colección "personaje" o su cabeza')

    lo, hi = bbox(person)
    head_lo, head_hi = bbox([head])
    feet_z = lo.z
    head_center_z = (head_lo.z + head_hi.z) / 2
    scale = TARGET_HEAD_Y / (head_center_z - feet_z)
    # El centro en planta se toma de los pies, no de todo el cuerpo (los brazos
    # abiertos desplazarían el eje)
    legs = next((o for o in person if o.name.startswith('piernas')), None)
    leg_lo, leg_hi = bbox([legs]) if legs else (lo, hi)
    cx = (leg_lo.x + leg_hi.x) / 2
    cy = (leg_lo.y + leg_hi.y) / 2
    print(f'[soporte] escala {scale:.4f} · pies z={feet_z:.4f} · centro ({cx:.4f}, {cy:.4f})')

    keep = []
    for name in KEEP:
        keep += meshes(name)
    if not keep:
        raise SystemExit('No encuentro las colecciones "base" / "llavero"')

    # Todo a la escala y el origen del avatar
    offset = Vector((cx, cy, feet_z))
    for o in keep:
        o.matrix_world = (
            __import__('mathutils').Matrix.Scale(scale, 4)
            @ __import__('mathutils').Matrix.Translation(-offset)
            @ o.matrix_world
        )

    # Fuera lo que no se exporta (personaje, esqueleto, cámara y luz)
    for o in list(bpy.data.objects):
        if o not in keep:
            bpy.data.objects.remove(o, do_unlink=True)

    bpy.ops.object.select_all(action='SELECT')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True
    )
    lo2, hi2 = bbox(keep)
    print(f'[soporte] exportado {out}')
    print(f'[soporte] caja final min={tuple(round(v, 3) for v in lo2)} max={tuple(round(v, 3) for v in hi2)}')


main()
