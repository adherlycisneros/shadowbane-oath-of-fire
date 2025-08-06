import { useState, useEffect } from "react";

export default function OrientationWrapper({ children }) {
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  useEffect(() => {
    let resizeTimeout;

    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setIsLandscape(window.innerWidth > window.innerHeight);
      }, 150);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  if (!isLandscape) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        tabIndex={-1}
        style={{
          position: "fixed",
          inset: 0,
          background: "url('/assets/textures/aged-paper.png') repeat, radial-gradient(circle at center, #3b1f1f 0%, #0f0707 100%)",
          backgroundBlendMode: "overlay",
          color: "#ffdf9e",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "2rem",
          zIndex: 9999,
          fontFamily: "'Cinzel', Georgia, serif",
          letterSpacing: "0.05em",
          textShadow: "0 0 8px rgba(255, 140, 0, 0.6), 0 0 16px rgba(255, 50, 0, 0.4)",
          userSelect: "none",
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
    );
  }

  return <>{children}</>;
}
