import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { CARD } from "../BannerStage";

/* ────────────────────────────────────────────────────────────────────────────
 * Scene 3 — Staffing / Precision Hiring (FAST / Option A).
 *
 * Compression strategy (same philosophy as Scene 2 Fast — edit, don't rush):
 *
 *   ✂  Frame 1 (single-card "searching" preview) — REMOVED.
 *      Original ran a 1-card preview before the 4-card cascade. The cascade
 *      itself already reads as a search resolving; the preview was redundant.
 *
 *   ✂  Magnifying-glass overlay on Card 3 — REMOVED.
 *      The blue checkmark in the selection chip already says "matched".
 *      The avatar-overlay magnifier was double-signalling.
 *
 *   ↓  Cascade stagger 14→8, per-card duration 28→18.  4 cards finish in
 *      4×8 + 18 = 50f (was 4×14 + 28 = 84f).
 *
 *   ↓  Selection cues window 35f → 25f.
 *
 *   ↓  F3 fade-ins: circle 50f→30f, checkmark 40f→25f (overlaps circle),
 *      labels 40f→25f.  Together: ~70f of F3 motion (was ~95f).
 *
 * Per-element easing durations stay ≥ 18f (cards) / 25f (success beats) so
 * motion still reads eased.  This file is a PARALLEL preview component;
 * Scene3Staffing.tsx remains the canonical Banner-composition source.
 * ──────────────────────────────────────────────────────────────────────── */

/* ── Timing (frames inside the combined Fast banner composition) ─────────
 *
 * Scene 2 Fast holds through ~315.  Scene 3 chrome and footer transition
 * begin during the S2 tail so the bridge feels woven, mirroring how Scene 2
 * overlapped Scene 1's tail.
 * ──────────────────────────────────────────────────────────────────────── */
export const T_SCENE3_FAST = {
  // Chrome — nav rects + search bar fade in as the macOS dots fade out.
  headerFadeIn: { start: 325, end: 355 },

  // Search-bar text "Precision Hiring" — fades in alongside the footer
  // typing the same words (footer s3WriteStart=345, dur=36 → ends 381).
  searchTextFadeIn: { start: 345, end: 381 },

  // 4 cards cascade in from the top of the list (no F1 preview).
  cardsCascadeStart: 340,
  cardsCascadeStagger: 8,
  cardsCascadeDuration: 18,
  // 4 cards × 8 + 18 → last card ends at 340 + 3*8 + 18 = 382

  // Per-card zoom pulse — each card briefly scales up after appearance.
  // Pulse starts at appearance-end and runs 10 frames. The cascade reads
  // as a sequential "scan" across the list.
  //   Card 0: pulse 358–368
  //   Card 1: pulse 366–376
  //   Card 2: pulse 374–384
  //   Card 3: pulse 382–392  (last pulse done at frame 392)
  cardPulseDuration: 10,
  cardPulsePeakScale: 1.06,

  // Selection cue (checkmark only) on Card 3 — waits until all 4 pulses
  // complete (scan finishes) before the match is committed.
  selectionCue: { start: 393, end: 406 },

  // Cards fade out → success state takes over.
  cardsFadeOut: { start: 410, end: 428 },

  // Frame 3 — success state.
  f3CircleFadeIn: { start: 415, end: 445 },
  f3CheckmarkFadeIn: { start: 440, end: 465 },
  f3LabelsFadeIn: { start: 460, end: 485 },

  // Hold to end of composition.
  holdEnd: 490,
} as const;

export const SCENE3_SD_FAST_DURATION = T_SCENE3_FAST.holdEnd;

/* ── Easing ──────────────────────────────────────────────────────────── */
const SOFT_OUT = Easing.bezier(0.32, 0.72, 0.37, 1);
const OVERSHOOT = Easing.bezier(0.34, 1.4, 0.64, 1);
const EASE_IN_OUT = Easing.bezier(0.45, 0, 0.55, 1);

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
 * Scene 3 chrome — top nav rects + search bar.
 *
 * Same shape and position as the canonical Scene 3 — just retimed.
 * ════════════════════════════════════════════════════════════════════════ */
export const Scene3FastHeader: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = envelope(frame, T_SCENE3_FAST.headerFadeIn);
  if (opacity <= 0.001) return null;

  const searchTextVis = envelope(frame, T_SCENE3_FAST.searchTextFadeIn);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        pointerEvents: "none",
      }}
    >
      {/* Top nav rects — left rect shifted to x=567 so its padding from
       *  the centered grey panel matches the right rect's right padding. */}
      <div
        style={{
          position: "absolute",
          left: lx(567),
          top: ly(154),
          width: 105,
          height: 15,
          background: "#FFFFFF",
          borderRadius: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: lx(832),
          top: ly(154),
          width: 53,
          height: 15,
          background: "#FFFFFF",
          borderRadius: 2,
        }}
      />

      {/* Search bar (white pill) */}
      <div
        style={{
          position: "absolute",
          left: lx(562),
          top: ly(195),
          width: 167,
          height: 18,
          background: "#FFFFFF",
          borderRadius: 2,
        }}
      />

      {/* Magnifier icon (kept in SVG for the small stroke detail) */}
      <svg
        width={CARD.w}
        height={CARD.h}
        viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <circle
          cx={575}
          cy={203}
          r={3.5}
          stroke="#BABABA"
          strokeWidth={1}
          fill="none"
        />
        <path
          d="M577.5 205.5 L580.5 208.5"
          stroke="#BABABA"
          strokeWidth={1}
          strokeLinecap="round"
        />
      </svg>

      {/* Search-bar text — fades in alongside the footer typing
          "Precision Hiring". Vertically centered to the search bar
          and left-aligned just after the magnifier icon. */}
      <div
        style={{
          position: "absolute",
          left: lx(586),
          top: ly(195),
          width: 167 - (586 - 562),
          height: 18,
          display: "flex",
          alignItems: "center",
          fontFamily: "Inter, sans-serif",
          fontSize: 9,
          fontWeight: 500,
          color: "#9AA3B8",
          letterSpacing: -0.05,
          opacity: searchTextVis,
        }}
      >
        ServiceNow Developer
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Person avatar — simplified silhouette (identical to canonical Scene 3)
 * ════════════════════════════════════════════════════════════════════════ */
const PersonAvatar: React.FC<{
  cx: number;
  cy: number;
  bgColor?: string;
  clipId: string;
}> = ({ cx, cy, bgColor = "#B9C4E1", clipId }) => (
  <g>
    <defs>
      <clipPath id={clipId}>
        <circle cx={cx} cy={cy} r={15} />
      </clipPath>
    </defs>
    <circle cx={cx} cy={cy} r={15} fill={bgColor} />
    <g clipPath={`url(#${clipId})`}>
      <circle cx={cx} cy={cy - 3} r={5} fill="white" />
      <ellipse cx={cx} cy={cy + 11} rx={10} ry={7} fill="white" />
    </g>
  </g>
);

/* ════════════════════════════════════════════════════════════════════════
 * Candidate row — light-blue card + avatar + name/role labels
 *
 * Geometry identical to the canonical Scene 3 (60px vertical stride).
 * ════════════════════════════════════════════════════════════════════════ */
const CARD_X = 560;
const CARD_W = 330;
const CARD_H = 53;
const CARD_BASE_Y = 221;
const CARD_VERTICAL_STRIDE = 60;
const AVATAR_CX = 584;
const AVATAR_BASE_CY = 248;

const PersonCard: React.FC<{
  index: number; // 0, 1, 2, 3
  opacity: number;
  pulseScale: number;
  scanVis: number;
  clipPrefix?: string;
}> = ({ index, opacity, pulseScale, scanVis, clipPrefix = "fast" }) => {
  if (opacity <= 0.001) return null;
  const cardY = CARD_BASE_Y + index * CARD_VERTICAL_STRIDE;
  // Avatar position in card-local coords (so the avatar SVG can use the
  // card-sized viewBox and scale together with the card body when the
  // pulse transform is applied to the outer container).
  const avLocalX = AVATAR_CX - CARD_X; // 24
  const avLocalY = AVATAR_BASE_CY - CARD_BASE_Y; // 27
  return (
    <div
      style={{
        position: "absolute",
        left: lx(CARD_X),
        top: ly(cardY),
        width: CARD_W,
        height: CARD_H,
        opacity,
        transform: `scale(${pulseScale})`,
        transformOrigin: "50% 50%",
      }}
    >
      {/* Card body */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#F1F4FF",
          borderRadius: 2,
        }}
      />
      {/* Avatar + magnifier scan overlay (in the same SVG so they scale
          together with the card's pulse transform). overflow:visible lets
          the magnifier handle extend just outside the card box. */}
      <svg
        width={CARD_W}
        height={CARD_H}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        <PersonAvatar
          cx={avLocalX}
          cy={avLocalY}
          clipId={`${clipPrefix}-avatar-clip-${index}`}
        />
        {/* Magnifying-glass scan — circle ring + short handle going
            down-right from the bottom-right of the avatar. Fades in/out
            with the card's pulse window. */}
        {scanVis > 0.001 ? (
          <g opacity={scanVis}>
            <circle
              cx={avLocalX}
              cy={avLocalY}
              r={18}
              stroke="#BABABA"
              strokeWidth={1.5}
              fill="none"
            />
            <path
              d={`M${avLocalX + 13} ${avLocalY + 13} L${avLocalX + 21} ${avLocalY + 21}`}
              stroke="#BABABA"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </g>
        ) : null}
      </svg>
      {/* Name label */}
      <div
        style={{
          position: "absolute",
          left: 610 - CARD_X,
          top: 17,
          width: 191,
          height: 6,
          background: "#D8D8D8",
          borderRadius: 1,
        }}
      />
      {/* Role label */}
      <div
        style={{
          position: "absolute",
          left: 610 - CARD_X,
          top: 30,
          width: 162,
          height: 6,
          background: "#D8D8D8",
          borderRadius: 1,
        }}
      />
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Selection cue on Card 3 — checkmark in selection chip only.
 *
 * Magnifier overlay dropped (was double-signalling vs. the blue check).
 * ════════════════════════════════════════════════════════════════════════ */
const Card3SelectionCue: React.FC<{ visibility: number }> = ({ visibility }) => {
  if (visibility <= 0.001) return null;
  return (
    <svg
      width={CARD.w}
      height={CARD.h}
      viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        opacity: visibility,
      }}
    >
      {/* Selection box outline (right edge of Card 3) */}
      <path
        d="M870.375 361.125 H859.125 V376.875 H874.875 V371.625"
        stroke="#D8D8D8"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Blue checkmark inside the box */}
      <path
        d="M863.875 368.625 L867.625 372.375 L876.625 362.625"
        stroke="#5C81F5"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Frame 3 — success state (big blue circle + checkmark + labels)
 * ════════════════════════════════════════════════════════════════════════ */
const SUCCESS_CIRCLE = { cx: 727, cy: 319, r: 40 };

const Frame3Success: React.FC = () => {
  const frame = useCurrentFrame();

  const circleVis = envelope(frame, T_SCENE3_FAST.f3CircleFadeIn);
  if (circleVis <= 0.001) return null;

  const checkmarkVis = envelope(frame, T_SCENE3_FAST.f3CheckmarkFadeIn);
  const labelsVis = envelope(frame, T_SCENE3_FAST.f3LabelsFadeIn);

  const circleScale = interpolate(circleVis, [0, 1], [0.55, 1], {
    easing: OVERSHOOT,
  });

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <svg
        width={CARD.w}
        height={CARD.h}
        viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <g
          opacity={circleVis}
          transform={`translate(${SUCCESS_CIRCLE.cx} ${SUCCESS_CIRCLE.cy}) scale(${circleScale}) translate(${-SUCCESS_CIRCLE.cx} ${-SUCCESS_CIRCLE.cy})`}
        >
          <circle
            cx={SUCCESS_CIRCLE.cx}
            cy={SUCCESS_CIRCLE.cy}
            r={SUCCESS_CIRCLE.r}
            fill="#ADC0FA"
          />
        </g>
        <path
          d="M713.583 322.792 C 713.583 322.792 716.458 322.792 720.292 329.5 C 720.292 329.5 730.946 311.93 740.417 308.417"
          stroke="#FFFFFF"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={checkmarkVis}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: lx(665),
          top: ly(380),
          width: 124,
          height: 6,
          background: "#D8D8D8",
          borderRadius: 1,
          opacity: labelsVis,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: lx(675),
          top: ly(393),
          width: 105,
          height: 6,
          background: "#D8D8D8",
          borderRadius: 1,
          opacity: labelsVis,
        }}
      />
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Scene 3 work area — 4 cards cascade in, selection cue, then success.
 *
 * All 4 cards cascade together (no F1 preview).  Selection cue appears
 * on Card 3 late in the cascade.  Cards fade out for the success state.
 * ════════════════════════════════════════════════════════════════════════ */
export const Scene3StaffingFastWorkArea: React.FC = () => {
  const frame = useCurrentFrame();

  const cardCascadeVis = (i: number) => {
    const start =
      T_SCENE3_FAST.cardsCascadeStart + i * T_SCENE3_FAST.cardsCascadeStagger;
    const end = start + T_SCENE3_FAST.cardsCascadeDuration;
    return envelope(frame, { start, end }, T_SCENE3_FAST.cardsFadeOut);
  };

  // Per-card pulse window — used both for the zoom transform and the
  // magnifier scan overlay, so they stay in sync.
  const pulseWindow = (i: number) => {
    const appearEnd =
      T_SCENE3_FAST.cardsCascadeStart +
      i * T_SCENE3_FAST.cardsCascadeStagger +
      T_SCENE3_FAST.cardsCascadeDuration;
    return {
      start: appearEnd,
      end: appearEnd + T_SCENE3_FAST.cardPulseDuration,
    };
  };

  // Zoom pulse — eases up to peak at mid, eases back to 1 by end.
  const cardPulseScale = (i: number) => {
    const { start, end } = pulseWindow(i);
    const mid = (start + end) / 2;
    return interpolate(
      frame,
      [start, mid, end],
      [1, T_SCENE3_FAST.cardPulsePeakScale, 1],
      {
        easing: EASE_IN_OUT,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );
  };

  // Magnifier scan overlay — fades in over 2f at the start of the card's
  // pulse, fades out over 2f at the end.  Card 3 (index 2 — the matched
  // candidate) is special: its magnifier stays visible all the way through
  // the selection-cue window so the "found" moment reads as a continuous
  // beat (scan → check → still scanning), and only fades out when the
  // cards collectively fade for the success state.
  const cardScanVis = (i: number) => {
    const { start, end } = pulseWindow(i);
    if (i === 2) {
      return interpolate(
        frame,
        [
          start,
          start + 2,
          T_SCENE3_FAST.cardsFadeOut.start,
          T_SCENE3_FAST.cardsFadeOut.end,
        ],
        [0, 1, 1, 0],
        {
          easing: EASE_IN_OUT,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      );
    }
    return interpolate(
      frame,
      [start, start + 2, end - 2, end],
      [0, 1, 1, 0],
      {
        easing: EASE_IN_OUT,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );
  };

  const cuesVis = envelope(
    frame,
    T_SCENE3_FAST.selectionCue,
    T_SCENE3_FAST.cardsFadeOut
  );

  return (
    <>
      <PersonCard index={0} opacity={cardCascadeVis(0)} pulseScale={cardPulseScale(0)} scanVis={cardScanVis(0)} />
      <PersonCard index={1} opacity={cardCascadeVis(1)} pulseScale={cardPulseScale(1)} scanVis={cardScanVis(1)} />
      <PersonCard index={2} opacity={cardCascadeVis(2)} pulseScale={cardPulseScale(2)} scanVis={cardScanVis(2)} />
      {/* Card 4 (index 3): zoom pulse only, no magnifier — the scan
          stops here so the next beat (selection cue on Card 3) lands clean. */}
      <PersonCard index={3} opacity={cardCascadeVis(3)} pulseScale={cardPulseScale(3)} scanVis={0} />

      <Card3SelectionCue visibility={cuesVis} />

      <Frame3Success />
    </>
  );
};
