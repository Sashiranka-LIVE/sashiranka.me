// Background-loop helper for .bgvid blocks (poster <img> + <video> + shade).
//
//  • reduced motion → the <video> is removed, only the poster is ever shown
//  • lazy: true     → <source data-src> are attached the first time the block nears the viewport
//  • the video fades in over the poster once it is really playing (class `is-playing`)
//  • plays only while on screen and while the tab is visible (saves battery/CPU)
export function initBgVideo(root, { lazy = false, margin = '300px 0px' } = {}) {
  const video = root?.querySelector('video');
  if (!video) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { video.remove(); return; }

  const markPlaying = () => root.classList.add('is-playing');
  video.addEventListener('playing', markPlaying, { once: true });
  if (!video.paused && video.readyState > 2) markPlaying();   // autoplay won the race with this script

  let loaded = !lazy, inView = false;
  const attach = () => {
    if (loaded) return;
    loaded = true;
    video.querySelectorAll('source[data-src]').forEach((s) => { s.src = s.dataset.src; });
    video.load();
  };
  const sync = () => {
    if (inView && !document.hidden) { attach(); video.play()?.catch(() => {}); }   // autoplay can be refused (e.g. low-power mode) → poster stays
    else video.pause();
  };
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { rootMargin: margin }).observe(root);
  document.addEventListener('visibilitychange', sync);
}
