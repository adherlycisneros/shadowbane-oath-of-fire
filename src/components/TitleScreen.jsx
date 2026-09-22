import styles from "./TitleScreen.module.css";

// Title music is requested by the game's music hook; the first real tap or click anywhere
// (this screen included) is what unlocks it. See audio/musicManager.js.
export default function TitleScreen({ onStart }) {
  return (
    <div className={`${styles.container} fullscreen-fit`}>
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
