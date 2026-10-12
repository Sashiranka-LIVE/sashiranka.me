# Handoff: sashiranka.me portfolio (hero-sample), 11 Oct 2026

Site is English-only. The one exception is the small decorative "කොළඹ" in the side rail.
Domain: **https://sashiranka.me/** (used for the canonical URL, og:url and og:image).

## How to run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npx vite preview   # http://127.0.0.1:4173 (serves dist)
node shoot3.mjs [pre|hero|mobile]   # Playwright screenshots -> shots/round3/ (needs the preview server)
npm run og         # regenerate public/og.png, favicon.svg, favicon-32.png, apple-touch-icon.png
```

## Round 6 (12 Oct 2026)
- **Preloader signing film:** after 100% the preloader fades to a black stage and plays `public/video/sign.{mp4,webm}` (4 s, 1040×1120 crop of the 1080×1920 source, native resolution, black level graded to pure #000 so it has no visible box). `sign-poster.webp` is the final frame, used for reduced motion. The preloader waits for the film to be playable (7 s timeout). If it cannot load or play, the vector SD signature (round 5 physics) draws instead. The nav monogram and footer signature are still the vector artwork.
- **About:** `public/portrait/about-3x4.jpg`, a native 1078×1438 crop (3:4, centred on the face) of the supplied 2576×1438 image. Frame is `aspect-ratio: 3/4`, image opacity .78. The attached file was landscape, not 3:4, so the crop is mine; re-crop from the original if you want a different framing.
- Old `about-original.jpg` is in `../archive/hero-v4/`.

## Round 5 (12 Oct 2026)
- **Hero video replaced** with `hero_section_bg_video` (6 s, native 1560×1080 crop, watermark cropped out), opacity .55 (was .35), 1 s dissolve loop, video shifted 14% right on desktop. Copy block and spec block now sit on dark glass panels.
- **Contact video replaced** with `ending_section_background_video` (8 s), opacity .88, light shade; the panel is 95% ink + blur so text always beats the footage.
- **Work images:** halftone layers, scale, clip-path reveal and crop-mark growth are removed. The clear colour image fades from 20% to 100% opacity under the cursor (on touch: while the card is centred). Source screenshots are still the 1200×900 originals; re-shoot at 2× when the repos are at hand.
- **About:** the original portrait (`public/portrait/about-original.jpg`, 960×958, untouched) in a dark square frame with crop marks, image opacity 78%, plain fade-in.
- **Signature:** rebuilt as S → D stem → D bowl + swash → tail, with a velocity profile per stroke (see README). Preloader draw is 3.4 s, footer 3.2 s. Mask strokes stay hidden until pen touchdown (a round cap on a zero-length dash stamped stray dots).
- **CTA** is now a paper button with an ink label (AAA); the contact email is paper with a 3 px accent rule.
- **Audit target raised to AAA** (7:1 normal, 4.5:1 large) over 5 hero frames, 6 contact frames and every section, desktop + mobile. Only the decorative accent full stop of the headline is below 4.5:1 (3.0–3.8:1, still above the 3:1 graphic minimum).
- Old round-4 videos and the halftone about print are in `../archive/hero-v4/`.

## Round 4 (11 Oct 2026): background videos, contrast
- **Hero:** the halftone portrait and the hover video are gone (code archived in `../archive/hero-v3/`, three.js removed from `package.json`).
  The beanie-removal clip is now a full-bleed, muted, looping, `playsinline` background (`#heroBg`): `object-fit: cover`, opacity .35, `#0F0E0C` gradient overlay (strongest on the left, plus top and bottom).
  The "SD" watermark is cropped out of the encode. On desktop the video is shifted 9% right with a feathered left edge, so the face sits right of the headline.
- **Contact:** the flaming-skull clip is a full-bleed background behind a dark glass panel (`.foot__panel`: 90% ink + `backdrop-filter: blur(18px)`, opaque fallback without backdrop-filter support). Desktop shifts the video 16% right so the skull sits beside the panel.
  There is still no message form (only the mailto link); the panel holds the title, email, links and signature.
- **Fallbacks:** poster `<img>` for both; no video at all under `prefers-reduced-motion` (nothing is downloaded); the contact video attaches its sources only when it scrolls near the viewport; both pause when off-screen.
- **Encodes** (`public/video/`, no audio, 1280×886, 25 fps, seamless dissolve loop): hero MP4 1.5 MB / WebM 0.9 MB (9.8 s); contact MP4 2.5 MB / WebM 2.6 MB (11.5 s).
- **Typography:** `--paper` and `--paper-dim` are both #F2EDE4 (body text), `--graphite` is #BDB7AB (labels). Key info is bold or accent #EA3D2A: solid accent CTA with ink label (4.8:1), accent email on the contact panel (large text), bold service lines and hero specs.
  Small accent text was swapped for bold paper plus an accent rule or square, because #EA3D2A on ink is only about 4.5:1 and drops below that with grain or footage behind it.
- **Audit:** Playwright + pixel sampling of every text run against the worst 2% brightest background pixels, over 5 hero frames, 6 contact frames and all sections, desktop 1440×900 and mobile 390×844: 0 failures (min 3.9:1 on the large accent full stop, everything else ≥ 4.5:1). The dotted ghost "PRINT" is decorative display type and is excluded.
- **Layout fix:** the two title lines had a ~90 px extra gap (`vertical-align: top` on `.line__in` fixes it) and the title overlapped the lede below 800 px height. Title size is now `min(17vw, 26vh)`.
- Removed the "FIG. 01 / hover to ignite" caption and moved the specs block up to its place.

## Done (earlier rounds)
- **(Retired in round 4) Hero portrait (2.5D halftone):** `src/avatar/portrait.js`. A plane displaced by a depth map and printed with ink dots plus a proof-red rim, with cursor tilt and a dot "print-in" reveal. `AVATAR.mode` in `src/config.js` switches between `'portrait'`, `'glb'` and `'code'` (the GLB and code busts are kept as fallbacks).
- **(Retired in round 4) Hero hover video:**
  - Hovering (or tapping on touch) dissolves the still, dot by dot, into the transform clip, which plays forward.
  - Leaving the figure plays the clip in reverse back to frame 0 using a pre-reversed encode (`createTransformPlayer`), then dissolves back to the still.
  - The red backdrop is graded toward ink and the edges feather out as a halftone ramp.
  - The video lazy-loads after the preloader. With prefers-reduced-motion there is no video.
  - Encodes are 720×720, GOP 6 (dense keyframes) and silent. The crop removes the "SD" watermark.
- **About section** (`#about`): `public/portrait/about-print.webp` (an ink + red-plate halftone of the leather-coat photo) plus a bio built only from real facts.
- **Selected Work** (`#work`): Salt & Fade Business Hub, Inspire College Certificate Studio and Free Paradise Resort.
  - Each has a service line, description, stack and live link.
  - Thumbnails come from local builds of his repos with demo data only:
    - Salt & Fade: no bank number, no account holder, no signature, and the client name is replaced.
    - Inspire College: the student name is "Your Name Here" and the signature is hidden.
  - Each thumbnail has a halftone version plus a colour version that reveals from the cursor's entry point on hover, with crop marks.
- **Branding:**
  - The SD signature was vectorised with potracer from the logo JPG and lives in `src/brand/sd-mark.json` and `public/brand/sd-mark.svg`.
  - `src/brand/signature.js` draws it in writing order through a mask of fat centreline strokes over the exact fill.
  - It is used as the nav monogram (replacing "SDF"), drawn at the end of the preloader, and drawn in the footer.
  - `BRAND` in `src/config.js` has a `logo` slot and an `ogImage` slot.
  - OG image (1200×630) and favicons are generated by `tools/brand/make-brand.mjs`. The car-logo banner is **not** used.
- **Footer/contact** (`#contact`): email, GitHub link, Colombo clock, signature.
- **Contrast pass:** `--paper-dim` was #D6CFC2 and `--graphite` #A9A296 (superseded in round 4: now #F2EDE4 and #BDB7AB). Mono labels went from 11 to 11.5 px at weight 500. Body copy is 16–19 px at weight 430.
- **Nav:** now 02 Work / 03 About / 04 Contact (the dead "Tools" link is removed). The email is sashirankafernando@gmail.com everywhere.

## Partially done / not yet verified
1. **Background videos:** checked in desktop Chromium only (it has no H.264, so the WebM path was exercised). Still to check on real devices: Safari/iOS inline autoplay (MP4 is listed first), Low Power Mode (autoplay refused, poster stays), and the dissolve at the loop seam.
2. **Selected Work / About / footer / mobile 390:** they build, but no screenshots were reviewed. Run `node shoot3.mjs` and check the spacing, the line-mask reveals, and the case-thumbnail hover on touch (the `is-on` class shows the colour version while a card is centred).
4. **Preloader signature draw:** the timing has not been checked visually (`node shoot3.mjs pre`).
5. **Favicon:** generated from a crop of the S + D. Check how it reads at 16 px.

## Remaining TODOs
- Review the screenshots, then tune the video `xf` values, mobile framing and section spacing.
- Lighthouse/contrast audit with real tooling. The ghost "PRINT" and "Work" headings are decorative display type.
- When the real logo arrives, set `BRAND.logo`. Rerun `npm run og` if the mark changes.
- His repos: the Free-Paradise-Resort **live site has broken images**. The pages reference `images/*.png`, but the files sit in the repo root. Either move the files into `images/` or fix the paths.
- His repos: scrub the PII from the Salt & Fade and Inspired-College repos (bank details, signatures, a client invoice PDF, a student certificate PDF). See brief.md.
- Optional: a Kavindu Dias Photography case study, and a downloadable CV.

## File map
- `index.html`: all sections (hero, work, about, contact) and the OG/meta tags.
- `src/main.js`: preloader, cursor, Lenis, GSAP reveals, signature draws, hero label updates.
- `src/bgvideo.js`: background-loop helper (lazy load, reduced motion, play/pause on visibility).
- `src/config.js`: `PALETTE`, `BRAND`.
- `src/brand/`: `sd-mark.json` and `signature.js`.
- `src/style.css`: all styles.
- `public/portrait/`: `about-print.webp` (About section).
- `public/video/`: `hero-bg` and `contact-bg` (`.mp4`, `.webm`) plus `hero-poster.webp` and `contact-poster.webp`.
- `public/work/`: `{saltfade,inspire,resort}{,-ht}.webp`.
- `public/brand/sd-mark.svg`, `public/og.png`, favicons.
- `tools/`: the scan pipeline and `brand/make-brand.mjs`. The avatar export scripts, `inspect.*`, the old `shoot.mjs` and the GLB/depth assets are in `../archive/hero-v3/`.
- `avatar-work-scripts/` (in the zip only): the Python pipeline scripts (matte, depth, assets, thumbnails, vectoriser).

## Asset sources and licences
- Portraits, both background videos and the SD logo were supplied by the user. Mattes and depth maps were made locally; nothing was uploaded.
- Matte model: rembg (MIT) with BiRefNet-portrait (MIT).
- Depth model: Depth Anything V2 **Small** (Apache-2.0). Do not swap in Base or Large, which are CC-BY-NC.
- Vectoriser: potracer, a Python port of potrace (GPL). It is used only as a build tool; the SVG output is the user's.
- Fonts: Archivo, Instrument Serif, JetBrains Mono and Noto Sans Sinhala, all under the OFL and self-hosted through @fontsource.
- Code libraries: three.js (MIT), GSAP (free licence), Lenis (MIT).
- Work thumbnails are screenshots of his own repos with the demo data described above.
- Ask the photographer about rights to the studio photos if the site will be used commercially.
