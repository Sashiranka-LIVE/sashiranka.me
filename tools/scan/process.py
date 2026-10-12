# TripoSR raw mesh -> clean, symmetric, decimated bust with an ink-tone channel.
import trimesh, numpy as np, json, sys
from scipy.spatial import cKDTree
import fast_simplification
src, smooth_it, target = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
keep_side = sys.argv[4] if len(sys.argv) > 4 else '+'
raw = trimesh.load(src, process=False)
cols = np.asarray(raw.visual.vertex_colors)[:, :3].astype(np.float32) / 255
R = trimesh.transformations.rotation_matrix
T = R(-0.17, [1, 0, 0]) @ R(np.pi / 2, [0, 1, 0]) @ R(-np.pi / 2, [1, 0, 0])  # z-up->y-up, face +Z, undo pitch
raw.apply_transform(T)
m = max(raw.split(only_watertight=False), key=lambda c: len(c.faces))
trimesh.smoothing.filter_taubin(m, lamb=0.5, nu=-0.53, iterations=smooth_it)
v, f = fast_simplification.simplify(m.vertices.astype(np.float32), m.faces.astype(np.int32), target_reduction=max(0.0, 1 - target / len(m.faces)))
m = trimesh.Trimesh(v, f, process=True)
# tone from the photo colours (dark hair/beard/brows = more ink)
d, idx = cKDTree(raw.vertices).query(m.vertices, k=6)
w = 1 / (d + 1e-5); w /= w.sum(1, keepdims=True)
lum = ((cols[idx] * w[..., None]).sum(1)) @ np.array([0.299, 0.587, 0.114])
skin, hairL = np.percentile(lum, 72), np.percentile(lum, 12)
tone = np.clip((skin - lum) / (skin - hairL), 0, 1) ** 0.6
# symmetry axis: nose tip (most forward point in the upper-middle band)
yv = m.vertices[:, 1]; H = np.ptp(yv)
band = (yv > m.bounds[1, 1] - 0.62 * H) & (yv < m.bounds[1, 1] - 0.35 * H)
tip = m.vertices[band][np.argmax(m.vertices[band][:, 2])]
m.apply_translation([-tip[0], 0, 0])
print('nose tip x offset', round(float(tip[0]), 4))
SYM = len(sys.argv) > 4 and sys.argv[4] == 'sym'
# optional hard symmetrise: keep his left half and mirror it
if SYM:
  exec('''
src_v, src_t = m.vertices.copy(), tone.copy()
half = m.slice_plane([0, 0, 0], [1, 0, 0], cap=False)
mir = half.copy(); mir.vertices[:, 0] *= -1; mir.faces = mir.faces[:, ::-1]
m = trimesh.util.concatenate([half, mir])
m.vertices[np.abs(m.vertices[:, 0]) < 1e-6, 0] = 0.0
m.merge_vertices(digits_vertex=4)
m.remove_unreferenced_vertices()
print('watertight after mirror', m.is_watertight)
trimesh.smoothing.filter_taubin(m, lamb=0.5, nu=-0.53, iterations=2)
hv = m.vertices.copy(); hv[:, 0] = np.abs(hv[:, 0])
tone = src_t[cKDTree(src_v).query(hv)[1]]
''')
# flat cut through the chest
yb = m.bounds[0, 1] + 0.2 * np.ptp(m.vertices[:, 1])
vt = m.vertices.copy()
m = m.slice_plane([0, yb, 0], [0, 1, 0], cap=True)
tone = tone[cKDTree(vt).query(m.vertices)[1]]
m.fix_normals()
# normalise: top of hair at y=1.3, height 2.9, centred
b = m.bounds; s = 2.9 / (b[1, 1] - b[0, 1])
m.apply_translation([0, -b[1, 1], -(b[0, 2] + b[1, 2]) / 2]); m.apply_scale(s); m.apply_translation([0, 1.3, 0])
# neck: narrowest slice in the lower half
ys = np.linspace(1.3 - 0.9 * 2.9, 1.3 - 0.4 * 2.9, 60)
widths = [np.ptp(m.vertices[np.abs(m.vertices[:, 1] - y) < 0.02, 0]) if (np.abs(m.vertices[:, 1] - y) < 0.02).sum() > 10 else 9 for y in ys]
neck_y = float(ys[int(np.argmin(widths))])
yv = m.vertices[:, 1]
tone *= 1 - 0.85 * np.exp(-((yv - (neck_y - 0.12)) / 0.16) ** 2)  # photo's shadowed neck is skin, not ink
adj = m.vertex_neighbors
for _ in range(2):
    tone = np.array([0.5 * tone[i] + 0.5 * tone[n].mean() if len(n) else tone[i] for i, n in enumerate(adj)])
print('faces', len(m.faces), 'neck_y', round(neck_y, 3), 'tone mean', tone.mean().round(3))
m.vertices.astype(np.float32).tofile('bust_pos.bin'); m.faces.astype(np.uint32).tofile('bust_idx.bin'); tone.astype(np.float32).tofile('bust_tone.bin')
json.dump({'neckY': neck_y, 'bottom': float(m.bounds[0, 1])}, open('bust.json', 'w'))
