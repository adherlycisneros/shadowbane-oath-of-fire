import { useSyncExternalStore } from "react";
import { isMuted, subscribeMuted, toggleMuted } from "../audio/musicManager";
import styles from "./MuteButton.module.css";

// The one music control: a fixed icon button that mutes and unmutes the game's music.
// Mute state lives in audio/musicManager.js; this component only subscribes to it and
// forwards the tap, which the manager treats as the activation gesture that may unlock audio.
// It is rendered once from Game so it is present on the title screen, in every room, in
// combat, on the reward scene and in the epilogue. Behind the orientation gate the whole game
// subtree is inert, so the control is not reachable there either.
export default function MuteButton() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, isMuted);
  const label = muted ? "Unmute music" : "Mute music";

  return (
    <button
      type="button"
      className={`${styles.button} ${muted ? styles.muted : ""}`}
      data-music-control=""
      aria-label={label}
      title={label}
      onClick={toggleMuted}
    >
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 9.5v5h3.6L12 19V5L6.6 9.5H3z" fill="currentColor" />
        {muted ? (
          <path d="M16 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path
            d="M15.5 8.6a4.8 4.8 0 0 1 0 6.8M18.4 5.7a8.9 8.9 0 0 1 0 12.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}
