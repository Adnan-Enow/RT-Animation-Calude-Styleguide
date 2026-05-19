import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { CARD } from "../BannerStage";

/* ────────────────────────────────────────────────────────────────────────────
 * Scene 2 — Software Development.
 *
 * Three frames composed from the source SVGs in
 *   animation scenes/scene 2 SD/SD Animation frame {1,2,3}.svg
 *
 *   Frame 1  — large `</>` code-bracket icon centered in the F7F7F7 area
 *   Frame 2  — code editor: file tree (left) + code lines + gutter (right)
 *   Frame 3  — project board: outer board + sidebar + 5 cards + bar chart
 *              + donut chart
 *
 * Frame transitions are plain crossfades (with sub-stagger inside Frame 3
 * so the dashboard reads as "being assembled" rather than appearing whole).
 * Geometry is in absolute SVG coords; lx/ly convert to card-local at the
 * JSX boundary, matching Scene 1's convention.
 * ──────────────────────────────────────────────────────────────────────── */

/* ── Timing — absolute frames in the banner timeline ─────────────────── */
export const T_SCENE2 = {
  // Chrome (macOS window controls + title bar) replacement during the bridge
  headerFadeIn: { start: 310, end: 345 },

  // Frame 1 — `</>` icon
  // < slides in from the left, > slides in from the right (meet in the middle),
  // / drops in from above slightly afterwards.
  f1BracketsStart: 320,
  f1BracketsEnd: 350,
  f1SlashStart: 340,
  f1SlashEnd: 365,
  f1FadeOut: { start: 380, end: 410 },

  // Frame 2 — code editor.  Structure (file tree + separator + gutter)
  // fades in as a group; each code line then types in left-to-right with
  // a small stagger so the whole thing reads as "code being written".
  f2StructureFadeIn: { start: 390, end: 420 },
  f2CodeLinesStart: 415,
  f2CodeLinesStagger: 4,
  f2CodeLineDuration: 8,
  // 17 lines × 4 stagger + 8 dur = 76 frames → cascade ends ~frame 491
  f2GlyphsFadeIn: { start: 495, end: 525 },
  f2FadeOut: { start: 540, end: 580 },

  // Frame 3 — project board. Holds through the Scene 2 plateau, then
  // fades out as the Scene 2 → Scene 3 bridge begins.
  f3FadeIn: { start: 560, end: 625 },
  f3FadeOut: { start: 700, end: 740 },
} as const;

/* ── Easing ──────────────────────────────────────────────────────────── */
const SOFT_OUT = Easing.bezier(0.32, 0.72, 0.37, 1);

/* ── Helpers ─────────────────────────────────────────────────────────── */
const lx = (x: number) => x - CARD.x;
const ly = (y: number) => y - CARD.y;

/** Trapezoidal envelope: 0 → 1 over fIn, hold at 1, 1 → 0 over fOut.
 *  If fOut omitted, the envelope just rises and stays at 1 forever. */
const envelope = (
  frame: number,
  fIn: { start: number; end: number },
  fOut?: { start: number; end: number }
) => {
  if (fOut) {
    return interpolate(
      frame,
      [fIn.start, fIn.end, fOut.start, fOut.end],
      [0, 1, 1, 0],
      {
        easing: SOFT_OUT,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );
  }
  return interpolate(frame, [fIn.start, fIn.end], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

/* ════════════════════════════════════════════════════════════════════════
 * Scene 2 chrome — macOS window controls + title bar
 *
 * Replaces Scene 1's pair of white nav skeletons with the standard macOS
 * window control dots (red close / yellow minimize / green zoom) and a
 * darker title rect, suggesting the document has become an editor / IDE
 * window. Crossfades in over the bridge frames as Scene 1's chrome bits
 * cross-fade out.
 * ════════════════════════════════════════════════════════════════════════ */
const Dot: React.FC<{ cx: number; cy: number; color: string }> = ({
  cx,
  cy,
  color,
}) => (
  <div
    style={{
      position: "absolute",
      left: lx(cx - 4),
      top: ly(cy - 4),
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: color,
    }}
  />
);

export const Scene2Header: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = envelope(frame, T_SCENE2.headerFadeIn);
  if (opacity <= 0.001) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        pointerEvents: "none",
      }}
    >
      <Dot cx={566} cy={160} color="#F68888" />
      <Dot cx={579} cy={160} color="#F2D43C" />
      <Dot cx={592} cy={160} color="#8BCF38" />
      <div
        style={{
          position: "absolute",
          left: lx(614),
          top: ly(157),
          width: 234,
          height: 7,
          background: "#D8D8D8",
          borderRadius: 1,
        }}
      />
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Frame 1 — `</>` code-bracket icon with directional slide-in
 *
 * Three sub-paths assemble into the icon with motion that suggests
 * "construction" rather than just a fade:
 *
 *   • <  slides in from off-card-left (≈160px offset → 0)
 *   • >  slides in from off-card-right (≈160px offset → 0)
 *   • /  drops in from above (≈40px offset → 0), slightly delayed so it
 *        lands as the brackets settle into their positions
 *
 * Slide eases use an expo-out curve (0.16, 1, 0.3, 1) so the brackets
 * decelerate gracefully into place — same curve as the card chrome's
 * entry, for visual continuity. The slash uses SOFT_OUT for a softer
 * landing.
 * ════════════════════════════════════════════════════════════════════════ */
const SLASH_PATH = "M702.875 383.583L734.125 279.417";
const RIGHT_BRACKET_PATH =
  "M744.542 357.542L770.583 331.5L744.542 305.458";
const LEFT_BRACKET_PATH = "M692.458 357.542L666.417 331.5L692.458 305.458";

const SLIDE_OFFSET = 160; // off-card distance for the bracket slide
const SLASH_DROP = 40; // distance the slash falls from above

const BRACKET_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const Frame1Icon: React.FC = () => {
  const frame = useCurrentFrame();

  // Outside the icon's lifetime — don't render at all.
  if (
    frame < T_SCENE2.f1BracketsStart - 1 ||
    frame > T_SCENE2.f1FadeOut.end
  ) {
    return null;
  }

  // Outer fade-out as Frame 2 begins to take over.
  const outerOpacity =
    frame < T_SCENE2.f1FadeOut.start
      ? 1
      : interpolate(
          frame,
          [T_SCENE2.f1FadeOut.start, T_SCENE2.f1FadeOut.end],
          [1, 0],
          {
            easing: SOFT_OUT,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }
        );
  if (outerOpacity <= 0.001) return null;

  // Bracket slide progress (0 = off-screen, 1 = settled in place).
  const bracketProg = interpolate(
    frame,
    [T_SCENE2.f1BracketsStart, T_SCENE2.f1BracketsEnd],
    [0, 1],
    {
      easing: BRACKET_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const ltOffset = (1 - bracketProg) * -SLIDE_OFFSET;
  const gtOffset = (1 - bracketProg) * SLIDE_OFFSET;

  // Slash drops in from above, lagging slightly behind the brackets.
  const slashProg = interpolate(
    frame,
    [T_SCENE2.f1SlashStart, T_SCENE2.f1SlashEnd],
    [0, 1],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const slashOffsetY = (1 - slashProg) * -SLASH_DROP;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: CARD.w,
        height: CARD.h,
        opacity: outerOpacity,
        pointerEvents: "none",
      }}
    >
      <svg
        width={CARD.w}
        height={CARD.h}
        viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}
        style={{ display: "block" }}
      >
        {/* < bracket — slides in from the left */}
        <g
          transform={`translate(${ltOffset}, 0)`}
          opacity={bracketProg}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d={LEFT_BRACKET_PATH}
            stroke="#DDE6FF"
            strokeWidth={8}
            fill="none"
          />
        </g>
        {/* > bracket — slides in from the right */}
        <g
          transform={`translate(${gtOffset}, 0)`}
          opacity={bracketProg}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d={RIGHT_BRACKET_PATH}
            stroke="#DDE6FF"
            strokeWidth={8}
            fill="none"
          />
        </g>
        {/* / slash — drops in from above */}
        <g
          transform={`translate(0, ${slashOffsetY})`}
          opacity={slashProg}
          strokeLinecap="round"
        >
          <path
            d={SLASH_PATH}
            stroke="#DDE6FF"
            strokeWidth={8}
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Frame 2 — code editor
 *
 * File tree (left) | vertical separator | gutter dots + code lines (right).
 * All elements ride a shared visibility prop, so the whole frame fades in
 * and out as one unit. Coordinates lifted directly from the SVG.
 * ════════════════════════════════════════════════════════════════════════ */

// Files in the left tree (small skeleton rects, varying widths to suggest
// different filename lengths / nesting indent).
const FILE_TREE_FILES = [
  { x: 568, y: 193, w: 52 },
  { x: 574, y: 203, w: 46 },
  { x: 574, y: 213, w: 45 },
  { x: 574, y: 223, w: 45 },
  { x: 568, y: 233, w: 52 },
  { x: 568, y: 243, w: 52 },
  { x: 568, y: 253, w: 52 },
  { x: 568, y: 263, w: 52 },
];

// Folder-collapse chevrons (tiny `>` glyphs) — paths verbatim from the SVG.
const FILE_TREE_CHEVRONS = [
  "M565.386 195.237L563.5 197.123L563.029 196.651L564.679 195.001L563.029 193.351L563.5 192.88L565.386 194.766C565.448 194.828 565.483 194.913 565.483 195.001C565.483 195.09 565.448 195.174 565.386 195.237Z",
  "M565.386 235.237L563.5 237.123L563.029 236.651L564.679 235.001L563.029 233.351L563.5 232.88L565.386 234.766C565.448 234.828 565.483 234.913 565.483 235.001C565.483 235.09 565.448 235.174 565.386 235.237Z",
  "M571.386 205.237L569.5 207.123L569.029 206.651L570.679 205.001L569.029 203.351L569.5 202.88L571.386 204.766C571.448 204.828 571.483 204.913 571.483 205.001C571.483 205.09 571.448 205.174 571.386 205.237Z",
];

// Gutter dots (line-number indicators) at fixed x=642, varying y.
const GUTTER_DOTS_Y = [
  199, 211, 223, 235, 247, 259, 271, 283, 295, 307, 319, 331, 343, 355, 367,
  379, 391, 403, 415, 427, 439, 451, 463, 475,
];

// Code lines — varying x and width, all at y stride 12 from 214 to 406.
const CODE_LINES = [
  { x: 655, y: 214, w: 174 },
  { x: 681, y: 226, w: 163 },
  { x: 668, y: 238, w: 152 },
  { x: 661, y: 250, w: 216 },
  { x: 681, y: 262, w: 191 },
  { x: 694, y: 274, w: 174 },
  { x: 706, y: 286, w: 158 },
  { x: 668, y: 298, w: 194 },
  { x: 657, y: 310, w: 161 },
  { x: 673, y: 322, w: 163 },
  { x: 660, y: 334, w: 152 },
  { x: 653, y: 346, w: 216 },
  { x: 674, y: 358, w: 180 },
  { x: 690, y: 370, w: 172 },
  { x: 678, y: 382, w: 199 },
  { x: 671, y: 394, w: 215 },
  { x: 661, y: 406, w: 230 },
];

// Two tiny inline `</>` glyphs decorating the code area (top + bottom).
const INLINE_CODE_GLYPHS = [
  "M659.083 206.667L662.583 195M663.75 203.75L666.667 200.833L663.75 197.917M657.917 203.75L655 200.833L657.917 197.917",
  "M664.083 430.667L667.583 419M668.75 427.75L671.667 424.833L668.75 421.917M662.917 427.75L660 424.833L662.917 421.917",
];

const Frame2CodeEditor: React.FC = () => {
  const frame = useCurrentFrame();

  // Out of frame's lifetime — don't render.
  if (
    frame < T_SCENE2.f2StructureFadeIn.start - 1 ||
    frame > T_SCENE2.f2FadeOut.end
  ) {
    return null;
  }

  // Outer fade-out as Frame 3 begins to take over.
  const outerOpacity =
    frame < T_SCENE2.f2FadeOut.start
      ? 1
      : interpolate(
          frame,
          [T_SCENE2.f2FadeOut.start, T_SCENE2.f2FadeOut.end],
          [1, 0],
          {
            easing: SOFT_OUT,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }
        );
  if (outerOpacity <= 0.001) return null;

  // Structure (file tree, separator, gutter dots, file-name rects, chevrons)
  // fades in as a single group — the "editor opens".
  const structureVis = interpolate(
    frame,
    [T_SCENE2.f2StructureFadeIn.start, T_SCENE2.f2StructureFadeIn.end],
    [0, 1],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Inline `</>` glyphs decorating the code — fade in last.
  const glyphsVis = interpolate(
    frame,
    [T_SCENE2.f2GlyphsFadeIn.start, T_SCENE2.f2GlyphsFadeIn.end],
    [0, 1],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: outerOpacity,
        pointerEvents: "none",
      }}
    >
      {/* Vertical separator between file tree and code area */}
      <div
        style={{
          position: "absolute",
          left: lx(630.25),
          top: ly(180),
          width: 0.5,
          height: 313,
          background: "#E8E8E8",
          opacity: structureVis,
        }}
      />

      {/* File tree — file-name skeleton rects */}
      {FILE_TREE_FILES.map((f, i) => (
        <div
          key={`f-${i}`}
          style={{
            position: "absolute",
            left: lx(f.x),
            top: ly(f.y),
            width: f.w,
            height: 4,
            background: "#D8D8D8",
            borderRadius: 1,
            opacity: structureVis,
          }}
        />
      ))}

      {/* File tree — folder-collapse chevrons */}
      <svg
        width={CARD.w}
        height={CARD.h}
        viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}
        style={{ position: "absolute", left: 0, top: 0, opacity: structureVis }}
      >
        {FILE_TREE_CHEVRONS.map((d, i) => (
          <path key={`chev-${i}`} d={d} fill="#DDE6FF" />
        ))}
      </svg>

      {/* Gutter dots (line-number indicators) — base 0.4 opacity in source. */}
      {GUTTER_DOTS_Y.map((y, i) => (
        <div
          key={`g-${i}`}
          style={{
            position: "absolute",
            left: lx(642),
            top: ly(y),
            width: 4,
            height: 4,
            background: "#D8D8D8",
            opacity: structureVis * 0.4,
            borderRadius: 2,
          }}
        />
      ))}

      {/* Code lines — each types in left-to-right (width grows from 0)
          with a per-line stagger. Reads as "code being written". */}
      {CODE_LINES.map((l, i) => {
        const lineStart =
          T_SCENE2.f2CodeLinesStart + i * T_SCENE2.f2CodeLinesStagger;
        const lineEnd = lineStart + T_SCENE2.f2CodeLineDuration;
        const progress = interpolate(frame, [lineStart, lineEnd], [0, 1], {
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        if (progress <= 0.001) return null;
        const animatedWidth = l.w * progress;
        return (
          <div
            key={`l-${i}`}
            style={{
              position: "absolute",
              left: lx(l.x),
              top: ly(l.y),
              width: animatedWidth,
              height: 4,
              background: "#D8D8D8",
              borderRadius: 1,
            }}
          />
        );
      })}

      {/* Inline `</>` glyphs — appear last, anchoring the "this is code" cue. */}
      <svg
        width={CARD.w}
        height={CARD.h}
        viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}
        style={{ position: "absolute", left: 0, top: 0, opacity: glyphsVis }}
      >
        {INLINE_CODE_GLYPHS.map((d, i) => (
          <path key={`glyph-${i}`} d={d} stroke="#DDE6FF" fill="none" />
        ))}
      </svg>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Frame 3 — project board (kanban + bar chart + donut)
 *
 * Sub-stagger across visibility:
 *   visibility 0.0 → 0.3   : outer board + header bar appear
 *   visibility 0.15 → 0.45 : sidebar appears
 *   visibility 0.35 → 0.7  : 5 light-blue cards appear
 *   visibility 0.55 → 0.85 : white title/subtitle labels inside cards
 *   visibility 0.7 → 1.0   : bar chart bars grow from baseline
 *   visibility 0.75 → 1.0  : donut chart accent arc sweeps in 0 → 90°
 *
 * Reads as "the dashboard being assembled" — never popping in fully formed.
 * ════════════════════════════════════════════════════════════════════════ */

const KANBAN_CARDS = [
  // Top row (3 small cards)
  { x: 634, y: 253, w: 79, h: 45 },
  { x: 720, y: 253, w: 79, h: 45 },
  { x: 806, y: 253, w: 79, h: 45 },
  // Bottom row (2 large cards)
  { x: 634, y: 303, w: 127, h: 126 },
  { x: 768, y: 303, w: 117, h: 126 },
];

// Bar chart bars inside the bottom-left card. Each grows from its baseline
// (y + h) up to its full height as bars-visibility goes 0 → 1.
const KANBAN_BAR_CHART_BARS = [
  { x: 648, y: 396, h: 26 },
  { x: 666, y: 379, h: 43 },
  { x: 684, y: 371, h: 51 },
  { x: 702, y: 348, h: 74 },
  { x: 720, y: 396, h: 26 },
  { x: 738, y: 348, h: 74 },
];

const KANBAN_LABELS = [
  // Title labels (white, 5px tall)
  { x: 640, y: 260, w: 54, h: 5 },
  { x: 726, y: 260, w: 54, h: 5 },
  { x: 814, y: 260, w: 54, h: 5 },
  { x: 797, y: 401, w: 59, h: 4 },
  // Subtitle labels (smaller)
  { x: 640, y: 269, w: 36, h: 5 },
  { x: 726, y: 269, w: 36, h: 5 },
  { x: 814, y: 269, w: 36, h: 5 },
  { x: 807, y: 409, w: 39, h: 4 },
];

// Donut chart geometry (centered around (826.5, 357.5), stroke width ~6.35
// for a ring that matches the source SVG's filled-path proportions).
const DONUT = { cx: 826.5, cy: 357.5, r: 26.325, strokeW: 6.35 };

// Sparkline points for the top-right card — a small upward-trending zigzag
// that hints at "metric over time". Drawn with the accent blue and a tiny
// rounded join so it reads as a polished trendline rather than a dumb
// polyline. Coords are in absolute SVG space.
const SPARKLINE_POINTS = "815,287 824,281 834,285 843,278 852,283 862,280 872,285 882,282";

const Frame3Kanban: React.FC = () => {
  const frame = useCurrentFrame();

  // Trapezoidal envelope: fade-in then fade-out for Scene 3 transition.
  const visibility = interpolate(
    frame,
    [
      T_SCENE2.f3FadeIn.start,
      T_SCENE2.f3FadeIn.end,
      T_SCENE2.f3FadeOut.start,
      T_SCENE2.f3FadeOut.end,
    ],
    [0, 1, 1, 0],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  if (visibility <= 0.001) return null;

  const subVis = (start: number, end: number) =>
    interpolate(visibility, [start, end], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // Sub-stagger phases — each kanban element class appears in sequence, so
  // the dashboard reads as "being assembled" rather than popping in whole.
  const outerVis = subVis(0, 0.3);
  const sidebarVis = subVis(0.15, 0.45);
  const cardsVis = subVis(0.35, 0.7);
  const labelsVis = subVis(0.55, 0.85);
  const sparklineVis = subVis(0.7, 0.9);
  const donutVis = subVis(0.75, 1);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* Outer board */}
      <div
        style={{
          position: "absolute",
          left: lx(561),
          top: ly(233),
          width: 330,
          height: 204,
          background: "#F2F2F2",
          opacity: outerVis,
          borderRadius: 2,
        }}
      />

      {/* Header bar (drawn on top of the outer board) */}
      <div
        style={{
          position: "absolute",
          left: lx(561),
          top: ly(233),
          width: 330,
          height: 15,
          background: "#D8D8D8",
          opacity: outerVis,
          borderRadius: 1,
        }}
      />

      {/* Left sidebar */}
      <div
        style={{
          position: "absolute",
          left: lx(561),
          top: ly(244),
          width: 67,
          height: 193,
          background: "#E8E8E8",
          opacity: sidebarVis,
          borderRadius: 1,
        }}
      />

      {/* Cards */}
      {KANBAN_CARDS.map((c, i) => (
        <div
          key={`c-${i}`}
          style={{
            position: "absolute",
            left: lx(c.x),
            top: ly(c.y),
            width: c.w,
            height: c.h,
            background: "#D6E0FD",
            opacity: cardsVis,
            borderRadius: 1,
          }}
        />
      ))}

      {/* Labels (titles + subtitles inside cards) */}
      {KANBAN_LABELS.map((l, i) => (
        <div
          key={`la-${i}`}
          style={{
            position: "absolute",
            left: lx(l.x),
            top: ly(l.y),
            width: l.w,
            height: l.h,
            background: "#FFFFFF",
            opacity: labelsVis,
            borderRadius: 1,
          }}
        />
      ))}

      {/* Bar chart bars — each grows from its baseline with a small
          per-bar stagger (≈0.025 of visibility per index), so the bars
          enter as a wave rather than all at once. */}
      {KANBAN_BAR_CHART_BARS.map((b, i) => {
        const barIndivVis = interpolate(
          visibility,
          [0.7 + i * 0.025, 0.85 + i * 0.025],
          [0, 1],
          {
            easing: SOFT_OUT,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }
        );
        const grownH = b.h * barIndivVis;
        return (
          <div
            key={`b-${i}`}
            style={{
              position: "absolute",
              left: lx(b.x),
              top: ly(b.y + b.h - grownH),
              width: 10,
              height: grownH,
              background: "#FFFFFF",
              opacity: barIndivVis,
              borderRadius: 1,
            }}
          />
        );
      })}

      {/* Sparkline trendline in the top-right card + donut chart in the
          bottom-right card, drawn together in one SVG layer. */}
      <svg
        width={CARD.w}
        height={CARD.h}
        viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {/* Sparkline — small upward-trending zigzag inside top-right card */}
        <polyline
          points={SPARKLINE_POINTS}
          stroke="#85A1F8"
          strokeWidth={1.5}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={sparklineVis}
        />

        {/* Donut chart background ring (full white circle) */}
        <circle
          cx={DONUT.cx}
          cy={DONUT.cy}
          r={DONUT.r}
          stroke="#FFFFFF"
          strokeWidth={DONUT.strokeW}
          fill="none"
          opacity={donutVis}
        />

        {/* Donut chart accent arc — sweeps 0° → 90° as donutVis goes 0 → 1.
            pathLength=100 normalises dasharray to % of circumference, so
            "25" = 25% of circle = 90° quarter arc. */}
        <circle
          cx={DONUT.cx}
          cy={DONUT.cy}
          r={DONUT.r}
          stroke="#85A1F8"
          strokeWidth={DONUT.strokeW}
          fill="none"
          pathLength={100}
          strokeDasharray={`${25 * donutVis} 100`}
          strokeLinecap="butt"
          transform={`rotate(-90 ${DONUT.cx} ${DONUT.cy})`}
        />
      </svg>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Scene 2 work area — orchestrates Frame 1 → Frame 2 → Frame 3.
 *
 * Each frame is fully self-managing — it reads useCurrentFrame() itself,
 * decides when to render based on T_SCENE2's per-frame timings, and
 * computes its own internal stagger. Scene2WorkArea is just a mount point.
 * ════════════════════════════════════════════════════════════════════════ */
export const Scene2WorkArea: React.FC = () => {
  return (
    <>
      <Frame1Icon />
      <Frame2CodeEditor />
      <Frame3Kanban />
    </>
  );
};
