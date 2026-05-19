import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { CARD } from "../BannerStage";

/* ────────────────────────────────────────────────────────────────────────────
 * Scene 4 — IT Support (FAST / Option A + bubbles kept).
 *
 * Compression strategy:
 *
 *   ✂  Frame 2 (3 typing-indicator dots) — REMOVED.
 *      The chat bubbles in Frame 3 already contain 3-dot ellipses; the
 *      standalone dot beat was redundant.
 *
 *   ↻  Frame 1 + Frame 4 decoration — RESTORED.
 *      Earlier trim dropped activity-chart bars + tag column for speed.
 *      User asked for them back so the tickets read as full tickets in
 *      the Fast preview too.  All decoration is rendered with the same
 *      contentVis envelope as the rest of the ticket so the fade-in
 *      remains a single coordinated motion.
 *
 *   ↑  Frame 4 ticket slide-up — ADDED.
 *      Mirrors Frame 1: ticket translates up from +22px during its
 *      fade-in for a clear "arriving" motion.
 *
 *   ↻  Frame 4 green badge — fade + pop.
 *      Badge opacity ramps over [0.5, 1] of the F4 visibility envelope
 *      (was [0.6, 1]) so the fade is clearly visible, and the overshoot
 *      scale runs [0.3, 1] so the check pops in with emphasis on top of
 *      the smooth opacity ramp.
 *
 *   ↓  F3 sub-stagger window 60f → 45f.  Same internal ordering
 *      (T → I → bubble1 → bubble2) but tighter overlaps.
 *
 * Total active window: 150 frames (5s).
 *
 * Per-element easing durations stay ≥ 20f so motion still reads eased.
 * This file is a PARALLEL preview component; Scene4IT.tsx remains the
 * canonical Banner-composition source.
 * ──────────────────────────────────────────────────────────────────────── */

/* ── Timing (frames inside the combined Fast banner composition) ─────────
 *
 * Scene 3 Fast holds through frame 490.  Scene 4 chrome + footer transition
 * begin during the S3 tail so the bridge feels woven, mirroring the
 * S1→S2 and S2→S3 bridges.
 * ──────────────────────────────────────────────────────────────────────── */
export const T_SCENE4_FAST = {
  // Chrome — Scene 4's plain nav rects fade back in as Scene 3's nav +
  // search bar fades out.
  headerFadeIn: { start: 490, end: 520 },

  // Frame 1 — ticket card.  Slides up from below as it fades in so the
  // ticket reads as "arriving" rather than just appearing.
  f1FadeIn: { start: 510, end: 535 },
  f1FadeOut: { start: 545, end: 565 },
  // Slide distance — translateY starts at this value (px below resting
  // position) and eases to 0 across the fade-in window.
  f1SlideFromY: 22,

  // Frame 3 — pixel "IT" logo + 2 chat bubbles.  Sub-stagger tightened
  // (bubbles appear earlier within the envelope).  Fade-out is pulled
  // earlier so F3 is fully gone before F4 starts — no cross-fade.
  f3FadeIn: { start: 550, end: 590 },
  f3FadeOut: { start: 605, end: 625 },

  // Frame 4 — resolved ticket with green badge.  Slides up from below
  // like F1 for symmetry.  Starts exactly when F3 finishes fading out
  // so there's no visual overlap between the two frames.
  f4FadeIn: { start: 625, end: 655 },
  // Slide distance — translateY starts at this value (px below resting
  // position) and eases to 0 across the fade-in window's first portion.
  f4SlideFromY: 22,

  // Final hold (small tail so the resolved badge can settle visually).
  holdEnd: 660,
} as const;

export const SCENE4_IT_FAST_DURATION = T_SCENE4_FAST.holdEnd;

/* ── Easing ──────────────────────────────────────────────────────────── */
const SOFT_OUT = Easing.bezier(0.32, 0.72, 0.37, 1);
const OVERSHOOT = Easing.bezier(0.34, 1.4, 0.64, 1);

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
 * Scene 4 chrome — return to the simple pair of white nav rects.
 * ════════════════════════════════════════════════════════════════════════ */
export const Scene4FastHeader: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = envelope(frame, T_SCENE4_FAST.headerFadeIn);
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
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Frame 1 — tabbed ticket card (trimmed)
 *
 * Same silhouette as canonical Scene 4 but with decoration stripped:
 *   • Card + tabs + dashed separator (the "ticket" identity)
 *   • Avatar / photo placeholder
 *   • 2 content lines (was 4)
 *   • 2 action buttons (drop the small tag between them)
 *   ✂ 12 activity bars dropped
 *   ✂ 5-tag left column dropped
 * ════════════════════════════════════════════════════════════════════════ */
const TICKET_CARD_PATH =
  "M788.146 260C793.628 260 798.072 264.445 798.072 269.928C798.072 264.445 802.517 260 808 260H868.509C873.991 260 878.437 264.445 878.437 269.928V367.072C878.437 372.555 873.991 377 868.509 377H808C802.517 377 798.072 372.555 798.072 367.072C798.072 372.555 793.628 377 788.146 377H583.928C578.445 377 574 372.555 574 367.072V269.928C574 264.445 578.445 260 583.928 260H788.146Z";

/* Activity-chart bar geometry (shared between F1 and F4 helper arrays). */
const F1_ACTIVITY_BAR_X = [
  813.2, 816.509, 819.818, 823.127, 826.436, 829.745, 833.055, 836.364, 839.673,
  842.982, 846.291,
];
const F1_WIDE_BAR = { x: 850.545, w: 10.8727 };

const Frame1Ticket: React.FC = () => {
  const frame = useCurrentFrame();
  const visibility = envelope(frame, T_SCENE4_FAST.f1FadeIn, T_SCENE4_FAST.f1FadeOut);
  if (visibility <= 0.001) return null;

  // Slide-up — start at +f1SlideFromY below resting position, ease to 0
  // across the fade-in window. Held at 0 after fade-in completes.
  const slideY = interpolate(
    frame,
    [T_SCENE4_FAST.f1FadeIn.start, T_SCENE4_FAST.f1FadeIn.end],
    [T_SCENE4_FAST.f1SlideFromY, 0],
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
        opacity: visibility,
        transform: `translateY(${slideY}px)`,
        pointerEvents: "none",
      }}
    >
      <svg
        width={CARD.w}
        height={CARD.h}
        viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {/* Outer card with two tab notches */}
        <path d={TICKET_CARD_PATH} fill="#ECF1FE" />

        {/* Tab title bars */}
        <rect
          x={587.236}
          y={268.744}
          width={187.909}
          height={15.6}
          rx={2.36}
          fill="#D9E2FF"
        />
        <rect
          x={813.2}
          y={268.744}
          width={48.218}
          height={15.6}
          rx={2.36}
          fill="#D9E2FF"
        />
        {/* Dashed vertical separator between tabs */}
        <line
          x1={798.191}
          y1={268.744}
          x2={798.191}
          y2={368.49}
          stroke="#D9E2FF"
          strokeWidth={0.71}
          strokeDasharray="2.36 2.36"
        />

        {/* Avatar placeholder */}
        <rect
          x={587.236}
          y={293.801}
          width={51.764}
          height={66.891}
          rx={2.36}
          fill="#D9E2FF"
        />

        {/* Content lines (4 stacked rects) */}
        {[293.801, 307.51, 321.219, 334.928].map((y, i) => (
          <rect
            key={`line-${i}`}
            x={680.364}
            y={y}
            width={94.782}
            height={5.673}
            rx={2.36}
            fill="#D9E2FF"
          />
        ))}

        {/* Tag column — 5 short rects to the left of the content lines */}
        {[293.801, 307.51, 321.219, 334.928, 346.982].map((y, i) => (
          <rect
            key={`tag-${i}`}
            x={652.236}
            y={y}
            width={21.509}
            height={5.673}
            rx={2.36}
            fill="#D9E2FF"
          />
        ))}

        {/* Activity-chart bars (right side) */}
        {F1_ACTIVITY_BAR_X.map((x, i) => (
          <rect
            key={`bar-${i}`}
            x={x}
            y={297.582}
            width={1.891}
            height={65.946}
            rx={0.47}
            fill="#D9E2FF"
          />
        ))}
        <rect
          x={F1_WIDE_BAR.x}
          y={297.582}
          width={F1_WIDE_BAR.w}
          height={65.946}
          rx={0.47}
          fill="#D9E2FF"
        />

        {/* 2 action buttons + middle tag */}
        <rect
          x={680.364}
          y={346.982}
          width={30.018}
          height={13.709}
          rx={2.36}
          fill="#D9E2FF"
        />
        <rect
          x={745.127}
          y={346.982}
          width={30.018}
          height={13.709}
          rx={2.36}
          fill="#D9E2FF"
        />
        <rect
          x={717}
          y={346.982}
          width={21.509}
          height={5.673}
          rx={2.36}
          fill="#D9E2FF"
        />
      </svg>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Frame 3 — pixel "IT" logo + 2 chat bubbles (BUBBLES KEPT)
 *
 * Same sub-stagger as canonical Scene 4 (T → I → bubble1 → bubble2) but
 * compressed into a 45-frame fade-in window.
 * ════════════════════════════════════════════════════════════════════════ */
const IT_LOGO_I_PATH =
  "M785.689 311.737H779.419V305.425H766.838V274.034H760.568V349.439H766.838V368.29H773.149V355.709H779.419V349.439H785.689V343.169H792V318.007H785.689V311.737ZM773.149 343.169H766.838V311.737H773.149V343.169ZM747.987 368.29H766.838V374.602H747.987V368.29ZM754.257 267.723H760.568V274.034H754.257V267.723ZM747.987 261.453H754.257V267.723H747.987V261.453ZM703.973 255.142H747.987V261.453H703.973V255.142Z";

const IT_LOGO_T_PATH =
  "M729.135 374.592H747.986V380.862H729.135V374.592ZM729.135 362.011H747.986V368.281H729.135V362.011ZM722.865 368.281H729.135V374.592H722.865V368.281ZM697.703 261.443H703.972V267.713H697.703V261.443ZM691.432 267.713H697.703V274.024H691.432V267.713ZM685.121 305.416H672.581V311.727H666.27V317.997H660V343.159H666.27V349.429H672.581V355.699H685.121V349.429H691.432V274.024H685.121V305.416ZM685.121 343.159H678.851V311.727H685.121V343.159Z";

const SPEECH_BUBBLE_1_PATH =
  "M830.641 266C853.141 265.999 852.641 291 844.641 296.5L849.454 301.5L828.641 302C807.141 300.5 805.097 266.001 830.641 266Z";
const SPEECH_BUBBLE_2_PATH =
  "M811.021 246C788.521 245.999 789.021 271 797.021 276.5L792.208 281.5L813.021 282C834.521 280.5 836.565 246.001 811.021 246Z";

const Frame3ITChat: React.FC = () => {
  const frame = useCurrentFrame();
  const visibility = envelope(frame, T_SCENE4_FAST.f3FadeIn, T_SCENE4_FAST.f3FadeOut);
  if (visibility <= 0.001) return null;

  // Sub-stagger — tightened so bubbles enter earlier and stay at full
  // opacity through the extended F3 hold window.  Ordering preserved
  // (T → I → bubble1 → bubble2).
  const tVis = interpolate(visibility, [0, 0.3], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const iVis = interpolate(visibility, [0.1, 0.4], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bubble1Vis = interpolate(visibility, [0.3, 0.6], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bubble2Vis = interpolate(visibility, [0.45, 0.75], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <svg
      width={CARD.w}
      height={CARD.h}
      viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}
      style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
    >
      <path d={IT_LOGO_T_PATH} fill="#DDE6FF" opacity={tVis} />
      <path d={IT_LOGO_I_PATH} fill="#DDE6FF" opacity={iVis} />

      <g opacity={bubble1Vis}>
        <path
          d={SPEECH_BUBBLE_1_PATH}
          fill="#F7F7F7"
          stroke="#DDE6FF"
          strokeWidth={3}
        />
        <circle cx={836.141} cy={283.5} r={2} fill="#DDE6FF" />
        <circle cx={830.141} cy={283.5} r={2} fill="#DDE6FF" />
        <circle cx={824.141} cy={283.5} r={2} fill="#DDE6FF" />
      </g>

      <g opacity={bubble2Vis}>
        <path
          d={SPEECH_BUBBLE_2_PATH}
          fill="#F7F7F7"
          stroke="#DDE6FF"
          strokeWidth={3}
        />
        <circle cx={805.521} cy={263.5} r={2} fill="#DDE6FF" />
        <circle cx={811.521} cy={263.5} r={2} fill="#DDE6FF" />
        <circle cx={817.521} cy={263.5} r={2} fill="#DDE6FF" />
      </g>
    </svg>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Frame 4 — resolved ticket with green badge (trimmed, holds to end)
 *
 * Same trim philosophy as F1 (drop bars + tag column).  Card body +
 * content + badge fade in with a quick internal sub-stagger so the badge
 * lands last with its overshoot.
 * ════════════════════════════════════════════════════════════════════════ */
const RESOLVED_CARD_PATH =
  "M789.555 280C794.345 280 798.228 283.883 798.228 288.673C798.228 283.883 802.111 280 806.901 280H859.763C864.553 280 868.436 283.883 868.436 288.673V373.542C868.436 378.332 864.553 382.215 859.763 382.215H806.901C802.111 382.215 798.228 378.332 798.228 373.542C798.228 378.332 794.345 382.215 789.555 382.215H611.145C606.356 382.215 602.473 378.332 602.472 373.542V288.673C602.472 283.883 606.355 280 611.145 280H789.555Z";

/* Activity-chart geometry for the resolved ticket. */
const F4_ACTIVITY_BAR_X = [
  811.444, 814.335, 817.226, 820.117, 823.008, 825.898, 828.79, 831.68, 834.571,
  837.462, 840.353,
];
const F4_WIDE_BAR = { x: 844.07, w: 9.499 };

const Frame4Resolved: React.FC = () => {
  const frame = useCurrentFrame();
  const visibility = envelope(frame, T_SCENE4_FAST.f4FadeIn);
  if (visibility <= 0.001) return null;

  const cardVis = interpolate(visibility, [0, 0.3], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const contentVis = interpolate(visibility, [0.2, 0.55], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Badge fade-in window widened (was [0.6, 1]) so the green check
  // resolves with a clearly visible, smooth opacity ramp rather than a
  // hard pop.  Overshoot scale softened from [0.4, 1] to [0.7, 1] so it
  // settles cleanly alongside the fade.
  const badgeVis = interpolate(visibility, [0.5, 1], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Pop-in: scale starts small and lands with a visible overshoot so the
  // green check arrives with emphasis while still riding the smooth
  // opacity ramp above.
  const badgeScale = interpolate(badgeVis, [0, 1], [0.3, 1], {
    easing: OVERSHOOT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slide-up — start at +f4SlideFromY below resting position, ease to 0
  // across the fade-in window. Held at 0 after fade-in completes.
  const slideY = interpolate(
    frame,
    [T_SCENE4_FAST.f4FadeIn.start, T_SCENE4_FAST.f4FadeIn.end],
    [T_SCENE4_FAST.f4SlideFromY, 0],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const BADGE = { cx: 601.972, cy: 339.406, r: 14.5 };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translateY(${slideY}px)`,
        pointerEvents: "none",
      }}
    >
      <svg
        width={CARD.w}
        height={CARD.h}
        viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {/* Card silhouette */}
        <path d={RESOLVED_CARD_PATH} fill="#ECF1FE" opacity={cardVis} />

        {/* Tab title bars */}
        <rect
          x={614.036}
          y={287.639}
          width={164.162}
          height={13.629}
          rx={2.06}
          fill="#D9E2FF"
          opacity={contentVis}
        />
        <rect
          x={811.444}
          y={287.639}
          width={42.125}
          height={13.629}
          rx={2.06}
          fill="#D9E2FF"
          opacity={contentVis}
        />
        <line
          x1={798.332}
          y1={287.639}
          x2={798.332}
          y2={374.779}
          stroke="#D9E2FF"
          strokeWidth={0.62}
          strokeDasharray="2.06 2.06"
          opacity={contentVis}
        />

        {/* Avatar */}
        <rect
          x={614.036}
          y={309.529}
          width={45.222}
          height={58.438}
          rx={2.06}
          fill="#D9E2FF"
          opacity={contentVis}
        />

        {/* Content lines (4 stacked rects) */}
        {[309.529, 321.506, 333.482, 345.459].map((y, i) => (
          <rect
            key={`l-${i}`}
            x={695.395}
            y={y}
            width={82.804}
            height={4.956}
            rx={2.06}
            fill="#D9E2FF"
            opacity={contentVis}
          />
        ))}

        {/* Tag column — 5 short rects to the left of the content lines */}
        {[309.529, 321.506, 333.482, 345.459, 355.99].map((y, i) => (
          <rect
            key={`t-${i}`}
            x={670.822}
            y={y}
            width={18.791}
            height={4.956}
            rx={2.06}
            fill="#D9E2FF"
            opacity={contentVis}
          />
        ))}

        {/* Activity-chart bars (right side) */}
        {F4_ACTIVITY_BAR_X.map((x, i) => (
          <rect
            key={`b-${i}`}
            x={x}
            y={312.833}
            width={1.652}
            height={57.612}
            rx={0.41}
            fill="#D9E2FF"
            opacity={contentVis}
          />
        ))}
        <rect
          x={F4_WIDE_BAR.x}
          y={312.833}
          width={F4_WIDE_BAR.w}
          height={57.612}
          rx={0.41}
          fill="#D9E2FF"
          opacity={contentVis}
        />

        {/* 2 action buttons + middle tag */}
        <rect
          x={695.395}
          y={355.99}
          width={26.225}
          height={11.977}
          rx={2.06}
          fill="#D9E2FF"
          opacity={contentVis}
        />
        <rect
          x={751.974}
          y={355.99}
          width={26.225}
          height={11.977}
          rx={2.06}
          fill="#D9E2FF"
          opacity={contentVis}
        />
        <rect
          x={727.401}
          y={355.99}
          width={18.791}
          height={4.956}
          rx={2.06}
          fill="#D9E2FF"
          opacity={contentVis}
        />

        {/* Green resolved badge — fades in over a widened window with a
         *  gentle overshoot scale so the transition reads clearly. */}
        <g
          opacity={badgeVis}
          transform={`translate(${BADGE.cx} ${BADGE.cy}) scale(${badgeScale}) translate(${-BADGE.cx} ${-BADGE.cy})`}
        >
          <circle
            cx={BADGE.cx}
            cy={BADGE.cy}
            r={BADGE.r}
            fill="#35C8AF"
          />
          <path
            d="M597.906 340.896 C 597.906 340.896 598.931 340.896 600.297 343.287 C 600.297 343.287 604.094 337.025 607.469 335.773"
            stroke="white"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Scene 4 work area — ticket → IT logo + chat → resolved
 * ════════════════════════════════════════════════════════════════════════ */
export const Scene4ITFastWorkArea: React.FC = () => {
  return (
    <>
      <Frame1Ticket />
      <Frame3ITChat />
      <Frame4Resolved />
    </>
  );
};
