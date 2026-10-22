# Convierte los modelos de "Modelos.Interactivo" a .glb listos para la página.
# Uso (Blender 3.6, sin interfaz):
#   blender -b --disable-autoexec --python export_models.py -- <carpeta_modelos> <carpeta_salida>
#
# 1. Personaje: se centra entre los pies, se escala para que el centro de la cabeza
#    quede a la misma altura que en el avatar de la página y se separa en
#    cuerpo (torso + brazos + piernas, origen en el suelo) y cabeza (cabeza + orejas,
#    origen en el centro de la cabeza).
# 2. Prendas: se llevan a la posición del personaje (muchas se modelaron sobre la copia
#    del cuerpo que trae el archivo del overol, desplazada 1,27 m) y reciben la misma
#    escala y origen que el cuerpo.
# 3. Las texturas se reconectan (en el zip llevan " - copia") y se incrustan en el .glb.
# 4. La rugosidad de los materiales sale de un ruido procedural (los destellos que dan
#    el aspecto de plástico). glTF no admite nodos procedurales, así que se hornea en
#    una imagen por objeto y se conecta a Roughness para que viaje en el .glb.
import bpy, sys, os, json
from mathutils import Vector, Matrix

args = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = args[0], args[1]
os.makedirs(os.path.join(OUT, 'ropa'), exist_ok=True)

TARGET_HEAD_Y = 1.4465  # centro de la cabeza del avatar actual (avatarDims.js, cuerpo estándar)
# Diferencia entre el cuerpo de AnimalCrossingCharacter y la copia del cuerpo del archivo Overol
OVEROL_TO_CHAR = Vector((0.0168 - 0.0392, -1.2267 - 0.0474, 0.0))

def open_blend(name):
    bpy.ops.wm.open_mainfile(filepath=os.path.join(SRC, name), load_ui=False, use_scripts=False)
    relink_images()

def relink_images():
    for img in bpy.data.images:
        if img.type != 'IMAGE' or not img.filepath:
            continue
        base = os.path.basename(bpy.path.abspath(img.filepath))
        stem, ext = os.path.splitext(base)
        for cand in (base, f'{stem} - copia{ext}'):
            p = os.path.join(SRC, cand)
            if os.path.exists(p):
                img.filepath = p
                img.reload()
                break

def world_bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx

def apply_matrix(objs, M):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.hide_set(False)
        o.hide_viewport = False
        o.matrix_world = M @ o.matrix_world
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

def export(objs, path):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', use_selection=True, export_yup=True,
        export_apply=True, export_texcoords=True, export_normals=True,
        export_materials='EXPORT', export_cameras=False, export_lights=False,
        export_animations=False, export_extras=False)

ROUGH_SIZE = 1024

def bake_roughness(objs):
    """Hornea la rugosidad procedural de cada objeto en una imagen y la conecta."""
    procedural = lambda m: m and m.use_nodes and any(
        n.type == 'BSDF_PRINCIPLED' and n.inputs['Roughness'].is_linked
        and n.inputs['Roughness'].links[0].from_node.type != 'TEX_IMAGE' for n in m.node_tree.nodes)
    targets = [o for o in objs if any(procedural(s.material) for s in o.material_slots)]
    if not targets:
        return
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 1
    scene.render.bake.margin = 4
    for o in targets:
        img = bpy.data.images.new(f'{o.name}_rugosidad', ROUGH_SIZE, ROUGH_SIZE)
        img.colorspace_settings.name = 'Non-Color'
        o['_rough'] = img.name
        for slot in o.material_slots:
            if not slot.material:
                continue
            # Copia propia: el mismo material puede estar en objetos con UV distintas
            slot.material = slot.material.copy()
            nt = slot.material.node_tree
            tex = nt.nodes.new('ShaderNodeTexImage')
            tex.image = img
            tex.name = 'rugosidad_horneada'
            nt.nodes.active = tex
    bpy.ops.object.select_all(action='DESELECT')
    for o in targets:
        o.select_set(True)
    bpy.context.view_layer.objects.active = targets[0]
    bpy.ops.object.bake(type='ROUGHNESS', use_clear=True)
    for o in targets:
        for slot in o.material_slots:
            m = slot.material
            if not m:
                continue
            nt = m.node_tree
            tex = nt.nodes['rugosidad_horneada']
            if procedural(m):
                bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
                sep = nt.nodes.new('ShaderNodeSeparateRGB')
                nt.links.new(tex.outputs['Color'], sep.inputs['Image'])
                nt.links.new(sep.outputs['G'], bsdf.inputs['Roughness'])
            else:
                nt.nodes.remove(tex)
        img = bpy.data.images[o['_rough']]
        img.pack()

def rename_skin(objs):
    for o in objs:
        for slot in o.material_slots:
            if slot.material and slot.material.name.lower().startswith(('piel', 'skin')):
                slot.material.name = 'skin'

# ---------------------------------------------------------------- Personaje
open_blend('AnimalCrossingCharacter - copia.blend')
ob = bpy.data.objects
torso, brazos, piernas, cabeza, orejas = ob['torso'], ob['brazos'], ob['piernas'], ob['cabeza'], ob['orejas']
mn, mx = world_bbox([torso, piernas])
center_xy = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, 0))
ground = world_bbox([piernas])[0].z
hmn, hmx = world_bbox([cabeza])
head_c = (hmn + hmx) / 2
scale = TARGET_HEAD_Y / (head_c.z - ground)
# M: centra entre los pies, apoya en el suelo y escala
M = Matrix.Scale(scale, 4) @ Matrix.Translation(Vector((-center_xy.x, -center_xy.y, -ground)))
info = {'scale': scale, 'center_xy': list(center_xy[:2]), 'ground': ground}

apply_matrix([torso, brazos, piernas, cabeza, orejas], M)
bake_roughness([torso, brazos, piernas, cabeza, orejas])
rename_skin([torso, brazos, piernas, cabeza, orejas])
export([torso, brazos, piernas], os.path.join(OUT, 'cuerpo.glb'))

# Cabeza: origen en su centro
hmn, hmx = world_bbox([cabeza])
hc = (hmn + hmx) / 2
half = (hmx - hmn) / 2
apply_matrix([cabeza, orejas], Matrix.Translation(-hc))
export([cabeza, orejas], os.path.join(OUT, 'cabeza.glb'))
# Perfil para la página (convertido a ejes de la web: x, y=arriba, z=adelante)
info['head_center_web'] = [round(hc.x, 4), round(hc.z, 4), round(-hc.y, 4)]
info['head_half_web'] = [round(half.x, 4), round(half.z, 4), round(half.y, 4)]
fmn, fmx = world_bbox([cabeza])
info['head_front_web'] = round(-fmn.y, 4)

# ---------------------------------------------------------------- Prendas
# archivo, salida, familia ('char' ya alineada | 'overol' modelada sobre la copia del overol),
# ubicación corregida para las copias desplazadas (la de su prenda gemela)
GARMENTS = [
    ('camisa - copia.blend', 'camisa', 'overol', None),
    ('Camisa.2 - copia.blend', 'camisa-2', 'overol', (0.0379, -0.2013, 1.4328)),
    ('camisa.manga.larga - copia.blend', 'manga-larga', 'overol', None),
    ('Chaqueta - copia.blend', 'chaqueta', 'overol', None),
    ('Chaqueta.2 - copia.blend', 'chaqueta-2', 'overol', (0.0379, -0.2013, 1.4328)),
    ('vestido - copia.blend', 'vestido', 'overol', None),
    ('Jean - copia.blend', 'jean', 'char', None),
    ('Falda - copia.blend', 'falda', 'char', None),
    ('Short - copia.blend', 'short', 'char', (0.0102, -1.7545, 1.0246)),
    ('Overol - copia.blend', 'overol', 'overol', None),
]
info['garments'] = {}
for fname, out, family, fix_loc in GARMENTS:
    open_blend(fname)
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.visible_get()]
    for o in meshes:
        if fix_loc is not None:
            o.location = fix_loc
    bpy.context.view_layer.update()
    delta = OVEROL_TO_CHAR if family == 'overol' else Vector((0, 0, 0))
    apply_matrix(meshes, M @ Matrix.Translation(delta))
    bake_roughness(meshes)
    rename_skin(meshes)
    export(meshes, os.path.join(OUT, 'ropa', out + '.glb'))
    gmn, gmx = world_bbox(meshes)
    info['garments'][out] = {'objects': [o.name for o in meshes], 'bbox_web_min': [round(gmn.x, 3), round(gmn.z, 3), round(-gmx.y, 3)], 'bbox_web_max': [round(gmx.x, 3), round(gmx.z, 3), round(-gmn.y, 3)]}

with open(os.path.join(OUT, 'perfil-modelos.json'), 'w', encoding='utf-8') as f:
    json.dump(info, f, indent=1)
print('EXPORT_OK')
