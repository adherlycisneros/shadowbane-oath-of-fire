import styles from "./CombatNotice.module.css";

// A single transient line pinned just above a room's action bar (see hooks/useNotice).
// Place it inside the room's positioned actions container.
export default function CombatNotice({ notice }) {
  return (
    <div className={styles.notice} role="status" aria-live="polite">
      {notice && <span key={notice.id}>{notice.text}</span>}
    </div>
  );
}
