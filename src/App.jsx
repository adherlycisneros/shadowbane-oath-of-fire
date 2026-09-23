import { useRef } from "react";
import OrientationWrapper from "./components/OrientationWrapper";
import Game from "./Game";
import useDesktopStageScale from "./hooks/useDesktopStageScale";

export default function App() {
  const frameRef = useRef(null);
  useDesktopStageScale(frameRef);

  return (
    <OrientationWrapper>
      {/* Desktop cinematic stage: on phones both wrappers are `display: contents` (no layout
          effect). On desktop-class viewports the frame is the centred, scaled box and the stage
          is the game's logical 932x430 surface inside it (global.css, useDesktopStageScale). */}
      <div className="game-frame" ref={frameRef}>
        <div className="game-stage">
          <Game />
        </div>
      </div>
    </OrientationWrapper>
  );
}
