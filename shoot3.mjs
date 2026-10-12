import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://127.0.0.1:4173/';
const out = 'shots/round3/';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const logs = [];
async function page(vp, extra = {}) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, ...extra });
  const p = await ctx.newPage();
  p.on('console', (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`));
  p.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await p.goto(BASE);
  return p;
}
const goto = (p, sel, off = 0) => p.evaluate(([s, o]) => window.__lenis.scrollTo(s, { immediate: true, offset: o }), [sel, off]);
const only = process.argv[2];
// 0. preloader: signature being drawn
if (!only || only === 'pre') {
  const p = await page({ width: 1280, height: 800 });
  await p.waitForFunction(() => { const q = document.querySelectorAll('#preSig mask path'); return q.length && parseFloat(getComputedStyle(q[5]).strokeDashoffset) < 0.5; }, null, { timeout: 30000, polling: 30 }).catch(() => {});
  await p.screenshot({ path: out + '00-preloader-signature.png' });
  await p.context().close();
}
if (!only || only === 'hero') {
  const p = await page({ width: 1280, height: 800 });
  await p.waitForTimeout(4000);
  await p.screenshot({ path: out + '01-hero.png' });
  await p.evaluate(() => { const v = document.getElementById('heroVideo'); v && (v.currentTime = 6); });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: out + '02-hero-held-pose.png' });
  const vstate = await p.evaluate(() => [...document.querySelectorAll('video')].map((v) => ({ id: v.id, src: v.currentSrc.split('/').pop(), t: v.currentTime.toFixed(2), rs: v.readyState, paused: v.paused })));
  logs.push('[video] ' + JSON.stringify(vstate));
  await goto(p, '#work', 0); await p.waitForTimeout(2600);
  await p.screenshot({ path: out + '03a-work-head.png' });
  await goto(p, '.case', -60); await p.waitForTimeout(2600);
  const fig = await p.locator('.case__fig').first().boundingBox();
  await p.mouse.move(fig.x + fig.width * 0.3, fig.y + fig.height * 0.4, { steps: 8 });
  await p.waitForTimeout(1300);
  await p.screenshot({ path: out + '03b-work-case1-hover.png' });
  await p.mouse.move(40, 400);
  await goto(p, '.case:nth-child(2)', -60); await p.waitForTimeout(2600);
  await p.screenshot({ path: out + '03c-work-case2.png' });
  await goto(p, '.case:nth-child(3)', -60); await p.waitForTimeout(2600);
  await p.screenshot({ path: out + '03d-work-case3.png' });
  await goto(p, '#about', 0); await p.waitForTimeout(2600);
  await p.screenshot({ path: out + '04a-about.png' });
  await goto(p, '.about__grid', -40); await p.waitForTimeout(2600);
  await p.screenshot({ path: out + '04b-about-body.png' });
  await goto(p, '#contact', 0); await p.waitForTimeout(3600);
  await p.screenshot({ path: out + '05-footer-signature.png' });
  await p.context().close();
}
if (!only || only === 'mobile') {
  const p = await page({ width: 390, height: 844 }, { hasTouch: true, isMobile: true });
  await p.waitForTimeout(12000);
  await p.screenshot({ path: out + '06a-mobile-hero.png' });
  await goto(p, '.case', -40); await p.waitForTimeout(2600);
  await p.screenshot({ path: out + '06b-mobile-work.png' });
  await goto(p, '.about__grid', -40); await p.waitForTimeout(2600);
  await p.screenshot({ path: out + '06c-mobile-about.png' });
  await goto(p, '#contact', 0); await p.waitForTimeout(3200);
  await p.screenshot({ path: out + '06d-mobile-footer.png' });
  await p.context().close();
}
await browser.close();
console.log(logs.filter((l) => /Shader Error|pageerror|\[video\]|\[error\]/.test(l)).join('\n') || 'no console errors');
