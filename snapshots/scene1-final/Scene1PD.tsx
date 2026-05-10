import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { BannerStage, CARD } from "../BannerStage";

/* ────────────────────────────────────────────────────────────────────────────
 * Scene1-PD — Refined Proposal Development scene.
 *
 * Same animation model as PDScene (horizontal shimmer band sweeps each line
 * as it morphs uneven → even), with these refinements:
 *
 *   • Line height reduced from 8 → 6 (thinner text strokes)
 *   • Line stride reduced from 22 → 18 (lines sit a touch closer)
 *   • More top/bottom padding inside the paper (10 → 17) so the text block
 *     has visibly more breathing room above the first line and below the last
 *   • Paper height adjusted so the new line span still centers cleanly
 *
 * ──────────────────────────────────────────────────────────────────────────── */

const COLORS = {
  innerBg: "#F7F7F7",
  panelBg: "#F2F2F2",
  textBlock: "#D8D8D8",
  shimmerBlue: "#ADC0FA",
  sparkleBlue: "#ADC0FA",
};

const lx = (x: number) => x - CARD.x;
const ly = (y: number) => y - CARD.y;

/* ── Geometry ─────────────────────────────────────────────────────────
 *
 * F7F7F7 visible (below header):  y=182.5..496  (height 313.5)
 * F7F7F7 horizontally:             x=545..898   (width  353)
 *
 * Paper: 200 × 220 — vertically and horizontally centered:
 *   x = 545 + (353 - 200)/2 = 622
 *   y = 182.5 + (313.5 - 220)/2 = 226.25  →  226
 *
 * Inside the paper, padding:
 *   top + bottom: 17 each (was 10 in PDScene — more breathing room)
 *   left + right: 10 each (unchanged from PDScene)
 *
 * Line layout:
 *   line max width = 200 - 20 = 180
 *   line x base    = 622 + 10 = 632
 *   indent x       = 632 + 12 = 644
 *   first line y   = 226 + 17 = 243
 *   stride         = 18  →  11 lines span (10×18 + 6) = 186
 *   last line y    = 243 + 180 = 423,  bottom = 429
 *   bottom padding = 446 - 429 = 17  ✓
 * ──────────────────────────────────────────────────────────────────────── */
const PANEL = { x: 622, y: 226, w: 200, h: 220 };
const LINE_HEIGHT = 6;

const UNEVEN_LINES = [
  { x: 632, y: 243, w: 180 }, // line 1 — full
  { x: 632, y: 261, w: 175 }, // slightly short
  { x: 632, y: 279, w: 180 }, // full
  { x: 632, y: 297, w: 116 }, // paragraph end
  { x: 644, y: 315, w: 162 }, // indented start of new paragraph
  { x: 632, y: 333, w: 180 }, // full
  { x: 632, y: 351, w: 175 }, // slightly short
  { x: 632, y: 369, w: 90 },  // paragraph end
  { x: 644, y: 387, w: 174 }, // indented start
  { x: 632, y: 405, w: 158 }, // slightly short
  { x: 632, y: 423, w: 72 },  // last short
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

// Sparkle near the panel's bottom-right corner (panel ends at x=822, y=446).
const SPARKLE = { cx: 790, cy: 415 };

/* ── Timeline — same pacing as PDScene ───────────────────────────────── */
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
  // Headline types in *alongside* the document — starts the moment the
  // paper begins fading in (frame 38) and finishes exactly as the shimmer
  // cascade begins (frame 138). 100 frames over 26 chars ≈ 8 chars/sec —
  // gentle, deliberate pace that runs in parallel with the lines arriving.
  footerWriteStart: 38,
  footerWriteDuration: 100,
  sparkleStart: 228,
  sparkleEnd: 250,
  end: 260,
};

export const SCENE1_PD_DURATION = T.end;

/* ── Easing ──────────────────────────────────────────────────────────── */
const SOFT_OUT = Easing.bezier(0.32, 0.72, 0.37, 1);
const EASE_IN_OUT = Easing.bezier(0.45, 0, 0.55, 1);
const OVERSHOOT = Easing.bezier(0.34, 1.4, 0.64, 1);

/* ── Helpers ──────────────────────────────────────────────────────────── */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ── Static card chrome ──────────────────────────────────────────────── */

const StaticCardContent: React.FC = () => (
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

/* ── Paper ──────────────────────────────────────────────────────────── */

const Paper: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [T.panelFadeStart, T.panelFadeEnd], [0, 1], {
    easing: SOFT_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
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

  const appearStart = T.linesStart + index * T.perLineAppearStagger;
  const appearProgress = interpolate(
    frame,
    [appearStart, appearStart + T.perLineAppearDuration],
    [0, 1],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  if (appearProgress <= 0.001) return null;

  const enterLift = interpolate(appearProgress, [0, 1], [3, 0]);

  const shimmerStart = T.shimmerStart + index * T.perLineShimmerStagger;
  const shimmerEnd = shimmerStart + T.perLineShimmerDuration;
  const shimmerProgress = interpolate(frame, [shimmerStart, shimmerEnd], [0, 1], {
    easing: EASE_IN_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const x = lerp(uneven.x, target.x, shimmerProgress);
  const w = lerp(uneven.w, target.w, shimmerProgress);

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
        opacity: appearProgress,
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

const Sparkle: React.FC<{ pop: number }> = ({ pop }) => {
  const opacity = interpolate(pop, [0, 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
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

const WorkArea: React.FC = () => {
  const frame = useCurrentFrame();
  const sparklePop = interpolate(frame, [T.sparkleStart, T.sparkleEnd], [0, 1], {
    easing: OVERSHOOT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <Paper />
      {UNEVEN_LINES.map((_, i) => (
        <ShimmerLineH key={i} index={i} />
      ))}
      {sparklePop > 0.001 ? <Sparkle pop={sparklePop} /> : null}
    </>
  );
};

/* ── Top-level scene ─────────────────────────────────────────────────── */

export const Scene1PD: React.FC = () => {
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
