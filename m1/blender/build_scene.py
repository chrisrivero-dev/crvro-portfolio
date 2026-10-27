"""Build and render the CRVRO M1 still-life in Blender.

Run:
  /Applications/Blender.app/Contents/MacOS/Blender --background \
    --python blender/build_scene.py

Outputs:
  blender/crvro-m1.blend
  assets/crvro-m1-poster.png

The proportions, screen texture, palette and rest camera match the browser
prototype. The screen texture is captured from the live DOM by
`node tools/capture-screen.cjs` before this script runs.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SCREEN = ROOT / "assets" / "screen-dom.png"
POSTER = ROOT / "assets" / "crvro-m1-poster.png"
BLEND = ROOT / "blender" / "crvro-m1.blend"

# ── reset ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.materials, bpy.data.curves, bpy.data.cameras, bpy.data.lights):
    pass

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1600
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
scene.render.filepath = str(POSTER)
scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.world.color = (0.78, 0.74, 0.66)

# ── helpers ────────────────────────────────────────────────────────────
def mat_principled(name, color, rough=0.5, metal=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if p.inputs.get("Coat Weight"):
        p.inputs["Coat Weight"].default_value = coat
        p.inputs["Coat Roughness"].default_value = 0.42
    return m


def rounded_box(name, loc, scale, material, bevel=0.12):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = (scale[0] / 2, scale[1] / 2, scale[2] / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = o.modifiers.new("Manufactured edge radius", "BEVEL")
    mod.width = bevel
    mod.segments = 5
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.materials.append(material)
    return o


def disk(name, loc, radius, depth, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=radius, depth=depth,
                                        location=loc, rotation=(math.pi/2, 0, 0))
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    bevel = o.modifiers.new("Edge bevel", "BEVEL")
    bevel.width = 0.035
    bevel.segments = 3
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    return o


def curve_line(name, points, color, width=0.006, cyclic=False):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = width
    cu.bevel_resolution = 2
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for p, co in zip(sp.points, points):
        p.co = (*co, 1)
    sp.use_cyclic_u = cyclic
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(color)
    return ob


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()

# ── materials ─────────────────────────────────────────────────────────
plastic = mat_principled("Warm graphite satin ABS", (0.205, 0.185, 0.165), 0.38, 0.0, 0.18)
fascia = mat_principled("Graphite fascia", (0.12, 0.108, 0.098), 0.44, 0.0, 0.10)
deep = mat_principled("Recess and vents", (0.025, 0.021, 0.018), 0.52)
black = mat_principled("Knob rubber", (0.018, 0.016, 0.014), 0.3, 0.0, 0.22)
metal = mat_principled("Fastener metal", (0.07, 0.065, 0.058), 0.26, 0.55)
paper = mat_principled("Warm paper", (0.78, 0.745, 0.67), 0.9)
map_ink = mat_principled("GIS ink", (0.22, 0.205, 0.18), 0.95)
map_ink.diffuse_color[3] = 0.12
amber = mat_principled("Amber lens", (0.62, 0.22, 0.025), 0.18, 0.0, 0.35)

# subtle procedural roughness for molded plastic
p = plastic.node_tree.nodes.get("Principled BSDF")
noise = plastic.node_tree.nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 95
noise.inputs["Detail"].default_value = 2.2
noise.inputs["Roughness"].default_value = 0.72
ramp = plastic.node_tree.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].position = 0.28
ramp.color_ramp.elements[0].color = (0.27, 0.27, 0.27, 1)
ramp.color_ramp.elements[1].position = 0.72
ramp.color_ramp.elements[1].color = (0.52, 0.52, 0.52, 1)
plastic.node_tree.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
plastic.node_tree.links.new(ramp.outputs["Color"], p.inputs["Roughness"])

# ── machine (browser dimensions / 100) ───────────────────────────────
# front faces camera on negative Y; desk top is Z = -3.9
body = rounded_box("CRVRO cabinet shell", (0, 0, -0.08), (7.6, 5.2, 7.6), plastic, 0.28)
front = rounded_box("Front fascia", (0, -2.58, -0.08), (7.36, 0.16, 7.36), fascia, 0.19)

# deep inner bezel, recessed glass and DOM-derived luminous image
well = rounded_box("CRT inner well", (0, -2.72, 0.70), (7.10, 0.20, 5.10), deep, 0.24)
glass = rounded_box("Recessed CRT glass", (0, -2.84, 0.70), (6.05, 0.16, 4.05), black, 0.18)

screen_mat = bpy.data.materials.new("Live DOM phosphor image")
screen_mat.use_nodes = True
nodes = screen_mat.node_tree.nodes
links = screen_mat.node_tree.links
for n in list(nodes):
    nodes.remove(n)
out = nodes.new("ShaderNodeOutputMaterial")
principled = nodes.new("ShaderNodeBsdfPrincipled")
principled.inputs["Roughness"].default_value = 0.20
principled.inputs["Metallic"].default_value = 0.0
if principled.inputs.get("Emission Strength"):
    principled.inputs["Emission Strength"].default_value = 0.32
tex = nodes.new("ShaderNodeTexImage")
tex.image = bpy.data.images.load(str(SCREEN))
tex.interpolation = "Linear"
links.new(tex.outputs["Color"], principled.inputs["Base Color"])
if principled.inputs.get("Emission Color"):
    links.new(tex.outputs["Color"], principled.inputs["Emission Color"])
links.new(principled.outputs["BSDF"], out.inputs["Surface"])

bpy.ops.mesh.primitive_plane_add(size=2, location=(0, -2.94, 0.70), rotation=(math.pi/2, 0, 0))
screen = bpy.context.object
screen.name = "DOM screen image — 600x400 source"
screen.scale = (3.0, 2.0, 1)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
screen.data.materials.append(screen_mat)

# lower service/control band
control = rounded_box("Recessed control deck", (0, -2.72, -2.50), (6.70, 0.20, 1.02), deep, 0.10)

# vents
for i in range(7):
    rounded_box(f"Vent {i+1:02d}", (-2.20, -2.86, -2.26 - i*0.08), (0.92, 0.06, 0.032), black, 0.012)

# knob and index mark
knob = disk("Brightness control", (-0.48, -2.94, -2.50), 0.18, 0.16, black)
rounded_box("Knob index", (-0.48, -3.035, -2.42), (0.025, 0.018, 0.11), paper, 0.006)

# amber power lamp
lamp = disk("Amber power lamp", (0.20, -2.96, -2.50), 0.055, 0.10, amber)

# four front fasteners
for i, (x, z) in enumerate(((-3.42, 3.05), (3.42, 3.05), (-3.42, -1.64), (3.42, -1.64)), 1):
    disk(f"Service fastener {i}", (x, -2.69, z), 0.052, 0.035, metal)

# genuinely extruded CRVRO identity
bpy.ops.object.text_add(location=(1.50, -2.955, -2.62), rotation=(math.pi/2, 0, 0))
logo = bpy.context.object
logo.name = "Embossed CRVRO identity"
logo.data.body = "CRVRO"
logo.data.align_x = "CENTER"
logo.data.align_y = "CENTER"
logo.data.size = 0.44
logo.data.extrude = 0.035
logo.data.bevel_depth = 0.008
logo.data.bevel_resolution = 2
logo.data.materials.append(plastic)

# feet
for i, (x, y) in enumerate(((-2.8, -1.7), (2.8, -1.7), (-2.8, 1.7), (2.8, 1.7)), 1):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.28, depth=0.11,
                                        location=(x, y, -3.89))
    foot = bpy.context.object
    foot.name = f"Rubber foot {i}"
    foot.data.materials.append(black)

# ── paper studio + GIS-inspired linework ─────────────────────────────
rounded_box("Paper-toned plinth", (0, 0, -4.02), (22, 18, 0.22), paper, 0.06)
# A matching paper-toned studio wall makes the poster share the browser's
# warm neutral environment instead of falling into an unrelated dark void.
rounded_box("Paper-toned backdrop", (0, 5.8, 1.5), (22, 0.20, 14), paper, 0.05)

# parcel/grid lines, intentionally very subtle and away from the subject
for x in (-8, -6, -4, 4, 6, 8):
    curve_line(f"Survey grid X {x}", [(x, -7, -3.89), (x+0.6, 7, -3.89)], map_ink, 0.007)
for y in (-6, -4, 4, 6):
    curve_line(f"Survey grid Y {y}", [(-10, y, -3.89), (10, y+0.25, -3.89)], map_ink, 0.007)
for ring in range(1, 5):
    pts = []
    for j in range(72):
        a = 2*math.pi*j/72
        rr = 0.72*ring*(1 + 0.05*math.sin(3*a+ring))
        pts.append((5.7 + math.cos(a)*rr*1.35, 2.8 + math.sin(a)*rr, -3.885))
    curve_line(f"Contour {ring}", pts, map_ink, 0.009, True)

# ── lights ───────────────────────────────────────────────────────────
def area(name, loc, energy, size, color, target=(0,0,-0.2)):
    bpy.ops.object.light_add(type="AREA", location=loc)
    l = bpy.context.object
    l.name = name
    l.data.energy = energy
    l.data.shape = "DISK"
    l.data.size = size
    l.data.color = color
    look_at(l, target)
    return l

area("Warm key softbox", (-6.5, -8.0, 9.0), 1150, 5.0, (1.0, 0.80, 0.62))
area("Cool fill card", (7.0, -5.0, 3.0), 520, 4.0, (0.62, 0.74, 0.90))
area("Rear rim", (-4.0, 5.0, 7.0), 900, 3.0, (1.0, 0.90, 0.72))

# The screen image itself provides the restrained amber emission; no visible
# rectangular area light is placed in front of the glass, avoiding a softbox
# reflection that would obscure the DOM texture.

# ── camera ───────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(1.45, -24.0, 0.85))
cam = bpy.context.object
cam.name = "M1 resting camera"
cam.data.lens = 55
look_at(cam, (0, 0, -0.20))
scene.camera = cam

# color management and render
POSTER.parent.mkdir(parents=True, exist_ok=True)
BLEND.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
bpy.ops.render.render(write_still=True)
print(f"[M1 Blender] blend={BLEND}")
print(f"[M1 Blender] poster={POSTER}")
