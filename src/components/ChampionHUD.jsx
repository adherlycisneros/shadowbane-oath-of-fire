import "../styles/cards.css";
import styles from "./ChampionHUD.module.css";
import { characterStates } from "../data/characterData";

export default function ChampionHUD({
  darklordHealth,
  chxospixieHealth,
  chxospixieStamina,
  chxospixieMaxStamina = 60,
  darklordDead,
  chxospixieDead,
  isPolymorphed = false,
}) {
  const stateKey = isPolymorphed ? "polymorphed" : "normal";
  
  const champions = [
    { key: "Darklord", health: darklordHealth, isDead: darklordDead },
    { key: "Chxospixie", health: chxospixieHealth, isDead: chxospixieDead },
  ];

  return (
    <div className={styles.hudContainer}>
      {champions.map(({ key, health, isDead }) => {
        const data = characterStates[key][stateKey];
        const maxHealth = data.maxHealth || 100;
        const healthPercentage = Math.min(100, Math.max(0, (health / maxHealth) * 100));

        const isChxospixie = key === "Chxospixie";
        const showStamina = isChxospixie && !isDead && chxospixieStamina !== undefined;
        const staminaPercentage = showStamina
          ? Math.min(100, Math.max(0, (chxospixieStamina / chxospixieMaxStamina) * 100))
          : 0;

        return (
          <div key={key} className={styles.hudEntry}>
            <span className={styles.hudName}>{data.displayName}</span>
            <div className={styles.barContainer}>
              <div
                className={styles.barBackground}
                title={`Health: ${health} / ${maxHealth}`}
              >
                <div
                  className={styles.healthBarFill}
                  style={{ width: `${healthPercentage}%` }}
                />
              </div>
              {showStamina && (
                <div
                  className={styles.barBackground}
                  title={`Stamina: ${chxospixieStamina} / ${chxospixieMaxStamina}`}
                >
                  <div
                    className={styles.staminaBarFill}
                    style={{ width: `${staminaPercentage}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
