import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { CARD } from "../BannerStage";

/* ────────────────────────────────────────────────────────────────────────────
 * Scene 3 — Staffing (Precision Hiring).
 *
 * Three frames composed from the source SVGs in
 *   animation scenes/scene 4 Staffing/Staffing Animation frame {2,3,4}.svg
 *
 *   Frame 1 (Staffing-2)  — search bar + 1 candidate card     ("searching")
 *   Frame 2 (Staffing-3)  — 4 candidate cards, one selected   ("reviewing")
 *   Frame 3 (Staffing-4)  — large blue circle + checkmark     ("hired")
 *
 * The first card from F1 stays anchored as the top of F2's list — F2's
 * additional cards (2, 3, 4) cascade in below it, so the eye reads it as
 * "the search expanded, more candidates came in". For F2 → F3, the cards
 * fade out and the success circle scales up at center with the checkmark
 * fading in inside.
 *
 * Geometry is in absolute SVG coords; lx/ly convert to card-local at the
 * JSX boundary (matching Scene 1 / Scene 2's convention).
 * ──────────────────────────────────────────────────────────────────────── */

/* ── Timing — absolute frames in the banner timeline ─────────────────── */
export const T_SCENE3 = {
  // Chrome (nav rects come back + search bar fades in)
  headerFadeIn: { start: 730, end: 780 },

  // Frame 1 — search + single result card
  f1FadeIn: { start: 770, end: 820 },
  // (no f1FadeOut — Card 1 persists into F2's list)

  // Frame 2 — additional cards cascade in below Card 1, then selection cues
  f2CardsCascadeStart: 870,
  f2CardsCascadeStagger: 14, // per-card delay
  f2CardsCascadeDuration: 28, // per-card fade-in window
  // 3 new cards × 14 + 28 = 70 frames → cascade ends ~frame 940
  f2SelectionCueStart: 945,
  f2SelectionCueEnd: 980, // checkmark + search-overlay highlight on Card 3
  f2FadeOut: { start: 1000, end: 1040 },

  // Frame 3 — success state: cards out, big circle scales in, checkmark
  // fades in inside, then text labels fade in below.
  f3CircleFadeIn: { start: 1020, end: 1070 },
  f3CheckmarkFadeIn: { start: 1050, end: 1090 },
  f3LabelsFadeIn: { start: 1075, end: 1115 },
} as const;

export const SCENE3_END_FRAME = 1200;

/* ── Easing ──────────────────────────────────────────────────────────── */
const SOFT_OUT = Easing.bezier(0.32, 0.72, 0.37, 1);
const OVERSHOOT = Easing.bezier(0.34, 1.4, 0.64, 1);

/* ── Helpers ─────────────────────────────────────────────────────────── */
const lx = (x: number) => x - CARD.x;
const ly = (y: number) => y - CARD.y;

/** Linear envelope helper — same pattern as Scene 2. Trapezoidal if both
 *  fade-in and fade-out are provided, otherwise just fade-in to 1. */
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
 * Scene 3 chrome — top nav rects (return) + search bar.
 *
 * Replaces Scene 2's macOS window controls with a return to the simpler
 * nav-rect pair (matching Scene 1's chrome) plus a fresh search input field
 * below the header band. The search bar lives just inside the F7F7F7 area
 * at y=195, wide enough for a magnifying-glass icon and a "Search" caption.
 * ════════════════════════════════════════════════════════════════════════ */
export const Scene3Header: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = envelope(frame, T_SCENE3.headerFadeIn);
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
      {/* Top nav rects — same shape and position as Scene 1's chrome */}
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

      {/* Magnifying-glass icon + "Search" caption inside the search bar */}
      <svg
        width={CARD.w}
        height={CARD.h}
        viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {/* Magnifying glass: small circle + handle */}
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
        {/* "Search" caption — small text-shaped rect, since we don't actually
            need to render the word for the silhouette to read correctly. */}
        <rect x={586} y={200} width={36} height={5} rx={1} fill="#C8C8C8" />
      </svg>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Person avatar — simplified silhouette
 *
 * The source SVGs render each candidate avatar as ~7 hand-tuned paths
 * (head, body, hair, arms, etc.). For our purposes a clean silhouette
 * built from primitives reads correctly and keeps the file tractable:
 *
 *   • outer circle (the avatar background tint)
 *   • white head (small circle near the top of the avatar)
 *   • white shoulders (ellipse, clipped to the outer circle so it reads
 *     as a torso emerging from below the chin)
 *
 * The clipPath ID is parameterised by position so multiple avatars on
 * screen don't collide.
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
 * A single candidate row — light-blue card + avatar + name/role labels.
 *
 * Cards are spaced 60px apart vertically (60 = 53 card height + 7 gap),
 * with avatars centered at (584, 248 + 60*index).
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
}> = ({ index, opacity }) => {
  if (opacity <= 0.001) return null;
  const cardY = CARD_BASE_Y + index * CARD_VERTICAL_STRIDE;
  const avatarCy = AVATAR_BASE_CY + index * CARD_VERTICAL_STRIDE;
  return (
    <div style={{ opacity }}>
      {/* Card body */}
      <div
        style={{
          position: "absolute",
          left: lx(CARD_X),
          top: ly(cardY),
          width: CARD_W,
          height: CARD_H,
          background: "#F1F4FF",
          borderRadius: 2,
        }}
      />
      {/* Avatar (rendered in SVG so we can use clipPath cleanly) */}
      <svg
        width={CARD.w}
        height={CARD.h}
        viewBox={`${CARD.x} ${CARD.y} ${CARD.w} ${CARD.h}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <PersonAvatar
          cx={AVATAR_CX}
          cy={avatarCy}
          clipId={`avatar-clip-${index}`}
        />
      </svg>
      {/* Name label */}
      <div
        style={{
          position: "absolute",
          left: lx(610),
          top: ly(cardY + 17),
          width: 191,
          height: 6,
          background: "#D8D8D8",
          borderRadius: 1,
        }}
      />
      {/* Role/subtitle label */}
      <div
        style={{
          position: "absolute",
          left: lx(610),
          top: ly(cardY + 30),
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
 * Selection cues for Card 3 (the "matched candidate" in F2).
 *
 * Two on-card overlays appear in sequence as visual highlights:
 *   • Checkmark in a small box at the right side of Card 3 (selection chip)
 *   • Magnifying-glass icon overlaying the avatar (search-result indicator)
 *
 * Both fade in together during T_SCENE3.f2SelectionCue window.
 * ════════════════════════════════════════════════════════════════════════ */
const Card3SelectionCues: React.FC<{ visibility: number }> = ({
  visibility,
}) => {
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
      {/* Magnifying-glass overlay on Card 3's avatar — communicates
          "this is the searched-for match". Larger than the search-bar
          icon so it reads as a deliberate highlight. */}
      <circle
        cx={583.667}
        cy={369.667}
        r={18.667}
        stroke="#BABABA"
        strokeWidth={1.5}
        fill="none"
      />
      <path
        d="M597 383 L613 399"
        stroke="#BABABA"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 * Frame 3 — success state.
 *
 * Big blue circle (radius 40) at center (727, 319), with a large white
 * checkmark inside. Two text-shaped rects below as the "Hired" headline.
 * The circle scales in with a soft overshoot so the moment lands with
 * weight rather than just appearing.
 * ════════════════════════════════════════════════════════════════════════ */
const SUCCESS_CIRCLE = { cx: 727, cy: 319, r: 40 };

const Frame3Success: React.FC = () => {
  const frame = useCurrentFrame();

  const circleVis = envelope(frame, T_SCENE3.f3CircleFadeIn);
  if (circleVis <= 0.001) return null;

  const checkmarkVis = envelope(frame, T_SCENE3.f3CheckmarkFadeIn);
  const labelsVis = envelope(frame, T_SCENE3.f3LabelsFadeIn);

  // Circle scales in with a slight overshoot — feels like "landing"
  // rather than "appearing".
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
        {/* Success circle */}
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
        {/* White checkmark inside — fades in slightly after the circle lands */}
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

      {/* Headline + subtitle text-shaped rects */}
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
 * Scene 3 work area — orchestrates the candidate list and success state.
 *
 * Card 1 enters with F1FadeIn and persists through F2's list state.
 * Cards 2, 3, 4 cascade in during F2's window with per-card stagger.
 * Selection cues (checkmark + search-overlay) appear on Card 3 toward
 * the end of F2. All cards fade out for F2→F3, then the success state
 * takes over.
 * ════════════════════════════════════════════════════════════════════════ */
export const Scene3WorkArea: React.FC = () => {
  const frame = useCurrentFrame();

  // Card 1 — visible from F1 fade-in until cards collectively fade out for F3.
  const card1Vis = envelope(frame, T_SCENE3.f1FadeIn, T_SCENE3.f2FadeOut);

  // Cards 2, 3, 4 — cascade in with per-card stagger, then fade out together.
  const cardCascadeVis = (i: number) => {
    const start =
      T_SCENE3.f2CardsCascadeStart + i * T_SCENE3.f2CardsCascadeStagger;
    const end = start + T_SCENE3.f2CardsCascadeDuration;
    return envelope(frame, { start, end }, T_SCENE3.f2FadeOut);
  };
  const card2Vis = cardCascadeVis(0);
  const card3Vis = cardCascadeVis(1);
  const card4Vis = cardCascadeVis(2);

  // Selection cues on Card 3 — fade in late in F2, fade out with the cards.
  const cuesVis = envelope(
    frame,
    { start: T_SCENE3.f2SelectionCueStart, end: T_SCENE3.f2SelectionCueEnd },
    T_SCENE3.f2FadeOut
  );

  return (
    <>
      {/* Person cards — Card 1 (top) is the persistent search result, then
          Cards 2, 3, 4 cascade in below it. Index controls vertical position. */}
      <PersonCard index={0} opacity={card1Vis} />
      <PersonCard index={1} opacity={card2Vis} />
      <PersonCard index={2} opacity={card3Vis} />
      <PersonCard index={3} opacity={card4Vis} />

      {/* Selection cues on Card 3 (the matched candidate) */}
      <Card3SelectionCues visibility={cuesVis} />

      {/* Success state — replaces the cards once they fade out */}
      <Frame3Success />
    </>
  );
};
