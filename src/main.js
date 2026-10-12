import './style.css';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initBgVideo } from './bgvideo.js';
import { signatureSVG, drawSignature } from './brand/signature.js';
import { BRAND } from './config.js';

gsap.registerPlugin(SplitText, ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const HOLD = params.get('hold');          // ?hold=0.6 freezes the preloader at 60% (for screenshots)

// ---------------- Colombo clock ----------------
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const clockEl = $('#clock');
const tick = () => (clockEl.textContent = fmt.format(new Date()) + ' +5:30');
const clock2 = $('#clock2');
const fmt2 = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', hour12: false });
const tick2 = () => clock2 && (clock2.textContent = fmt2.format(new Date()) + ' +5:30');
tick(); tick2(); setInterval(() => { tick(); tick2(); }, 1000);

// ---------------- Brand marks ----------------
const brandMark = $('#brandMark');
brandMark.innerHTML = BRAND.logo ? `<img src="${BRAND.logo}" alt="" />` : signatureSVG({ title: '' });
$('#preSig').innerHTML = signatureSVG({ drawn: false, title: '' });
$('#footSig').innerHTML = signatureSVG({ drawn: false });

// ---------------- Lenis ----------------
const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
lenis.stop();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// ---------------- Cursor (registration mark, difference blend) ----------------
const cursor = $('#cursor');
if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); gsap.to(cursor, { opacity: 1, duration: 0.3 }); }, { passive: true });
  document.addEventListener('pointerleave', () => gsap.to(cursor, { opacity: 0, duration: 0.3 }));
  document.querySelectorAll('[data-hover]').forEach((el) => {
    const cls = el.dataset.hover === 'cta' ? 'is-hover' : 'is-link';
    el.addEventListener('pointerenter', () => cursor.classList.add(cls));
    el.addEventListener('pointerleave', () => cursor.classList.remove(cls));
  });
  // magnetic primary CTA
  const btn = $('.btn--primary');
  btn.addEventListener('pointermove', (e) => {
    const r = btn.getBoundingClientRect();
    gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.6, ease: 'power3' });
  });
  btn.addEventListener('pointerleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,.4)' }));
}

// ---------------- Background videos ----------------
// hero loop starts straight away (it is the first paint); the contact loop attaches its sources on approach.
const progress = { fonts: 0, poster: 0, sig: 0 };
const heroPoster = $('#heroBg .bgvid__poster');
const posterDone = () => (progress.poster = 1);
if (heroPoster.complete && heroPoster.naturalWidth) posterDone();
else { heroPoster.addEventListener('load', posterDone, { once: true }); heroPoster.addEventListener('error', posterDone, { once: true }); }
document.fonts.ready.then(() => (progress.fonts = 1));
// signing film (preloader): gate the preloader on it, fall back to the vector signature if it cannot play
const preVideo = $('#preVideo'), preStage = $('#preStage');
let sigFilm = false;
if (reduce) { preVideo.remove(); progress.sig = 1; }
else {
  const sigDone = () => (progress.sig = 1);
  preVideo.addEventListener('canplaythrough', () => { sigFilm = true; sigDone(); }, { once: true });
  preVideo.addEventListener('error', sigDone, { once: true });
  preVideo.querySelectorAll('source').forEach((s) => s.addEventListener('error', () => { if (!s.nextElementSibling) sigDone(); }));
  setTimeout(sigDone, 7000);
}
initBgVideo($('#heroBg'));
initBgVideo($('#contactBg'), { lazy: true });

// ---------------- Hero intro states ----------------
const lede = new SplitText('#lede', { type: 'lines', mask: 'lines', linesClass: 'ln' });
gsap.set('.line__in', { yPercent: 108 });
gsap.set(lede.lines, { yPercent: 100 });
gsap.set(['[data-reveal]', '.top', '.side', '.scrollcue'], { autoAlpha: 0 });
gsap.set('.ctas > *', { autoAlpha: 0, y: 14 });
gsap.set('.sheet', { clipPath: 'inset(50% 50% 50% 50%)' });
gsap.set('.hero__bg', { autoAlpha: 0 });

// ---------------- Preloader ----------------
const digits = $('#preDigits'), fill = $('#preFill');
const checks = [...document.querySelectorAll('#preChecks li')];
const shown = { v: 0 };
const minTime = reduce ? 0.2 : 2.4;
const t0 = performance.now();

function realProgress() {
  const time = Math.min(1, (performance.now() - t0) / 1000 / minTime);
  const asset = (progress.fonts + progress.poster + progress.sig) / 3;
  let p = Math.min(time, asset * 0.5 + time * 0.5, asset === 1 ? time : 0.92);
  if (HOLD) p = Math.min(p, parseFloat(HOLD));
  return p;
}
function paint() {
  const p = shown.v;
  digits.textContent = String(Math.round(p * 100)).padStart(3, '0');
  fill.style.transform = `scaleX(${p})`;
  checks[0].classList.toggle('done', progress.fonts === 1 && p > 0.2);
  checks[1].classList.toggle('done', progress.poster === 1 && p > 0.5);
  checks[2].classList.toggle('done', progress.sig === 1 && p > 0.86);
}
gsap.ticker.add(function loop() {
  shown.v += (realProgress() - shown.v) * 0.09;
  if (realProgress() >= 1 && shown.v > 0.995) shown.v = 1;
  paint();
  if (shown.v === 1) { gsap.ticker.remove(loop); finish(); }
});

async function finish() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.inOut' } });
  tl.to('.pre__digits', { yPercent: -105, duration: 0.7, ease: 'expo.in' })
    .to('.pre__pct, .pre__checks', { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, '<0.1')
    // sign the sheet before it feeds out: the supplied signing film on a black stage
    // (reduced motion → still frame; film unavailable → the vector signature draws instead)
    .add(sigFilm || reduce ? signStage() : drawSignature(gsap, $('#preSig .sig'), { duration: 3.4 }), '-=0.15')
    .to({}, { duration: 0.3 })
    // the sheet feeds out of the "printer": clip from bottom, proof-red edge leading
    .set('#preEdge', { opacity: 1 })
    .to('#pre', { clipPath: 'inset(0 0 100% 0)', duration: 1.15 }, '+=0.05')
    .to('#preEdge', { bottom: '100%', duration: 1.15 }, '<')
    .add(() => { document.body.classList.remove('is-loading'); $('#pre').remove(); lenis.start(); ScrollTrigger.refresh(); })
    .add(reveal(), '-=0.55');
}

function signStage() {
  const hold = reduce ? 0.7 : (preVideo.duration || 4) + 0.15;
  return gsap.timeline()
    .to(preStage, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' })
    .add(() => { if (!reduce) { preVideo.currentTime = 0; preVideo.play().catch(() => {}); } })
    .to({}, { duration: hold });
}

function reveal() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.hero__bg', { autoAlpha: 1, duration: 2.4, ease: 'power2.out' }, 0)
    .to('.sheet', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }, 0)
    .to('.line__in', { yPercent: 0, duration: 1.4, stagger: 0.12 }, 0.15)
    .to(['.top', '.side', '.scrollcue'], { autoAlpha: 1, duration: 1 }, 0.5)
    .to('[data-reveal]', { autoAlpha: 1, duration: 1, stagger: 0.08 }, 0.6)
    .to(lede.lines, { yPercent: 0, duration: 1.2, stagger: 0.07 }, 0.55)
    .to('.ctas > *', { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0.8);
  return tl;
}

// ---------------- Scroll: hero parallax ----------------
gsap.to('.hero__title', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
// ---------------- Sheets: line-mask reveals (same easing as the hero) ----------------
document.querySelectorAll('[data-split], [data-lines]').forEach((el) => {
  const st = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'ln' });
  if (reduce) return;
  gsap.set(st.lines, { yPercent: 105 });
  gsap.to(st.lines, { yPercent: 0, duration: el.hasAttribute('data-split') ? 1.3 : 1.1, stagger: 0.07, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 86%' } });
});
document.querySelectorAll('.sec-head__folio, .case__no, .case__svc, .case__stack, .case__link, .about__list, .foot__links, .foot__mail').forEach((el) => {
  if (reduce) return;
  gsap.from(el, { autoAlpha: 0, y: 16, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
});
// work images: no transforms. The clear colour proof simply appears (opacity) while the cursor is over it;
// on touch devices it shows while the card is centred in the viewport.
document.querySelectorAll('.case__fig').forEach((el) => {
  ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 45%', toggleClass: 'is-on' });
});
// about portrait: plain fade-in
document.querySelectorAll('.about__print').forEach((el) => {
  if (reduce) return;
  gsap.from(el, { autoAlpha: 0, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
});
// footer signature draws when it comes into view
const footSvg = $('#footSig .sig');
ScrollTrigger.create({ trigger: '#footSig', start: 'top 92%', once: true, onEnter: () => drawSignature(gsap, footSvg, { duration: reduce ? 0.01 : 3.2 }) });


window.__lenis = lenis;
