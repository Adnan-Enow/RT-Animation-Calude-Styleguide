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

## Status

**Day 1**
- ✅ All four scenes are wired into one `Banner` composition
- ✅ Footer staged transitions work across all 4 scenes (5 written tails, 4 backspaces)
- ✅ `Banner-Clean` composition exists (white frame only, no blue blob) for clean renders
- ✅ Render config tuned for high quality (PNG intermediates + CRF 14)
- ✅ Snapshot at `snapshots/all-scenes-v1/` is the rollback recovery point

**Day 2 — Fast variants + card-only export**
- ✅ `Scene1-PD-Fast` — 22 s (660 frames) optimised orchestrator weaving all 4 scenes
- ✅ `Banner-Fast-16s` — 16 s (480 frames) ultra-compact variant (scaled 480/660 ≈ 0.727)
- ✅ Scene 4 F1 and F4 now share a slide-up entrance + restored full ticket detail (activity bars, tag columns, content lines)
- ✅ Scene 4 F4 green resolved badge has a pop-in (overshoot scale) inside the same fade window
- ✅ Scene 4 F3 → F4 is now strictly sequential (no cross-fade): F3 fades out fully before F4 enters
- ✅ `Scene1-PD-Fast-Card` — card-only render variant of the Fast banner (378 × 475, no blob, no shadow)
- ✅ Export verified at `--crf=14 --scale=4` (5808 × 2836 full / 1512 × 1900 card) — see [Render workflow](#render-workflow)

See [Fast variants](#fast-variants-22s-and-16s) for the full timing breakdown and [Card-only export](#card-only-export-the-frame-only-render) for how the no-background render works.

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
| ID | What it is | Size | Duration |
|---|---|---|---|
| `Banner` | Full continuous banner with the soft blue background blob — production | 1452 × 709 | 1880f / 62.7s |
| `Banner-Clean` | Same animation, no blob, no grid lines — pure white background | 1452 × 709 | 1880f / 62.7s |
| `Banner-Card` | Original banner cropped to the card only (no blob, no shadow) — composite-friendly | 378 × 475 | 1880f / 62.7s |
| `Scene1-PD` | Scene 1 in isolation (260 frames). Frozen reference matching `snapshots/scene1-final/` | 1452 × 709 | 260f |
| `Scene1-PD-Fast` | **22 s optimised banner** (all 4 scenes orchestrated) — with blob | 1452 × 709 | 660f / 22s |
| `Scene1-PD-Fast-Card` | Same Fast banner cropped to the card only (no blob, no shadow) — composite-friendly | 378 × 475 | 660f / 22s |
| `Banner-Fast-16s` | **16 s ultra-compact variant** of the Fast banner (scaled 480/660 ≈ 0.727) | 1452 × 709 | 480f / 16s |

Composition dimensions for full banners: **1452 × 709 @ 30fps**. Card-only compositions are **378 × 475 @ 30fps**. Don't change.

Total `Banner` duration: **1880 frames ≈ 62.7 seconds**. See [Fast variants](#fast-variants-22s-and-16s) for the optimised versions.

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

---

## Original banner (62.7 s) — canonical timing record

This is the original production `Banner` composition — 1880 frames at
30 fps = 62.7 s. **Don't conflate it with the Fast variants in the next
section.** The two are independent timelines; changing one does not
affect the other.

| Aspect | Value |
|---|---|
| Composition ID | `Banner` (with blob) / `Banner-Clean` (white only) / `Banner-Card` (card only) |
| Master orchestrator | [`src/BannerAnimation.tsx`](src/BannerAnimation.tsx) (`T` block + `FOOTER_STAGES`) |
| Scene files | `Scene1PD.tsx` / `Scene2SD.tsx` / `Scene3Staffing.tsx` / `Scene4IT.tsx` |
| Duration | 1880 frames / 62.7 s |

### Original — Scene-by-scene timeline

All frame numbers are absolute (from frame 0 of the composition).

```
Frame      Beat
─────      ──────────────────────────────────────────────────────────
0–~30      Glass card entrance (BannerStage default; chrome only)
38–138     Footer types "Best at Crafting Proposals"
38–56      Scene 1 paper panel fades in
60–115     Scene 1: 11 skeleton lines cascade in uneven (stagger 5, dur 12/line)
~115–138   Scene 1 uneven hold (lines settle, no movement)
138–~250   Scene 1: shimmer cascade sweeps each line, geometry morphs
           uneven → even (per-line stagger 7, shimmer dur 16)
228–250    Scene 1 sparkle pops (overshoot scale, near panel bottom-right)
260        Scene 1 standalone duration ends (also `Scene1-PD` composition end)
280–320    Scene 1 work area fades out (S1→S2 bridge)
295–330    Footer backspaces tail → "Best at "
310–345    Scene 2 macOS window controls fade in
320–365    Scene 2 F1 `</>` icon: < slides from left, > from right, / drops in
340–410    Footer types "Best at Delivering Software Solutions"
380–410    Scene 2 F1 `</>` icon fades out
390–420    Scene 2 F2 code editor structure fades in (file tree + gutter)
415–~491   Scene 2 F2: 17 code lines type in left-to-right (stagger 4, dur 8/line)
495–525    Scene 2 F2 glyphs (`</>` accents on code) fade in
540–580    Scene 2 F2 code editor fades out → kanban takeover
560–625    Scene 2 F3 kanban dashboard fades in (sub-stagger: outer → sidebar
           → cards → labels → bars → donut sweep 0°→90°)
700–740    Scene 2 F3 kanban fades out (S2→S3 bridge)
720–770    Footer backspaces → "Best at "
720–770    Scene 2 macOS chrome fades out (overlaps with kanban fade-out)
730–780    Scene 3 nav rects + search bar fade in
770–820    Scene 3 F1 single candidate card fades in
790–830    Footer types "Best at Precision Hiring"
870–~940   Scene 3 F2: 3 additional candidate cards cascade in below Card 1
           (stagger 14, per-card fade-in 28 frames)
945–980    Scene 3 F2 selection cues on Card 3 (checkmark in box + magnifier overlay)
1000–1040  Scene 3 F2 cards fade out → success state takes over
1020–1070  Scene 3 F3 success circle scales in (overshoot)
1050–1090  Scene 3 F3 white checkmark fades in inside circle
1075–1115  Scene 3 F3 hired labels fade in below
1200–1240  Scene 3 work area + chrome fade out (S3→S4 bridge)
1210–1250  Footer backspaces → "Best at "
1240–1290  Scene 4 plain nav rects fade back in
1265–1315  Footer types "Best at Providing IT Support"
1280–1305  Scene 4 F1 ticket card — clean fade-in (no sub-stagger, no slide)
1410–1450  Scene 4 F1 ticket fades out
1430–1470  Scene 4 F2: 3 typing dots fade in (sin-bob amplitude motion)
1490–1525  Scene 4 F2 typing dots fade out (10-frame gap before F3 — no overlap)
1535–1595  Scene 4 F3 pixel "IT" logo + 2 chat bubbles fade in
1680–1730  Scene 4 F3 fades out
1710–1770  Scene 4 F4 resolved ticket + green badge fade in (no slide-up in original)
1770–1880  Scene 4 F4 holds through end of composition (no further animation)
1880       Composition end
```

### Original — Per-file timing constants (canonical source of truth)

**Master orchestrator** ([`src/BannerAnimation.tsx`](src/BannerAnimation.tsx) → `T`):

```ts
// Scene-level cross-fade gates
scene1FadeOutStart: 280, scene1FadeOutEnd: 320,
scene2HeaderFadeOutStart: 720, scene2HeaderFadeOutEnd: 770,
scene3FadeOutStart: 1200, scene3FadeOutEnd: 1240,

// T.footer — typewriter stages (7 stages, identical structure to Fast)
s1WriteStart: 38,   s1WriteDuration: 100,  // "Best at Crafting Proposals"
s12BackspaceStart: 295, s12BackspaceDuration: 35,
s2WriteStart: 340,  s2WriteDuration: 70,   // "Best at Delivering Software Solutions"
s23BackspaceStart: 720, s23BackspaceDuration: 50,
s3WriteStart: 790,  s3WriteDuration: 40,   // "Best at Precision Hiring"
s34BackspaceStart: 1210, s34BackspaceDuration: 40,
s4WriteStart: 1265, s4WriteDuration: 50,   // "Best at Providing IT Support"

end: 1880,  // BANNER_DURATION (= SCENE4_END_FRAME)
```

**Scene 1** ([`src/scenes/Scene1PD.tsx`](src/scenes/Scene1PD.tsx) → `T`):

```ts
panelFadeStart: 38, panelFadeEnd: 56,
linesStart: 60,
perLineAppearStagger: 5,
perLineAppearDuration: 12,
unevenHoldEnd: 138,
shimmerStart: 138,
perLineShimmerStagger: 7,
perLineShimmerDuration: 16,
footerWriteStart: 38, footerWriteDuration: 100,  // mirrors master Stage 1
sparkleStart: 228, sparkleEnd: 250,
end: 260,                                         // SCENE1_PD_DURATION
```

**Scene 2** ([`src/scenes/Scene2SD.tsx`](src/scenes/Scene2SD.tsx) → `T_SCENE2`):

```ts
headerFadeIn:        { start: 310, end: 345 },  // macOS chrome in

// Frame 1 — `</>` icon (KEPT in original — REMOVED in Fast)
f1BracketsStart: 320, f1BracketsEnd: 350,       // < / > slide from edges
f1SlashStart: 340,    f1SlashEnd: 365,          // / drops from above
f1FadeOut:           { start: 380, end: 410 },

// Frame 2 — code editor
f2StructureFadeIn:   { start: 390, end: 420 },
f2CodeLinesStart:    415,
f2CodeLinesStagger:  4,
f2CodeLineDuration:  8,
// 17 lines × 4 stagger + 8 dur → cascade ends ~frame 491
f2GlyphsFadeIn:      { start: 495, end: 525 },  // `</>` accents on code
f2FadeOut:           { start: 540, end: 580 },

// Frame 3 — kanban dashboard
f3FadeIn:            { start: 560, end: 625 },
f3FadeOut:           { start: 700, end: 740 },
```

Constants exposed for tuning: `SLIDE_OFFSET = 160` (Frame 1 bracket slide distance).

**Scene 3** ([`src/scenes/Scene3Staffing.tsx`](src/scenes/Scene3Staffing.tsx) → `T_SCENE3`):

```ts
headerFadeIn:        { start: 730, end: 780 },   // nav + search

// Frame 1 — single candidate card (KEPT in original — REMOVED in Fast)
f1FadeIn:            { start: 770, end: 820 },
// (no f1FadeOut — Card 1 persists into F2's list)

// Frame 2 — 3 additional cards cascade in
f2CardsCascadeStart: 870,
f2CardsCascadeStagger: 14,
f2CardsCascadeDuration: 28,
f2SelectionCueStart: 945,
f2SelectionCueEnd:   980,                        // checkmark + magnifier on Card 3
f2FadeOut:           { start: 1000, end: 1040 },

// Frame 3 — success state
f3CircleFadeIn:      { start: 1020, end: 1070 }, // big blue circle (overshoot)
f3CheckmarkFadeIn:   { start: 1050, end: 1090 },
f3LabelsFadeIn:      { start: 1075, end: 1115 },

// (SCENE3_END_FRAME = 1200, declared separately)
```

**Scene 4** ([`src/scenes/Scene4IT.tsx`](src/scenes/Scene4IT.tsx) → `T_SCENE4`):

```ts
headerFadeIn: { start: 1240, end: 1290 },  // plain nav rects in

// Frame 1 — ticket card (clean fade-in, NO slide-up — that's a Fast-only addition)
f1FadeIn:     { start: 1280, end: 1305 },
f1FadeOut:    { start: 1410, end: 1450 },

// Frame 2 — 3 typing dots (KEPT in original — REMOVED in Fast)
f2FadeIn:     { start: 1430, end: 1470 },
f2FadeOut:    { start: 1490, end: 1525 },  // must fully clear before F3

// Frame 3 — pixel "IT" logo + 2 chat bubbles
f3FadeIn:     { start: 1535, end: 1595 },  // ~10-frame gap after F2 clears
f3FadeOut:    { start: 1680, end: 1730 },

// Frame 4 — resolved ticket + green badge (NO internal checkmark — user removed it)
f4FadeIn:     { start: 1710, end: 1770 },
// (no f4FadeOut — F4 holds through SCENE4_END_FRAME = 1880)
```

### Original — Critical invariants

- **Scene 1 is frozen** — snapshotted at `snapshots/scene1-final/`.
  Don't fine-tune unless the user explicitly asks.
- **F2 → F3 gap in Scene 4** (10 frames, 1525 → 1535) is intentional;
  the typing dots are a discrete beat, not a backdrop. Don't remove it.
- **No slide-up on F1 / F4 in Scene 4** — that's a Fast-only addition
  the user asked for in the optimised variant. The original F1/F4 use
  a flat fade-in only.
- **No internal white checkmark inside F4 ticket** — user removed it.
  Only the green resolved badge signals "done".
- **No Frame 5 in Scene 4** — user explicitly cut the 3-stacked-tickets
  visual. Don't reinstate.
- **The persistent `"Best at "` prefix** is shared across all 7 footer
  stages — only tails rewrite.

### Original — Where to edit what

| User asks | Edit this |
|---|---|
| "Change a footer tagline" | `FOOTER_STAGES` in [`BannerAnimation.tsx`](src/BannerAnimation.tsx) — change the `toText`. Adjust `duration` (~2 frames/char) if length changes significantly. |
| "Shift a scene earlier / later" | The matching `scene<N>FadeOut*` keys in `T` (master) and the `T_SCENE<N>` block in the scene file. Both need to stay aligned. |
| "Change the bracket slide-in distance (Scene 2 F1)" | `SLIDE_OFFSET` in [`Scene2SD.tsx`](src/scenes/Scene2SD.tsx). |
| "Tweak code-line typing speed (Scene 2 F2)" | `f2CodeLinesStagger` (per-line delay) and `f2CodeLineDuration` (per-line typing window) in `T_SCENE2`. |
| "Tweak the candidate cascade (Scene 3 F2)" | `f2CardsCascadeStagger` and `f2CardsCascadeDuration` in `T_SCENE3`. |
| "Adjust the success-circle pop (Scene 3 F3)" | `circleScale` interpolation inside `Frame3Success` in [`Scene3Staffing.tsx`](src/scenes/Scene3Staffing.tsx). Currently uses `OVERSHOOT` curve. |
| "Change Scene 4 F1 fade-in pace" | `f1FadeIn` window in `T_SCENE4`. Currently 25 frames; user said "clean and quick". |
| "Adjust typing-dot bob (Scene 4 F2)" | `Math.sin(t * 4 - i * 0.7)` in `Frame2TypingDots` in [`Scene4IT.tsx`](src/scenes/Scene4IT.tsx). |
| "Tweak the green badge pop (Scene 4 F4)" | `interpolate(badgeVis, [0, 1], [0.4, 1], { easing: OVERSHOOT })` in `Frame4Resolved`. Higher first value → less overshoot. |

### Original — Render commands

| Use case | Command |
|---|---|
| With blob | `npx remotion render Banner out/banner.mp4 --crf=14 --scale=4` |
| White frame only (no blob, no grid) | `npx remotion render Banner-Clean out/banner-clean.mp4 --crf=14 --scale=4` |
| Card only (no blob, no shadow) | `npx remotion render Banner-Card out/banner-card.mp4 --crf=14 --scale=4` |

Or use the npm aliases: `npm run render` / `npm run render-clean` /
`npm run render-card`.

---

## Fast variants (22 s and 16 s)

Two parallel orchestrators exist alongside the canonical 62.7 s banner.
They share `BannerStage`, the colour palette, easings, and footer
mechanic — only the timing is compressed. **Don't conflate them with the
production `BannerAnimation`. The 62.7 s `Banner` is untouched.**

| Variant | File | Composition ID | Duration | Built from |
|---|---|---|---|---|
| Fast (22 s) | `src/scenes/Scene1PD-Fast.tsx` (orchestrator) | `Scene1-PD-Fast` | 660 f / 22 s | `Scene1PD-Fast` + `Scene2SD-Fast` + `Scene3Staffing-Fast` + `Scene4IT-Fast` |
| Fast (22 s) card-only | (wrapper export in same file: `Scene1PDFastCardOnly`) | `Scene1-PD-Fast-Card` | 660 f / 22 s | Same Fast scenes, cropped to card (no blob, no shadow) |
| Fast 16 s | `src/scenes/Scene1PD-Fast16.tsx` (orchestrator) | `Banner-Fast-16s` | 480 f / 16 s | `Scene1PD-Fast16` + `Scene2SD-Fast16` + `Scene3Staffing-Fast16` + `Scene4IT-Fast16` |

The 16 s variant is a literal duplicate of the 22 s files with **every
frame-based number multiplied by `480/660 ≈ 0.727` and rounded**. Pixel
values (slide distances, sizes) and easing curves are unchanged.

### 22 s Fast — Scene-by-scene timeline

All frame numbers are absolute (from frame 0 of the composition).

```
Frame      Beat
─────      ──────────────────────────────────────────────────────────
0–6        Glass card entrance (cardEntryStart=6, duration=24)
30–100     Footer types "Best at Crafting Proposals"
38–52      Scene 1 paper panel fades in
50–113     Scene 1: 11 skeleton lines cascade in (stagger 3, dur 10/line)
           Each line shimmers after appearance (delay 2, shimmer dur 14)
108–130    Scene 1 sparkle pops (overshoot scale)
130–150    Scene 1 tail-fade (paper + lines + sparkle clear)
130–160    Footer backspaces tail → "Best at " (s1→s2 bridge)
135–168    Scene 1 nav-rect chrome fades out
140–170    Scene 2 macOS window controls fade in
165–195    Scene 2 code editor structure fades in (file tree + gutter)
165–235    Footer types "Best at Delivering Software Solutions"
190–229    Scene 2 12 code lines type in (stagger 3, per-line dur 6)
240–265    Scene 2 code-editor fade-out → kanban takeover
250–295    Scene 2 kanban dashboard fades in (3 sub-phases on this envelope)
305–335    Scene 2 macOS chrome + work area fade out (S2→S3 bridge)
305–340    Footer backspaces → "Best at "
325–355    Scene 3 nav rects + search bar fade in
340–382    Scene 3: 4 candidate cards cascade in (stagger 8, dur 18/card)
345–381    Footer types "Best at Precision Hiring"
345–381    Scene 3 search-bar text "Precision Hiring" fades in
358–392    Scene 3 per-card zoom pulse (10 frames per card, scale 1.06)
393–406    Scene 3 selection cue (checkmark on Card 3) — after all pulses
410–428    Scene 3 cards fade out → success state takes over
415–445    Scene 3 success circle scales in (overshoot)
440–465    Scene 3 white checkmark fades in
460–485    Scene 3 hired labels fade in
488–515    Scene 3 nav + search + work area fade out (S3→S4 bridge)
488–518    Footer backspaces → "Best at "
490–520    Scene 4 plain nav rects fade in
510–535    Scene 4 F1 ticket slides up from y=+22 px + fades in
522–564    Footer types "Best at Providing IT Support"
545–565    Scene 4 F1 ticket fades out
550–590    Scene 4 F3: pixel "IT" logo + 2 chat bubbles fade in
605–625    Scene 4 F3 fades out FULLY (no cross-fade with F4)
625–655    Scene 4 F4 resolved ticket slides up from y=+22 px + fades in
           Green resolved badge pops in (overshoot, scale 0.3→1) inside
           the back half of the same fade window
660        End of composition (hold ~5 frames after F4 settles)
```

### 22 s Fast — Per-file timing constants (canonical source of truth)

**Master orchestrator** ([`src/scenes/Scene1PD-Fast.tsx`](src/scenes/Scene1PD-Fast.tsx)):

```ts
// T_SCENE1 — Scene-1 work area
panelFadeStart: 38, panelFadeEnd: 52,
linesStart: 50, perLineAppearStagger: 3, perLineAppearDuration: 10,
shimmerDelayAfterAppear: 2, perLineShimmerDuration: 14,
sparkleStart: 108, sparkleEnd: 130,
tailFadeStart: 130, tailFadeEnd: 150,

// T — bridge fades between scenes
scene1HeaderFadeOut: { start: 135, end: 168 },
scene2HeaderFadeOut: { start: 305, end: 335 },
scene2WorkAreaFadeOut: { start: 305, end: 335 },
scene3HeaderFadeOut: { start: 488, end: 515 },
scene3WorkAreaFadeOut: { start: 488, end: 515 },

// T.footer — typewriter stages (7 stages, mirrors the production banner)
s1WriteStart: 30,  s1WriteDuration: 70,   // "Best at Crafting Proposals"
s12BackspaceStart: 130, s12BackspaceDuration: 30,
s2WriteStart: 165, s2WriteDuration: 70,   // "Best at Delivering Software Solutions"
s23BackspaceStart: 305, s23BackspaceDuration: 35,
s3WriteStart: 345, s3WriteDuration: 36,   // "Best at Precision Hiring"
s34BackspaceStart: 488, s34BackspaceDuration: 30,
s4WriteStart: 522, s4WriteDuration: 42,   // "Best at Providing IT Support"

end: 660,  // SCENE1_PD_FAST_DURATION
```

**Scene 2 Fast** ([`src/scenes/Scene2SD-Fast.tsx`](src/scenes/Scene2SD-Fast.tsx) → `T_SCENE2_FAST`):

```ts
headerFadeIn:        { start: 140, end: 170 },  // macOS chrome in
f2StructureFadeIn:   { start: 165, end: 195 },  // file tree + gutter
f2CodeLinesStart:    190,
f2CodeLinesStagger:  3,
f2CodeLineDuration:  6,
f2FadeOut:           { start: 240, end: 265 },  // code editor → kanban
f3FadeIn:            { start: 250, end: 295 },  // kanban (3 sub-phases)
f3HoldEnd:           315,
```

Note: in this Fast variant, Scene 2 **Frame 1 (`</>` icon)** is REMOVED.
The first beat is the code editor directly. Don't reinstate the bracket
slide-in.

**Scene 3 Fast** ([`src/scenes/Scene3Staffing-Fast.tsx`](src/scenes/Scene3Staffing-Fast.tsx) → `T_SCENE3_FAST`):

```ts
headerFadeIn:        { start: 325, end: 355 },  // nav + search
searchTextFadeIn:    { start: 345, end: 381 },  // "Precision Hiring" in search
cardsCascadeStart:   340,
cardsCascadeStagger: 8,
cardsCascadeDuration: 18,
cardPulseDuration:   10,
cardPulsePeakScale:  1.06,
selectionCue:        { start: 393, end: 406 },  // checkmark only on Card 3
cardsFadeOut:        { start: 410, end: 428 },
f3CircleFadeIn:      { start: 415, end: 445 },  // big blue circle (overshoot)
f3CheckmarkFadeIn:   { start: 440, end: 465 },
f3LabelsFadeIn:      { start: 460, end: 485 },
holdEnd:             490,
```

Note: in this Fast variant, Scene 3 **Frame 1 (single candidate preview
+ magnifier overlay)** is REMOVED. The cards cascade in directly.

**Scene 4 Fast** ([`src/scenes/Scene4IT-Fast.tsx`](src/scenes/Scene4IT-Fast.tsx) → `T_SCENE4_FAST`):

```ts
headerFadeIn:  { start: 490, end: 520 },  // plain nav rects in
f1FadeIn:      { start: 510, end: 535 },  // F1 ticket slides up + fades in
f1FadeOut:     { start: 545, end: 565 },
f1SlideFromY:  22,                        // px below resting position
f3FadeIn:      { start: 550, end: 590 },  // pixel IT logo + chat bubbles
f3FadeOut:     { start: 605, end: 625 },  // FULLY out before F4 starts
f4FadeIn:      { start: 625, end: 655 },  // F4 resolved ticket slides up
f4SlideFromY:  22,
holdEnd:       660,
```

**Critical invariants for Scene 4:**
- `f3FadeOut.end === f4FadeIn.start` (625 === 625). The two frames
  touch exactly — no cross-fade, no overlap. The user chose this
  explicitly. Don't reintroduce overlap.
- F1 and F4 share the **same slide-up entrance** (`translateY: 22 → 0`
  across the fade-in window, eased with `SOFT_OUT`).
- F4 green resolved badge has a **pop-in inside the same fade window**:
  `badgeVis = interpolate(visibility, [0.5, 1], [0, 1])` then
  `badgeScale = interpolate(badgeVis, [0, 1], [0.3, 1], { easing: OVERSHOOT })`.
  Adjust the `[0.3, 1]` range to dampen / intensify the overshoot.
- Scene 4 Frame 2 (typing dots) is REMOVED in the Fast variant. Don't
  reinstate.

### 22 s Fast — Restored ticket detail (F1 + F4)

The user explicitly asked for the full skeleton ticket detail. Both F1
and F4 render the full set of elements (don't simplify these away):
- 4 horizontal content lines
- 5-tag column (rects at x=652.236 for F1, x=670.822 for F4)
- 11 activity bars + 1 wide bar (x columns `F1_ACTIVITY_BAR_X` / `F4_ACTIVITY_BAR_X`,
  wide bar `F1_WIDE_BAR` / `F4_WIDE_BAR`)
- Middle tag (x=717 for F1, x=727.401 for F4)

### 16 s Fast — Scaling rule

Every frame number from the 22 s variant is multiplied by `480/660` and
rounded. Pixel offsets, slide distances, easings, FOOTER_STAGES *texts*,
and per-line stagger COUNTS are unchanged. The result preserves the
visual rhythm — entrances are proportionally faster, holds are
proportionally shorter, but pacing relationships and overshoot
intensity stay constant.

If a 22 s timing changes, **regenerate the 16 s timing by re-applying
the scale factor** rather than hand-editing it. Always verify the F3 → F4
no-overlap invariant survives:

```ts
// In Scene4IT-Fast16.tsx, after any timing change, this must hold:
T_SCENE4_FAST.f3FadeOut.end === T_SCENE4_FAST.f4FadeIn.start
```

Currently (480 / 660 scale): `f3FadeOut.end = 455`, `f4FadeIn.start = 455`. ✅

---

## Card-only export ("the frame-only render")

Often you don't want the blue blob or any banner chrome — just the
glass card with its inner animation, ready to composite on top of an
arbitrary background in CSS, Figma, or video editing software.

Two card-only compositions exist:

| Composition | Source | Duration |
|---|---|---|
| `Banner-Card` | Original 62.7 s `BannerAnimation` cropped to card | 1880 f |
| `Scene1-PD-Fast-Card` | 22 s Fast banner cropped to card | 660 f |

**How it works (the pattern):**

The wrapper renders the full 1452 × 709 banner inside a composition
that is exactly the card size (`378 × 475`), positioned so the card
falls at `(0, 0)`. The full banner is offset by `(-CARD.x, -CARD.y)`
so only the card region is visible — everything outside the card area
is clipped. The wrapper passes two flags to the inner animation:

- `showBackground={false}` — suppresses the soft blue `BackgroundBlob`
  and the `GridLines` overlay (the desk surface). The white
  `AbsoluteFill` remains so transparency around the card is replaced
  by white.
- `cleanCard={true}` — tells `CardChrome` to render the card with NO
  drop shadow, NO border, NO border-radius. Just a flat opaque white
  rectangle as the backdrop.

The result is a tightly-cropped MP4 sized exactly to the card geometry
(at `--scale=4`: `1512 × 1900`), with the animation positioned correctly
inside it and no extraneous chrome.

**Existing wrapper components** (don't duplicate — extend if you need
more variants):

- [`BannerCardOnly`](src/BannerAnimation.tsx) → `Banner-Card` (62.7 s)
- [`Scene1PDFastCardOnly`](src/scenes/Scene1PD-Fast.tsx) → `Scene1-PD-Fast-Card` (22 s)

Both follow the same pattern (see the existing source for the literal
component shape).

**Adding a card-only variant for a new composition:**

1. Make the inner component (e.g. `Scene1PDFast`) accept optional
   `showBackground?: boolean` and `cleanCard?: boolean` props, default
   `true` / `false`, and forward them to its `<BannerStage>`.
2. Add a small `<XCardOnly>` wrapper component that renders the inner
   composition wrapped in a `<div>` of size `1452 × 709` offset by
   `(-CARD.x, -CARD.y)`, passing `showBackground={false}` and
   `cleanCard={true}`.
3. Export `<X>_CARD_WIDTH = CARD.w` and `<X>_CARD_HEIGHT = CARD.h`
   constants from the same file.
4. Register a new `<Composition>` in [`src/Root.tsx`](src/Root.tsx)
   with the wrapper as the component, the new constants as `width` /
   `height`, and the original `<X>_DURATION`.

That's the whole recipe. The render command is identical to any other
composition — just supply the new composition ID.

---

## Render workflow (full reference)

### High-quality export settings (canonical)

```bash
# These are the settings used for all production-quality renders.
# CRF 14 = visually lossless. --scale=4 = 4× pixel density.
# (PNG intermediates via remotion.config.ts — already set.)
npx remotion render <id> <outpath> --crf=14 --scale=4
```

The two render variables — `--crf` (quality) and `--scale` (pixel
density) — are intentionally **passed at the CLI** rather than baked
into `remotion.config.ts`, so the same composition can be rendered at
preview quality or production quality without code changes.

| Use case | Command |
|---|---|
| Production banner with blob, 62.7 s | `npx remotion render Banner out/banner.mp4 --crf=14 --scale=4` |
| Clean banner (white frame), 62.7 s | `npx remotion render Banner-Clean out/banner-clean.mp4 --crf=14 --scale=4` |
| Card-only, 62.7 s (composite-friendly) | `npx remotion render Banner-Card out/banner-card.mp4 --crf=14 --scale=4` |
| Fast banner (22 s), with blob | `npx remotion render Scene1-PD-Fast out/scene1-pd-fast.mp4 --crf=14 --scale=4` |
| **Fast banner card-only (22 s)** | `npx remotion render Scene1-PD-Fast-Card out/scene1-pd-fast-card.mp4 --crf=14 --scale=4` |
| Fast 16 s variant, with blob | `npx remotion render Banner-Fast-16s out/banner-fast-16s.mp4 --crf=14 --scale=4` |
| Preview / scrubbing in Studio | `npm run dev` (interactive — no CLI render) |
| Single still frame for layout check | `npx remotion still <id> out/check.png --frame=<N> --scale=0.5` |

### Output dimensions at `--scale=4`

| Composition | Native | Output @ scale 4 |
|---|---|---|
| `Banner` / `Banner-Clean` / `Scene1-PD-Fast` / `Banner-Fast-16s` | 1452 × 709 | 5808 × 2836 |
| `Banner-Card` / `Scene1-PD-Fast-Card` | 378 × 475 | 1512 × 1900 |

### Why these settings

- **PNG intermediates** (`Config.setVideoImageFormat("png")` in
  [`remotion.config.ts`](remotion.config.ts)) → no chroma-subsampling
  artefacts on text edges, gradients, or drop shadows during the
  intermediate-frame capture stage.
- **CRF 14** → essentially perceptually lossless H.264. Default is 18.
  CRF 12 would be visually identical; CRF 18 has subtle banding on the
  soft blue blob.
- **`--scale=4`** → renders at 4× pixel density so the resulting MP4
  can be downsampled cleanly to retina-quality web (or used at native
  size on 5K displays).

If file size becomes a concern, the realistic trade-offs are:
- Drop to `--scale=2` (halves dimensions) for ~75% smaller files.
- Raise CRF to 18 for ~50% smaller files with imperceptible quality loss.
- Both at once for ~85% smaller files.

### Output locations

All renders land in `out/` (gitignored). The latest production-quality
renders from this session:

| File | Composition | Size |
|---|---|---|
| `out/scene1-pd-fast.mp4` | `Scene1-PD-Fast` (22 s, with blob) | ~28 MB |
| `out/scene1-pd-fast-card.mp4` | `Scene1-PD-Fast-Card` (22 s, card only) | ~1.5 MB |

The card-only render is much smaller because (a) the pixel count is
~13× lower, and (b) the white background compresses extremely well
under H.264.

---

## Common edits — addendum for Fast variants

| User asks | Edit this |
|---|---|
| "Change the Fast tagline X to Y" | `FOOTER_STAGES` in [`Scene1PD-Fast.tsx`](src/scenes/Scene1PD-Fast.tsx)'s `T.footer` block. Mirror the change in `Scene1PD-Fast16.tsx` (scale the duration by 480/660). |
| "Speed up Scene N in Fast" | Edit the matching `T_SCENE<N>_FAST` block in `Scene<N>-Fast.tsx`. **Then re-derive `Scene<N>-Fast16.tsx`** by multiplying every frame number by 480/660. |
| "Change F4 slide distance in Scene 4 Fast" | `T_SCENE4_FAST.f4SlideFromY` in [`Scene4IT-Fast.tsx`](src/scenes/Scene4IT-Fast.tsx). Mirror in `-Fast16.tsx`. Pixel values are NOT scaled by 480/660. |
| "Remove F1/F4 slide-up motion" | Delete the `slideY` interpolation and the wrapping `translateY()` div in `Frame1Ticket` / `Frame4Resolved` in `Scene4IT-Fast.tsx`. |
| "Render the Fast banner without the background" | `npx remotion render Scene1-PD-Fast-Card out/<name>.mp4 --crf=14 --scale=4` |
| "Render at lower quality for preview" | Same command with `--crf=23 --scale=1`. |
| "Add a card-only variant of the 16 s composition" | Follow the [recipe](#card-only-export-the-frame-only-render); make `Scene1PDFast16` accept the same props and add a `Scene1PDFast16CardOnly` wrapper. |
