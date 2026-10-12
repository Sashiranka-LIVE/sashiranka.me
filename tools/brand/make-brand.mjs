// Renders the OG image (1200×630) and favicons from the vectorised SD mark. `npm run og`
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SD = JSON.parse(readFileSync(root + '/src/brand/sd-mark.json', 'utf8'));
const nm = 'file://' + root + '/node_modules/';
const mark = (color, extra = '') => `<svg viewBox="0 0 ${SD.w} ${SD.h}" ${extra}><path d="${SD.fill}" fill="${color}" fill-rule="evenodd"/></svg>`;
const fonts = `
@font-face{font-family:A;src:url(${nm}@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2);font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:S;font-style:italic;src:url(${nm}@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2)}
@font-face{font-family:M;src:url(${nm}@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2);font-weight:100 800}`;
const og = `<!doctype html><html><head><style>${fonts}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#0F0E0C;color:#EEE8DC;font-family:A;position:relative;overflow:hidden}
.glow{position:absolute;right:-40px;top:40px;width:760px;height:560px;background:radial-gradient(closest-side,rgba(234,120,42,.26),rgba(234,61,42,.08) 55%,transparent)}
.dots{position:absolute;right:0;top:0;width:640px;height:630px;background:radial-gradient(circle,rgba(238,232,220,.11) 1.1px,transparent 1.7px) 0 0/7px 7px;
  -webkit-mask:radial-gradient(closest-side at 60% 50%,#000,transparent)}
.sheet{position:absolute;inset:22px;border:1px solid rgba(238,232,220,.22)}
.c{position:absolute;width:16px;height:16px;border-color:#D6CFC2;border-style:solid;border-width:0}
.tl{left:14px;top:14px;border-left-width:1px;border-top-width:1px}.tr{right:14px;top:14px;border-right-width:1px;border-top-width:1px}
.bl{left:14px;bottom:14px;border-left-width:1px;border-bottom-width:1px}.br{right:14px;bottom:14px;border-right-width:1px;border-bottom-width:1px}
.m{font-family:M;font-weight:500;font-size:17px;letter-spacing:.08em;text-transform:uppercase;color:#D6CFC2}
.top{position:absolute;left:64px;right:64px;top:58px;display:flex;justify-content:space-between}
h1{position:absolute;left:58px;top:150px;font-weight:800;font-stretch:62%;text-transform:uppercase;font-size:176px;line-height:.82;letter-spacing:-.01em}
h1 em{font-family:S;font-weight:400;font-stretch:100%;text-transform:none;font-size:56px;color:#D6CFC2;margin-right:12px;vertical-align:58px}
h1 .g{color:transparent;-webkit-text-stroke:1.5px rgba(238,232,220,.5)}
h1 .r{color:#EA3D2A}
.name{position:absolute;left:64px;bottom:62px;font-size:30px;font-weight:600}
.name span{display:block;margin-top:8px}
.sig{position:absolute;right:58px;top:170px;width:470px;filter:drop-shadow(0 0 18px rgba(234,140,60,.35))}
.bar{position:absolute;right:64px;bottom:62px;text-align:right}
.bar b{color:#EA3D2A;font-weight:600}
</style></head><body>
<div class="glow"></div><div class="dots"></div><div class="sheet"></div>
<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>
<div class="top m"><span>Sheet 01 / 04</span><span>Colombo, Sri Lanka</span></div>
<h1>Form<br><em>to</em><span class="g">Print</span><span class="r">.</span></h1>
<div class="sig">${mark('#EEE8DC', 'width="100%"')}</div>
<div class="name">Sasiranka D. Fernando<span class="m">Freelance web developer · VZiP DEVELOGENZ</span></div>
<div class="bar m"><b>●</b> sashiranka.me</div>
</body></html>`;
const icon = (size, pad) => `<!doctype html><html><head><style>*{margin:0}body{width:${size}px;height:${size}px;background:#0F0E0C;display:grid;place-items:center}
svg{width:${size - pad * 2}px;height:auto}</style></head><body>${mark('#EEE8DC')}</body></html>`;
// SVG favicon: crop the mark's dense part (S + D) so it reads at 16px, ink tile
const fav = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0F0E0C"/><svg x="2" y="6" width="60" height="52" viewBox="${Math.round(SD.w * 0.36)} 0 ${Math.round(SD.w * 0.5)} ${Math.round(SD.h * 0.72)}"><path d="${SD.fill}" fill="#EEE8DC" fill-rule="evenodd"/></svg></svg>`;
const { writeFileSync } = await import('node:fs');
writeFileSync(root + '/public/favicon.svg', fav);
const b = await chromium.launch();
const shot = async (html, w, h, out, scale = 1) => {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  const tmp = root + '/tools/brand/_render.html'; writeFileSync(tmp, html);
  await p.goto('file://' + tmp, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
  await p.screenshot({ path: out }); await p.close();
};
await shot(og, 1200, 630, root + '/public/og.png');
await shot(icon(180, 14), 180, 180, root + '/public/apple-touch-icon.png');
const p = await b.newPage({ viewport: { width: 32, height: 32 } });
await p.setContent(`<body style="margin:0">${fav.replace('<svg ', '<svg width="32" height="32" ')}</body>`); await p.screenshot({ path: root + '/public/favicon-32.png', omitBackground: true }); await p.close();
await b.close();
console.log('brand assets written');
