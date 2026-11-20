# ANCIENT — Interactive 3D Sculpture Gallery

React · Vite · TypeScript · Three.js · React Three Fiber · Drei · Tailwind CSS

## Run
```bash
npm install
npm run dev      # development
npm run build    # production build -> dist/
npm run preview
```

## Configure
Everything editable lives in `src/config/site.ts`: Instagram username, profile URL, and each sculpture's name, era, description, model path and Instagram link.

## 3D models (required — not bundled)
No sculpture files ship with this repo, so every slot shows an empty pedestal labelled with its expected path until you add the models.
1. Get licensed marble-sculpture GLB files (e.g. Sketchfab downloads with CC licenses, or your own scans). Credit authors as their licenses require.
2. Compress: `npx gltf-transform optimize in.glb public/models/zeus.glb --compress draco --texture-compress webp`
3. Place the files at the paths in `src/config/site.ts` (`public/models/david.glb` (included), `augustus.glb`, `warrior.glb`, `nefertiti.glb`, `medusa.glb`, `athena.glb`). Models are auto-centred and scaled; tweak `scale` / `yOffset` if needed. Materials are replaced with marble in code.
4. Draco decoding is automatic (drei loads the decoder from a CDN). Models load only when the collection scrolls into view.

Add `public/og.jpg` (1200×630) for social previews.

## Deploy
**GitHub Pages:** `npm run build`, then publish `dist/` (e.g. with the `gh-pages` package: `npx gh-pages -d dist`), or use a GitHub Actions Pages workflow that runs `npm ci && npm run build` and uploads `dist`. Vite `base` is `./`, so project sites work as-is.

**Cloudflare Pages:** connect the repo, build command `npm run build`, output directory `dist`.

## Performance & accessibility
Lazy-loaded 3D chunk, pixel-ratio cap (1.5 on mobile, 2 on desktop), shadows/antialiasing off on mobile, WebGL fallback message, `prefers-reduced-motion` stops rotation and animations.
