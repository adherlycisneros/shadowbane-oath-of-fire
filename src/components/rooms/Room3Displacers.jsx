import { useState, useEffect } from "react";
import { characterStates } from "../../data/characterData";
import EnemyHUD from "../EnemyHUD";
import EnemyCard from "../EnemyCard";
import ChampionCard from "../ChampionCard";
import ChampionHUD from "../ChampionHUD";
import styles from "./Room3Displacers.module.css";

export default function Room3Displacers({
  darklordHealth,
  chxospixieHealth,
  chxospixieStamina,
  setDarklordHealth,
  setChxospixieHealth,
  setChxospixieStamina,
  setCanContinue,
  isPolymorphed,
  darklordDead,
  chxospixieDead,
}) {
  const [enemyHealth, setEnemyHealth] = useState(1); //180 health
  const [enemyDefeated, setEnemyDefeated] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [enemyPose, setEnemyPose] = useState("idle");
  const [actionDisabled, setActionDisabled] = useState(false);

  const [darklordPose, setDarklordPose] = useState("idle");
  const [chxospixiePose, setChxospixiePose] = useState("idle");

  const stateKey = isPolymorphed ? "polymorphed" : "normal";
  const darklord = characterStates.Darklord[stateKey];
  const chxospixie = characterStates.Chxospixie[stateKey];

  const isGameOver = darklordDead && chxospixieDead;
  const enemyMaxHealth = 180;

  const [floatingDamage, setFloatingDamage] = useState(null);

  const triggerRedFlash = () => {
    setShowRedFlash(true);
    setTimeout(() => setShowRedFlash(false), 300);
  };

  useEffect(() => {
    if (enemyHealth <= 0) {
      const timer = setTimeout(() => {
        setEnemyDefeated(true);
        setTimeout(() => setCanContinue(true), 1500);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [enemyHealth, setCanContinue]);

  const showDamage = (damage, target) => {
    setFloatingDamage({ value: damage, target });
    setTimeout(() => setFloatingDamage(null), 1800);
  };

  const dealDamage = (damage, attacker) => {
    if (enemyDefeated || isGameOver || actionDisabled) return;

    setActionDisabled(true);
    const poseSetter = attacker === "Darklord" ? setDarklordPose : setChxospixiePose;
    const isDead = attacker === "Darklord" ? darklordDead : chxospixieDead;

    poseSetter("attack");

    setTimeout(() => {
      poseSetter(isDead ? "dead" : "idle");

      setEnemyHealth((prev) => {
        const newHealth = Math.max(prev - damage, 0);
        showDamage(damage, "enemy");

        if (newHealth > 0) {
          setTimeout(() => {
            setEnemyPose("attack");
            setTimeout(() => {
              enemyAttack(attacker);
              setEnemyPose("idle");
              setActionDisabled(false);
            }, 1000);
          }, 2000);
        } else {
          setActionDisabled(false);
        }
        return newHealth;
      });
    }, 1000);
  };

  const enemyAttack = (attacker) => {
    if (enemyDefeated || isGameOver) return;

    const targets = [];
    if (!darklordDead) targets.push("Darklord");
    if (!chxospixieDead) targets.push("Chxospixie");

    if (targets.length === 0) return;

    let target;
    if (targets.includes(attacker)) {
      target = attacker;
    } else {
      target = targets.find(t => t !== attacker);
    }

    if (!target) return;

    const damage = Math.floor(Math.random() * 6) + 10;

    if (target === "Darklord") {
      setDarklordHealth((prev) => Math.max(prev - damage, 0));
      triggerRedFlash();
      showDamage(damage, "Darklord");
    } else {
      setChxospixieHealth((prev) => Math.max(prev - damage, 0));
      triggerRedFlash();
      showDamage(damage, "Chxospixie");
    }
  };

  const enemySpritePath =
    enemyPose === "attack"
      ? "/assets/sprites/enemies/room3/displacer-attack.png"
      : "/assets/sprites/enemies/room3/displacer-idle.png";

  return (
    <div className={`${styles.roomBackground} fullscreen-fit`}>
      {showRedFlash && <div className={styles.redFlash} />}

      <div className={styles.battlefield}>
        <div className={styles.leftSide}>
          <div className={styles.championWrapper}>
            <ChampionCard
              championKey="Darklord"
              pose={darklordDead ? "dead" : darklordPose}
              isDead={darklordDead}
              isPolymorphed={isPolymorphed}
              size="large"
            />
            {floatingDamage?.target === "Darklord" && (
              <div className={`${styles.floatingDamage} ${floatingDamage.status ? styles.status : ""}`}>
                {floatingDamage.status ? floatingDamage.value : `-${floatingDamage.value}`}
              </div>
            )}
          </div>

          <div className={styles.championWrapper}>
            <ChampionCard
              championKey="Chxospixie"
              pose={chxospixieDead ? "dead" : chxospixiePose}
              isDead={chxospixieDead}
              isPolymorphed={isPolymorphed}
              size="large"
            />
            {floatingDamage?.target === "Chxospixie" && (
              <div className={`${styles.floatingDamage} ${floatingDamage.status ? styles.status : ""}`}>
                {floatingDamage.status ? floatingDamage.value : `-${floatingDamage.value}`}
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.rightSide} ${styles.specificrightSide}`}>
          <div className={styles.enemyWrapper}>
            <EnemyCard
              enemyName="Twin Displacer Beasts"
              spritePath={enemySpritePath}
              size="xlarge"
              isDead={enemyDefeated}
            />
            {floatingDamage?.target === "enemy" && (
              <div className={`${styles.floatingDamage} ${floatingDamage.dodge ? styles.dodge : ""}`}>
                {floatingDamage.dodge ? "Dodge" : `-${floatingDamage.value}`}
              </div>
            )}
          </div>

          {!enemyDefeated && (
            <EnemyHUD
              enemyName="Twin Displacer Beasts"
              health={enemyHealth}
              maxHealth={enemyMaxHealth}
              isDead={enemyDefeated}
            />
          )}
        </div>
      </div>

      <ChampionHUD
        darklordHealth={darklordHealth}
        chxospixieHealth={chxospixieHealth}
        darklordDead={darklordDead}
        chxospixieDead={chxospixieDead}
        chxospixieStamina={chxospixieStamina}
        chxospixieMaxStamina={60}
        isPolymorphed={isPolymorphed}
      />

      <div className={`${styles.actionsContainer} ${styles.actionsContainerFeedback}`}>
        <div className={styles.actionsInner}>
          {enemyDefeated ? (
            <span className={styles.feedbackText}>✨ Displacers defeated! Safe passage unlocked! ✨</span>
          ) : (
            <div className={styles.actionsInnerRow}>
              <div className={styles.actionGroup}>
                <h4>{darklord.displayName}'s Actions:</h4>
                <div className={styles.actionButtonsRow}>
                  {darklord.moves.map((move) => (
                    <button
                      key={move.name}
                      className={`${styles.actionButton} ${actionDisabled || darklordDead ? styles.disabled : ""}`}
                      disabled={actionDisabled || darklordDead}
                      onClick={() => dealDamage(move.damage, "Darklord", move.name)}
                    >
                      {move.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.actionGroup}>
                <h4>{chxospixie.displayName}'s Actions:</h4>
                <div className={styles.actionButtonsRow}>
                  {chxospixie.moves.map((move) => {
                    const staminaBlocked = move.staminaCost && chxospixieStamina < move.staminaCost;
                    const isDisabled = chxospixieDead || actionDisabled || staminaBlocked;

                    return (
                      <button
                        key={move.name}
                        className={`${styles.actionButton} ${isDisabled ? styles.disabled : ""}`}
                        disabled={isDisabled}
                        onClick={() => {
                          dealDamage(move.damage, "Chxospixie", move.name);
                          if (move.staminaCost) {
                            setChxospixieStamina((s) => Math.max(s - move.staminaCost, 0));
                          }
                        }}
                      >
                        {move.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
