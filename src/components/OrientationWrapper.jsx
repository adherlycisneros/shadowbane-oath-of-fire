import { useEffect, useRef, useState } from "react";
import { OrientationGateContext } from "../orientationGate";

const PORTRAIT_QUERY = "(orientation: portrait)";
// Devices driven by a mouse/trackpad are exempt: a tall browser window on a laptop
// is not a phone that needs rotating.
const DESKTOP_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

function mediaMatches(query) {
  return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
}

function computeNeedsRotation() {
  const isPortrait =
    typeof window.matchMedia === "function"
      ? mediaMatches(PORTRAIT_QUERY)
      : window.innerHeight >= window.innerWidth;
  return isPortrait && !mediaMatches(DESKTOP_POINTER_QUERY);
}

export default function OrientationWrapper({ children }) {
  const [needsRotation, setNeedsRotation] = useState(computeNeedsRotation);
  const overlayRef = useRef(null);

  useEffect(() => {
    let resizeTimeout;
    const update = () => setNeedsRotation(computeNeedsRotation());
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(update, 150);
    };

    const queries =
      typeof window.matchMedia === "function"
        ? [window.matchMedia(PORTRAIT_QUERY), window.matchMedia(DESKTOP_POINTER_QUERY)]
        : [];
    queries.forEach((query) => query.addEventListener("change", update));
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      clearTimeout(resizeTimeout);
      queries.forEach((query) => query.removeEventListener("change", update));
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  // Land keyboard / screen-reader focus on the message when it appears.
  useEffect(() => {
    if (needsRotation && overlayRef.current) overlayRef.current.focus();
  }, [needsRotation]);

  return (
    <OrientationGateContext.Provider value={needsRotation}>
      {/* The game stays mounted behind the gate so rotating never loses progress. */}
      <div style={{ display: "contents" }} inert={needsRotation}>
        {children}
      </div>

      {needsRotation && (
        <div
          ref={overlayRef}
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          style={{
            position: "fixed",
            inset: 0,
            background: "url('/assets/textures/aged-paper.webp') repeat, radial-gradient(circle at center, #3b1f1f 0%, #0f0707 100%)",
            backgroundBlendMode: "overlay",
            color: "#ffdf9e",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "2rem",
            zIndex: 9999,
            fontFamily: "'Quintessential', Georgia, serif",
            letterSpacing: "0.05em",
            textShadow: "0 0 8px rgba(255, 140, 0, 0.6), 0 0 16px rgba(255, 50, 0, 0.4)",
            userSelect: "none",
            outline: "none",
          }}
        >
          <div
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              border: "2px solid #a13c1e",
              padding: "2rem",
              borderRadius: "12px",
              boxShadow: "0 0 20px rgba(255, 80, 0, 0.4)",
              maxWidth: "600px",
              animation: "pulseGlow 2s infinite",
            }}
          >
            <p style={{ fontSize: "1.9rem", marginBottom: "1rem" }}>
              🔄 Rotate Thy Device
            </p>
            <p style={{ fontSize: "1.2rem", lineHeight: 1.5 }}>
              The path through Shadowbane’s dungeons is best walked in <strong>landscape</strong>.  
              Turn your device, brave hero, and continue your quest.
            </p>
          </div>

          <style>
            {`
              @keyframes pulseGlow {
                0% {
                  box-shadow: 0 0 10px rgba(255, 80, 0, 0.4);
                }
                50% {
                  box-shadow: 0 0 25px rgba(255, 120, 0, 0.7);
                }
                100% {
                  box-shadow: 0 0 10px rgba(255, 80, 0, 0.4);
                }
              }
            `}
          </style>
        </div>
      )}
    </OrientationGateContext.Provider>
  );
}
