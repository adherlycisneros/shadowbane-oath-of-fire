import { useEffect } from "react";
import styles from "./WhisperOverlay.module.css";

export default function WhisperOverlay({ phrase, onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 7500); // auto-dismiss after 3.5s
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={styles.overlay}>
      <div className={styles.fog}></div>
      <div className={styles.phrase}>
        <em>{phrase}</em>
      </div>
    </div>
  );
}
