# Exporta el cuerpo con huesos y las texturas de piel del equipo (zip "ScratchesLight001",
# archivo Personaje.para.pagina.principal.blend) y la ropa preparada para doblarse con él.
# Uso (Blender 3.6, sin interfaz):
#   blender -b --disable-autoexec --python export_rig.py -- <carpeta_personaje> <carpeta_rig> <carpeta_extras> <carpeta_salida>
#
# - cuerpo.glb: torso, brazos y piernas con el esqueleto "Esqueleto" (malla con piel/skin).
#   La piel del cuerpo lleva el normal map de rayones (reducido a NORMAL_SIZE).
# - cabeza.glb: cabeza y orejas, origen en el centro de la cabeza, con la rugosidad de la
#   textura de imperfecciones horneada. En la página se engancha al hueso "cabeza".
# Las texturas del .blend apuntan a ../ScratchesLight001 y ../imperfection_0002_2k_wvEb3Q:
# el .blend debe estar en una subcarpeta junto a esas carpetas.
# La cadena y la base del archivo no se exportan (se usarán más adelante).
# - zapatos/*.glb: igual que la ropa, con los pesos de las piernas (siguen a los pies).
# - ropa/*.glb: cada prenda recibe los pesos del cuerpo (transferencia por cercanía) y se
#   exporta con una copia del esqueleto. En la página se une al esqueleto del cuerpo.
# Todo recibe la misma transformación M que el resto de los modelos (pies en el suelo, escala).
import bpy, sys, os
from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import export_models as base  # noqa: E402
import export_extras as extras  # noqa: E402

RIG_FILE = 'Personaje.para.pagina.principal.blend'
# Materiales de piel del archivo: se renombran a "skin" para que tomen el tono elegido
SKIN_MATERIALS = ('cabeza', 'cuerpo', 'piel', 'skin')
NORMAL_SIZE = 1024
# Pesos: el torso (de la malla y de las prendas) tiene algo de peso en los huesos del brazo
# y al subir un brazo se deformaba. Entre ARM_RAMP (|x| en metros de la página, ya con M)
# el peso del brazo pasa al hueso torso: dentro del torso 0 %, en la manga 100 %.
ARM_BONES = ('hombro', 'brazo', 'antebrazo')
ARM_RAMP = (0.22, 0.31)
# Solo a la altura de los hombros (altura en metros): las faldas anchas quedaban al lado
# de las manos y se arrastraban con ellas
ARM_HEIGHT = (0.72, 0.86)
LEG_BONES = ('cadera', 'muslo', 'pierna', 'pie')
# Faldas y vestidos: rígidos (sin peso en las piernas), para que no se arruguen al dar un paso
RIGID_SKIRTS = ('vestido', 'falda')
ARMATURE = 'Esqueleto'
BODY = ('torso', 'brazos', 'piernas')


def rest_pose(arm):
    """Quita cualquier pose de prueba: la exportación va en la posición de reposo."""
    for pb in arm.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.scale = (1, 1, 1)
    arm.animation_data_clear()


def place_rig(arm, M):
    """Aplica M al esqueleto (las mallas hijas lo siguen) y lo deja en reposo."""
    arm.hide_set(False)
    arm.hide_viewport = False
    arm.hide_select = False
    arm.matrix_world = M @ arm.matrix_world
    rest_pose(arm)
    bpy.context.view_layer.update()


def export_skinned(objs, path):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.hide_select = False
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    # Sin aplicar modificadores: el de esqueleto se exporta como piel, no como pose fija
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', use_selection=True, export_yup=True,
        export_apply=False, export_skins=True, export_animations=False,
        export_texcoords=True, export_normals=True, export_materials='EXPORT',
        export_cameras=False, export_lights=False, export_extras=False)


def append_rig(rig_path):
    """Trae el esqueleto y el cuerpo del archivo con huesos a la escena abierta."""
    names = [ARMATURE] + list(BODY)
    with bpy.data.libraries.load(rig_path, link=False) as (src, dst):
        dst.objects = [n for n in src.objects if n in names]
    # Se usan los objetos traídos (no la búsqueda por nombre): el archivo del overol trae
    # su propia copia oculta del cuerpo con los mismos nombres
    got = {}
    for o in dst.objects:
        bpy.context.scene.collection.objects.link(o)
        got[o.name.split('.')[0] if o.type == 'MESH' else ARMATURE] = o
    return got[ARMATURE], [got[n] for n in BODY]


def skin_garment(garment, arm, body):
    """Copia los pesos de las mallas de body a la prenda (por cercanía) y la une al esqueleto."""
    # Fuente única: copia del cuerpo unida en una sola malla (conserva los grupos por nombre)
    bpy.ops.object.select_all(action='DESELECT')
    copies = []
    for b in body:
        c = b.copy()
        c.data = b.data.copy()
        bpy.context.scene.collection.objects.link(c)
        copies.append(c)
    for c in copies:
        c.select_set(True)
    bpy.context.view_layer.objects.active = copies[0]
    bpy.ops.object.join()
    source = copies[0]

    bpy.ops.object.select_all(action='DESELECT')
    garment.select_set(True)
    bpy.context.view_layer.objects.active = garment
    mod = garment.modifiers.new('pesos', 'DATA_TRANSFER')
    mod.object = source
    mod.use_vert_data = True
    mod.data_types_verts = {'VGROUP_WEIGHTS'}
    mod.vert_mapping = 'POLYINTERP_NEAREST'
    mod.layers_vgroup_select_src = 'ALL'
    mod.layers_vgroup_select_dst = 'NAME'
    bpy.ops.object.datalayout_transfer(modifier=mod.name)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(source, do_unlink=True)

    world = garment.matrix_world.copy()
    garment.parent = arm
    garment.matrix_world = world
    arm_mod = garment.modifiers.new('esqueleto', 'ARMATURE')
    arm_mod.object = arm


def relax_weights(obj, arms=True, legs=False):
    """Pasa al hueso torso el peso de brazos (cerca del centro) y, si legs, el de las piernas."""
    groups = {g.index: g.name for g in obj.vertex_groups}
    torso = obj.vertex_groups.get('torso') or obj.vertex_groups.new(name='torso')
    lo, hi = ARM_RAMP
    y0, y1 = ARM_HEIGHT
    ramp = lambda t, a, b: min(1, max(0, (t - a) / (b - a)))
    for v in obj.data.vertices:
        p = obj.matrix_world @ v.co
        keep = ramp(abs(p.x), lo, hi) * ramp(p.z, y0, y1)
        moved = 0
        for g in v.groups:
            name = groups[g.group].lower()
            if arms and name.startswith(ARM_BONES):
                moved += g.weight * (1 - keep)
                g.weight *= keep
            elif legs and name.startswith(LEG_BONES):
                moved += g.weight
                g.weight = 0
        if moved:
            torso.add([v.index], moved, 'ADD')


def rename_skin(objs):
    for o in objs:
        for slot in o.material_slots:
            if slot.material and slot.material.name.lower().startswith(SKIN_MATERIALS):
                slot.material.name = 'skin'


def drop_alpha(objs):
    """La piel de la cabeza conecta un JPG (sin transparencia) al Alpha: no hace nada en
    Blender, pero el exportador lo convertía en una textura de color de 3 MB."""
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if not (m and m.use_nodes):
                continue
            for n in m.node_tree.nodes:
                if n.type == 'BSDF_PRINCIPLED':
                    for l in list(n.inputs['Alpha'].links):
                        m.node_tree.links.remove(l)
                    n.inputs['Alpha'].default_value = 1


def shrink_normal_maps(objs):
    """Los normal maps vienen a 2K: a NORMAL_SIZE pesan mucho menos en la página."""
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if not (m and m.use_nodes):
                continue
            for n in m.node_tree.nodes:
                if n.type == 'NORMAL_MAP' and n.inputs['Color'].is_linked:
                    tex = n.inputs['Color'].links[0].from_node
                    img = getattr(tex, 'image', None)
                    if img and img.size[0] > NORMAL_SIZE:
                        img.scale(NORMAL_SIZE, NORMAL_SIZE)


def export_head(out_dir):
    """Cabeza y orejas sin esqueleto (la página las cuelga del hueso), centradas en la cabeza."""
    head = [bpy.data.objects['cabeza'], bpy.data.objects['orejas']]
    for o in head:
        world = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = world
        for m in list(o.modifiers):
            o.modifiers.remove(m)
    bpy.context.view_layer.update()
    drop_alpha(head)
    base.bake_roughness(head)
    rename_skin(head)
    # Primero se aplican las transformaciones: con la malla girada, la caja (y su centro)
    # saldrían más grandes que la cabeza real
    base.apply_matrix(head, Matrix.Identity(4))
    hmn, hmx = base.world_bbox([head[0]])
    print('HEAD_CENTER', [round(v, 4) for v in (hmn + hmx) / 2])
    base.apply_matrix(head, Matrix.Translation(-(hmn + hmx) / 2))
    base.export(head, os.path.join(out_dir, 'cabeza.glb'))


def main():
    args = sys.argv[sys.argv.index('--') + 1:]
    char_dir, rig_dir, extras_dir, out_dir = args[0], args[1], args[2], args[3]
    rig_path = os.path.join(rig_dir, RIG_FILE)
    os.makedirs(os.path.join(out_dir, 'ropa'), exist_ok=True)
    os.makedirs(os.path.join(out_dir, 'zapatos'), exist_ok=True)

    base.SRC = char_dir
    M, _, info = base.character_frame()

    # ------------------------------------------------------------ Cuerpo
    base.SRC = rig_dir
    base.open_blend(RIG_FILE)
    arm = bpy.data.objects[ARMATURE]
    body = [bpy.data.objects[n] for n in BODY]
    place_rig(arm, M)
    relax_weights(bpy.data.objects['torso'])
    drop_alpha(body)
    base.bake_roughness(body)
    shrink_normal_maps(body)
    rename_skin(body)
    export_skinned([arm] + body, os.path.join(out_dir, 'cuerpo.glb'))
    bones = [b.name for b in arm.data.bones]
    export_head(out_dir)

    # ------------------------------------------------------------ Ropa
    base.SRC = char_dir
    for spec in base.GARMENTS:
        out, meshes = base.open_garment(spec, M)
        base.bake_roughness(meshes)
        base.rename_skin(meshes)
        arm, body = append_rig(rig_path)
        place_rig(arm, M)
        for g in meshes:
            skin_garment(g, arm, body)
            relax_weights(g, legs=out in RIGID_SKIRTS)
        for b in body:
            bpy.data.objects.remove(b, do_unlink=True)
        export_skinned([arm] + meshes, os.path.join(out_dir, 'ropa', out + '.glb'))

    # ------------------------------------------------------------ Zapatos
    base.SRC = extras_dir
    for fname, out, kind, _ in extras.EXTRAS:
        if not out.startswith('zapatos/'):
            continue
        base.open_blend(fname)
        meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.visible_get()]
        base.apply_matrix(meshes, M)
        base.bake_roughness(meshes)
        arm, body = append_rig(rig_path)
        place_rig(arm, M)
        legs = [b for b in body if b.name.startswith('piernas')]
        for g in meshes:
            skin_garment(g, arm, legs)
        for b in body:
            bpy.data.objects.remove(b, do_unlink=True)
        export_skinned([arm] + meshes, os.path.join(out_dir, out + '.glb'))

    print('RIG_OK', info['scale'], bones)


if __name__ == '__main__':
    main()
