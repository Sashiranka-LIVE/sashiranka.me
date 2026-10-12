import SD from './sd-mark.json';

// The SD signature, vectorised from his logo (potrace fill + skeleton centrelines).
// The exact potrace fill is revealed through a mask of fat centreline strokes, so the "pen"
// writes it in true writing order but the final shape is pixel-true to the original artwork.
//
// Strokes (built by tools/brand/build-sign-paths.py): 1 S · 2 D stem · 3 D bowl + under-swash · 4 tail.
// Each one carries a time table `tt` (normalised time at evenly spaced arc positions) computed from the
// two-thirds power law of handwriting (speed ~ curvature^-1/3) with a soft pen-down / pen-up ramp.
let uid = 0;
export function signatureSVG({ cls = '', title = 'Sasiranka D. Fernando signature', drawn = true } = {}) {
  const id = `sdm${++uid}`;
  const strokes = SD.strokes.map((s) =>
    `<path d="${s.d}" pathLength="1" style="stroke-dasharray:1 3;stroke-dashoffset:${drawn ? 0 : 1.01};visibility:${drawn ? 'visible' : 'hidden'}" data-len="${s.len}"/>`).join('');
  return `<svg class="sig ${cls}" viewBox="0 0 ${SD.w} ${SD.h}" role="img" aria-label="${title}">
    <defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${SD.w}" height="${SD.h}">
      <g fill="none" stroke="#fff" stroke-width="${SD.pen}" stroke-linecap="round" stroke-linejoin="round">${strokes}</g>
    </mask></defs>
    <path class="sig__ink" d="${SD.fill}" fill="currentColor" fill-rule="evenodd" mask="url(#${id})"/>
  </svg>`;
}

// time u∈[0,1] → arc progress s∈[0,1] along one stroke, from its velocity-derived time table
function progressAt(tt, u) {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  let lo = 0, hi = tt.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; (tt[m] <= u ? (lo = m) : (hi = m)); }
  const f = (u - tt[lo]) / Math.max(tt[hi] - tt[lo], 1e-9);
  return (lo + f) / (tt.length - 1);
}

// Writes S, then D, then the flourishes. `duration` is the whole signing time including the short
// pen-lift pauses between strokes.
export function drawSignature(gsap, svg, { duration = 3.4 } = {}) {
  const paths = [...svg.querySelectorAll('mask path')];
  const weight = SD.strokes.reduce((a, s) => a + s.T + s.gap, 0);
  const tl = gsap.timeline();
  paths.forEach((p, i) => {
    const st = SD.strokes[i];
    const state = { u: 0 };
    tl.fromTo(state, { u: 0 }, {
      u: 1, duration: Math.max((duration * st.T) / weight, 0.02), ease: 'none',
      onUpdate: () => {
        const s = progressAt(st.tt, state.u);
        // hidden until the pen actually touches down: a round line-cap on a zero-length dash would stamp a dot at the stroke start
        p.style.visibility = s > 0.002 ? 'visible' : 'hidden';
        p.style.strokeDashoffset = 1.01 * (1 - s);
      },
      onComplete: () => { p.style.visibility = 'visible'; p.style.strokeDashoffset = 0; },
    }, i ? `>+=${(duration * st.gap) / weight}` : '>');
  });
  return tl;
}
export function resetSignature(svg) { svg.querySelectorAll('mask path').forEach((p) => { p.style.strokeDashoffset = 1.01; p.style.visibility = 'hidden'; }); }
