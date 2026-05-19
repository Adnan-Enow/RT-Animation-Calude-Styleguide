import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { BannerStage, CARD } from "../BannerStage";

/* ────────────────────────────────────────────────────────────────────────────
 * Scene1-PD-Fast — Option B optimization of Scene1PD.
 *
 * Compresses the 260-frame original into ~150 frames (~5s @ 30fps) by
 * OVERLAPPING the appear-cascade with the shimmer-cascade per-line instead
 * of running them as two sequential global waves.
 *
 *   Original:  paper-in → all lines appear (wave 1) → hold → all lines
 *              shimmer/morph (wave 2) → sparkle
 *
 *   Option B:  paper-in → each line appears, then immediately shimmers
 *              (one continuous per-line lifecycle) → sparkle → paper-out
 *
 * Per-element durations are kept long enough that the eased curves still
 * read as eased — the time savings come from removing dead-air and from
 * collapsing the two global waves into one, not from making any single
 * motion snappier.
 *
 * This file is a PARALLEL preview composition. It does NOT replace
 * Scene1PD.tsx; the original is preserved for A/B comparison via the
 * "Scene1-PD" composition in Root.tsx.
 * ──────────────────────────────────────────────────────────────────────── */

const COLORS = {
  innerBg: "#F7F7F7",
  panelBg: "#F2F2F2",
  textBlock: "#D8D8D8",
  shimmerBlue: "#ADC0FA",
  sparkleBlue: "#ADC0FA",
};

const lx = (x: number) => x - CARD.x;
const ly = (y: number) => y - CARD.y;

/* Geometry — identical to Scene1PD.tsx */
const PANEL = { x: 622, y: 226, w: 200, h: 220 };
const LINE_HEIGHT = 6;

const UNEVEN_LINES = [
  { x: 632, y: 243, w: 180 },
  { x: 632, y: 261, w: 175 },
  { x: 632, y: 279, w: 180 },
  { x: 632, y: 297, w: 116 },
  { x: 644, y: 315, w: 162 },
  { x: 632, y: 333, w: 180 },
  { x: 632, y: 351, w: 175 },
  { x: 632, y: 369, w: 90 },
  { x: 644, y: 387, w: 174 },
  { x: 632, y: 405, w: 158 },
  { x: 632, y: 423, w: 72 },
];

const EVEN_LEFT = 632;
const EVEN_FULL_W = 180;
const EVEN_TARGETS = [
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: 130 },
  { x: EVEN_LEFT, w: 72 },
];

const SPARKLE = { cx: 790, cy: 415 };

/* ── Timeline (Option B) ──────────────────────────────────────────────
 *
 * Total budget: 150 frames (~5.0s at 30fps)
 *
 * 0–30    : BannerStage card entrance (unchanged)
 * 38–52   : Paper fades in (14f, was 18f)
 * 50–90   : Lines cascade in — overlaps tail of paper fade
 *           line i appears at (50 + 3i) → (60 + 3i)
 * 62–106  : Shimmer cascade — each line shimmers 2f after its appear ends
 *           line i shimmers at (62 + 3i) → (76 + 3i)
 *           Last line finishes shimmer at frame 106.
 * 108–130 : Sparkle pop (22f, same as original — climax stays generous)
 * 130–150 : Paper + content fade out (20f)
 *
 * Per-line lifecycle (line 0):
 *   appear : 50 → 60   (10f, SOFT_OUT)  ─┐
 *   bridge : 60 → 62   (2f static hold)  ├ feels like one continuous gesture
 *   shimmer: 62 → 76   (14f, EASE_IN_OUT)─┘
 *
 * Why this preserves smoothness:
 *   • Per-element easing windows (10f appear, 14f shimmer, 22f sparkle)
 *     are all ≥ 10 frames — above the threshold where eased curves
 *     stop reading as smooth and start reading as snappy.
 *   • The 2-frame bridge between appear-end and shimmer-start gives a
 *     micro-beat of settle before the morph begins, so it doesn't feel
 *     like the line "shoots in and immediately stretches".
 * ──────────────────────────────────────────────────────────────────────── */
export const T = {
  panelFadeStart: 38,
  panelFadeEnd: 52,
  linesStart: 50,
  perLineAppearStagger: 3,
  perLineAppearDuration: 10,
  // Per-line shimmer starts shimmerDelay frames after that line's appearEnd
  shimmerDelayAfterAppear: 2,
  perLineShimmerDuration: 14,
  sparkleStart: 108,
  sparkleEnd: 130,
  // Tail fade-out for paper, lines, sparkle — matches the user-perceived
  // "scene ends where paper fades away" beat at the 5s mark.
  tailFadeStart: 130,
  tailFadeEnd: 150,
  // Footer typing — proportionally shortened from 100f → 70f.
  // 26 chars / 70f ≈ 2.7 f/char (was 3.8). Still well-paced, finishes at
  // frame 100 — mid-shimmer-cascade, in parallel with the document arriving.
  footerWriteStart: 30,
  footerWriteDuration: 70,
  end: 150,
};

export const SCENE1_PD_FAST_DURATION = T.end;

/* ── Easing — identical to Scene1PD.tsx ──────────────────────────────── */
const SOFT_OUT = Easing.bezier(0.32, 0.72, 0.37, 1);
const EASE_IN_OUT = Easing.bezier(0.45, 0, 0.55, 1);
const OVERSHOOT = Easing.bezier(0.34, 1.4, 0.64, 1);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ── Per-line scheduling helper ──────────────────────────────────────── */
const lineSchedule = (i: number) => {
  const appearStart = T.linesStart + i * T.perLineAppearStagger;
  const appearEnd = appearStart + T.perLineAppearDuration;
  const shimmerStart = appearEnd + T.shimmerDelayAfterAppear;
  const shimmerEnd = shimmerStart + T.perLineShimmerDuration;
  return { appearStart, appearEnd, shimmerStart, shimmerEnd };
};

/* ── Static card chrome — identical to Scene1PD.tsx ──────────────────── */

export const StaticCardContent: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        left: lx(545),
        top: ly(141),
        width: 353,
        height: 355,
        background: COLORS.innerBg,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: lx(545.25),
        top: ly(141.25),
        width: 352.5,
        height: 41.5,
        background: "#D4DFFE",
        opacity: 0.5,
        border: "0.5px solid white",
      }}
    />
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
  </>
);

/* ── Paper ────────────────────────────────────────────────────────────── */

const Paper: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [T.panelFadeStart, T.panelFadeEnd], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [T.tailFadeStart, T.tailFadeEnd], [1, 0], {
    easing: EASE_IN_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = fadeIn * fadeOut;

  const lift = interpolate(frame, [T.panelFadeStart, T.panelFadeEnd], [4, 0], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (opacity <= 0.001) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: lx(PANEL.x),
        top: ly(PANEL.y),
        width: PANEL.w,
        height: PANEL.h,
        background: COLORS.panelBg,
        borderRadius: 2,
        opacity,
        transform: `translateY(${lift}px)`,
      }}
    />
  );
};

/* ── Skeleton line with horizontal shimmer band ──────────────────────── */

const ShimmerLineH: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const uneven = UNEVEN_LINES[index];
  const target = EVEN_TARGETS[index];
  const { appearStart, appearEnd, shimmerStart, shimmerEnd } = lineSchedule(index);

  const appearProgress = interpolate(frame, [appearStart, appearEnd], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (appearProgress <= 0.001) return null;

  const enterLift = interpolate(appearProgress, [0, 1], [3, 0]);

  const shimmerProgress = interpolate(frame, [shimmerStart, shimmerEnd], [0, 1], {
    easing: EASE_IN_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const x = lerp(uneven.x, target.x, shimmerProgress);
  const w = lerp(uneven.w, target.w, shimmerProgress);

  const tailFade = interpolate(frame, [T.tailFadeStart, T.tailFadeEnd], [1, 0], {
    easing: EASE_IN_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = appearProgress * tailFade;

  const showShimmer = shimmerProgress > 0 && shimmerProgress < 1;
  const bandX = -30 + shimmerProgress * 160;

  return (
    <div
      style={{
        position: "absolute",
        left: lx(x),
        top: ly(uneven.y),
        width: w,
        height: LINE_HEIGHT,
        background: COLORS.textBlock,
        borderRadius: 2,
        opacity,
        transform: `translateY(${enterLift}px)`,
        overflow: "hidden",
      }}
    >
      {showShimmer ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${bandX}%`,
            width: "45%",
            background:
              "linear-gradient(90deg, rgba(173,192,250,0) 0%, rgba(173,192,250,0.95) 50%, rgba(173,192,250,0) 100%)",
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
};

/* ── AI sparkle ──────────────────────────────────────────────────────── */

const Sparkle: React.FC<{ pop: number; tailFade: number }> = ({ pop, tailFade }) => {
  const opacity =
    interpolate(pop, [0, 0.4], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) * tailFade;
  const scale = interpolate(pop, [0, 0.6, 1], [0.55, 1.08, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: lx(SPARKLE.cx - 26),
        top: ly(SPARKLE.cy - 26),
        width: 52,
        height: 52,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "50% 50%",
      }}
    >
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="26" fill={COLORS.sparkleBlue} />
        <g transform="translate(13, 13)" fill="white">
          <path d="M13 0 L15.5 10.5 L26 13 L15.5 15.5 L13 26 L10.5 15.5 L0 13 L10.5 10.5 Z" />
        </g>
      </svg>
    </div>
  );
};

/* ── Work area ────────────────────────────────────────────────────────── */

export const WorkArea: React.FC = () => {
  const frame = useCurrentFrame();
  const sparklePop = interpolate(frame, [T.sparkleStart, T.sparkleEnd], [0, 1], {
    easing: OVERSHOOT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tailFade = interpolate(frame, [T.tailFadeStart, T.tailFadeEnd], [1, 0], {
    easing: EASE_IN_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <Paper />
      {UNEVEN_LINES.map((_, i) => (
        <ShimmerLineH key={i} index={i} />
      ))}
      {sparklePop > 0.001 ? <Sparkle pop={sparklePop} tailFade={tailFade} /> : null}
    </>
  );
};

/* ── Top-level scene ─────────────────────────────────────────────────── */

export const Scene1PDFast: React.FC = () => {
  return (
    <BannerStage
      cardEntryStart={6}
      cardEntryDuration={24}
      footerText="Best at Crafting Proposals"
      footerWriteStart={T.footerWriteStart}
      footerWriteDuration={T.footerWriteDuration}
    >
      <StaticCardContent />
      <WorkArea />
    </BannerStage>
  );
};
