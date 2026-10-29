# Convierte la isla final (zip "isla") a .glb para el escenario de la página.
#   blender -b --disable-autoexec --python export_island.py -- <carpeta_personaje> <carpeta_isla> <archivo_salida.glb>
#
# La isla se modeló a la misma escala que AnimalCrossingCharacter, con el lugar del personaje
# en el origen: recibe la misma escala que el personaje (sin moverla) y el suelo queda en y = 0.
#
# GROUND_SCALE achica solo el suelo (desde el centro). El árbol, los arbustos y el pasto
# conservan su tamaño y solo se acercan al centro en la misma proporción, para no quedar
# fuera del borde. El tronco y la copa del árbol se mueven juntos.
import bpy, sys, os
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import export_models as base  # noqa: E402

GROUND_SCALE = 0.6
GROUND = 'suelo'
TREE = ('Esfera', 'Círculo')  # copa y tronco


def center_xy(objs):
    mn, mx = base.world_bbox(objs)
    return Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, 0))


def shrink_ground(meshes):
    f = GROUND_SCALE
    by_name = {o.name: o for o in meshes}
    ground = by_name[GROUND]
    base.apply_matrix([ground], Matrix.Scale(f, 4))
    tree = [by_name[n] for n in TREE]  # falla si cambian los nombres (no deben separarse)
    groups = [tree] + [[o] for o in meshes if o is not ground and o not in tree]
    for objs in groups:
        c = center_xy(objs)
        base.apply_matrix(objs, Matrix.Translation(c * (f - 1)))


def main():
    args = sys.argv[sys.argv.index('--') + 1:]
    char_dir, island_dir, out_path = args[0], args[1], args[2]

    base.SRC = char_dir
    _, _, info = base.character_frame()

    base.SRC = island_dir
    base.open_blend('isla.blend')
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.visible_get()]
    shrink_ground(meshes)
    base.apply_matrix(meshes, Matrix.Scale(info['scale'], 4))
    base.bake_roughness(meshes)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    base.export(meshes, out_path)
    mn, mx = base.world_bbox(meshes)
    print('ISLAND_OK', info['scale'], [round(v, 3) for v in mn], [round(v, 3) for v in mx], len(meshes))


if __name__ == '__main__':
    main()
