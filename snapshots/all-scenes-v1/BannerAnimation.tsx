import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { BannerStage, CARD, type FooterStage } from "./BannerStage";
import { WorkArea as Scene1WorkArea } from "./scenes/Scene1PD";
import { Scene2Header, Scene2WorkArea } from "./scenes/Scene2SD";
import { Scene3Header, Scene3WorkArea } from "./scenes/Scene3Staffing";
import {
  Scene4Header,
  Scene4WorkArea,
  SCENE4_END_FRAME,
} from "./scenes/Scene4IT";

/* ────────────────────────────────────────────────────────────────────────────
 * BannerAnimation — the full continuous banner.
 *
 * Sequences:
 *   Scene 1 (Proposal Development)
 *     → bridge → Scene 2 (Software Development)
 *     → bridge → Scene 3 (Staffing — Precision Hiring)
 *     → bridge → Scene 4 (IT Support — Resolving Tech Tickets)
 *
 * Each bridge does the same dance: outgoing scene's content fades out,
 * footer's tail erases back to the "Best at " prefix, incoming scene's
 * chrome + work-area content fade in, footer's new tail types in.
 *
 * The shared chrome — background blob, glass card, header-band tint, divider,
 * action icons — never crossfades. Only the *content inside* the card changes
 * (and the chrome bits sitting on top of the header band: nav skeletons →
 * macOS controls → nav skeletons + search bar → nav skeletons again). That's
 * what makes the whole thing read as one continuous voice rather than scenes
 * stitched together.
 * ──────────────────────────────────────────────────────────────────────── */

const SOFT_OUT = Easing.bezier(0.32, 0.72, 0.37, 1);

const lx = (x: number) => x - CARD.x;
const ly = (y: number) => y - CARD.y;

const T = {
  // Scene 1 holds final state, then fades out for the Scene 1 → 2 bridge.
  scene1FadeOutStart: 280,
  scene1FadeOutEnd: 320,

  // Scene 2 → Scene 3 bridge: Scene 2's macOS chrome fades out as Scene 3's
  // nav-bar + search-bar chrome fades in. Scene 2's Frame 3 (the kanban
  // dashboard) fades out via its own internal envelope (T_SCENE2.f3FadeOut).
  scene2HeaderFadeOutStart: 720,
  scene2HeaderFadeOutEnd: 770,

  // Scene 3 → Scene 4 bridge: Scene 3's success state + search-bar chrome
  // fade out as Scene 4's plain nav-rect chrome fades back in. Scene 3's
  // Frame 3Success doesn't have its own fade-out, so we gate the whole
  // Scene 3 work area behind this envelope.
  scene3FadeOutStart: 1200,
  scene3FadeOutEnd: 1240,

  // Footer text staged transitions across all four scenes.
  footer: {
    // Stage 1 — Initial type-in of "Best at Crafting Proposals" with paper.
    s1WriteStart: 38,
    s1WriteDuration: 100,
    // Stage 2 — Backspace down to "Best at " (Scene 1 → 2 bridge).
    s12BackspaceStart: 295,
    s12BackspaceDuration: 35,
    // Stage 3 — Retype tail "Delivering Software Solutions" (Scene 2).
    s2WriteStart: 340,
    s2WriteDuration: 70,
    // Stage 4 — Backspace down to "Best at " (Scene 2 → 3 bridge).
    s23BackspaceStart: 720,
    s23BackspaceDuration: 50,
    // Stage 5 — Retype tail "Precision Hiring" (Scene 3).
    s3WriteStart: 790,
    s3WriteDuration: 40,
    // Stage 6 — Backspace down to "Best at " (Scene 3 → 4 bridge).
    s34BackspaceStart: 1210,
    s34BackspaceDuration: 40,
    // Stage 7 — Retype tail "Providing IT Support" (Scene 4).
    s4WriteStart: 1265,
    s4WriteDuration: 50,
  },

  // Total composition duration — extends through Scene 4's hold.
  end: SCENE4_END_FRAME,
} as const;

export const BANNER_DURATION = T.end;

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

/* ── Shared inner-area background (F7F7F7 + header band tint) ─────────
 * Constant across both scenes. Only the chrome content rendered *above*
 * the header tint changes (Scene 1 nav skeletons → Scene 2 traffic lights). */
const SharedInnerBackground: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        left: lx(545),
        top: ly(141),
        width: 353,
        height: 355,
        background: "#F7F7F7",
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

/* ── Scene 1's header chrome — pair of white nav skeletons.
 * Lives on top of the header band tint. Crossfades out as Scene 2's
 * traffic-light chrome crossfades in. */
const Scene1Header: React.FC = () => (
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

export const BannerAnimation: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene 1 visibility: 1 from start through frame 280, fades to 0 by 320.
  // Wraps Scene1Header + Scene1WorkArea so they fade together as a unit.
  const scene1Vis = interpolate(
    frame,
    [T.scene1FadeOutStart, T.scene1FadeOutEnd],
    [1, 0],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Scene 2's chrome (macOS controls + title bar) fades out for Scene 3.
  // Scene 2's WorkArea has its own internal fade-out (Frame3Kanban's f3FadeOut)
  // so we don't double-wrap it — only the chrome bits need this gate.
  const scene2HeaderVis = interpolate(
    frame,
    [T.scene2HeaderFadeOutStart, T.scene2HeaderFadeOutEnd],
    [1, 0],
    {
      easing: SOFT_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Scene 3's chrome + work area both fade out together for the Scene 3 → 4
  // bridge. Scene 3's success state doesn't have an internal fade-out, so we
  // gate the entire Scene 3 subtree behind this single visibility value.
  const scene3Vis = interpolate(
    frame,
    [T.scene3FadeOutStart, T.scene3FadeOutEnd],
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
      {/* Always-visible base — F7F7F7 inner area + header band tint */}
      <SharedInnerBackground />

      {/* Scene 1 — chrome + document, both fade out together */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: scene1Vis,
          pointerEvents: "none",
        }}
      >
        <Scene1Header />
        <Scene1WorkArea />
      </div>

      {/* Scene 2 — chrome (macOS controls) gated by scene2HeaderVis so it
          fades out at the Scene 2 → 3 bridge; work area handles its own
          internal frame-by-frame visibility. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: scene2HeaderVis,
          pointerEvents: "none",
        }}
      >
        <Scene2Header />
      </div>
      <Scene2WorkArea />

      {/* Scene 3 — nav-bar + search-bar chrome and candidate list, fade in
          via their own internal envelopes; whole subtree fades out together
          for the Scene 3 → 4 bridge. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: scene3Vis,
          pointerEvents: "none",
        }}
      >
        <Scene3Header />
        <Scene3WorkArea />
      </div>

      {/* Scene 4 — nav-rect chrome (no search bar) and IT-support frame
          sequence, fade in via their own internal envelopes. */}
      <Scene4Header />
      <Scene4WorkArea />
    </BannerStage>
  );
};
