# Animation Patterns — Style Guide

Detailed reference for the visual + motion language of this project. The
goal is a **modern SaaS skeleton-UI banner** that loops silently behind a
landing-page headline. Everything below is the result of iteration with
the user — don't deviate without explicit permission.

---

## 1. Color palette

| Token | Hex | Used for |
|---|---|---|
| `innerBg` | `#F7F7F7` | Inside-the-card background ("the desk") |
| `panelBg` | `#F2F2F2` | Document panel ("the paper") |
| `textBlock` | `#D8D8D8` | Skeleton text lines (resting state) |
| `shimmerBlue` | `#ADC0FA` | Shimmer band, sparkle fill |
| `selectionStroke` | `#C3D2FF` | Border of the optional selection chip |
| `headerTint` | `#D4DFFE` | Header band (always rendered at 0.5 opacity) |
| `cardBlob` | `#ADC0FA` | Background blurred blob (in `BannerStage`) |
| Footer text | `#454545` | "Best at Proposal Development…" |
| Icons (lucide) | `#A8A8A8` | Plus + paper-plane in the footer |

The two greys (`F7F7F7` vs `F2F2F2`) are intentionally close — the paper
should feel like it's *resting on* the desk, not floating. Don't increase
the contrast to "make the panel more visible".

---

## 2. Typography

**Inter**, Latin subset, single weight (`500`) per scene unless a heading
demands otherwise. Loaded at module init via `@remotion/google-fonts`:

```ts
import { loadFont } from "@remotion/google-fonts/Inter";
const { fontFamily: INTER } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
```

Why one weight + Latin only: `loadFont()` without options downloads ~63
font files at render time, slowing every render and triggering Remotion's
"too many requests" warning. Restricting to one weight + one subset cuts
that to ~2 requests.

**Footer text** in `BannerStage`:
- Family: Inter
- Weight: 500
- Size: 12px
- Color: `#454545`
- Letter-spacing: `-0.05`

---

## 3. Icons

Always **`lucide-react`**. Two icons live in the footer:

- `CirclePlus` (left) — circled plus, the "info / add" cue
- `Send` (right) — paper plane, the "send / submit" cue

```tsx
import { CirclePlus, Send } from "lucide-react";
<CirclePlus size={16} color="#A8A8A8" strokeWidth={1.6} />
<Send size={14} color="#A8A8A8" strokeWidth={1.6} />
```

Stroke width `1.6` is the right thickness — `1.5` reads as too thin at this
icon size, `2` reads as cartoonish.

---

## 4. Easing curves

Three named curves cover almost everything:

```ts
const SOFT_OUT    = Easing.bezier(0.32, 0.72, 0.37, 1);  // entrances (fade-ins, lift-ins)
const EASE_IN_OUT = Easing.bezier(0.45, 0, 0.55, 1);     // morphs (geometry tweens)
const OVERSHOOT   = Easing.bezier(0.34, 1.4, 0.64, 1);   // pops (sparkle, check)
```

| When | Use |
|---|---|
| Element fades / lifts in | `SOFT_OUT` |
| Geometry tweens uneven → even | `EASE_IN_OUT` |
| Sparkle / check pops at the end | `OVERSHOOT` |
| Linear motion | **never** — feels mechanical |

We tried `Easing.bezier(0.16, 1, 0.3, 1)` (snappy expo-out) for line
entrances and the user said it felt twitchy. Stick with `SOFT_OUT`.

---

## 5. Coordinate system

Reference SVGs are in **1452 × 709 absolute pixel space**. The card
chrome sits at:

```ts
const CARD = { x: 537, y: 120, w: 378, h: 475 };
const INNER = { x: 545, y: 141, w: 353, h: 355 };  // light grey area inside card
```

To position elements inside the card, define geometry in absolute SVG coords
and convert at render-time:

```ts
const lx = (x: number) => x - CARD.x;  // left  in card-local
const ly = (y: number) => y - CARD.y;  // top   in card-local
```

So a `<rect x="555" y="198">` in the SVG becomes:

```tsx
<div style={{ left: lx(555), top: ly(198) }} />
```

Always work in SVG coords until the JSX boundary. This makes diffing against
reference SVGs trivial.

---

## 6. Glass card chrome (BannerStage)

Defined once in [`src/BannerStage.tsx`](../src/BannerStage.tsx) and inherited
by every scene. Pieces:

- **Background blob** — soft `#ADC0FA` ellipse, blurred 249px, drifting
  subtly with `Math.sin(t * 0.4)` for life.
- **Faint white grid lines** at fixed positions (matches the source SVG).
- **Glass card** — translucent white (`rgba(255,255,255,0.86)`) with
  `backdrop-filter: blur(8.8px)`, soft shadow, hairline border.
- **Card entrance** — opacity 0→1 + 16px lift + scale 0.985→1, eased with
  `Easing.bezier(0.16, 1, 0.3, 1)` over frames 6–30.
- **Header band** — light blue tint (`#D4DFFE` @ 0.5 opacity) covering the
  top 41.5px of the inner area, plus two white skeleton bars (placeholder
  for nav).
- **Footer** — divider at y=542, then a flex row with `CirclePlus` (left),
  "Best at Proposal Development…" (Inter 500 / 12px / `#454545`), and
  `Send` (right).

**Don't modify the chrome unless the user explicitly asks** — every scene
shares it. Changes there ripple to all scenes at once (which is what we
want for consistency).

---

## 7. Animation flow (canonical sequence)

For a typical "skeleton document" scene like Scene1-PD, the timeline is:

```
Frame   Phase
─────   ───────────────────────────────────────────────
6–36    Card chrome enters     (BannerStage)
38–56   Paper fades in alone   (empty grey rect)
60–122  Lines cascade in       (5-frame stagger × 12-frame fade per line)
122–138 Hold uneven            (let the eye read the document)
138–224 Shimmer + align        (7-frame stagger × 16-frame morph per line)
228–250 Sparkle pop            (overshoot bezier)
250–260 Hold final state
─────   ───────────────────────────────────────────────
Total: 260 frames @ 30fps ≈ 8.7s
```

Two phases per line:
1. **Appear** — pure fade-in + tiny upward translate (3px). Line stays
   uneven during this phase.
2. **Shimmer + morph** — horizontal blue gradient band sweeps inside the
   line, while geometry (x, w) tweens uneven → even in lockstep with the
   sweep. Line "settles into alignment" exactly as the band passes through.

Don't skip the **hold uneven** beat (frames 122–138). Without it, the eye
doesn't register the "raw document" state — the shimmer reads as decoration
instead of as transformation.

---

## 8. The horizontal shimmer band

Inside each skeleton line during its shimmer phase:

```tsx
<div style={{ /* the line itself */
  background: COLORS.textBlock,  // grey D8D8D8
  overflow: "hidden",             // clip the shimmer to the line bounds
  borderRadius: 2,
}}>
  <div style={{
    position: "absolute",
    top: 0, bottom: 0,
    left: `${bandX}%`,            // animates from -30% to 130%
    width: "45%",
    background:
      "linear-gradient(90deg, rgba(173,192,250,0) 0%, rgba(173,192,250,0.95) 50%, rgba(173,192,250,0) 100%)",
  }} />
</div>
```

`bandX = -30 + shimmerProgress * 160` so the band always fully exits before
the next phase. The 45% width is the right balance — narrower bands look
like a flicker, wider bands wash out the line.

The line's geometry tweens uneven → even with the **same eased
`shimmerProgress`**, so visually the band and the morph are inseparable —
the band *is* the transformation.

---

## 9. Geometry pattern (Scene1-PD)

```ts
// PANEL (paper) — 200×220, centered horizontally + vertically inside the
// F7F7F7 inner area below the header
const PANEL = { x: 622, y: 226, w: 200, h: 220 };

// Lines: 6px tall, stride 18, 17px top/bottom padding, 10px left/right
const LINE_HEIGHT = 6;

const UNEVEN_LINES = [
  { x: 632, y: 243, w: 180 }, // line 1   — full
  { x: 632, y: 261, w: 175 }, //   2     — slightly short
  { x: 632, y: 279, w: 180 }, //   3     — full
  { x: 632, y: 297, w: 116 }, //   4     — paragraph end
  { x: 644, y: 315, w: 162 }, //   5     — INDENT (paragraph 2 starts)
  { x: 632, y: 333, w: 180 }, //   6     — full
  { x: 632, y: 351, w: 175 }, //   7     — slightly short
  { x: 632, y: 369, w:  90 }, //   8     — paragraph end
  { x: 644, y: 387, w: 174 }, //   9     — INDENT (paragraph 3 starts)
  { x: 632, y: 405, w: 158 }, //  10     — slightly short
  { x: 632, y: 423, w:  72 }, //  11     — short closing line
];
```

Three paragraphs, each ending in a short line. Indents at lines 5 and 9
(paragraph starts) shift x from `632` to `644`. **Don't randomize x values
just to look "uneven"** — text doesn't behave that way. Keep the consistent
left margin.

---

## 10. The sparkle (final pop)

After the shimmer cascade completes, an AI sparkle pops in near the
bottom-right of the paper:

```tsx
const SPARKLE = { cx: 790, cy: 415 };  // tune per scene's panel bounds

const opacity = interpolate(pop, [0, 0.4], [0, 1], { ... });
const scale   = interpolate(pop, [0, 0.6, 1], [0.55, 1.08, 1], {
  easing: OVERSHOOT,
});
```

The 8-pointed star inside the blue circle is hand-rolled SVG:

```jsx
<svg width="52" height="52" viewBox="0 0 52 52">
  <circle cx="26" cy="26" r="26" fill="#ADC0FA" />
  <g transform="translate(13, 13)" fill="white">
    <path d="M13 0 L15.5 10.5 L26 13 L15.5 15.5 L13 26 L10.5 15.5 L0 13 L10.5 10.5 Z" />
  </g>
</svg>
```

The overshoot at `1.08` then back to `1.0` is what makes it feel "snappy
but settled". Without overshoot it reads as a fade-in; with too much
overshoot (e.g. `1.2`) it reads as cartoony.

---

## 11. Things that have been tried and rejected

| Idea | Why we didn't keep it |
|---|---|
| CSS `@keyframes shimmer` looping continuously | Renders as static in Remotion |
| Continuous shimmer wave on every line forever | Reads as "loading state" not "transformation done" |
| Scaling the document to make it smaller | Distorts the precise SVG-coord positioning; better to set explicit panel sizes |
| Larger sparkle (`scale 1.2`) | Cartoony — overshoot at `1.08` is the sweet spot |
| Stronger ease-out (`Easing.bezier(0.16, 1, 0.3, 1)`) for line entrances | Twitchy, drew attention away from the shimmer phase |
| Adding random x-offsets to skeleton lines | Looks chaotic — text doesn't behave that way |
| Heavy backdrop-filter blur (40px+) on the card | Makes the inside content look hazy / unreadable |
| Using `lucide-react` `ArrowRight` instead of `Send` for the right footer icon | Doesn't match the "paper plane" cue from the source design |
| Selection chip with its own opacity fade-in (frames 30→45) | Double-stacked with parent fade-in; chip appeared to "pop in" awkwardly |

---

## 12. Tuning knobs (when the user asks for tweaks)

| User asks | Edit this |
|---|---|
| "Make the paper smaller" | `PANEL.w`, `PANEL.h`; recompute centering math in the comments |
| "Lines too thick" | `LINE_HEIGHT` (currently 6) |
| "Lines too close together" | Increase the y stride between successive `UNEVEN_LINES` entries |
| "More space inside the paper" | Increase first-line `y` (top padding) and adjust last-line `y` (bottom padding) |
| "Smoother animation" | Increase `T.perLineAppearDuration` and `T.perLineShimmerDuration`; increase total `T.end` to absorb the extra time |
| "Faster" | Decrease the same; tighten T.end |
| "Different shimmer color" | `COLORS.shimmerBlue` (currently `#ADC0FA`) and the gradient stops in the shimmer band |
| "Sparkle in a different position" | `SPARKLE.cx` / `SPARKLE.cy` |

After any change, render a still:
```bash
npx remotion still Scene1-PD out/check.png --frame=180 --scale=0.5
```
Eyeball it before committing to a full MP4 render.
