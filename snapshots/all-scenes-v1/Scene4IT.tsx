import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { CARD } from "../BannerStage";

/* ────────────────────────────────────────────────────────────────────────────
 * Scene 4 — IT Support (Resolving Tech Tickets).
 *
 * Five frames composed from the source SVGs in
 *   animation scenes/scene 3 IT/IT Animation frame {1,2,3,4,5}.svg
 *
 *   Frame 1 (IT-1) — tabbed ticket card with avatar + content + activity bars
 *   Frame 2 (IT-2) — 3 pulsing typing-indicator dots          (transition beat)
 *   Frame 3 (IT-3) — big pixel "IT" logo + 2 chat bubbles
 *   Frame 4 (IT-4) — single ticket with green resolved badge
 *   Frame 5 (IT-5) — 3 resolved tickets stacked vertically
 *
 * Connected narrative:
 *   ticket arrives → support thinks → chat happens → resolved → resolved at scale
 *
 * Visual continuity tricks:
 *   • Frame 2's 3 dots persist as the ellipses inside Frame 3's speech bubbles
 *     so the eye reads the dots as the same characters being "spoken".
 *   • Frame 4's single ticket repositions to become Frame 5's middle card
 *     (a 9px upward shift) — Frame 5's top + bottom cards cascade in around it.
 *
 * Geometry is in absolute SVG coords; lx/ly convert to card-local at the
 * JSX boundary (matching Scene 1 / Scene 2 / Scene 3's convention).
 * ──────────────────────────────────────────────────────────────────────── */

/* ── Timing — absolute frames in the banner timeline ─────────────────── */
export const T_SCENE4 = {
  // Chrome (Scene 3's nav rects + search bar fade out, plain nav rects fade
  // back in for Scene 4)
  headerFadeIn: { start: 1240, end: 1290 },

  // Frame 1 — ticket card. No sub-stagger; the whole card appears together
  // with a quick clean fade-in so the eye reads the ticket as a single object.
  f1FadeIn: { start: 1280, end: 1305 },
  f1FadeOut: { start: 1410, end: 1450 },

  // Frame 2 — 3 typing dots ("processing"). Must fully fade out *before*
  // Frame 3 begins (no overlap) — the dots are a discrete beat, not a
  // backdrop for the chat.
  f2FadeIn: { start: 1430, end: 1470 },
  f2FadeOut: { start: 1490, end: 1525 },

  // Frame 3 — IT logo + chat bubbles. Starts ~10 frames after Frame 2's
  // dots have fully cleared.
  f3FadeIn: { start: 1535, end: 1595 },
  f3FadeOut: { start: 1680, end: 1730 },

  // Frame 4 — single resolved ticket with green badge. This is the final
  // frame; no fade-out — the ticket holds through to the composition end.
  f4FadeIn: { start: 1710, end: 1770 },
} as const;

export const SCENE4_END_FRAME = 1880;

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
 *
 * No search bar this time (Scene 3 had the search bar). Just the same two
 * nav rects from Scene 1, fading back in as Scene 3's chrome fades out.
 * ════════════════════════════════════════════════════════════════════════ */
export const Scene4Header: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = envelope(frame, T_SCENE4.headerFadeIn);
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
      <div
        style={{
          position: "absolute",
          left: lx(555),
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
 * Frame 1 — tabbed ticket card
 *
 * The dual-tab shape from the source SVG: a rounded rect with two narrower
 * "tabs" emerging from the top. Inside:
 *   • Left avatar / photo placeholder (rect)
 *   • 4 content lines (stacked horizontal rects)
 *   • 5 small tag labels in a left column
 *   • 12 vertical activity-chart bars on the right
 *   • 2 action buttons at the bottom
 *
 * The whole ticket appears together with a single clean fade-in — no
 * internal sub-stagger. Reads as "the ticket is here, ready to be looked
 * at" rather than "the ticket is being constructed".
 * ════════════════════════════════════════════════════════════════════════ */

// Two-tab card outline path (matches the source SVG's dual-tab shape).
// Rendered as one filled path so the tab notches and rounded corners read
// correctly as a single ticket-card silhouette.
const TICKET_CARD_PATH =
  "M788.146 260C793.628 260 798.072 264.445 798.072 269.928C798.072 264.445 802.517 260 808 260H868.509C873.991 260 878.437 264.445 878.437 269.928V367.072C878.437 372.555 873.991 377 868.509 377H808C802.517 377 798.072 372.555 798.072 367.072C798.072 372.555 793.628 377 788.146 377H583.928C578.445 377 574 372.555 574 367.072V269.928C574 264.445 578.445 260 583.928 260H788.146Z";

const ACTIVITY_BAR_X_VALUES = [
  813.2, 816.509, 819.818, 823.127, 826.436, 829.745, 833.055, 836.364, 839.673,
  842.982, 846.291,
];
// The last "bar" is wider — represents the "current" vertical column.
const WIDE_BAR = { x: 850.545, w: 10.8727 };

const Frame1Ticket: React.FC = () => {
  const frame = useCurrentFrame();
  const visibility = envelope(frame, T_SCENE4.f1FadeIn, T_SCENE4.f1FadeOut);
  if (visibility <= 0.001) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: visibility,
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
        {/* Dashed vertical separator between the two tabs */}
        <line
          x1={798.191}
          y1={268.744}
          x2={798.191}
          y2={368.49}
          stroke="#D9E2FF"
          strokeWidth={0.71}
          strokeDasharray="2.36 2.36"
        />

        {/* Avatar / photo placeholder (left of the content area) */}
        <rect
          x={587.236}
          y={293.801}
          width={51.764}
          height={66.891}
          rx={2.36}
          fill="#D9E2FF"
        />

        {/* Content lines (4 stacked rects, ~94px wide) */}
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

        {/* Small tag labels — left column, 5 short rects */}
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

        {/* Activity chart bars (vertical, on the right side) */}
        {ACTIVITY_BAR_X_VALUES.map((x, i) => (
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
        {/* Wide "current column" bar */}
        <rect
          x={WIDE_BAR.x}
          y={297.582}
          width={WIDE_BAR.w}
          height={65.946}
          rx={0.47}
          fill="#D9E2FF"
        />

        {/* Two action buttons at the bottom */}
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
        {/* Small tag between the two buttons */}
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
 * Frame 2 — 3 typing-indicator dots
 *
 * Simple, focal "thinking" beat between the ticket and the chat. Each dot
 * pulses up/down with a sin-based offset so the whole thing reads as alive
 * rather than a frozen still. Centered around (723, 344) per source SVG.
 *
 * The dots persist visually into Frame 3 — they sit behind the speech
 * bubbles' ellipses, providing a "the conversation continues" cue.
 * ════════════════════════════════════════════════════════════════════════ */
const TYPING_DOTS_X = [707, 723, 739];
const TYPING_DOTS_CY = 344;
const TYPING_DOT_R = 5;

const Frame2TypingDots: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Visibility includes a long tail so the dots are still subtly visible
  // when Frame 3 takes over (continuity cue).
  const visibility = envelope(frame, T_SCENE4.f2FadeIn, T_SCENE4.f2FadeOut);
  if (visibility <= 0.001) return null;

  const t = frame / fps;

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
        pointerEvents: "none",
      }}
    >
      {TYPING_DOTS_X.map((x, i) => {
        // Phase-offset sin so the three dots bob in a wave.
        const bob = Math.sin(t * 4 - i * 0.7) * 2.5;
        return (
          <circle
            key={i}
            cx={x}
            cy={TYPING_DOTS_CY + bob}
            r={TYPING_DOT_R}
            fill="#D8E1FC"
          />
        );
      })}
    </svg>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Frame 3 — pixel "IT" logo + chat bubbles
 *
 * Two letterforms drawn in pixel-bar style (filled path, accent blue).
 * Two speech bubbles on the right, each with a 3-dot ellipsis inside —
 * representing the live IT support conversation.
 * ════════════════════════════════════════════════════════════════════════ */

// "I" letter from the source SVG — pixel-bar form
const IT_LOGO_I_PATH =
  "M785.689 311.737H779.419V305.425H766.838V274.034H760.568V349.439H766.838V368.29H773.149V355.709H779.419V349.439H785.689V343.169H792V318.007H785.689V311.737ZM773.149 343.169H766.838V311.737H773.149V343.169ZM747.987 368.29H766.838V374.602H747.987V368.29ZM754.257 267.723H760.568V274.034H754.257V267.723ZM747.987 261.453H754.257V267.723H747.987V261.453ZM703.973 255.142H747.987V261.453H703.973V255.142Z";

// "T" letter from the source SVG — pixel-bar form
const IT_LOGO_T_PATH =
  "M729.135 374.592H747.986V380.862H729.135V374.592ZM729.135 362.011H747.986V368.281H729.135V362.011ZM722.865 368.281H729.135V374.592H722.865V368.281ZM697.703 261.443H703.972V267.713H697.703V261.443ZM691.432 267.713H697.703V274.024H691.432V267.713ZM685.121 305.416H672.581V311.727H666.27V317.997H660V343.159H666.27V349.429H672.581V355.699H685.121V349.429H691.432V274.024H685.121V305.416ZM685.121 343.159H678.851V311.727H685.121V343.159Z";

// Two speech bubbles (top-right of card area) — outlined paths with
// little 3-dot ellipses inside. The bubbles mark "live conversation".
const SPEECH_BUBBLE_1_PATH =
  "M830.641 266C853.141 265.999 852.641 291 844.641 296.5L849.454 301.5L828.641 302C807.141 300.5 805.097 266.001 830.641 266Z";
const SPEECH_BUBBLE_2_PATH =
  "M811.021 246C788.521 245.999 789.021 271 797.021 276.5L792.208 281.5L813.021 282C834.521 280.5 836.565 246.001 811.021 246Z";

const Frame3ITChat: React.FC = () => {
  const frame = useCurrentFrame();
  const visibility = envelope(frame, T_SCENE4.f3FadeIn, T_SCENE4.f3FadeOut);
  if (visibility <= 0.001) return null;

  // Sub-stagger so the "I" arrives, then "T", then bubbles
  const iVis = interpolate(visibility, [0, 0.4], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tVis = interpolate(visibility, [0.15, 0.55], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bubble1Vis = interpolate(visibility, [0.4, 0.7], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bubble2Vis = interpolate(visibility, [0.55, 0.85], [0, 1], {
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
      {/* "T" letter — drawn first since it's the bigger, calmer shape */}
      <path d={IT_LOGO_T_PATH} fill="#DDE6FF" opacity={tVis} />
      {/* "I" letter */}
      <path d={IT_LOGO_I_PATH} fill="#DDE6FF" opacity={iVis} />

      {/* Speech bubble 1 (lower-right) with 3-dot ellipsis */}
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

      {/* Speech bubble 2 (upper-right) with 3-dot ellipsis */}
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
 * Resolved-ticket sub-component
 *
 * Same dual-tab card silhouette as Frame 1, with a small green badge
 * (containing a white checkmark) sitting to the left of the card. The
 * badge is the only "resolved" cue — no extra checkmark inside the card.
 * ════════════════════════════════════════════════════════════════════════ */

// Smaller / refined card path used by Frame 4 (slightly different
// proportions than Frame 1's path).
const RESOLVED_CARD_PATH =
  "M789.555 280C794.345 280 798.228 283.883 798.228 288.673C798.228 283.883 802.111 280 806.901 280H859.763C864.553 280 868.436 283.883 868.436 288.673V373.542C868.436 378.332 864.553 382.215 859.763 382.215H806.901C802.111 382.215 798.228 378.332 798.228 373.542C798.228 378.332 794.345 382.215 789.555 382.215H611.145C606.356 382.215 602.473 378.332 602.472 373.542V288.673C602.472 283.883 606.355 280 611.145 280H789.555Z";

const ResolvedTicket: React.FC<{
  cardVis: number;
  contentVis: number;
  badgeVis: number;
}> = ({ cardVis, contentVis, badgeVis }) => {
  if (cardVis <= 0.001 && contentVis <= 0.001 && badgeVis <= 0.001) return null;

  // Badge scale uses overshoot so the "resolved" landing has weight.
  const badgeScale = interpolate(badgeVis, [0, 1], [0.4, 1], {
    easing: OVERSHOOT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Badge is centered around (601.972, 339.406) in source SVG; we add `dy`
  // to all y-values to handle the stacked-ticket offsets.
  const BADGE = { cx: 601.972, cy: 339.406, r: 14.5 };

  return (
    <g>
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

      {/* Content lines */}
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

      {/* Tag labels */}
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

      {/* Activity bars (simplified — 11 thin + 1 wide) */}
      {[
        811.444, 814.335, 817.226, 820.117, 823.008, 825.898, 828.79, 831.68,
        834.571, 837.462, 840.353,
      ].map((x, i) => (
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
        x={844.07}
        y={312.833}
        width={9.499}
        height={57.612}
        rx={0.41}
        fill="#D9E2FF"
        opacity={contentVis}
      />

      {/* Action buttons */}
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

      {/* Green resolved badge — circle with white checkmark — pops in
          last with an overshoot scale so it lands with emphasis. */}
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
    </g>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Frame 4 — single resolved ticket (final frame)
 *
 * Card fades in, content fades in shortly after, then the green badge pops
 * in with overshoot. No fade-out — the ticket holds through to the
 * composition end.
 * ════════════════════════════════════════════════════════════════════════ */
const Frame4Resolved: React.FC = () => {
  const frame = useCurrentFrame();
  const visibility = envelope(frame, T_SCENE4.f4FadeIn);
  if (visibility <= 0.001) return null;

  const cardVis = interpolate(visibility, [0, 0.4], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const contentVis = interpolate(visibility, [0.2, 0.6], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeVis = interpolate(visibility, [0.55, 1], [0, 1], {
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
      <ResolvedTicket
        cardVis={cardVis}
        contentVis={contentVis}
        badgeVis={badgeVis}
      />
    </svg>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Scene 4 work area orchestrator
 *
 * Each frame is fully self-managing — reads useCurrentFrame() itself,
 * decides when to render based on T_SCENE4's per-frame timings, computes
 * its own internal stagger. Scene 4 ends at Frame 4 (resolved ticket).
 * ════════════════════════════════════════════════════════════════════════ */
export const Scene4WorkArea: React.FC = () => {
  return (
    <>
      <Frame1Ticket />
      <Frame2TypingDots />
      <Frame3ITChat />
      <Frame4Resolved />
    </>
  );
};
