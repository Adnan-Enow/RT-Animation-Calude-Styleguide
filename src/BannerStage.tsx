import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { CirclePlus, Send } from "lucide-react";
import { loadFont } from "@remotion/google-fonts/Inter";

// Load Inter at module init so it's available during renders.
// Two weights for typographic hierarchy (title vs caption); Latin subset only
// to keep the network round-trip count modest at render time.
const { fontFamily: INTER } = loadFont("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

/**
 * Shared stage: white background, soft blurred blue blob, faint grid lines,
 * and a centered glass card. Children render inside the card content area.
 */

export const CARD = { x: 537, y: 120, w: 378, h: 475 } as const;
export const INNER = { x: 545, y: 141, w: 353, h: 355 } as const;

const GridLines: React.FC = () => {
  const v = (x: number) => (
    <div
      key={`v-${x}`}
      style={{
        position: "absolute",
        left: x,
        top: 0,
        bottom: 0,
        width: 1,
        background: "rgba(255,255,255,0.33)",
      }}
    />
  );
  const h = (y: number) => (
    <div
      key={`h-${y}`}
      style={{
        position: "absolute",
        top: y,
        left: 0,
        right: 0,
        height: 1,
        background: "rgba(255,255,255,0.33)",
      }}
    />
  );
  return (
    <>
      {v(99.5)}
      {v(537.5)}
      {v(915.5)}
      {v(1392.5)}
      {h(69.5)}
      {h(119.5)}
      {h(594.5)}
      {h(637.5)}
    </>
  );
};

const BackgroundBlob: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const scale = 1 + Math.sin(t * 0.6) * 0.015;
  const drift = Math.sin(t * 0.4) * 6;

  return (
    <svg
      width={1452}
      height={709}
      viewBox="0 0 1452 709"
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate(${drift}px, ${-drift * 0.3}px) scale(${scale})`,
        transformOrigin: "50% 60%",
      }}
    >
      <defs>
        <filter
          id="bg-blob-blur"
          x="-636.6"
          y="-399.6"
          width="2616.2"
          height="1332.2"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="249.3" />
        </filter>
      </defs>
      <g filter="url(#bg-blob-blur)">
        <path
          d="M152.182 293.319C-12.8918 249.97 -135.683 425.412 -138 434H1479.72C1483.77 322.764 1480.53 112.806 1435.12 162.862C1378.36 225.432 1176.79 115.832 1073.12 100.292C969.439 84.7515 858.811 213.164 664.778 284.322C470.744 355.48 317.255 336.668 152.182 293.319Z"
          fill="#ADC0FA"
        />
      </g>
    </svg>
  );
};

const CardChrome: React.FC<{ progress: number }> = ({ progress }) => {
  const lift = interpolate(progress, [0, 1], [16, 0]);
  const scale = interpolate(progress, [0, 1], [0.985, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: CARD.x,
        top: CARD.y,
        width: CARD.w,
        height: CARD.h,
        opacity,
        transform: `translateY(${lift}px) scale(${scale})`,
        transformOrigin: "50% 50%",
        background: "rgba(255,255,255,0.86)",
        backdropFilter: "blur(8.8px)",
        WebkitBackdropFilter: "blur(8.8px)",
        border: "0.76px solid rgba(255,255,255,0.71)",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 30px 60px -20px rgba(60, 80, 160, 0.18), 0 8px 24px -8px rgba(60, 80, 160, 0.12)",
        borderRadius: 4,
        overflow: "hidden",
      }}
    />
  );
};

/**
 * A footer-text stage. Each stage declares the text the headline should
 * display by the end of its window. Transitions between consecutive
 * stages are computed automatically:
 *
 *   • If the new stage's text is a *prefix extension* of the previous,
 *     the difference types in (write phase).
 *   • If it's a *prefix truncation*, the difference backspaces (erase phase).
 *   • If they diverge after a common prefix, the divergent tail backspaces
 *     first, then the new tail types in — a single stage handles both.
 *
 * Letter-by-letter, frame-driven, with the same eased pacing as Scene 1's
 * original typewriter so the whole banner feels like one continuous voice.
 */
export type FooterStage = {
  /** What the headline should read once this stage's transition completes. */
  toText: string;
  /** Frame at which the transition into `toText` begins. */
  start: number;
  /** Frames over which the transition completes. */
  duration: number;
};

const CardFooter: React.FC<{
  progress: number;
  stages: FooterStage[];
}> = ({ progress, stages }) => {
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const frame = useCurrentFrame();

  // ── Footer-text staged transition mechanics ────────────────────────
  // Each stage advances the headline from the previous stage's `toText`
  // to its own `toText`. Three layers of polish on top of basic
  // char-count interpolation:
  //
  //   1. Eased progression — Material-standard (0.4, 0, 0.2, 1). Letters
  //      ease into the message, find rhythm through the middle, settle
  //      into the final character. Linear reads mechanical / robotic.
  //
  //   2. Fractional opacity — the in-flight character (whichever one is
  //      mid-transition: appearing during a write, disappearing during
  //      a backspace) renders at fractional opacity. No position change.
  //
  //   3. Sin-pulsed cursor with per-stage trapezoidal envelopes — caret
  //      eases in 4 frames before each stage, pulses softly during the
  //      transition, eases out 12 frames after. The envelopes are
  //      union-maxed so the cursor stays continuous when stages overlap
  //      in time and disappears during quiet holds between them.
  // ───────────────────────────────────────────────────────────────────
  const easedFraction = (t: number) =>
    interpolate(t, [0, 1], [0, 1], {
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // Resolve which stage is currently active (latest stage whose start ≤ frame).
  let active = -1;
  for (let i = 0; i < stages.length; i++) {
    if (frame >= stages[i].start) active = i;
  }

  // Resolve visibleText + which char (if any) is "in-flight".
  // baseLength = count of leading chars rendered at full opacity.
  // Any char at index >= baseLength inside visibleText is the in-flight one.
  let visibleText = "";
  let baseLength = 0;
  let inFlightOpacity = 1;

  if (active >= 0) {
    const stage = stages[active];
    const fromText = active === 0 ? "" : stages[active - 1].toText;
    const toText = stage.toText;

    if (frame >= stage.start + stage.duration) {
      // Past the stage's window — settle on its target text.
      visibleText = toText;
      baseLength = toText.length;
      inFlightOpacity = 1;
    } else {
      const linearProgress =
        stage.duration > 0 ? (frame - stage.start) / stage.duration : 1;
      const eased = easedFraction(linearProgress);

      // Common prefix: chars that are identical between fromText and toText
      // and stay anchored throughout the transition.
      let commonLen = 0;
      while (
        commonLen < fromText.length &&
        commonLen < toText.length &&
        fromText[commonLen] === toText[commonLen]
      ) {
        commonLen++;
      }

      const backspaceCount = fromText.length - commonLen;
      const writeCount = toText.length - commonLen;
      const totalChars = backspaceCount + writeCount;

      if (totalChars === 0) {
        visibleText = toText;
        baseLength = toText.length;
        inFlightOpacity = 1;
      } else {
        const exact = eased * totalChars;
        const animated = Math.floor(exact);
        const partial = exact - animated;

        if (animated < backspaceCount) {
          // Erase phase — last visible char is fading out 1 → 0.
          const visibleLen = fromText.length - animated;
          visibleText = fromText.slice(0, visibleLen);
          baseLength = Math.max(0, visibleLen - 1);
          inFlightOpacity = 1 - partial;
        } else {
          // Write phase — next char is fading in 0 → 1.
          const writeChars = animated - backspaceCount;
          const baseLen = commonLen + writeChars;
          if (partial > 0 && baseLen < toText.length) {
            visibleText = toText.slice(0, baseLen + 1);
            baseLength = baseLen;
            inFlightOpacity = partial;
          } else {
            visibleText = toText.slice(0, baseLen);
            baseLength = baseLen;
            inFlightOpacity = 1;
          }
        }
      }
    }
  }

  // Cursor envelope: union-max of per-stage trapezoidal envelopes.
  // Each stage's envelope rises 4 frames before its start, holds at 1
  // through its end, falls over 12 frames after. Stages whose envelopes
  // overlap merge naturally (Math.max). Stages with quiet holds between
  // them let the cursor fade out and back in.
  const stageEnvelopes = stages.map((s) =>
    interpolate(
      frame,
      [s.start - 4, s.start, s.start + s.duration, s.start + s.duration + 12],
      [0, 1, 1, 0],
      {
        easing: Easing.bezier(0.32, 0.72, 0.37, 1),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    )
  );
  const cursorEnvelope =
    stageEnvelopes.length > 0 ? Math.max(...stageEnvelopes) : 0;
  const cursorPulse = 0.4 + 0.5 * Math.abs(Math.sin(frame * 0.25));
  const cursorOpacity = cursorEnvelope * cursorPulse;
  const showCursor = stages.length > 0 && cursorOpacity > 0.01;

  return (
    <div
      style={{
        position: "absolute",
        left: CARD.x,
        top: CARD.y,
        width: CARD.w,
        height: CARD.h,
        opacity,
        pointerEvents: "none",
      }}
    >
      {/* Headline above the divider — what this scene is "best at" */}
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          top: 516 - CARD.y,
          fontFamily: INTER,
          fontSize: 12,
          fontWeight: 500,
          color: "#454545",
          letterSpacing: -0.05,
          lineHeight: 1.2,
          whiteSpace: "pre",
        }}
      >
        {visibleText.split("").map((ch, i) => {
          if (i < baseLength) {
            return <span key={i}>{ch}</span>;
          }
          // In-flight char: opacity fades 0 → 1 (write) or 1 → 0 (erase).
          return (
            <span key={i} style={{ opacity: inFlightOpacity }}>
              {ch}
            </span>
          );
        })}
        {showCursor ? (
          <span style={{ opacity: cursorOpacity }}>|</span>
        ) : null}
      </div>

      {/* Divider line */}
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 17,
          top: 542 - CARD.y,
          height: 1,
          background: "#F3F3F3",
        }}
      />

      {/* Action row — plus icon (left) + arrow icon (right), evenly spread */}
      <div
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          top: 560 - CARD.y,
          height: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <CirclePlus size={18} color="#A8A8A8" strokeWidth={1.6} />
        <Send size={14} color="#A8A8A8" strokeWidth={1.6} />
      </div>
    </div>
  );
};

export const BannerStage: React.FC<{
  children: React.ReactNode;
  cardEntryStart?: number;
  cardEntryDuration?: number;
  showFooter?: boolean;
  /**
   * If false, suppresses the soft blue background blob and the faint
   * white grid lines, leaving only the white canvas + glass card +
   * scene content. Useful for rendering a "clean" version of the
   * banner where the chrome around the card isn't desired. Default true.
   */
  showBackground?: boolean;
  /**
   * Sequence of footer text stages. Each stage transitions from the
   * previous stage's text to its own `toText` over [start, start+duration].
   * Backspace + retype is computed automatically via common-prefix detection.
   */
  footerStages?: FooterStage[];
  /** Legacy single-stage API — kept for backward compat with Scene1PD's
   *  original signature. Equivalent to `footerStages: [{ toText: footerText,
   *  start: footerWriteStart, duration: footerWriteDuration ?? 60 }]`. */
  footerText?: string;
  /** Legacy. */
  footerWriteStart?: number;
  /** Legacy. */
  footerWriteDuration?: number;
}> = ({
  children,
  cardEntryStart = 6,
  cardEntryDuration = 24,
  showFooter = true,
  showBackground = true,
  footerStages,
  footerText,
  footerWriteStart,
  footerWriteDuration,
}) => {
  const frame = useCurrentFrame();

  // Resolve final stages: prefer the explicit array, else synthesize from
  // the legacy single-stage props for backward compat.
  const effectiveStages: FooterStage[] = footerStages
    ? footerStages
    : footerText != null && footerWriteStart != null
      ? [
          {
            toText: footerText,
            start: footerWriteStart,
            duration: footerWriteDuration ?? 60,
          },
        ]
      : footerText != null
        ? [{ toText: footerText, start: 0, duration: 0 }]
        : [];

  const cardProgress = interpolate(
    frame,
    [cardEntryStart, cardEntryStart + cardEntryDuration],
    [0, 1],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const contentProgress = interpolate(
    frame,
    [cardEntryStart + 12, cardEntryStart + cardEntryDuration + 6],
    [0, 1],
    {
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill style={{ background: "#ffffff" }}>
      {showBackground ? <BackgroundBlob /> : null}
      {showBackground ? <GridLines /> : null}
      <CardChrome progress={cardProgress} />
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          overflow: "hidden",
          opacity: contentProgress,
          transform: `translateY(${interpolate(contentProgress, [0, 1], [6, 0])}px)`,
          borderRadius: 4,
        }}
      >
        {children}
      </div>
      {showFooter ? (
        <CardFooter progress={contentProgress} stages={effectiveStages} />
      ) : null}
    </AbsoluteFill>
  );
};
