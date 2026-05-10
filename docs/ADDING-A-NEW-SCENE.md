# Adding a New Scene

Step-by-step walkthrough for building Scenes 2 (Software Development), 3
(IT), and 4 (Staffing) on top of the Scene 1 pattern. The whole point of
this project's structure is that **adding a scene is mostly a
copy-and-edit-the-constants job, not a from-scratch build**.

If you find yourself touching `BannerStage.tsx` or rewriting easing
curves, stop — that's almost certainly not the right move. See [What you
should *not* do](#what-you-should-not-do) below.

---

## Prerequisites

Before you start, you should have:

1. **2–4 keyframe SVGs** for the new scene, drawn at **1452 × 709**
   (the banner's absolute coordinate space). These are the geometric
   ground truth — every rect, every position is read off these files.
2. The scene's **footer headline** decided. Each scene has its own —
   "Best at Software Development…", "Best at IT…", etc. (See
   [Step 0](#step-0-one-time-make-banner-footer-text-configurable) below
   for how the footer is currently wired.)
3. Read [`CLAUDE.md`](../CLAUDE.md) and
   [`ANIMATION-PATTERNS.md`](ANIMATION-PATTERNS.md) at least once. The
   palette, easing curves, font, icons, and animation flow are locked —
   don't relitigate them per scene.

---

## Step 0 (one-time): Make BannerStage footer text configurable

The current `BannerStage.tsx` hardcodes the footer headline to
`"Best at Proposal Development…"`. That's fine for Scene 1, but Scene
2 onward will need different headlines.

**The right fix** is to add a single prop:

```tsx
// In src/BannerStage.tsx — change the BannerStage signature:
export const BannerStage: React.FC<{
  children: React.ReactNode;
  cardEntryStart?: number;
  cardEntryDuration?: number;
  showFooter?: boolean;
  footerText?: string;     // ← add this
}> = ({
  children,
  cardEntryStart = 6,
  cardEntryDuration = 24,
  showFooter = true,
  footerText = "Best at Proposal Development…",  // ← default keeps Scene 1 unchanged
}) => {
  // ...
  // pass footerText down to <CardFooter />
}
```

Then in `CardFooter`, replace the hardcoded string with `{footerText}`.
Each scene passes its own:

```tsx
<BannerStage cardEntryStart={6} cardEntryDuration={24} footerText="Best at Software Development…">
```

**Do this once, before adding Scene 2.** It's a 4-line change. After
that, adding scenes is purely a content-only operation.

---

## Step 1: Drop the keyframe SVGs

Create a numbered folder under `reference/`:

```
reference/
  01-PD/         ← already there (Scene 1)
  02-SD/         ← new
    frame-1.svg
    frame-2.svg
    frame-3.svg
```

Folder naming: `NN-CODE` where `NN` is two digits (`02`, `03`, `04`)
and `CODE` is the abbreviation used in scene IDs (`SD`, `IT`, `STAFF`).

Don't drop SVGs anywhere else. They go here, full stop.

---

## Step 2: Copy Scene1PD.tsx as the starting point

```bash
cp src/scenes/Scene1PD.tsx src/scenes/Scene2SD.tsx
```

This gives you the entire scene structure — `COLORS`, `lx`/`ly`,
geometry constants, `T` timeline object, `SOFT_OUT` / `EASE_IN_OUT` /
`OVERSHOOT` curves, `lerp`, `StaticCardContent`, `Paper`, `ShimmerLineH`,
`Sparkle`, `WorkArea`, and the top-level export — already wired
together.

You will edit constants and possibly tweak content. **Don't restructure
the file.** The 5-piece layout (geometry / timeline / easing /
sub-components / top-level export) is the same for every scene by
design.

---

## Step 3: Rename the export + the duration constant

In `Scene2SD.tsx`, rename:

```ts
// Before:
export const SCENE1_PD_DURATION = T.end;
export const Scene1PD: React.FC = () => { ... };

// After:
export const SCENE2_SD_DURATION = T.end;
export const Scene2SD: React.FC = () => { ... };
```

Naming pattern: `Scene<N><CODE>` for the component, `SCENE<N>_<CODE>_DURATION`
for the duration constant.

---

## Step 4: Read the SVGs, extract coordinates

Open `reference/02-SD/frame-1.svg` (the initial-state keyframe) in a
text editor. You're looking for:

1. The **paper / panel** — usually a `<rect>` with the `panelBg`
   colour (`#F2F2F2`). Note its `x`, `y`, `width`, `height`.
2. The **skeleton text lines** — a sequence of `<rect>` elements with
   colour `#D8D8D8` (textBlock). Note `x`, `y`, `width` for each.
3. The **sparkle / final indicator** — usually only in the last
   keyframe SVG. Note its center position.

Then update the constants in `Scene2SD.tsx`:

```ts
// Replace the PANEL block:
const PANEL = { x: <from-svg>, y: <from-svg>, w: <from-svg>, h: <from-svg> };

// Replace UNEVEN_LINES with the actual line rects from frame-1.svg:
const UNEVEN_LINES = [
  { x: 632, y: 243, w: 180 }, // line 1 — copy from <rect> in SVG
  { x: 632, y: 261, w: 175 },
  // ... one entry per skeleton line
];

// EVEN_TARGETS: the resting "aligned" geometry each line morphs to.
// Usually all lines align to the same x and a max width except the
// final 1-2 lines which stay short (paragraph endings).
const EVEN_TARGETS = [
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  // ...
];

// Sparkle position from the final keyframe SVG:
const SPARKLE = { cx: <from-svg>, cy: <from-svg> };
```

**Always work in absolute SVG coords.** The `lx()` / `ly()` helpers
convert to card-local at render time. This makes diffing against the
reference SVGs trivial — if you got a number wrong, you can spot it by
comparing to the SVG.

If a `<rect>` has decimal coords like `x="632.5"`, just round to the
nearest integer. Sub-pixel positioning makes no visual difference and
clutters the constants block.

### Math out the padding in comments

Above `PANEL`, write the centering math the same way Scene1PD does:

```ts
/* ── Geometry ─────────────────────────────────────────────────────────
 *
 * F7F7F7 visible (below header):  y=182.5..496  (height 313.5)
 * F7F7F7 horizontally:             x=545..898   (width  353)
 *
 * Paper: <W> × <H> — vertically and horizontally centered:
 *   x = 545 + (353 - <W>)/2 = <X>
 *   y = 182.5 + (313.5 - <H>)/2 = <Y>
 *
 * Inside the paper, padding:
 *   top + bottom: <N> each
 *   left + right: <N> each
 * ──────────────────────────────────────────────────────────────────────── */
```

This is not optional. The user iterates ("more padding", "smaller
paper") and having the math written down means you can recalc in your
head without re-reading the SVG.

---

## Step 5: Tune the timeline (usually unchanged)

```ts
const T = {
  panelFadeStart: 38,
  panelFadeEnd: 56,
  linesStart: 60,
  perLineAppearStagger: 5,
  perLineAppearDuration: 12,
  unevenHoldEnd: 138,
  shimmerStart: 138,
  perLineShimmerStagger: 7,
  perLineShimmerDuration: 16,
  sparkleStart: 228,
  sparkleEnd: 250,
  end: 260,
};
```

**Default: keep Scene 1's pacing exactly.** Banner scenes loop silently
behind a hero — consistent rhythm across scenes is part of why it
reads as a "set". Don't make Scene 2 faster just because it has fewer
lines.

When you might tweak `T`:
- **More lines (15+)**: extend `T.end` by `(extraLines * perLineShimmerStagger)`
  so the shimmer cascade has time to finish before sparkle.
- **Fewer lines (6–8)**: `T.end` can shrink, but pull `sparkleStart` /
  `sparkleEnd` in proportionally — don't leave dead air.
- **Extra phase** (e.g. a chip click animation between hold and shimmer):
  add a new field like `chipClickStart` / `chipClickEnd` and slot it into
  the existing flow. Don't inline a literal frame number anywhere.

---

## Step 6: Register the scene in Root.tsx

```tsx
// src/Root.tsx
import { Scene1PD, SCENE1_PD_DURATION } from "./scenes/Scene1PD";
import { Scene2SD, SCENE2_SD_DURATION } from "./scenes/Scene2SD";  // ← add

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Scene1-PD"
        component={Scene1PD}
        durationInFrames={SCENE1_PD_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition                                                   // ← add
        id="Scene2-SD"
        component={Scene2SD}
        durationInFrames={SCENE2_SD_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
```

Composition `id` naming: `Scene<N>-<CODE>` with a hyphen (matches the
folder convention and looks clean in the Remotion Studio sidebar).

---

## Step 7: Verify with a still, then render

Don't render the full MP4 first — it's ~30s. Render a single still
inside the most "interesting" frame (usually mid-shimmer):

```bash
npx remotion still Scene2-SD out/scene2-check.png --frame=180 --scale=0.5
```

Open `out/scene2-check.png` and eyeball:
- Paper is centered inside the card's F7F7F7 area
- Lines have visible padding on all 4 sides of the paper
- Line widths and indents look like prose, not a checkerboard
- Shimmer band is visible on at least one line at frame 180

If anything looks off, fix the constants and re-render the still. Only
when stills look right should you do the full render:

```bash
npx remotion render Scene2-SD out/Scene2-SD.mp4
```

For live iteration:

```bash
npm run dev   # opens Remotion Studio at http://localhost:3000
```

Studio hot-reloads on every file save and lets you scrub the timeline
frame-by-frame. Use it heavily during the constants-tuning phase.

---

## Step 8: Update the footer headline (per scene)

Once Step 0 is done and `BannerStage` accepts a `footerText` prop, set
it from your scene's top-level export:

```tsx
export const Scene2SD: React.FC = () => {
  return (
    <BannerStage
      cardEntryStart={6}
      cardEntryDuration={24}
      footerText="Best at Software Development…"
    >
      <StaticCardContent />
      <WorkArea />
    </BannerStage>
  );
};
```

Headline copy comes from the user — don't invent it. If you don't have
the exact wording, use a placeholder and ask.

---

## Common edits per scene

| If the SVG shows… | Edit |
|---|---|
| Different paper size | `PANEL.w` / `PANEL.h` + recompute centering math |
| More or fewer skeleton lines | Add/remove rows in `UNEVEN_LINES` and `EVEN_TARGETS` (must stay equal-length) |
| A different element instead of a paper (e.g. a chat bubble, a list of cards) | Replace the `Paper` sub-component with a scene-specific equivalent. Keep the same fade-in pattern. |
| A selection chip / cursor / extra UI element | Add a sub-component and a `T.chip*` block in the timeline. Don't fold it into `Paper`. |
| Different sparkle position | `SPARKLE.cx` / `SPARKLE.cy` |
| No sparkle in this scene | Drop `Sparkle` from `WorkArea` and the `T.sparkle*` fields from `T` |

---

## What you should *not* do

- ❌ **Don't restructure the file.** 5 pieces in this order: COLORS,
  lx/ly + geometry, T timeline, sub-components, top-level export.
- ❌ **Don't import a different easing curve** (e.g. `Easing.cubic`,
  `Easing.bezier(0.16, 1, 0.3, 1)`). The three named curves are tuned —
  see [`ANIMATION-PATTERNS.md`](ANIMATION-PATTERNS.md#4-easing-curves).
- ❌ **Don't redefine `COLORS`** — palette is locked across all scenes.
  If a new colour is genuinely needed, add it to the palette in
  ANIMATION-PATTERNS.md and use the same token everywhere.
- ❌ **Don't loop the shimmer continuously** in a new scene. One-time
  cascade per loop is the pattern. Continuous shimmer reads as
  "loading" instead of "AI processed the document".
- ❌ **Don't change `BannerStage`** to add scene-specific behaviour.
  If you need scene-specific chrome, that's a `<StaticCardContent>`
  responsibility (rendered as a child of `BannerStage`).
- ❌ **Don't inline magic frame numbers.** Every frame value goes in `T`.
- ❌ **Don't use `setTimeout` / `requestAnimationFrame` / React state**
  for motion. Compute everything from `useCurrentFrame()`. If you find
  yourself wanting state, you're solving the wrong problem.

---

## Checklist before declaring a scene done

- [ ] Reference SVGs in `reference/NN-CODE/`
- [ ] Geometry constants match SVG `<rect>` coords (eyeball-diff against frame-1.svg)
- [ ] Padding math written out as a comment above `PANEL`
- [ ] `UNEVEN_LINES` and `EVEN_TARGETS` are the same length
- [ ] `SCENE<N>_<CODE>_DURATION` exported and used in `Root.tsx`
- [ ] Composition registered in `Root.tsx` with id `Scene<N>-<CODE>`
- [ ] `footerText` prop set on `BannerStage` (after Step 0)
- [ ] Still render at frame 180 looks right
- [ ] Full MP4 renders without warnings (`npx remotion render Scene<N>-<CODE>`)
- [ ] `npx tsc --noEmit` is clean

---

## Reference: existing scene as a template

Always read [`Scene1PD.tsx`](../src/scenes/Scene1PD.tsx) before
starting a new scene. It's the canonical implementation; your new
scene should look structurally identical, just with different
constants.

If something in Scene 1 feels weird and you want to "improve" it in
Scene 2, **ask first**. The patterns there are deliberate — they're
the result of iteration with the user.
