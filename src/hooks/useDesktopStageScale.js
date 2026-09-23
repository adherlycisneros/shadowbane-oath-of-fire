import { useEffect } from "react";

// Desktop cinematic stage (see global.css). The accepted 932x430 landscape composition is the
// game's logical surface; on desktop-class viewports it is scaled up uniformly and centred in
// a charcoal frame. This hook derives that scale from the window and publishes it as
// `--stage-scale` on the frame element. Phones never match the query, so the frame and stage
// stay `display: contents` there and nothing changes.
export const DESKTOP_STAGE_QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

const LOGICAL_WIDTH = 932;
const LOGICAL_HEIGHT = 430;
// Cap: 1.6 keeps sprites within their source resolution and leaves a visible frame on large
// monitors instead of a wall-to-wall painting.
const MAX_SCALE = 1.6;
const GUTTER_X = 64;
const GUTTER_Y = 48;

export default function useDesktopStageScale(frameRef) {
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia(DESKTOP_STAGE_QUERY);

    const apply = () => {
      if (!query.matches) {
        frame.style.removeProperty("--stage-scale");
        return;
      }
      const scale = Math.min(
        MAX_SCALE,
        (window.innerWidth - GUTTER_X) / LOGICAL_WIDTH,
        (window.innerHeight - GUTTER_Y) / LOGICAL_HEIGHT
      );
      frame.style.setProperty("--stage-scale", scale.toFixed(4));
    };

    apply();
    window.addEventListener("resize", apply);
    query.addEventListener("change", apply);
    return () => {
      window.removeEventListener("resize", apply);
      query.removeEventListener("change", apply);
    };
  }, [frameRef]);
}
