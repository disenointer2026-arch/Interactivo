# Convierte los modelos de "Modelos restantes" (zapatos, peinados, narices, accesorios y
# llaveros) a .glb con la misma escala y posición que el personaje.
# Uso (Blender 3.6, sin interfaz):
#   blender -b --disable-autoexec --python export_extras.py -- <carpeta_personaje> <carpeta_extras> <carpeta_salida>
#
# Todos se modelaron sobre AnimalCrossingCharacter, así que reciben su misma transformación (M):
# - 'cuerpo': zapatos, origen en el suelo entre los pies.
# - 'cabeza': peinados, narices y accesorios, origen en el centro de la cabeza.
# - 'objeto': llaveros; se centran, se apoyan en el suelo y se escalan a una altura fija
#   (la página los coloca detrás del personaje).
import bpy, sys, os, json
from mathutils import Vector, Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import export_models as base  # noqa: E402

# archivo, salida, tipo, rol del material (None = conserva colores) o altura (objetos)
EXTRAS = [
    ('Zapatos.blend', 'zapatos/zapatos', 'cuerpo', None),
    ('Zapatos.version2.blend', 'zapatos/zapatos-2', 'cuerpo', None),
    ('Botas.blend', 'zapatos/botas', 'cuerpo', None),
    ('Sandalias.blend', 'zapatos/sandalias', 'cuerpo', None),

    ('Cabello.corto.recto.blend', 'cabello/recto', 'cabeza', 'hair'),
    ('Cabello.corto.H.blend', 'cabello/corto', 'cabeza', 'hair'),
    ('cabello.corto.Hfleco.blend', 'cabello/flequillo', 'cabeza', 'hair'),
    ('Cabello.corto.picos.blend', 'cabello/picos', 'cabeza', 'hair'),
    ('Cabello.corto.ondas.blend', 'cabello/ondas', 'cabeza', 'hair'),
    ('Cabello.afro.blend', 'cabello/afro', 'cabeza', 'hair'),
    ('Cabello.corto.colitas.blend', 'cabello/colitas', 'cabeza', 'hair'),
    ('Cabello.largo.capul.blend', 'cabello/largo', 'cabeza', 'hair'),

    # La nariz toma el tono de piel, un poco más oscuro (el cargador lee "shade")
    ('Nariz.triangulo.blend', 'nariz/triangular', 'cabeza', 'skin_shade0.9'),
    ('Nariz.redonda.blend', 'nariz/redonda', 'cabeza', 'skin_shade0.9'),
    ('Nariz.rectangular.blend', 'nariz/cuadrada', 'cabeza', 'skin_shade0.9'),

    ('Gorra.blend', 'accesorios/gorra', 'cabeza', None),
    ('Sombrero.blend', 'accesorios/sombrero', 'cabeza', None),
    ('Balaca.blend', 'accesorios/balaca', 'cabeza', None),
    ('Moño.blend', 'accesorios/mono', 'cabeza', None),
    ('Flor.blend', 'accesorios/flor', 'cabeza', None),
    ('audifonos.blend', 'accesorios/audifonos', 'cabeza', None),
    ('Gafas.blend', 'accesorios/gafas', 'cabeza', None),
    ('Gafas.redondas.blend', 'accesorios/gafas-redondas', 'cabeza', None),
    ('Gafas.Sol.blend', 'accesorios/gafas-sol', 'cabeza', None),

    # Llaveros: altura final en metros de la página (el personaje mide ~1,9 m)
    ('Bolsa.dinero.blend', 'llaveros/bolsa-dinero', 'objeto', 0.5),
    ('guitarra.blend', 'llaveros/guitarra', 'objeto', 0.8),
    ('Moneda.blend', 'llaveros/moneda', 'objeto', 0.42),
    ('Nota.musical.blend', 'llaveros/nota-musical', 'objeto', 0.48),
    ('Regalo.blend', 'llaveros/regalo', 'objeto', 0.42),
    ('Tulipan.blend', 'llaveros/tulipan', 'objeto', 0.5),
]


def set_role(meshes, role):
    """Un solo material con el nombre del rol, para que la página le ponga el color elegido."""
    mat = bpy.data.materials.new(role)
    mat.use_nodes = True
    mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.8, 0.8, 0.8, 1)
    for o in meshes:
        o.data.materials.clear()
        o.data.materials.append(mat)


def main():
    args = sys.argv[sys.argv.index('--') + 1:]
    char_dir, extras_dir, out_dir = args[0], args[1], args[2]

    base.SRC = char_dir
    M, _, info = base.character_frame()
    hc, _ = base.head_center(M)
    report = {'scale': info['scale'], 'head_center': list(hc), 'parts': {}}

    base.SRC = extras_dir
    for fname, out, kind, extra in EXTRAS:
        base.open_blend(fname)
        meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.visible_get()]
        base.apply_matrix(meshes, M)
        if kind == 'cabeza':
            base.apply_matrix(meshes, Matrix.Translation(-hc))
        elif kind == 'objeto':
            mn, mx = base.world_bbox(meshes)
            center = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))
            s = extra / (mx.z - mn.z)
            base.apply_matrix(meshes, Matrix.Scale(s, 4) @ Matrix.Translation(-center))
        if kind != 'objeto' and extra:
            set_role(meshes, extra)
        base.bake_roughness(meshes)
        path = os.path.join(out_dir, out + '.glb')
        os.makedirs(os.path.dirname(path), exist_ok=True)
        base.export(meshes, path)
        mn, mx = base.world_bbox(meshes)
        report['parts'][out] = {'min_web': [round(mn.x, 3), round(mn.z, 3), round(-mx.y, 3)], 'max_web': [round(mx.x, 3), round(mx.z, 3), round(-mn.y, 3)]}

    with open(os.path.join(out_dir, 'perfil-extras.json'), 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=1)
    print('EXTRAS_OK')


if __name__ == '__main__':
    main()
