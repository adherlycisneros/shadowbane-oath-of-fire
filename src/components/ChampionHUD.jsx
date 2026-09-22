import "../styles/cards.css";
import styles from "./ChampionHUD.module.css";
import { characterStates } from "../data/characterData";

// Champion HUD: one card per champion. Both share the same health treatment; Chxospixie's
// stamina is a secondary strip attached below her health. Darklord's card simply ends after
// his health (health is his only resource), and the row is top-aligned so his card is never
// stretched to match hers. The stamina strip stays mounted while she is fallen (dimmed with the
// rest of her card) so the HUD footprint never changes with a death.
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
        const maxHealth = data.maxHealth || 200;
        const healthPercentage = Math.min(100, Math.max(0, (health / maxHealth) * 100));

        const showStamina = key === "Chxospixie" && chxospixieStamina !== undefined;
        const staminaPercentage = showStamina
          ? Math.min(100, Math.max(0, (chxospixieStamina / chxospixieMaxStamina) * 100))
          : 0;

        return (
          <div key={key} className={`${styles.hudEntry} ${isDead ? styles.fallen : ""}`}>
            <span className={styles.hudName}>
              {data.displayName}
              {isDead && <span className={styles.srOnly}> (fallen)</span>}
            </span>
            <div className={styles.barContainer}>
              <div
                className={styles.barBackground}
                role="progressbar"
                aria-label={`${data.displayName} health`}
                aria-valuemin={0}
                aria-valuemax={maxHealth}
                aria-valuenow={Math.max(0, health)}
                title={`Health: ${health} / ${maxHealth}`}
              >
                <div
                  className={styles.healthBarFill}
                  style={{ width: `${healthPercentage}%` }}
                />
              </div>
              {showStamina && (
                <div className={styles.staminaStrip}>
                  <div className={styles.barLabel} aria-hidden="true">
                    <span>Stamina</span>
                    <span className={styles.barValue}>
                      {chxospixieStamina} / {chxospixieMaxStamina}
                    </span>
                  </div>
                  <div
                    className={styles.barBackground}
                    role="progressbar"
                    aria-label={`${data.displayName} stamina`}
                    aria-valuemin={0}
                    aria-valuemax={chxospixieMaxStamina}
                    aria-valuenow={chxospixieStamina}
                    title={`Stamina: ${chxospixieStamina} / ${chxospixieMaxStamina}`}
                  >
                    <div
                      className={styles.staminaBarFill}
                      style={{ width: `${staminaPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
