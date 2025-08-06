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
  setActionLog,
}) {
  const [enemyHealth, setEnemyHealth] = useState(180);
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

  const logAction = (entry) => {
    setActionLog([entry]);
  };

  useEffect(() => {
    setActionLog([]);
  }, [setActionLog]);

  useEffect(() => {
    if (enemyHealth <= 0) {
      const timer = setTimeout(() => {
        setEnemyDefeated(true);
        logAction(["✅ Displacers defeated!"]);
        setTimeout(() => setCanContinue(true), 1500);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [enemyHealth, setCanContinue, setActionLog]);

  const showDamage = (damage, target) => {
    setFloatingDamage({ value: damage, target });
    setTimeout(() => setFloatingDamage(null), 1500);
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

    // Determine valid targets
    const targets = [];
    if (!darklordDead) targets.push("Darklord");
    if (!chxospixieDead) targets.push("Chxospixie");

    if (targets.length === 0) return; // no one to attack

    // Attack the attacker if alive, otherwise the other target
    let target;
    if (targets.includes(attacker)) {
      target = attacker;
    } else {
    // attacker dead or invalid, pick the other alive target
      target = targets.find(t => t !== attacker);
    }

    if (!target) return; // safety check

    const damage = Math.floor(Math.random() * 6) + 10;
    // const moves = ["Tentacle Flurry", "Shadow Pounce", "Illusory Strikes"];
    // if (newHealth <= 0) setDarklordDead(true);

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
          <ChampionCard
            championKey="Darklord"
            pose={darklordDead ? "dead" : darklordPose}
            isDead={darklordDead}
            isPolymorphed={isPolymorphed}
            size="large"
          />
          {floatingDamage?.target === "Darklord" && (
            <div className={styles.floatingDamage}>-{floatingDamage.value}</div>
          )}

          <ChampionCard
            championKey="Chxospixie"
            pose={chxospixieDead ? "dead" : chxospixiePose}
            isDead={chxospixieDead}
            isPolymorphed={isPolymorphed}
            size="large"
          />
          {floatingDamage?.target === "Chxospixie" && (
            <div className={styles.floatingDamage}>-{floatingDamage.value}</div>
          )}
        </div>

        <div className={styles.rightSide}>
          <EnemyCard
            enemyName="Twin Displacer Beasts"
            spritePath={enemySpritePath}
            size="xlarge"
            isDead={enemyDefeated}
          />
          {floatingDamage?.target === "enemy" && (
            <div className={styles.floatingDamage}>-{floatingDamage.value}</div>
          )}
          <EnemyHUD
            enemyName="Twin Displacer Beasts"
            health={enemyHealth}
            maxHealth={enemyMaxHealth}
            isDead={enemyDefeated}
          />
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

      {!enemyDefeated && (
        <div className={styles.actionsContainer}>
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
                        if (staminaBlocked) {
                          logAction("Chxospixie is too exhausted!");
                        } else {
                          dealDamage(move.damage, "Chxospixie", move.name);
                          if (move.staminaCost) {
                            setChxospixieStamina((s) => s - move.staminaCost);
                          }
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
        </div>
      )}
    </div>
  );
}
