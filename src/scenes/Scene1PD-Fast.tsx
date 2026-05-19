import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { BannerStage, CARD, type FooterStage } from "../BannerStage";
import {
  Scene2FastHeader,
  Scene2SDFastWorkArea,
} from "./Scene2SD-Fast";
import {
  Scene3FastHeader,
  Scene3StaffingFastWorkArea,
} from "./Scene3Staffing-Fast";
import {
  Scene4FastHeader,
  Scene4ITFastWorkArea,
  SCENE4_IT_FAST_DURATION,
} from "./Scene4IT-Fast";

/* ────────────────────────────────────────────────────────────────────────────
 * Scene1-PD-Fast — Fast banner preview composition.
 *
 * This file orchestrates the OPTIMIZED versions of Scenes 1, 2, 3 and 4
 * back-to-back. It's a parallel preview composition; the canonical
 * production banner (Scene1PD/Scene2SD/Scene3Staffing/Scene4IT.tsx in
 * BannerAnimation.tsx) is untouched.
 *
 *   Scene 1 (Option B):  paper → lines cascade → shimmer cascade → sparkle
 *                        ~150 frames (5s)
 *   Scene 1 → Scene 2 bridge: footer backspaces "Crafting Proposals" →
 *                        types "Delivering Software Solutions"; macOS
 *                        chrome swaps in
 *   Scene 2 (Option A):  code editor → kanban dashboard
 *                        (Frame 1 `</>` icon REMOVED; trimmed decoration)
 *                        ~165 frames (5.5s) of active animation
 *   Scene 2 → Scene 3 bridge: macOS chrome + kanban fade out; footer
 *                        backspaces "Delivering Software Solutions" →
 *                        types "Precision Hiring"; nav rects + search
 *                        bar fade in
 *   Scene 3 (Option A):  4 candidates cascade → selection cue → success
 *                        (Frame 1 single-card preview + magnifier overlay
 *                        REMOVED)  ~150 frames (5s)
 *   Scene 3 → Scene 4 bridge: nav + search fade out; footer backspaces
 *                        "Precision Hiring" → types "Providing IT
 *                        Support"; plain nav rects fade in
 *   Scene 4 (Option A):  ticket card → IT logo + chat bubbles → resolved
 *                        (Frame 2 typing dots REMOVED; F1 & F4 detail
 *                        trimmed)  ~150 frames (5s)
 *
 * Total composition: ~645 frames (~21.5s).
 *
 * Per-element easing durations stay ≥ 6f (Scene 1/2) / ≥ 18f (Scene 3
 * cards) / ≥ 25f (success beats) so motion still reads eased.  The
 * compression comes from overlap (Scene 1) and editing (Scenes 2 & 3),
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

  // Scene 2 chrome (macOS dots) + kanban work area fade out during S2→S3
  // bridge so Scene 3's nav rects + search bar can come back in.
  scene2HeaderFadeOut: { start: 305, end: 335 },
  scene2WorkAreaFadeOut: { start: 305, end: 335 },

  // Scene 3 chrome (nav + search) + cards/success state fade out during
  // S3→S4 bridge so Scene 4's plain nav rects can come back in.
  scene3HeaderFadeOut: { start: 488, end: 515 },
  scene3WorkAreaFadeOut: { start: 488, end: 515 },

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
    // Stage 4 — backspace down to "Best at " (S2→S3 bridge).
    s23BackspaceStart: 305,
    s23BackspaceDuration: 35,
    // Stage 5 — retype tail "Precision Hiring".
    s3WriteStart: 345,
    s3WriteDuration: 36,
    // Stage 6 — backspace down to "Best at " (S3→S4 bridge).
    s34BackspaceStart: 488,
    s34BackspaceDuration: 30,
    // Stage 7 — retype tail "Providing IT Support".
    s4WriteStart: 522,
    s4WriteDuration: 42,
  },

  end: SCENE4_IT_FAST_DURATION, // 660
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
  {
    toText: "Best at ",
    start: T.footer.s23BackspaceStart,
    duration: T.footer.s23BackspaceDuration,
  },
  {
    toText: "Best at Precision Hiring",
    start: T.footer.s3WriteStart,
    duration: T.footer.s3WriteDuration,
  },
  {
    toText: "Best at ",
    start: T.footer.s34BackspaceStart,
    duration: T.footer.s34BackspaceDuration,
  },
  {
    toText: "Best at Providing IT Support",
    start: T.footer.s4WriteStart,
    duration: T.footer.s4WriteDuration,
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
/* Grey inner background — centered horizontally within the white card.
 *   Card: x=537, w=378  → local range 0..378
 *   Grey: w=353         → centered, left pad = right pad = (378-353)/2 = 12.5
 *         x = 537 + 12.5 = 549.5
 * Header tint sits flush with the grey rect's left edge. */
const SharedInnerBackground: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        left: lx(549.5),
        top: ly(141),
        width: 353,
        height: 355,
        background: COLORS.innerBg,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: lx(549.75),
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
    {/* Left nav rect — left padding matches the right rect's right padding
     *  from the centered grey panel (grey: 549.5..902.5).
     *  Right rect ends at 832+53=885 → 17.5px from grey right (902.5).
     *  Left rect starts at 549.5 + 17.5 = 567. */}
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
export const Scene1PDFast: React.FC<{
  showBackground?: boolean;
  cleanCard?: boolean;
}> = ({ showBackground = true, cleanCard = false }) => {
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

  // Scene 2 chrome (macOS dots) fades out during the S2→S3 bridge so the
  // Scene 3 nav rects + search bar can take over.
  const scene2HeaderVis = interpolate(
    frame,
    [T.scene2HeaderFadeOut.start, T.scene2HeaderFadeOut.end],
    [1, 0],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Scene 2 work area (code editor + kanban) fades out alongside its chrome.
  const scene2WorkAreaVis = interpolate(
    frame,
    [T.scene2WorkAreaFadeOut.start, T.scene2WorkAreaFadeOut.end],
    [1, 0],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Scene 3 chrome (nav rects + search bar) fades out during the S3→S4
  // bridge so Scene 4's plain nav rects can return.
  const scene3HeaderVis = interpolate(
    frame,
    [T.scene3HeaderFadeOut.start, T.scene3HeaderFadeOut.end],
    [1, 0],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Scene 3 work area (cards / success state) fades out alongside its chrome.
  const scene3WorkAreaVis = interpolate(
    frame,
    [T.scene3WorkAreaFadeOut.start, T.scene3WorkAreaFadeOut.end],
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
      showBackground={showBackground}
      cleanCard={cleanCard}
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

      {/* Scene 2 chrome — macOS controls; fades in (self) then out (envelope) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: scene2HeaderVis,
          pointerEvents: "none",
        }}
      >
        <Scene2FastHeader />
      </div>

      {/* Scene 2 work area — code editor + kanban (fades out for S3) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: scene2WorkAreaVis,
          pointerEvents: "none",
        }}
      >
        <Scene2SDFastWorkArea />
      </div>

      {/* Scene 3 chrome — fades in via its own envelope, out via wrapper */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: scene3HeaderVis,
          pointerEvents: "none",
        }}
      >
        <Scene3FastHeader />
      </div>

      {/* Scene 3 work area — fades out for the S3→S4 bridge */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: scene3WorkAreaVis,
          pointerEvents: "none",
        }}
      >
        <Scene3StaffingFastWorkArea />
      </div>

      {/* Scene 4 chrome — plain nav rects; handles its own fade-in */}
      <Scene4FastHeader />

      {/* Scene 4 work area — ticket → IT logo + chat → resolved */}
      <Scene4ITFastWorkArea />
    </BannerStage>
  );
};

/* Card-only render of the Fast banner — exact card dimensions, no blob,
   no drop shadow, no border. Mirrors BannerCardOnly. */
export const SCENE1_PD_FAST_CARD_WIDTH = CARD.w;
export const SCENE1_PD_FAST_CARD_HEIGHT = CARD.h;

export const Scene1PDFastCardOnly: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        left: -CARD.x,
        top: -CARD.y,
        width: 1452,
        height: 709,
      }}
    >
      <Scene1PDFast showBackground={false} cleanCard={true} />
    </div>
  );
};
