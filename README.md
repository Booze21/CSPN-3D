# ANCIENT — Instagram welcome page (3D)

One-screen page: a 3D statue (David) with a glowing ring and a single button that opens Instagram.
React · Vite · TypeScript · Three.js · React Three Fiber · Drei · Tailwind CSS

```bash
npm install
npm run dev
npm run build   # output: dist/
```

Edit `src/config/site.ts` for the Instagram link, title, subtitle, button text and model path.
Model: `public/models/david.glb` (Draco-compressed, ~1.5 MB). To swap it, replace the file or change `site.model`.

Deploy (Cloudflare Pages): build command `npm run build`, output directory `dist`.
