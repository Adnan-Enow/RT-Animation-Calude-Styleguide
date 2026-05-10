# CLAUDE.md — Recruit-Talent Banner Animation

**This file is auto-loaded by Claude Code in any session that opens this folder.**
It encodes everything a future Claude needs to extend or fine-tune the
banner without re-litigating decisions or rediscovering patterns. Read
this first; everything else is supporting detail.

> **Mission**: a single continuous animated banner for the Recruit-Talent
> landing-page hero. Four scenes — Proposal Development, Software
> Development, Staffing, IT Support — flow into each other with a
> persistent "Best at …" headline that backspaces and retypes between
> scenes so the whole thing reads as one voice rather than four videos.

---

## Status (end of day 1)

- ✅ All four scenes are wired into one `Banner` composition
- ✅ Footer staged transitions work across all 4 scenes (5 written tails, 4 backspaces)
- ✅ `Banner-Clean` composition exists (white frame only, no blue blob) for clean renders
- ✅ Render config tuned for high quality (PNG intermediates + CRF 14)
- ✅ Snapshot at `snapshots/all-scenes-v1/` is the rollback recovery point
- 🔧 **The whole banner needs scene-by-scene fine-tuning.** That's the next session's work.
  See [Per-scene fine-tuning notes](#per-scene-fine-tuning-notes).

---

## Quick start

```bash
# Install (only once)
npm install

# Live dev — opens Remotion Studio at http://localhost:3000
npm run dev

# Type-check (no emit; fast; run after every code change)
npx tsc --noEmit

# Render the production banner (with the blue blob) at very high quality
npm run render

# Render the clean banner (white frame only — what you usually want)
npm run render-clean

# Render any composition manually
npx remotion render <id> <outpath> --crf=14

# Render a single still frame (much faster than full video — for layout checks)
npx remotion still Banner out/check.png --frame=1500 --scale=0.5
```

Compositions registered in [`src/Root.tsx`](src/Root.tsx):
| ID | What it is |
|---|---|
| `Banner` | Full continuous banner with the soft blue background blob — production |
| `Banner-Clean` | Same animation, no blob, no grid lines — pure white background |
| `Scene1-PD` | Scene 1 in isolation (260 frames). Frozen reference matching `snapshots/scene1-final/` |

Composition dimensions: **1452 × 709 @ 30fps**. Don't change.

Total `Banner` duration: **1880 frames ≈ 62.7 seconds**.

---

## What this banner actually does

A 4-scene story about Recruit-Talent's services. Each scene has its own
content inside a shared glass card. The card chrome (the blob, the card
itself, the footer divider, the two action icons) **never crossfades** —
it's the constant backdrop. Only what's *inside* the card changes, plus
the chrome bits sitting on top of the header band (nav rects → macOS
controls → nav + search bar → nav).

```
Frame    Scene + beat
─────    ──────────────────────────────────────────────────────────
0–260    Scene 1 (PD): paper, skeleton lines cascade uneven → shimmer
                       transforms uneven → even, sparkle pop
260–410  Scene 1 → 2 bridge: paper fades, "Crafting Proposals" backspaces,
                       macOS controls fade in, "Delivering Software
                       Solutions" types in, `</>` slides in from edges
390–700  Scene 2 (SD): code icon → code editor (lines type in left-to-right)
                       → kanban dashboard (cards + bars + donut sweep)
700–830  Scene 2 → 3 bridge: kanban fades, footer backspaces + retypes
                       to "Precision Hiring", nav + search bar fade in
770–1115 Scene 3 (Staffing): single candidate → 4 candidates cascade in
                       → selection cues on Card 3 → success state
                       (big blue circle + checkmark)
1115–1240 Scene 3 → 4 bridge: success fades, footer → "Providing IT Support",
                       plain nav rects fade back in
1280–1450 Scene 4 Frame 1: tabbed ticket card (single clean fade-in,
                       no sub-stagger — appears together)
1430–1525 Scene 4 Frame 2: 3 typing dots pulse with sin-bob,
                       FULLY clear before Frame 3 begins (no overlap)
1535–1730 Scene 4 Frame 3: pixel "IT" logo + 2 chat bubbles with ellipses
1710–1880 Scene 4 Frame 4: resolved ticket with green badge (no internal
                       checkmark — just the badge), holds to end
```

---

## File structure

```
src/
├── Root.tsx                  ← Composition registry
├── BannerStage.tsx           ← Shared chrome + footer-stages mechanism
├── BannerAnimation.tsx       ← Master orchestrator weaving all 4 scenes
├── index.ts / index.css      ← Remotion entry boilerplate
└── scenes/
    ├── Scene1PD.tsx          ← Scene 1 (Proposal Development)
    ├── Scene2SD.tsx          ← Scene 2 (Software Development)
    ├── Scene3Staffing.tsx    ← Scene 3 (Staffing)
    └── Scene4IT.tsx          ← Scene 4 (IT Support)

reference/
└── 01-PD/                    ← Source SVG keyframes for Scene 1 (in convention)

animation scenes/             ← Source SVGs for Scenes 2/3/4 (NOT in convention,
    scene 2 SD/                  user dropped these here mid-build; left as
    scene 3 IT/                  untracked working material rather than
    scene 4 Staffing/            reorganising)

snapshots/
├── scene1-final/             ← Frozen Scene 1 (post-Scene-1-finalisation)
└── all-scenes-v1/            ← Frozen full state (end of day 1)

docs/
├── ANIMATION-PATTERNS.md     ← Detailed style guide (Scene-1-focused but
│                                conventions apply to all scenes)
├── ADDING-A-NEW-SCENE.md     ← Walkthrough for adding scenes
└── COMPONENT-ARCHITECTURE.md ← Why BannerStage + Scene split exists

out/                          ← Rendered MP4s (gitignored)
```

---

## Hard rules (Remotion-imposed)

These are not stylistic — breaking them produces broken renders:

- **Every animation MUST be driven by `useCurrentFrame()`**. No CSS transitions, no `@keyframes`, no Tailwind animation utilities. They render as static frames.
- **Easing belongs inside `interpolate()`**, not on CSS. Use `Easing.bezier(...)`.
- **Time values are frames, not seconds**. Convert with `useVideoConfig().fps` when needed (`2 * fps` = 2 seconds).
- **No `setTimeout` / `requestAnimationFrame` / React state for motion.** Compute everything from `frame`.
- **Children of `<Sequence>` see local frames** (starting at 0). We don't use `<Sequence>` here — everything is one timeline — but if you add it, account for it.

---

## Animation philosophy

Modern SaaS, *paper-on-desk* feel. Every motion is eased; nothing is
linear. The banner loops silently behind a landing-page headline, so it
must feel weightless and inevitable, never twitchy.

- **Entrances**: ease-out (decelerating). Element rushes in, settles.
- **Exits / morphs**: ease-in-out. Symmetric.
- **Pops** (sparkle, check, badge): tiny overshoot — `Easing.bezier(0.34, 1.4, 0.64, 1)`.
- **Static lines never shimmer on their own**. Shimmer is a deliberate phase that happens once, in cascade. CSS-loop shimmers across the document feel like a permanent loading state — that's not what we're after.

---

## Locked design language (don't deviate)

### Color palette

```ts
{
  innerBg:     "#F7F7F7",  // Inside-the-card background ("the desk")
  panelBg:     "#F2F2F2",  // Document panel ("the paper")
  textBlock:   "#D8D8D8",  // Skeleton text lines (resting state)
  shimmerBlue: "#ADC0FA",  // Shimmer band, sparkle fill, background blob
  selectionStroke: "#C3D2FF",  // Optional selection chip border
  headerTint:  "#D4DFFE",  // Header band (always rendered at 0.5 opacity)
  footerText:  "#454545",  // "Best at …"
  footerIcons: "#A8A8A8",  // CirclePlus + Send

  // Scene-2 specifics
  codeAccent:  "#DDE6FF",  // </> icon, code-line glyphs

  // Scene-3 specifics
  candidateCard:   "#F1F4FF",
  candidateAvatar: "#B9C4E1",  // avatar background
  selectionBlue:   "#5C81F5",  // checkmark stroke

  // Scene-4 specifics
  ticketBg:    "#ECF1FE",  // Tabbed ticket card
  ticketSkel:  "#D9E2FF",  // Skeleton elements inside ticket
  resolvedGreen: "#35C8AF",  // Resolved-badge fill

  // Scene-3 success / Scene-4 hint
  successCircle: "#ADC0FA",
}
```

### Font

**Inter** via `@remotion/google-fonts/Inter`, weights `["500", "600"]`,
Latin subset only. Keeps font network requests modest at render time.

### Icons

**`lucide-react`**. Footer always: `CirclePlus` (left, 18px) + `Send`
(right, 14px), strokeWidth 1.6, color `#A8A8A8`. Don't mix icon
libraries.

### Easing curves

```ts
const SOFT_OUT     = Easing.bezier(0.32, 0.72, 0.37, 1);  // entrances
const EASE_IN_OUT  = Easing.bezier(0.45, 0, 0.55, 1);     // morphs
const OVERSHOOT    = Easing.bezier(0.34, 1.4, 0.64, 1);   // pops
const MATERIAL_STD = Easing.bezier(0.4, 0, 0.2, 1);       // text reveals
const EXPO_OUT     = Easing.bezier(0.16, 1, 0.3, 1);      // card chrome entrance, bracket slides
```

These are tuned for this project's pacing. If tempted to switch to
`Easing.ease`, `Easing.cubic`, etc. — **don't**.

### Composition

- Dimensions: 1452 × 709 (banner aspect)
- Frame rate: 30fps
- Card frame: `CARD = { x: 537, y: 120, w: 378, h: 475 }` (exported from BannerStage)
- Inner area: `INNER = { x: 545, y: 141, w: 353, h: 355 }` (exported from BannerStage)

---

## Architecture in one paragraph

`BannerStage` owns the constant chrome (white background, optional blue
blob, optional grid lines, glass card with entrance animation, footer
with divider + plus/send icons + staged headline text). `BannerAnimation`
is the master orchestrator: it mounts a single `BannerStage`, declares
the 7 footer text stages once, and renders Scene 1 + Scene 2 + Scene 3 +
Scene 4 work-area components stacked together — each scene's components
manage their own `useCurrentFrame()` envelopes and decide when to render
based on absolute frame numbers in their own `T_SCENE<N>` timing
constants. Per-scene chrome bits (Scene 1's nav rects, Scene 2's macOS
window controls, Scene 3's search bar, Scene 4's nav rects again) fade
in/out independently using opacity wrappers in `BannerAnimation`. The
shared inner-area background (F7F7F7 + header band tint) is rendered
once and never crossfades.

For deeper architectural rationale, see
[`docs/COMPONENT-ARCHITECTURE.md`](docs/COMPONENT-ARCHITECTURE.md).

---

## Footer staged transitions — the typewriter mechanism

Defined in [`BannerAnimation.tsx`](src/BannerAnimation.tsx) as a
`FOOTER_STAGES` array and consumed by `BannerStage`'s `CardFooter`
component. Each stage declares `{ toText, start, duration }`. Transitions
between consecutive stages are computed automatically via common-prefix
detection — if the new stage's text shares a prefix with the previous
stage's text, the difference is what backspaces (if shorter) or types in
(if longer); divergent tails do both in sequence.

The 7 stages currently:

```
Stage 1 (frame 38)    : type → "Best at Crafting Proposals"
Stage 2 (frame 295)   : backspace → "Best at "
Stage 3 (frame 340)   : type → "Best at Delivering Software Solutions"
Stage 4 (frame 720)   : backspace → "Best at "
Stage 5 (frame 790)   : type → "Best at Precision Hiring"
Stage 6 (frame 1210)  : backspace → "Best at "
Stage 7 (frame 1265)  : type → "Best at Providing IT Support"
```

`"Best at "` (with the trailing space) is the persistent prefix. Only
the tail rewrites. The cursor pulses softly with a sin envelope and
fades out between stages — see `CardFooter` for the full mechanic.

To change a tagline: edit the `toText` in `FOOTER_STAGES`. To change
pacing of a stage: tune its `duration` (currently ~1.7–2.5 frames per
character).

---

## Coordinate system

Reference SVGs are in **1452 × 709 absolute pixel space**. To position
elements inside the card, every scene defines geometry in absolute SVG
coords and converts to card-local at the JSX boundary:

```ts
const lx = (x: number) => x - CARD.x;  // CARD.x = 537
const ly = (y: number) => y - CARD.y;  // CARD.y = 120
```

So an SVG `<rect x="555" y="198">` becomes
`<div style={{ left: lx(555), top: ly(198) }} />`. Always work in SVG
coords until the JSX boundary. This makes diffing against reference
SVGs trivial. **Don't pre-subtract CARD.x/y in the constants.**

For SVG paths (used in icons, code glyphs, chat bubbles, donut sweep,
etc.), wrap the SVG with `viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}`
so absolute path coords land in the right place inside the card-local
rendering area.

---

## Scene-by-scene reference

### Scene 1 — Proposal Development

| Aspect | Value |
|---|---|
| File | [`src/scenes/Scene1PD.tsx`](src/scenes/Scene1PD.tsx) |
| Duration | 260 frames standalone (lives 0–260 in master) |
| Headline | "Best at Crafting Proposals" (writes in alongside paper, frames 38–138) |
| Content | Paper fades in → 11 skeleton lines cascade in uneven → hold → shimmer band sweeps each line, geometry morphs uneven → even → sparkle pops |
| Locked | Paper geometry, line widths/positions, easing pacing, sparkle position |
| Locked further | Snapshot copy at `snapshots/scene1-final/` is the recovery if Scene 1 drifts |

The user finalised Scene 1 with explicit approval. **Don't touch it
without explicit instruction.** It's the reference standard for the
other scenes' style.

### Scene 2 — Software Development

| Aspect | Value |
|---|---|
| File | [`src/scenes/Scene2SD.tsx`](src/scenes/Scene2SD.tsx) |
| Range | 310–700 |
| Headline | "Best at Delivering Software Solutions" |
| Chrome | macOS window controls (red/yellow/green dots) + grey title bar — **NOT "traffic lights"** in user terminology |
| Frames | F1 `</>` icon (slides: `<` from left, `>` from right, `/` drops from above) → F2 code editor (lines type in left-to-right with stagger) → F3 kanban (sub-stagger across outer/sidebar/cards/labels/bars/donut, donut accent arc sweeps 0°→90°) |

### Scene 3 — Staffing (Precision Hiring)

| Aspect | Value |
|---|---|
| File | [`src/scenes/Scene3Staffing.tsx`](src/scenes/Scene3Staffing.tsx) |
| Range | 770–1115 |
| Headline | "Best at Precision Hiring" |
| Chrome | Plain nav rects + search bar (white pill with magnifier icon) |
| Frames | F1 single candidate card → F2 4 candidates cascade in below the first → selection cues on Card 3 (blue checkmark in box + magnifier overlay on avatar) → F3 success state (big blue circle scales in with overshoot, white checkmark, hired headline text rects) |
| Avatar style | Simplified primitives (clipped circle + head + shoulders ellipse) — not the full source-SVG paths. Easy to swap to verbatim paths if pixel fidelity is needed. |

### Scene 4 — IT Support

| Aspect | Value |
|---|---|
| File | [`src/scenes/Scene4IT.tsx`](src/scenes/Scene4IT.tsx) |
| Range | 1240–1880 |
| Headline | "Best at Providing IT Support" |
| Chrome | Plain nav rects (no search bar) |
| Frames | F1 ticket card (clean fade-in, no sub-stagger) → F2 3 typing dots with sin-bob (fully clear before F3 starts — gap, no overlap) → F3 pixel "IT" logo + 2 chat bubbles with ellipsis dots → F4 resolved ticket with green badge (no internal card checkmark, just the badge), holds to end |
| Removed | Frame 5 was originally 3 stacked tickets — user cut it. Don't reinstate. |

---

## Snapshot system

Two snapshots exist:

| Folder | When | Purpose |
|---|---|---|
| `snapshots/scene1-final/` | After Scene 1 was approved | Frozen Scene 1 source files (BannerStage + Scene1PD + README). Recovery if Scene 1 drifts. |
| `snapshots/all-scenes-v1/` | End of day 1 | Frozen full project state (all 7 source files + README with rollback instructions). Recovery if anything drifts during fine-tuning. |

The READMEs in each snapshot folder contain explicit `cp` commands for
restoring source files from the snapshot. Snapshots are **not for
running** — they're literal file copies, not buildable. The `Scene1-PD`
composition in `Root.tsx` is the runtime verification that Scene 1
hasn't drifted.

If a future change risks breaking working state, **make a new
`snapshots/<name>/` folder with the same convention** before touching
anything.

---

## Render workflow

### Live preview during development

```bash
npm run dev   # opens Remotion Studio at http://localhost:3000
```

Hot-reloads on every file save. Scrub timeline with the cursor; jump
frames with arrow keys.

### Render config

[`remotion.config.ts`](remotion.config.ts) is set for high-quality renders:

- **`Config.setVideoImageFormat("png")`** — lossless intermediate frame
  captures. (Was JPEG previously; switched for cleaner final output —
  no chroma artefacts on text edges, gradients, or drop shadows.)
- `Config.setOverwriteOutput(true)` — overwrite without prompt
- `Config.overrideWebpackConfig(enableTailwind)` — Tailwind v4 support

### Render commands

```bash
# Production banner with blue blob (CRF 14 = visually lossless)
npm run render
# → out/banner.mp4

# Clean banner (white frame only, no blob, no grid lines)
npm run render-clean
# → out/banner-clean.mp4

# Render any composition manually
npx remotion render <id> <outpath> --crf=14

# Lower CRF = higher quality, larger file. CRF 14 is essentially
# perceptually lossless. Default is 18 (also high).

# Quick still for layout checks
npx remotion still Banner out/check.png --frame=1500 --scale=0.5
```

### What "Banner-Clean" does

Same `BannerAnimation` component, but with `defaultProps={{ showBackground: false }}`
which suppresses the `BackgroundBlob` and `GridLines` components inside
`BannerStage`. The white `AbsoluteFill` background stays. Use this when
the surrounding chrome would conflict with where the banner is being
embedded.

---

## Common edits — when the user asks for X, do Y

| User asks | Edit this |
|---|---|
| "Change tagline X to Y" | `FOOTER_STAGES` in `BannerAnimation.tsx`, change the `toText`. Adjust `duration` if length changes a lot (~2 frames/char). |
| "Speed up Scene N" | Reduce all values in `T_SCENEN` and shift later scenes earlier in `BannerAnimation.tsx`'s `T` block. |
| "Make Scene N start earlier" | Shift its `T_SCENEN` `f1FadeIn.start` earlier, plus adjust the bridge timings in `BannerAnimation.tsx`. |
| "More padding inside the card" | Don't — paddings are baked into reference SVGs and shared across scenes. If genuinely needed, change `INNER` in `BannerStage.tsx` and recompute every scene's geometry. |
| "Change the blob color" | `fill="#ADC0FA"` in `BackgroundBlob` inside `BannerStage.tsx`. |
| "Hide the blob for this render" | Use the `Banner-Clean` composition; don't permanently remove the blob from `Banner`. |
| "Smoother typewriter" | Already eased with Material-standard. To go softer: change `easedFraction` in `CardFooter` to `Easing.bezier(0.5, 0, 0.5, 1)`. |
| "Add a 5th scene" | See [`docs/ADDING-A-NEW-SCENE.md`](docs/ADDING-A-NEW-SCENE.md). Create `Scene5<Code>.tsx` mirroring Scene4IT's structure. Add its imports + chrome + work area + footer stages 8 + 9 in `BannerAnimation.tsx`. Extend `BANNER_DURATION`. |

---

## What NOT to do

- ❌ **Don't add CSS animations / transitions / @keyframes.** They render as static frames.
- ❌ **Don't loop the shimmer continuously.** It's a one-time cascade per scene loop; reads as "AI processed the document" not "page is loading forever".
- ❌ **Don't change the blob, glass-card chrome, or footer divider/icons** unless the user explicitly asks. They're shared across all scenes.
- ❌ **Don't introduce additional fonts.** Inter is enough.
- ❌ **Don't change the `"Best at "` prefix.** It's the persistent anchor — only tails rewrite.
- ❌ **Don't refer to Scene 2's window controls as "traffic lights".** The user corrected this — they're macOS window controls.
- ❌ **Don't add a Frame 5 to Scene 4.** The user explicitly cut it. The 3-stacked-tickets visual is gone.
- ❌ **Don't put a white checkmark inside the card in Scene 4 Frame 4.** The user removed it. Only the green badge is the "resolved" cue.
- ❌ **Don't pre-subtract `CARD.x`/`CARD.y` in geometry constants.** Always store SVG coords; convert via `lx`/`ly` at JSX time.
- ❌ **Don't use `setTimeout` / React state for motion.** Compute from `frame`.
- ❌ **Don't break Scene 1.** Snapshot at `snapshots/scene1-final/` is the rollback if you do.
- ❌ **Don't commit `node_modules`, `out/`, or `.env`.** They're gitignored for a reason.

---

## Per-scene fine-tuning notes

These are the most likely places fine-tuning will happen:

### Scene 1
Already approved as the canonical reference. Don't fine-tune unless
explicitly requested. If something feels off in Scene 1's pacing, check
[`Scene1PD.tsx`](src/scenes/Scene1PD.tsx)'s `T` object first.

### Scene 2
- **Frame 1 bracket slide distance** (`SLIDE_OFFSET = 160` in
  [`Scene2SD.tsx`](src/scenes/Scene2SD.tsx)): brackets currently slide from
  off-card; reducing makes them slide a shorter distance.
- **Code-line cascade pacing** (`f2CodeLinesStagger: 4`,
  `f2CodeLineDuration: 8`): per-line stagger and per-line typing window.
  Higher stagger = slower wave, higher duration = each line types in over
  more frames.
- **Donut sweep duration**: tied to `barsVis` sub-phase — see
  `Frame3Kanban` `subVis(0.75, 1)` for the donut.

### Scene 3
- **Candidate card cascade pacing** (`f2CardsCascadeStagger: 14`,
  `f2CardsCascadeDuration: 28` in [`Scene3Staffing.tsx`](src/scenes/Scene3Staffing.tsx)):
  per-card stagger and per-card fade-in window.
- **Selection cue timing** (`f2SelectionCueStart: 945`): when the
  checkmark + magnifier appear on Card 3.
- **Success circle overshoot** (`circleScale` in `Frame3Success`):
  uses `OVERSHOOT` curve; tweak intensity by changing the input range
  `[0, 1]` to `[0.55, 1.05]` etc.

### Scene 4
- **Frame 1 fade-in pace** (`f1FadeIn: { start: 1280, end: 1305 }` in
  [`Scene4IT.tsx`](src/scenes/Scene4IT.tsx)): currently 25 frames — the user
  said the elaborate sub-stagger took too long, so it's now a clean
  fade. Speed up by tightening to 15 frames; slow down to 40 if needed.
- **Frame 2 sin-bob frequency**: `Math.sin(t * 4 - i * 0.7)` in
  `Frame2TypingDots`. Higher 4 = punchier bob. The phase offset 0.7
  per dot creates the wave. Adjust amplitude with `* 2.5`.
- **Frame 2 → Frame 3 gap**: currently 10 frames (f2FadeOut.end=1525,
  f3FadeIn.start=1535). User explicitly wanted this gap so dots fully
  clear before chat appears. **Don't remove the gap.**
- **Green badge overshoot**: `interpolate(badgeVis, [0, 1], [0.4, 1], { easing: OVERSHOOT })`.
  Higher first value = less overshoot, lower = more dramatic landing.

---

## Where to look for what

| Need to… | Look in |
|---|---|
| Understand the project shape | This file |
| Understand a single scene's content | `src/scenes/Scene<N><Code>.tsx` (each is self-contained) |
| Add a new scene | [`docs/ADDING-A-NEW-SCENE.md`](docs/ADDING-A-NEW-SCENE.md) |
| Understand BannerStage vs Scene split | [`docs/COMPONENT-ARCHITECTURE.md`](docs/COMPONENT-ARCHITECTURE.md) |
| Detailed visual style guide | [`docs/ANIMATION-PATTERNS.md`](docs/ANIMATION-PATTERNS.md) (Scene-1-focused but conventions apply) |
| Change footer text or pacing | `FOOTER_STAGES` in [`BannerAnimation.tsx`](src/BannerAnimation.tsx) |
| Change scene timing in master | `T` block in [`BannerAnimation.tsx`](src/BannerAnimation.tsx) |
| Change frame timing within a scene | `T_SCENE<N>` block in `Scene<N><Code>.tsx` |
| Adjust render quality | `Config.setVideoImageFormat` in [`remotion.config.ts`](remotion.config.ts), or `--crf` flag on render command |
| Roll back if something breaks | `snapshots/all-scenes-v1/README.md` has the cp commands |

---

## Tech stack

| Tool | Version | Purpose |
|---|---|---|
| Remotion | 4.0.457 | React-based video framework — frame-driven rendering |
| React | 19.2.3 | Component model |
| TypeScript | 5.9.3 | Type safety |
| `@remotion/google-fonts` | ^4.0.457 | Loads Inter at module init |
| `lucide-react` | ^1.14.0 | Footer icons (CirclePlus, Send) |
| `@remotion/tailwind-v4` | 4.0.457 | Tailwind v4 webpack integration (configured but barely used — most styles are inline since they're frame-driven) |
| `tailwindcss` | 4.0.0 | (Available but mostly inline-style throughout) |

No CSS modules, no styled-components, no animation libs (Framer Motion,
GSAP, etc). Everything is `useCurrentFrame()` + `interpolate()` + inline
styles. That's the design.

---

## Glossary of conventions used in this codebase

| Term | What it means here |
|---|---|
| `T` / `T_SCENE<N>` | Per-scene timing object holding all frame numbers as named keys. Never inline a magic frame number anywhere. |
| `f<N>FadeIn` / `f<N>FadeOut` | Frame N's fade-in / fade-out windows, each `{ start, end }` |
| `lx(x)` / `ly(y)` | Convert absolute SVG coord to card-local coord (subtract CARD.x or CARD.y) |
| Footer `Stage` | One entry in `FOOTER_STAGES` declaring `{ toText, start, duration }`; transitions are computed automatically |
| Sub-stagger | Within a single visibility envelope, sub-elements animate in sequence by mapping different `[start, end]` sub-windows of the parent's `0..1` range |
| Trapezoidal envelope | `interpolate(frame, [a, b, c, d], [0, 1, 1, 0])` — fade in over `[a, b]`, hold, fade out over `[c, d]` |
| "The chrome" | BannerStage's persistent visual elements: blob, grid, glass card, footer divider, action icons. Never crossfaded between scenes. |
| "The work area" | Each scene's content rendered inside the glass card. Crossfaded between scenes. |
| Snapshot | Literal file-copy folder under `snapshots/` for rollback. Not buildable independently. |

---

## How a future Claude should approach this project

1. **Read this file** (you already are).
2. **Skim `BannerAnimation.tsx`** — the master timeline lives in its `T` block and `FOOTER_STAGES` array.
3. **Skim `BannerStage.tsx`** — the chrome and the footer-stages mechanic.
4. **Open the relevant `Scene<N><Code>.tsx`** when fine-tuning a specific scene.
5. **Run `npm run dev`** to scrub the studio. The visual is the source of truth.
6. **Make small changes** and watch them hot-reload.
7. **Snapshot before large changes**: `cp -r src snapshots/<name>/` plus a README.
8. **Type-check after each change**: `npx tsc --noEmit`.
9. **Render to verify**: `npm run render-clean` for the white-only version.

The user iterates fast. Make minimal, focused changes. Ask if scope is
unclear. Don't refactor without prompting.
