import styles from "./TitleScreen.module.css";
import { firstInteractionRef } from "../firstInteractionRef";

export default function TitleScreen({ onStart }) {
  const handleFirstInteraction = () => {
    if (!firstInteractionRef.current) {
      try {
        const audio = new Audio("/assets/audio/title_screen.mp3");
        audio.loop = true;
        audio.volume = 0.35;
        // play inside user gesture to unlock audio on mobile
        audio.play().catch(() => {});
        firstInteractionRef.audio = audio;
      } catch (e) {
        // ignore; hook will try later
      }
      firstInteractionRef.current = true;
    }
  };

  return (
    <div
      className={`${styles.container} fullscreen-fit`}
      onClick={handleFirstInteraction}
      onTouchStart={handleFirstInteraction}
    >
      <h1 className={styles.title}>Shadowbane: Oath of Fire</h1>
      <p className={styles.subtitle}>
        Bound by oath, forged by fire, unbroken by fate.
      </p>
      <button
        className={styles.button}
        onClick={onStart}
      >
        Begin Your Journey
      </button>
    </div>
  );
}
