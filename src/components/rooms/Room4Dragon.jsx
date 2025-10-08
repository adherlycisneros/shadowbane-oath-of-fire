import { useState, useEffect } from "react";
import { characterStates } from "../../data/characterData";
import EnemyHUD from "../EnemyHUD";
import EnemyCard from "../EnemyCard";
import ChampionHUD from "../ChampionHUD";
import ChampionCard from "../ChampionCard";
import styles from "./Room4Dragon.module.css";
import shared from "./Room3Displacers.module.css";

export default function Room4Dragon({
  darklordHealth,
  chxospixieHealth,
  chxospixieStamina,
  setDarklordHealth,
  setChxospixieHealth,
  setChxospixieStamina,
  setActionLog,
  dragonAwakened,
  setDragonAwakened,
  setCanContinue,
  isPolymorphed,
  darklordDead,
  chxospixieDead
}) {
  const [enemyHealth, setEnemyHealth] = useState(300);
  const [enemyDefeated, setEnemyDefeated] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [enemyPose, setEnemyPose] = useState("idle");
  const [actionDisabled, setActionDisabled] = useState(false);
  const [fightStarted, setFightStarted] = useState(false);

  const [darklordPose, setDarklordPose] = useState("idle");
  const [chxospixiePose, setChxospixiePose] = useState("idle");

  const [floatingDamage, setFloatingDamage] = useState([]);

  const stateKey = isPolymorphed ? "polymorphed" : "normal";
  const darklord = characterStates.Darklord[stateKey];
  const chxospixie = characterStates.Chxospixie[stateKey];

  const isGameOver = darklordDead && chxospixieDead;
  const enemyMaxHealth = 300;

  const awakenDragon = () => {
    setDragonAwakened(true);
    setEnemyPose("attack");
    setTimeout(() => setEnemyPose("idle"), 1000);
  }

  const triggerRedFlash = () => {
    setShowRedFlash(true);
    setTimeout(() => setShowRedFlash(false), 300);
  };

  const showAction = (text, delay = 1600) => {
    setCanContinue(false);
    setActionLog([text]);
    setTimeout(() => {
      setActionLog([]);

      //Only continue if enemy defated 
      if (enemyDefeated) {
        setCanContinue(true);
      }
    }, delay);
  };

  useEffect(() => {
    setActionLog([]);
  }, [setActionLog]);

  const healOne = (character) => {
    if (character === "Darklord" && !darklordDead) {
      setDarklordHealth((h) => {
        const newHealth = Math.min(120, h + 120);
        showDamage("HP↑", "Darklord", "heal");
        return newHealth;
      });
    } else if (character === "Chxospixie" && !chxospixieDead) {
      setChxospixieHealth((h) => {
        const newHealth = Math.min(120, h + 120);
        showDamage("HP↑", "Chxospixie", "heal");
        return newHealth;
      });
    }
    setFightStarted(true);
  };

  const attemptDualHeal = () => {
    const wokeDragon = Math.random() < 0.5;
    if (wokeDragon) {
      awakenDragon(); //attack pose, idle pose transition
      setFightStarted(true);

      //simulate enemy attack delay
      setTimeout(() => {
        setActionDisabled(false);
      }, 1500);
    } else {
      if (!darklordDead) {
        setDarklordHealth((h) => {
          const newHealth = Math.min(120, h + 120);
          showDamage("HP↑", "Darklord", "heal");
          return newHealth;
        });
      }
      if (!chxospixieDead) {
        setChxospixieHealth((h) => {
          const newHealth = Math.min(120, h + 120);
          showDamage("HP↑", "Chxospixie", "heal");
          return newHealth;
        });
      }
      setFightStarted(true);
    }
  };

  useEffect(() => {
    if (enemyHealth <= 0) {
      const timer = setTimeout(() => {
        setEnemyDefeated(true);
        showAction(["✅ Amethyst Dragon Defeated!"]);
        setTimeout(() => setCanContinue(true), 1500);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [enemyHealth, setCanContinue, setActionLog]);

  const showDamage = (value, target, type = "damage") => {
    const id = Date.now() + Math.random(); //unique key 
    setFloatingDamage((prev) => [...prev, { id, value, target, type }]);
    setTimeout(() => {
      setFloatingDamage((prev) => prev.filter(d => d.id !== id));
    }, 1500);
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

    const damage = Math.floor(Math.random() * 11) + 20;

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
      ? "/assets/sprites/enemies/room4/dragon-attack.png"
      : "/assets/sprites/enemies/room4/dragon-idle.png";

  //RETURN FOR COMBAT VERSION
  if (dragonAwakened && !enemyDefeated) {
    return (
      <div className={`${styles.roomBackground2}`}>
        {showRedFlash && <div className={shared.redFlash} />}

        <div className={`${shared.battlefield} ${styles.battlefield}`}>
          <div className={shared.leftSide}>
            <div className={shared.championWrapper}>
              <ChampionCard
                championKey="Darklord"
                pose={darklordDead ? "dead" : darklordPose}
                isDead={darklordDead}
                isPolymorphed={isPolymorphed}
                size="large"
              />
              {floatingDamage.filter(d => d.target === "Darklord").map(d => (
                <div
                  key={d.id}
                  className={`${styles.heal} ${shared.floatingDamage} ${d.type === "heal" ? shared.heal : ""}`}
                >
                  {d.type === "heal" ? `+${d.value}` : `-${d.value}`}
                </div>
              ))}
            </div>

            <div className={shared.championWrapper}>
              <ChampionCard
                championKey="Chxospixie"
                pose={chxospixieDead ? "dead" : chxospixiePose}
                isDead={chxospixieDead}
                isPolymorphed={isPolymorphed}
                size="large"
              />
              {floatingDamage.filter(d => d.target === "Chxospixie").map(d => (
                <div
                  key={d.id}
                  className={`${styles.heal} ${shared.floatingDamage} ${d.type === "heal" ? shared.heal : ""}`}
                >
                  {d.type === "heal" ? `+${d.value}` : `-${d.value}`}
                </div>
              ))}
            </div>
          </div>
          <div className={shared.rightSide}>
            <div className={shared.enemyWrapper}>
              {/* Enemy HUD */}
              {!enemyDefeated && (
                <EnemyHUD
                  enemyName="Amethyst Dragon"
                  health={enemyHealth}
                  maxHealth={enemyMaxHealth}
                  isDead={enemyDefeated}
                />
              )}
              <EnemyCard
                enemyName="Amethyst Dragon"
                spritePath={enemySpritePath}
                size="cinematic"
                isDead={enemyDefeated}
                className={styles.dragonEnemy}
              />
              {floatingDamage.filter(d => d.target === "enemy").map(d => (
                <div
                  key={d.id}
                  className={`${styles.heal} ${shared.floatingDamage} ${d.dodge ? shared.dodge : ""}`}
                >
                  {d.dodge ? "Dodge" : `-${d.value}`}
                </div>
              ))}
            </div>
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
          <div className={`${shared.actionsContainer}`}>
            <div className={shared.actionsInnerRow}>
              <div className={shared.actionGroup}>
                <h4>{darklord.displayName}'s Actions:</h4>
                <div className={shared.actionButtonsRow}>
                  {darklord.moves.map((move) => (
                    <button
                      key={move.name}
                      className={`${shared.actionButton} ${actionDisabled || darklordDead ? shared.disabled : ""}`}
                      disabled={darklordDead}
                      onClick={() => dealDamage(move.damage, "Darklord", move.name)}
                    >
                      {move.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className={shared.actionGroup}>
                <h4>{chxospixie.displayName}'s Actions:</h4>
                <div className={shared.actionButtonsRow}>
                  {chxospixie.moves.map((move) => {
                    const staminaBlocked = move.staminaCost && chxospixieStamina < move.staminaCost;
                    const isDisabled = chxospixieDead || actionDisabled || staminaBlocked;

                    return (
                      <button
                        key={move.name}
                        className={`${shared.actionButton} ${isDisabled ? shared.disabled : ""}`}
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
          </div>
        )}
      </div>
    );
  }

  if (enemyDefeated) {
    return (
      <div className={`${styles.roomBackground2}`}>

      </div>
    )
  }

  return (
    <div className={`${styles.roomBackground1}`}>
      <div className={shared.battlefield}>
        <div className={`${shared.leftSide} ${styles.leftSide}`}>
          <div className={shared.championWrapper}>
            <ChampionCard
              championKey="Darklord"
              pose="idle"
              size="large"
            />
            {floatingDamage.filter(d => d.target === "Darklord").map(d => (
              <div
                key={d.id}
                className={`${styles.heal} ${shared.floatingDamage} ${d.type === "heal" ? shared.heal : ""}`}>
                {d.type === "heal" ? `${d.value}` : `-${d.value}`}
              </div>
            ))}

          </div>

          <div className={shared.championWrapper}>
            <ChampionCard
              championKey="Chxospixie"
              pose="idle"
              size="large"
            />
            {floatingDamage.filter(d => d.target === "Chxospixie").map(d => (
              <div
                key={d.id}
                className={`${styles.heal} ${shared.floatingDamage} ${d.type === "heal" ? shared.heal : ""}`}>
                {d.type === "heal" ? `${d.value}` : `-${d.value}`}
              </div>
            ))}
          </div>
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

      <div className={`${shared.actionsContainer} ${styles.actionsContainer}`}>
        <h4>The crystal glows softly.
          <br />
          Choose carefully:
        </h4>
        <button
          className={styles.actionButton}
          disabled={actionDisabled || darklordDead}
          onClick={() => {
            healOne("Darklord");
            setActionDisabled(true);
          }}
        >
          Heal Darklord (+50)
        </button>
        <button
          className={styles.actionButton}
          disabled={actionDisabled || chxospixieDead}
          onClick={() => {
            healOne("Chxospixie");
            setActionDisabled(true);
          }}
        >
          Heal Chxospixie (+50)
        </button>
        <button
          className={styles.actionButton}
          disabled={actionDisabled}
          onClick={() => {
            attemptDualHeal();
            setActionDisabled(true);
          }}
        >
          Heal both.
          <br />
          (⚠️ Might Disturb the Dragon)
        </button>
      </div>
    </div>
  );
}
