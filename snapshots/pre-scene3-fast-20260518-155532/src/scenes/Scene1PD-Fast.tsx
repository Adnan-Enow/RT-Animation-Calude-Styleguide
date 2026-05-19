import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { BannerStage, CARD, type FooterStage } from "../BannerStage";
import {
  Scene2FastHeader,
  Scene2SDFastWorkArea,
  SCENE2_SD_FAST_DURATION,
} from "./Scene2SD-Fast";

/* ────────────────────────────────────────────────────────────────────────────
 * Scene1-PD-Fast — Fast banner preview composition.
 *
 * This file orchestrates the OPTIMIZED versions of Scene 1 and Scene 2
 * back-to-back. It's a parallel preview composition; the canonical
 * production banner (Scene1PD.tsx + Scene2SD.tsx in BannerAnimation.tsx)
 * is untouched.
 *
 *   Scene 1 (Option B):  paper → lines cascade → shimmer cascade → sparkle
 *                        ~150 frames (5s)
 *   Scene 1 → Scene 2 bridge: footer backspaces "Crafting Proposals" →
 *                        types "Delivering Software Solutions"; macOS
 *                        chrome swaps in
 *   Scene 2 (Option A):  code editor → kanban dashboard
 *                        (Frame 1 `</>` icon REMOVED; trimmed decoration)
 *                        ~150 frames (5s) of active animation
 *
 * Total composition: ~315 frames (~10.5s).
 *
 * Per-element easing durations stay ≥ 6f so motion still reads eased.
 * The compression comes from overlap (Scene 1) and editing (Scene 2),
 * not from making any single motion snappier.
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

/* ── Scene 1 timing (Option B) ────────────────────────────────────────── */
const T_SCENE1 = {
  panelFadeStart: 38,
  panelFadeEnd: 52,
  linesStart: 50,
  perLineAppearStagger: 3,
  perLineAppearDuration: 10,
  shimmerDelayAfterAppear: 2,
  perLineShimmerDuration: 14,
  sparkleStart: 108,
  sparkleEnd: 130,
  // Tail fade for paper / lines / sparkle — runs alongside the
  // S1→S2 bridge so the document clears as Scene 2's chrome arrives.
  tailFadeStart: 130,
  tailFadeEnd: 150,
};

/* ── Master orchestrator timing ───────────────────────────────────────── */
const T = {
  // Scene 1 nav-rect chrome — fades out as macOS chrome fades in.
  scene1HeaderFadeOut: { start: 135, end: 168 },

  // Footer stages (typewriter mechanism).
  footer: {
    // Stage 1 — type "Best at Crafting Proposals" alongside paper.
    s1WriteStart: 30,
    s1WriteDuration: 70,
    // Stage 2 — backspace down to "Best at " (S1→S2 bridge).
    s12BackspaceStart: 130,
    s12BackspaceDuration: 30,
    // Stage 3 — retype tail "Delivering Software Solutions".
    s2WriteStart: 165,
    s2WriteDuration: 70,
  },

  end: SCENE2_SD_FAST_DURATION, // 315
};

export const SCENE1_PD_FAST_DURATION = T.end;

const FOOTER_STAGES: FooterStage[] = [
  {
    toText: "Best at Crafting Proposals",
    start: T.footer.s1WriteStart,
    duration: T.footer.s1WriteDuration,
  },
  {
    toText: "Best at ",
    start: T.footer.s12BackspaceStart,
    duration: T.footer.s12BackspaceDuration,
  },
  {
    toText: "Best at Delivering Software Solutions",
    start: T.footer.s2WriteStart,
    duration: T.footer.s2WriteDuration,
  },
];

/* ── Easing ──────────────────────────────────────────────────────────── */
const SOFT_OUT = Easing.bezier(0.32, 0.72, 0.37, 1);
const EASE_IN_OUT = Easing.bezier(0.45, 0, 0.55, 1);
const OVERSHOOT = Easing.bezier(0.34, 1.4, 0.64, 1);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ── Per-line scheduling helper (Scene 1) ────────────────────────────── */
const lineSchedule = (i: number) => {
  const appearStart = T_SCENE1.linesStart + i * T_SCENE1.perLineAppearStagger;
  const appearEnd = appearStart + T_SCENE1.perLineAppearDuration;
  const shimmerStart = appearEnd + T_SCENE1.shimmerDelayAfterAppear;
  const shimmerEnd = shimmerStart + T_SCENE1.perLineShimmerDuration;
  return { appearStart, appearEnd, shimmerStart, shimmerEnd };
};

/* ════════════════════════════════════════════════════════════════════════
 * Shared chrome — F7F7F7 inner background + header tint band.
 * Constant across both scenes; never crossfades.
 * ════════════════════════════════════════════════════════════════════════ */
const SharedInnerBackground: React.FC = () => (
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
  </>
);

/* ════════════════════════════════════════════════════════════════════════
 * Scene 1 chrome — pair of white nav skeletons (fade out at S1→S2 bridge)
 * ════════════════════════════════════════════════════════════════════════ */
const Scene1FastHeader: React.FC = () => (
  <>
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

/* ════════════════════════════════════════════════════════════════════════
 * Scene 1 — Paper
 * ════════════════════════════════════════════════════════════════════════ */
const Paper: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(
    frame,
    [T_SCENE1.panelFadeStart, T_SCENE1.panelFadeEnd],
    [0, 1],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const fadeOut = interpolate(
    frame,
    [T_SCENE1.tailFadeStart, T_SCENE1.tailFadeEnd],
    [1, 0],
    {
      easing: EASE_IN_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const opacity = fadeIn * fadeOut;

  const lift = interpolate(
    frame,
    [T_SCENE1.panelFadeStart, T_SCENE1.panelFadeEnd],
    [4, 0],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

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

/* ════════════════════════════════════════════════════════════════════════
 * Scene 1 — Skeleton line with horizontal shimmer band
 * ════════════════════════════════════════════════════════════════════════ */
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

  const tailFade = interpolate(
    frame,
    [T_SCENE1.tailFadeStart, T_SCENE1.tailFadeEnd],
    [1, 0],
    {
      easing: EASE_IN_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
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

/* ════════════════════════════════════════════════════════════════════════
 * Scene 1 — AI sparkle
 * ════════════════════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════════════════════
 * Scene 1 work area
 * ════════════════════════════════════════════════════════════════════════ */
const Scene1FastWorkArea: React.FC = () => {
  const frame = useCurrentFrame();
  const sparklePop = interpolate(
    frame,
    [T_SCENE1.sparkleStart, T_SCENE1.sparkleEnd],
    [0, 1],
    {
      easing: OVERSHOOT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const tailFade = interpolate(
    frame,
    [T_SCENE1.tailFadeStart, T_SCENE1.tailFadeEnd],
    [1, 0],
    {
      easing: EASE_IN_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
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

/* ════════════════════════════════════════════════════════════════════════
 * Top-level — combined Fast banner orchestrator
 * ════════════════════════════════════════════════════════════════════════ */
export const Scene1PDFast: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene 1 chrome (nav rects) fades out during the bridge.
  const scene1HeaderVis = interpolate(
    frame,
    [T.scene1HeaderFadeOut.start, T.scene1HeaderFadeOut.end],
    [1, 0],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <BannerStage
      cardEntryStart={6}
      cardEntryDuration={24}
      footerStages={FOOTER_STAGES}
    >
      {/* Always-visible base */}
      <SharedInnerBackground />

      {/* Scene 1 chrome — gated by scene1HeaderVis */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: scene1HeaderVis,
          pointerEvents: "none",
        }}
      >
        <Scene1FastHeader />
      </div>

      {/* Scene 1 work area — paper/lines/sparkle handle their own tail fade */}
      <Scene1FastWorkArea />

      {/* Scene 2 chrome — macOS controls; handles its own fade-in */}
      <Scene2FastHeader />

      {/* Scene 2 work area — code editor + kanban */}
      <Scene2SDFastWorkArea />
    </BannerStage>
  );
};
