import styles from "./TitleScreen.module.css";

export default function TitleScreen({ onStart }) {
  return (
    <div className={`${styles.container} fullscreen-fit`}>
      <h1 className={styles.title}>Shadowbane: Oath of Fire</h1>
      <p className={styles.subtitle}>Bound by oath, forged by fire, unbroken by fate.</p>
      <button
        className={styles.button}
        onClick={onStart}
      >
        Begin Your Journey
      </button>
    </div>
  );
}
