// src/components/EnemyHUD.jsx  FOR ENEMY NAMES AND HEALTH BARS 
import styles from "./EnemyHUD.module.css";

export default function EnemyHUD({ enemyName, health, maxHealth = 100, isDead = false }) {
  const healthPercentage = Math.max(0, (health / maxHealth) * 100);

  return (
    <div className={styles.enemyHUDContainer}>
      <div className={styles.enemyName}>{enemyName}{isDead ? " ☠️" : ""}</div>
      <div className={styles.healthBarContainer}>
        <div
          className={styles.healthBarFill}
          style={{ width: `${healthPercentage}%` }}
        />
      </div>
    </div>
  );
}
