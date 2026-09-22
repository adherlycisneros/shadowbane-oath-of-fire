import { useEffect, useRef, useState } from "react";
import styles from "./OmenOverlay.module.css";

// The omen: shown once, after the intro of its room is dismissed. The words stay on
// screen until the player dismisses them, and the button only wakes after `minimumMs`.
export default function OmenOverlay({ phrase, onDismiss, minimumMs = 2500 }) {
  const [ready, setReady] = useState(false);
  const dialogRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const timer = setTimeout(() => setReady(true), minimumMs);
    return () => clearTimeout(timer);
  }, [minimumMs]);

  useEffect(() => {
    if (ready) buttonRef.current?.focus();
  }, [ready]);

  return (
    <div
      ref={dialogRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="omen-lead"
      aria-describedby="omen-words"
      tabIndex={-1}
    >
      <div className={styles.fog} aria-hidden="true" />
      <div className={styles.content}>
        <p id="omen-lead" className={styles.lead}>A dark omen brands itself into your memory...</p>
        <p id="omen-words" className={styles.phrase}>“{phrase}”</p>
        <p className={styles.tail}>Remember these words.</p>
        <button
          ref={buttonRef}
          type="button"
          className={styles.dismiss}
          disabled={!ready}
          onClick={onDismiss}
        >
          I will remember
        </button>
      </div>
    </div>
  );
}
