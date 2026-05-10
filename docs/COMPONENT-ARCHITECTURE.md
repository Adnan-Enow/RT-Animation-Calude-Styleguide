# Component Architecture

Why this project is split into `BannerStage` + per-scene components,
what each piece is responsible for, and the conventions that hold the
whole thing together.

If you've already read [`CLAUDE.md`](../CLAUDE.md) and
[`ANIMATION-PATTERNS.md`](ANIMATION-PATTERNS.md), this document is the
"why" to those documents' "what".

---

## The two-layer split

```
BannerStage           ← shared chrome: blob, glass card, header band, footer
  └── Scene<N><CODE>  ← scene-specific work area: paper, lines, sparkle
```

Every Remotion `Composition` is a top-level scene component
(`Scene1PD`, `Scene2SD`, …). Each scene is just a thin wrapper:

```tsx
export const Scene1PD: React.FC = () => (
  <BannerStage cardEntryStart={6} cardEntryDuration={24}>
    <StaticCardContent />
    <WorkArea />
  </BannerStage>
);
```

That's the entire architectural rule: **`BannerStage` owns the chrome,
the children own the work area inside the card.**

---

## What `BannerStage` owns

Defined in [`src/BannerStage.tsx`](../src/BannerStage.tsx). Renders, in
back-to-front order:

1. **White background** — the page behind everything.
2. **`BackgroundBlob`** — soft `#ADC0FA` blurred ellipse, drifts with
   `Math.sin(t * 0.4)` to feel alive without distracting.
3. **`GridLines`** — faint white verticals + horizontals at fixed
   positions (matching the source SVG exactly — these are not arbitrary).
4. **`CardChrome`** — the glass card itself. Translucent white,
   `backdrop-filter: blur(8.8px)`, hairline border, soft shadow.
   Animates in with opacity 0→1, +16px lift, scale 0.985→1, eased with
   `Easing.bezier(0.16, 1, 0.3, 1)` over `cardEntryStart` →
   `cardEntryStart + cardEntryDuration` (default frames 6→30).
5. **The card's content area** — children render here, clipped to the
   card's bounds, with their own short fade/lift after the chrome
   settles.
6. **`CardFooter`** — divider, headline ("Best at Proposal
   Development…"), `CirclePlus` (left) + `Send` (right) icons. Fades
   in alongside the content.

Plus the two exported geometry constants:

```ts
export const CARD  = { x: 537, y: 120, w: 378, h: 475 } as const;
export const INNER = { x: 545, y: 141, w: 353, h: 355 } as const;
```

`CARD` is the outer card frame. `INNER` is the F7F7F7 area inside the
card, below the header band, where scene content actually lives. Both
are imported by scenes for the `lx()` / `ly()` helpers.

### What `BannerStage` deliberately does *not* know

- The colour of any text line, paper, or sparkle.
- The number of skeleton lines.
- The duration of the scene (each scene exports its own `*_DURATION`).
- Anything about timing inside the work area.

This separation is the whole point. Adding Scene 2 doesn't risk
breaking Scene 1's chrome because there's no chrome code in scenes.

---

## What each scene owns

Defined in `src/scenes/Scene<N><CODE>.tsx`. Five canonical pieces, in
this order:

```ts
// 1. COLORS — only scene-specific tokens (most are the same per scene
//    so this is mostly a re-statement of the global palette, intentional)
const COLORS = { innerBg, panelBg, textBlock, shimmerBlue, sparkleBlue };

// 2. lx / ly + geometry — PANEL position, line positions, sparkle position
const lx = (x: number) => x - CARD.x;
const ly = (y: number) => y - CARD.y;
const PANEL = { x: 622, y: 226, w: 200, h: 220 };
const UNEVEN_LINES = [/* ... */];
const EVEN_TARGETS = [/* ... */];
const SPARKLE = { cx: 790, cy: 415 };

// 3. T — frame numbers, exported as *_DURATION
const T = { panelFadeStart, panelFadeEnd, linesStart, /* ... */ end };
export const SCENE1_PD_DURATION = T.end;

// 4. Easing — the same three named curves in every scene by convention
const SOFT_OUT    = Easing.bezier(0.32, 0.72, 0.37, 1);
const EASE_IN_OUT = Easing.bezier(0.45, 0, 0.55, 1);
const OVERSHOOT   = Easing.bezier(0.34, 1.4, 0.64, 1);

// 5. Sub-components + top-level export
const StaticCardContent = ...;  // header band + nav skeletons (shared chrome inside the card body)
const Paper = ...;              // the F2F2F2 panel that fades in
const ShimmerLineH = ...;       // one skeleton line with its own shimmer band
const Sparkle = ...;            // the AI-finished pop at the end
const WorkArea = ...;           // composes the above

export const Scene1PD: React.FC = () => (
  <BannerStage>
    <StaticCardContent />
    <WorkArea />
  </BannerStage>
);
```

Why duplicated easing constants in every scene instead of a shared
module? Two reasons:
1. **Constants are documentation.** Reading Scene1PD top-to-bottom tells
   you everything about how it animates. Hopping to a `easing.ts`
   import would scatter that.
2. **Per-scene tunability.** If Scene 3's morphs genuinely need a
   different curve (rare, but possible), changing one scene is one
   file. Sharing creates pressure to "just make it more flexible" —
   which always ends in a config blob no one understands.

This is the same reason `T` lives inline per scene rather than in a
shared timing module. Locality > DRY for animation work.

---

## The coordinate convention

Reference SVGs are in **1452 × 709 absolute pixel space**. The card
chrome covers a slice of that. Inside the card's content area, scenes
need to position elements relative to the card's top-left.

The convention: **always work in absolute SVG coords; convert to
card-local at the JSX boundary**.

```ts
const lx = (x: number) => x - CARD.x;  // 537 → 0
const ly = (y: number) => y - CARD.y;  // 120 → 0

// SVG says: <rect x="555" y="198" width="200" height="20" />
// Becomes:
<div style={{ left: lx(555), top: ly(198), width: 200, height: 20 }} />
```

Why not just store everything in card-local from the start? Because
the user iterates against the reference SVGs ("the line on row 4
should start at the same x as row 5"). When constants match SVG
numbers exactly, you can read both side-by-side and verify by eye. As
soon as you subtract `CARD.x`, that diffability is gone.

The conversion happens at the *latest* moment — inside the JSX `style`
prop — so all logic above (interpolation, lerps, conditionals) reads
in the same coordinate system as the SVG.

---

## How animation is wired

Every animated value is computed from `useCurrentFrame()`. No CSS
transitions, no `@keyframes`, no React state, no `setTimeout`. This is
non-negotiable: **Remotion renders frame-by-frame**. Anything time-based
that doesn't go through `frame` will render as a static frame — broken.

The pattern across the codebase:

```tsx
const frame = useCurrentFrame();
const opacity = interpolate(frame, [T.fadeStart, T.fadeEnd], [0, 1], {
  easing: SOFT_OUT,
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

Three things to notice:

1. **The frame range comes from `T`** — never inlined.
2. **`extrapolate*: "clamp"`** is on every interpolate. Without it,
   values overshoot before the start frame and after the end frame,
   which produces brief flashes of inverted state (e.g. opacity > 1 or
   negative scale).
3. **Easing belongs inside `interpolate()`**, not as a CSS
   `transition-timing-function`. CSS transitions don't run in
   Remotion's frame-by-frame render.

For two values that should move in lockstep (the shimmer band sweeping
across a line *while* the line's geometry morphs), compute one
`progress` value and pass it to both — see `ShimmerLineH` in
`Scene1PD.tsx` for the canonical example.

---

## How `BannerStage` and the scene communicate

Two channels:

**1. Constants exported by `BannerStage`** — `CARD`, `INNER`. Scenes
import these to compute `lx` / `ly` and to know the bounds of the
content area. These are the only "shared types" the scene depends on.

**2. Props passed to `BannerStage`** — currently:

```ts
{
  children: React.ReactNode;            // the work area
  cardEntryStart?: number;              // when the card chrome starts entering
  cardEntryDuration?: number;           // how long the entry takes
  showFooter?: boolean;                 // toggle footer (rare; default true)
}
```

When adding more per-scene customisation (e.g. `footerText` for the
Scene 2 / 3 / 4 headlines — see
[`ADDING-A-NEW-SCENE.md`](ADDING-A-NEW-SCENE.md#step-0-one-time-make-banner-footer-text-configurable)),
prefer **a single scalar prop** with a sensible default over a config
object or render-prop. The chrome is small; props stay flat.

What scenes deliberately *don't* receive from `BannerStage`:
- The current frame (each component reads `useCurrentFrame()` itself —
  Remotion handles the global state).
- Easing curves, colours, font, icons (locked globally; importing them
  per scene keeps the scene file self-describing).

---

## Files inventory

```
src/
├── index.ts          ← Remotion entry: registerRoot(RemotionRoot)
├── index.css         ← global resets (currently empty — intentional)
├── Root.tsx          ← <RemotionRoot/>: registers each scene as a <Composition>
├── BannerStage.tsx   ← shared chrome: blob, grid, card, header band, footer
└── scenes/
    └── Scene1PD.tsx  ← Proposal Development scene (canonical reference)
```

Each file has exactly one responsibility:

| File | Responsibility |
|---|---|
| `index.ts` | Boot Remotion. **Don't** add logic here. |
| `index.css` | Global CSS resets if needed. Animations don't go here. |
| `Root.tsx` | Register `<Composition>` entries. One per scene. |
| `BannerStage.tsx` | The chrome that every scene shares. |
| `scenes/Scene<N><CODE>.tsx` | One scene's work area + timing. |

---

## What can change vs what's locked

**Can change per scene** (just edit the scene file):
- `PANEL`, `UNEVEN_LINES`, `EVEN_TARGETS`, `SPARKLE` geometry
- `T` timeline values
- The set of sub-components inside `WorkArea` (e.g. swap `Paper` for a
  chat-area-shaped element if the SVG shows one)
- The `footerText` prop passed to `BannerStage` (after Step 0)

**Locked globally** (don't touch without explicit user permission):
- The colour palette (see ANIMATION-PATTERNS.md §1)
- The font (Inter, weight 500, Latin subset)
- The icon set (`lucide-react`)
- The three easing curves (`SOFT_OUT`, `EASE_IN_OUT`, `OVERSHOOT`)
- Composition dimensions (1452 × 709 @ 30fps)
- The chrome itself — blob colour/shape, grid line positions, glass
  card translucency, header band tint, footer divider/icons layout

If you find yourself wanting to change something on the locked list,
**stop and ask the user**. The locks aren't arbitrary; each was the
output of iteration. Changing one cascades visually across every
scene.

---

## Why this split, in one paragraph

Banner scenes look identical at first glance — same card, same blob,
same footer — and differ only in what happens inside the paper. If
each scene re-implemented the chrome, four scenes meant four chances
for the chrome to drift apart. Splitting `BannerStage` from
per-scene `WorkArea`s makes "consistency across scenes" a property of
the architecture, not of discipline. Per-scene files stay small,
top-to-bottom readable, and trivially diffable against their reference
SVGs. Scene-specific timing stays in scene-specific `T` objects so
tweaking pacing for one scene can't spill into another. Everything
locked is locked in one place; everything tunable is tunable where
you'd expect to find it.
