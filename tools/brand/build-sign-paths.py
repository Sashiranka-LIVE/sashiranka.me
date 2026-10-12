"""Rebuild the signature's pen strokes in true writing order, with a human velocity profile.

Input : tools/brand/sd-mark.centrelines-original.json  (potrace fill + skeleton centrelines, unordered)
Output: src/brand/sd-mark.json  (same exact fill, new `strokes`: ordered, smoothed, with a time table)

Writing order (S first, then D, then the flourishes):
  P1  S      hook -> S spine -> lower loop -> exit stroke to the D stem        (centrelines 0,1,2,3)
  P2  D stem top -> down to the foot                                          (4,5)
  P3  D bowl: tick -> over the top -> down into the big under-swash           (6,7,8)
  P4  tail    baseline through the D foot out to the right flick              (9,10,11)

Speed along each stroke follows the two-thirds power law of handwriting (v ~ curvature^-1/3: slow in
tight curves, fast on long arcs) with minimum-jerk style acceleration at pen-down and a soft landing at pen-up.
Run:  python3 -I tools/brand/build-sign-paths.py
"""
import json, numpy as np
from scipy.ndimage import gaussian_filter1d

SRC = 'tools/brand/sd-mark.centrelines-original.json'
OUT = 'src/brand/sd-mark.json'
d = json.load(open(SRC))
raw = []
for s in d['strokes']:
    pts = [tuple(map(float, p.split())) for p in s['d'][1:].split('L')]
    raw.append(np.array(pts))

# the lower loop of the S must be travelled bottom-first (down, round the left tip, back along the top)
loop = raw[2]
if loop[len(loop) // 3][1] < 380:
    raw[2] = loop[::-1]

PEN = [('S', [0, 1, 2, 3]), ('D', [4, 5]), ('D', [6, 7, 8]), ('flourish', [9, 10, 11])]

def resample(p, step):
    seg = np.hypot(*np.diff(p, axis=0).T)
    s = np.concatenate([[0], np.cumsum(seg)])
    keep = np.concatenate([[True], seg > 1e-6])
    n = max(int(s[-1] / step), 8)
    t = np.linspace(0, s[-1], n)
    return np.stack([np.interp(t, s[keep], p[keep, 0]), np.interp(t, s[keep], p[keep, 1])], 1), s[-1]

def smooth(p, sigma):
    pad = int(sigma * 4)
    # extend ends along their tangent so smoothing does not pull the endpoints inward
    a = p[0] - (p[1:pad + 1][::-1] - p[0]); b = p[-1] - (p[-pad - 1:-1][::-1] - p[-1])
    q = np.concatenate([a, p, b])
    q = np.stack([gaussian_filter1d(q[:, 0], sigma), gaussian_filter1d(q[:, 1], sigma)], 1)
    return q[len(a):len(a) + len(p)]

strokes, tot_units = [], 0
for part, idx in PEN:
    chain = [raw[idx[0]]]
    for i in idx[1:]:
        nxt = raw[i]
        chain.append(nxt)
    p = np.concatenate(chain)
    p, _ = resample(p, 2.0)
    p = smooth(p, 3.0)
    p, L = resample(p, 3.0)
    # curvature from the (smoothed) tangent angle
    t = np.diff(p, axis=0); ang = np.unwrap(np.arctan2(t[:, 1], t[:, 0]))
    ds = np.hypot(*t.T)
    ang = gaussian_filter1d(ang, 4)
    kappa = np.abs(np.gradient(ang, ds.mean()) / 1.0) / 1.0
    kappa = np.concatenate([kappa, kappa[-1:]])
    kappa = gaussian_filter1d(kappa, 3)
    k0 = 1 / 260.0                                   # floor: straight runs are fast but finite
    v = (1.0 / (kappa + k0)) ** (1 / 3)              # two-thirds power law
    s_arc = np.concatenate([[0], np.cumsum(ds)])
    ramp_in, ramp_out = 55.0, 40.0                   # px: pen-down acceleration / pen-up deceleration
    sm = lambda x: (lambda c: c * c * (3 - 2 * c))(np.clip(x, 0, 1))
    v *= 0.22 + 0.78 * sm(s_arc / ramp_in)
    v *= 0.30 + 0.70 * sm((s_arc[-1] - s_arc) / ramp_out)
    dt = np.hypot(*np.diff(p, axis=0).T) / ((v[:-1] + v[1:]) / 2)
    tt = np.concatenate([[0], np.cumsum(dt)])
    T = tt[-1]; tt = tt / T
    tot_units += T
    path = 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in p)
    strokes.append({'d': path, 'len': round(float(L), 1), 'T': float(T), 'part': part,
                    'tt': [round(float(x), 4) for x in tt[::2]] + ([round(float(tt[-1]), 4)] if len(tt) % 2 == 0 else [])})
# normalise time weights: total drawing = 1.0, plus a pen-lift pause (fraction of total) before each new stroke
for i, s in enumerate(strokes):
    s['T'] = round(s['T'] / tot_units, 5)
    s['gap'] = 0.0 if i == 0 else 0.07
    # `tt` was stored at every 2nd sample (+ last), so progress(u) is looked up on that coarser grid
out = {'w': d['w'], 'h': d['h'], 'fill': d['fill'], 'pen': d['pen'], 'strokes': strokes}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print([(s['part'], s['len'], round(float(s['T']), 3)) for s in strokes])
