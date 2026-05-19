import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { CARD } from "../BannerStage";

/* ────────────────────────────────────────────────────────────────────────────
 * Scene 2 — Software Development (FAST / Option A).
 *
 * Compression strategy: instead of speeding everything up (which loses
 * smoothness), we EDIT — cut the weakest beat and trim decoration:
 *
 *   ✂  Frame 1 (`</>` icon) — REMOVED.
 *      The macOS chrome + footer text already label this as software dev;
 *      the title-card icon was redundant.
 *
 *   ✂  Inline `</>` glyphs in the code editor — REMOVED.
 *      Pure decoration; nobody saw them.
 *
 *   ✂  Sparkline in top-right kanban card — REMOVED.
 *      Donut chart already carries the "metrics" semantic with motion.
 *
 *   ↓  17 code lines → 12 (drop 5, keeping varied widths). Visual gaps
 *      now read as natural "blank lines" in code.
 *
 *   ↓  6 bar-chart bars → 4 (keep alternating heights for rhythm).
 *
 *   ↓  6 kanban sub-phases → 3 phases:
 *        Phase A (0.00–0.40): board + header + sidebar (container)
 *        Phase B (0.30–0.70): cards + labels         (content)
 *        Phase C (0.60–1.00): bars + donut           (data)
 *
 * Per-element easing durations are kept ≥ 6 frames so motion still reads
 * eased, not snappy.
 *
 * This file is a PARALLEL preview component; the original Scene2SD.tsx is
 * untouched (still used by the main `Banner` composition).
 * ──────────────────────────────────────────────────────────────────────── */

/* ── Timing (frames inside the combined Fast banner composition) ─────────
 *
 * Scene 1 Fast ends fade-out at frame 150 (paper/lines/sparkle gone).
 * Scene 2 starts overlapping during S1's tail so the bridge feels woven.
 * ──────────────────────────────────────────────────────────────────────── */
export const T_SCENE2_FAST = {
  // Chrome — macOS window controls fade in during the bridge (overlaps
  // with the tail of Scene 1's fade-out).
  headerFadeIn: { start: 140, end: 170 },

  // Frame 2 — code editor.  Structure (file tree + separator + gutter) fades
  // in as a group, then 12 code lines type in left-to-right.
  f2StructureFadeIn: { start: 165, end: 195 },
  f2CodeLinesStart: 190,
  f2CodeLinesStagger: 3,
  f2CodeLineDuration: 6,
  // 12 lines × 3 stagger + 6 dur → last line ends at 190 + 11*3 + 6 = 229
  f2FadeOut: { start: 240, end: 265 },

  // Frame 3 — kanban dashboard. Single fade-in window driving 3 sub-phases.
  f3FadeIn: { start: 250, end: 295 },
  // Hold to end of composition (no internal fade-out in this preview).
  f3HoldEnd: 315,
} as const;

export const SCENE2_SD_FAST_DURATION = T_SCENE2_FAST.f3HoldEnd;

/* ── Easing ──────────────────────────────────────────────────────────── */
const SOFT_OUT = Easing.bezier(0.32, 0.72, 0.37, 1);
const MATERIAL_STD = Easing.bezier(0.4, 0, 0.2, 1);

/* ── Helpers ─────────────────────────────────────────────────────────── */
const lx = (x: number) => x - CARD.x;
const ly = (y: number) => y - CARD.y;

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
 * Scene 2 Fast chrome — macOS window controls + title bar
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

export const Scene2FastHeader: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = envelope(frame, T_SCENE2_FAST.headerFadeIn);
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
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Frame 2 — code editor (12 lines, no inline glyphs)
 * ════════════════════════════════════════════════════════════════════════ */

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

const FILE_TREE_CHEVRONS = [
  "M565.386 195.237L563.5 197.123L563.029 196.651L564.679 195.001L563.029 193.351L563.5 192.88L565.386 194.766C565.448 194.828 565.483 194.913 565.483 195.001C565.483 195.09 565.448 195.174 565.386 195.237Z",
  "M565.386 235.237L563.5 237.123L563.029 236.651L564.679 235.001L563.029 233.351L563.5 232.88L565.386 234.766C565.448 234.828 565.483 234.913 565.483 235.001C565.483 235.09 565.448 235.174 565.386 235.237Z",
  "M571.386 205.237L569.5 207.123L569.029 206.651L570.679 205.001L569.029 203.351L569.5 202.88L571.386 204.766C571.448 204.828 571.483 204.913 571.483 205.001C571.483 205.09 571.448 205.174 571.386 205.237Z",
];

const GUTTER_DOTS_Y = [
  199, 211, 223, 235, 247, 259, 271, 283, 295, 307, 319, 331, 343, 355, 367,
  379, 391, 403, 415, 427, 439, 451, 463, 475,
];

// 12 code lines — picked from the original 17 with strategic drops so the
// remaining lines have visual gaps that read as natural "blank rows" /
// paragraph breaks in code. Dropped original indices: 4, 8, 12, 13, 16.
const CODE_LINES = [
  { x: 655, y: 214, w: 174 },
  { x: 681, y: 226, w: 163 },
  { x: 668, y: 238, w: 152 },
  { x: 661, y: 250, w: 216 },
  { x: 694, y: 274, w: 174 },
  { x: 706, y: 286, w: 158 },
  { x: 668, y: 298, w: 194 },
  { x: 673, y: 322, w: 163 },
  { x: 660, y: 334, w: 152 },
  { x: 653, y: 346, w: 216 },
  { x: 690, y: 370, w: 172 },
  { x: 678, y: 382, w: 199 },
];

const Frame2CodeEditor: React.FC = () => {
  const frame = useCurrentFrame();

  if (
    frame < T_SCENE2_FAST.f2StructureFadeIn.start - 1 ||
    frame > T_SCENE2_FAST.f2FadeOut.end
  ) {
    return null;
  }

  const outerOpacity =
    frame < T_SCENE2_FAST.f2FadeOut.start
      ? 1
      : interpolate(
          frame,
          [T_SCENE2_FAST.f2FadeOut.start, T_SCENE2_FAST.f2FadeOut.end],
          [1, 0],
          {
            easing: SOFT_OUT,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }
        );
  if (outerOpacity <= 0.001) return null;

  const structureVis = interpolate(
    frame,
    [T_SCENE2_FAST.f2StructureFadeIn.start, T_SCENE2_FAST.f2StructureFadeIn.end],
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

      {/* Gutter dots */}
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

      {/* Code lines — each types in left-to-right */}
      {CODE_LINES.map((l, i) => {
        const lineStart =
          T_SCENE2_FAST.f2CodeLinesStart + i * T_SCENE2_FAST.f2CodeLinesStagger;
        const lineEnd = lineStart + T_SCENE2_FAST.f2CodeLineDuration;
        const progress = interpolate(frame, [lineStart, lineEnd], [0, 1], {
          easing: MATERIAL_STD,
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
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Frame 3 — kanban dashboard (no sparkline; 4 bars; 3 sub-phases)
 * ════════════════════════════════════════════════════════════════════════ */

const KANBAN_CARDS = [
  { x: 634, y: 253, w: 79, h: 45 },
  { x: 720, y: 253, w: 79, h: 45 },
  { x: 806, y: 253, w: 79, h: 45 },
  { x: 634, y: 303, w: 127, h: 126 },
  { x: 768, y: 303, w: 117, h: 126 },
];

// 4 bars — evenly spaced across the same visual area (stride 30 from x=648
// to x=738), centered within the bottom-left card (x 634→761).
const KANBAN_BAR_CHART_BARS = [
  { x: 648, y: 396, h: 26 },
  { x: 678, y: 379, h: 43 },
  { x: 708, y: 348, h: 74 },
  { x: 738, y: 348, h: 74 },
];

const KANBAN_LABELS = [
  { x: 640, y: 260, w: 54, h: 5 },
  { x: 726, y: 260, w: 54, h: 5 },
  { x: 814, y: 260, w: 54, h: 5 },
  { x: 797, y: 401, w: 59, h: 4 },
  { x: 640, y: 269, w: 36, h: 5 },
  { x: 726, y: 269, w: 36, h: 5 },
  { x: 814, y: 269, w: 36, h: 5 },
  { x: 807, y: 409, w: 39, h: 4 },
];

const DONUT = { cx: 826.5, cy: 357.5, r: 26.325, strokeW: 6.35 };

const Frame3Kanban: React.FC = () => {
  const frame = useCurrentFrame();

  // No internal fade-out — composition ends with kanban visible.
  const visibility = interpolate(
    frame,
    [T_SCENE2_FAST.f3FadeIn.start, T_SCENE2_FAST.f3FadeIn.end],
    [0, 1],
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

  // Three sub-phases — collapsed from the original six.
  //   Phase A : container chrome (board + header + sidebar)
  //   Phase B : content        (cards + labels)
  //   Phase C : data           (bars + donut)
  const containerVis = subVis(0, 0.4);
  const contentVis = subVis(0.3, 0.7);
  const dataVis = subVis(0.6, 1);

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
          opacity: containerVis,
          borderRadius: 2,
        }}
      />

      {/* Header bar */}
      <div
        style={{
          position: "absolute",
          left: lx(561),
          top: ly(233),
          width: 330,
          height: 15,
          background: "#D8D8D8",
          opacity: containerVis,
          borderRadius: 1,
        }}
      />

      {/* Sidebar — aligned with cards (top of first row → bottom of second row);
          recoloured to the widget blue for visual consistency with the cards. */}
      <div
        style={{
          position: "absolute",
          left: lx(561),
          top: ly(253),
          width: 67,
          height: 176,
          background: "#D6E0FD",
          opacity: containerVis,
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
            opacity: contentVis,
            borderRadius: 1,
          }}
        />
      ))}

      {/* Labels */}
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
            opacity: contentVis,
            borderRadius: 1,
          }}
        />
      ))}

      {/* Bar chart — tiny per-bar stagger inside the data phase for rhythm */}
      {KANBAN_BAR_CHART_BARS.map((b, i) => {
        const barIndivVis = interpolate(
          visibility,
          [0.6 + i * 0.04, 0.85 + i * 0.04],
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

      {/* Donut chart — signature 0°→90° sweep */}
      <svg
        width={CARD.w}
        height={CARD.h}
        viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <circle
          cx={DONUT.cx}
          cy={DONUT.cy}
          r={DONUT.r}
          stroke="#FFFFFF"
          strokeWidth={DONUT.strokeW}
          fill="none"
          opacity={dataVis}
        />
        <circle
          cx={DONUT.cx}
          cy={DONUT.cy}
          r={DONUT.r}
          stroke="#85A1F8"
          strokeWidth={DONUT.strokeW}
          fill="none"
          pathLength={100}
          strokeDasharray={`${25 * dataVis} 100`}
          strokeLinecap="butt"
          transform={`rotate(-90 ${DONUT.cx} ${DONUT.cy})`}
        />
      </svg>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Scene 2 Fast work area
 * ════════════════════════════════════════════════════════════════════════ */
export const Scene2SDFastWorkArea: React.FC = () => {
  return (
    <>
      <Frame2CodeEditor />
      <Frame3Kanban />
    </>
  );
};
