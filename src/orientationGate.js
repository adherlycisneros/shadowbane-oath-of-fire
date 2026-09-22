import { createContext, useContext } from "react";

// Shared between OrientationWrapper (provider) and Game (consumer) so the game can
// pause its music while the "rotate your device" message is covering the screen.
export const OrientationGateContext = createContext(false);

export function useOrientationGate() {
  return useContext(OrientationGateContext);
}
