# Recruit-Talent Banner Animation

A single continuous animated banner for the Recruit-Talent landing-page
hero, built with [Remotion](https://www.remotion.dev/). Four scenes —
Proposal Development → Software Development → Staffing → IT Support —
flow into each other with a persistent **"Best at …"** headline that
backspaces and retypes between scenes so the whole thing reads as one
voice rather than four videos.

---

## Quick start

```bash
npm install        # only first time
npm run dev        # open studio at http://localhost:3000
```

Three compositions are registered (sidebar in the studio):

| ID | What it is |
|---|---|
| **Banner** | Full continuous banner with the soft blue background blob — production |
| **Banner-Clean** | Same animation, no blob, no grid lines — pure white background |
| **Scene1-PD** | Scene 1 in isolation (260 frames). Frozen reference matching `snapshots/scene1-final/` |

---

## Render

```bash
# Production banner with blob (CRF 14 — visually lossless)
npm run render
# → out/banner.mp4

# Clean banner (white frame only)
npm run render-clean
# → out/banner-clean.mp4

# Custom: any composition, any output, any quality
npx remotion render <id> <outpath> --crf=14
```

[`remotion.config.ts`](remotion.config.ts) uses **PNG** for intermediate
frame captures (lossless) so the encoder gets a clean source — no
chroma artefacts on text edges, gradients, or drop shadows.

| Composition | Dimensions | FPS | Duration |
|---|---|---|---|
| `Banner`, `Banner-Clean` | 1452 × 709 | 30 | 1880 frames ≈ 62.7s |
| `Scene1-PD` | 1452 × 709 | 30 | 260 frames ≈ 8.7s |

---

## Project structure

```
src/
├── Root.tsx                  ← composition registry
├── BannerStage.tsx           ← shared chrome + footer-stages mechanism
├── BannerAnimation.tsx       ← master orchestrator weaving 4 scenes
└── scenes/
    ├── Scene1PD.tsx          ← Scene 1 — Proposal Development
    ├── Scene2SD.tsx          ← Scene 2 — Software Development
    ├── Scene3Staffing.tsx    ← Scene 3 — Staffing
    └── Scene4IT.tsx          ← Scene 4 — IT Support

reference/01-PD/              ← source SVG keyframes for Scene 1
animation scenes/             ← source SVGs for Scenes 2/3/4 (working material)
snapshots/                    ← rollback recovery points (not for building)
docs/                         ← detailed style guide + architecture notes
```

For the full architectural rationale, scene-by-scene reference, design
language, and fine-tuning notes, see [**`CLAUDE.md`**](CLAUDE.md). It's
loaded automatically by Claude Code in any session that opens this
folder; it's also useful as plain Markdown for humans.

---

## What the banner shows (timeline)

```
0–260      Scene 1 (PD)        — paper + skeleton lines + shimmer + sparkle
260–410    Bridge 1 → 2        — "Crafting Proposals" → "Delivering Software Solutions"
390–700    Scene 2 (SD)        — </> icon → code editor → kanban dashboard
700–830    Bridge 2 → 3        — → "Precision Hiring"
770–1115   Scene 3 (Staffing)  — search → 4 candidates → success
1115–1240  Bridge 3 → 4        — → "Providing IT Support"
1280–1880  Scene 4 (IT)        — ticket → typing → IT chat → resolved ticket
```

---

## Conventions

- All animation is driven by `useCurrentFrame()` + `interpolate()`. **No CSS
  animations.** They render as static frames in Remotion.
- Coordinates work in absolute SVG space (matching `reference/*.svg`)
  and convert to card-local with `lx()` / `ly()` helpers at render time.
- One named `T_SCENE<N>` object per scene holds all frame numbers — no
  magic numbers inline.
- The shared chrome (blob, glass card, footer divider, action icons)
  never crossfades between scenes. Only what's *inside* the card changes.

---

## Tech

- [Remotion](https://www.remotion.dev/) 4.0.457 — React-based video framework
- React 19 + TypeScript 5.9
- Inter font via `@remotion/google-fonts`
- `lucide-react` for the footer icons (CirclePlus, Send)

No CSS modules, no styled-components, no Framer Motion / GSAP. Inline
styles + frame-driven interpolation throughout.

---

## Snapshots (rollback)

Two checkpoints exist as literal file-copy folders:

| Folder | When | If you need to roll back |
|---|---|---|
| `snapshots/scene1-final/` | After Scene 1 was approved | See its `README.md` for `cp` commands |
| `snapshots/all-scenes-v1/` | End of day 1 build | See its `README.md` for full-state restore commands |

---

## License

Internal — Recruit Talent.
