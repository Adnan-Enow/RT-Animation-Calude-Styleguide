import "./index.css";
import { Composition } from "remotion";
import { Scene1PD, SCENE1_PD_DURATION } from "./scenes/Scene1PD";
import { BannerAnimation, BANNER_DURATION } from "./BannerAnimation";

/**
 * Banner geometry — every scene shares this stage.
 *  1452 × 709 matches the source design SVGs (banner aspect at the proposal
 *  development hero). 30fps is the project default.
 *
 * Compositions:
 *   • Banner    — the full continuous banner (Scene 1 → Scene 2 + footer
 *                 backspace/retype). This is the "real" video.
 *   • Scene1-PD — Scene 1 in isolation. Kept as the snapshot-verification
 *                 composition; matches snapshots/scene1-final/ frame-for-frame.
 */
const WIDTH = 1452;
const HEIGHT = 709;
const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Banner"
        component={BannerAnimation}
        durationInFrames={BANNER_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="Scene1-PD"
        component={Scene1PD}
        durationInFrames={SCENE1_PD_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
