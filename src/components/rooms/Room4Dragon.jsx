import { useState, useEffect, useRef } from "react";
import { characterStates } from "../../data/characterData";
import { GUARDS, disabledReason, guardHolds, resolveCounter, rollBetween } from "../../data/combat";
import EnemyHUD from "../EnemyHUD";
import EnemyCard from "../EnemyCard";
import ChampionHUD from "../ChampionHUD";
import ChampionCard from "../ChampionCard";
import MoveButton from "../MoveButton";
import FloatingText from "../FloatingText";
import CombatNotice from "../CombatNotice";
import useFloatingText from "../../hooks/useFloatingText";
import useNotice from "../../hooks/useNotice";
import useTimeouts from "../../hooks/useTimeouts";
import useHeroFallNotice from "../../hooks/useHeroFallNotice";
import styles from "./Room4Dragon.module.css";
import shared from "./Room3Displacers.module.css";

const ENEMY_MAX_HEALTH = 220;
const ENEMY_DAMAGE_RANGE = [22, 26];
// The chamber's full replenishment also refills Chxospixie's stamina (matches Game's HERO_MAX_STAMINA).
const CHXOSPIXIE_MAX_STAMINA = 60;

export default function Room4Dragon({
  darklordHealth,
  chxospixieHealth,
  chxospixieStamina,
  setDarklordHealth,
  setChxospixieHealth,
  setChxospixieStamina,
  dragonAwakened,
  setDragonAwakened,
  setCanContinue,
  isPolymorphed,
  darklordDead,
  chxospixieDead,
  setDarklordDead,
  setChxospixieDead,
  roomResetTrigger,
}) {
  const enemyMaxHealth = ENEMY_MAX_HEALTH;
  const [enemyHealth, setEnemyHealth] = useState(enemyMaxHealth);
  // Mirrors enemyHealth for timer callbacks so damage math never runs inside a state
  // updater (React StrictMode double-invokes updaters in development).
  const enemyHealthRef = useRef(enemyMaxHealth);
  const [enemyDefeated, setEnemyDefeated] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [enemyPose, setEnemyPose] = useState("idle");
  const [actionDisabled, setActionDisabled] = useState(false);

  const [darklordPose, setDarklordPose] = useState("idle");
  const [chxospixiePose, setChxospixiePose] = useState("idle");

  const [feedback, setFeedback] = useState("");

  // Track when the global Continue button should be up and the screen should be minimal on bg2
  const [continuePhase, setContinuePhase] = useState(false);
  // One-shot guard raised by the acting hero's move ({ hero, kind }); gone once the counter lands.
  const [guard, setGuard] = useState(null);
  const [enemyDaze, setEnemyDaze] = useState(null);

  const later = useTimeouts();
  const floaters = useFloatingText();
  const [notice, showNotice] = useNotice();

  const stateKey = isPolymorphed ? "polymorphed" : "normal";
  const darklord = characterStates.Darklord[stateKey];
  const chxospixie = characterStates.Chxospixie[stateKey];

  const isGameOver = darklordDead && chxospixieDead;

  useHeroFallNotice({
    darklordDead,
    chxospixieDead,
    darklordName: darklord.displayName,
    chxospixieName: chxospixie.displayName,
    showNotice,
  });

  //Watch for reset trigger and restore defaults
  useEffect(() => {
    enemyHealthRef.current = ENEMY_MAX_HEALTH;
    setEnemyHealth(ENEMY_MAX_HEALTH);
    setEnemyDefeated(false);
    setEnemyPose("idle");
    setGuard(null);
    setEnemyDaze(null);
  }, [roomResetTrigger]);

  const awakenDragon = () => {
    setDragonAwakened(true);
    setEnemyPose("attack");
    later(() => setEnemyPose("idle"), 1000);
  };

  const triggerRedFlash = () => {
    setShowRedFlash(true);
    later(() => setShowRedFlash(false), 300);
  };

  const showHeal = (target) => floaters.add(target, "Full HP", { kind: "heal" });

  // The crystal restores the chosen hero(es) to full health.
  const healOne = (character) => {
    if (character === "Darklord" && !darklordDead) {
      setDarklordHealth(darklord.maxHealth);
      showHeal("Darklord");
    } else if (character === "Chxospixie" && !chxospixieDead) {
      setChxospixieHealth(chxospixie.maxHealth);
      showHeal("Chxospixie");
    }
    setFeedback("✨ Fully healed... the dragon continues to sleep ✨");

    later(() => {
      setCanContinue(true);
      setContinuePhase(true); // switch to bg2 and hide battlefield/HUD
    }, 2000);
  };

  const attemptDualHeal = () => {
    const wokeDragon = Math.random() < 0.5;
    if (wokeDragon) {
      triggerRedFlash();
      awakenDragon(); //attack pose, idle pose transition

      //simulate enemy attack delay
      later(() => {
        setActionDisabled(false);
      }, 1500);
    } else {
      // The full replenishment: HP for every standing champion, and Chxospixie's stamina.
      if (!darklordDead) {
        setDarklordHealth(darklord.maxHealth);
        showHeal("Darklord");
      }
      if (!chxospixieDead) {
        setChxospixieHealth(chxospixie.maxHealth);
        setChxospixieStamina(CHXOSPIXIE_MAX_STAMINA);
        showHeal("Chxospixie");
      }
      setFeedback("✨ Fully healed... the dragon continues to sleep ✨");

      later(() => {
        setCanContinue(true);
        setContinuePhase(true); // switch to bg2 and hide battlefield/HUD
      }, 2000);
    }
  };

  // Victory: the dragon falls, then the interrupted full-party restoration finally completes:
  // both champions to full HP, Chxospixie to full stamina, and a champion who fell during the
  // dragon fight stands again here. This is the chamber's own restoration, a deliberate
  // exception to the next-room half-strength revival rule.
  useEffect(() => {
    if (enemyHealth <= 0 && !enemyDefeated) {
      setEnemyDefeated(true);
      setFeedback("✨ Amethyst Dragon defeated! ✨");

      later(() => {
        setDarklordHealth(darklord.maxHealth);
        setDarklordDead(false);
        showHeal("Darklord");
        setChxospixieHealth(chxospixie.maxHealth);
        setChxospixieStamina(CHXOSPIXIE_MAX_STAMINA);
        setChxospixieDead(false);
        showHeal("Chxospixie");
        setFeedback("✨ The chamber's healing magic surges once more. Your champions stand renewed. ✨");
      }, 1400);

      later(() => {
        setCanContinue(true);
        setContinuePhase(true); // switch to bg2 and hide battlefield/HUD
      }, 4200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enemyHealth, enemyDefeated]);

  // Raise the acting move's guard (if any). Returns the guard kind the counter must respect.
  const raiseGuard = (hero, kind, landed) => {
    if (!guardHolds(kind, landed)) return null;
    setGuard({ hero, kind });
    const status = GUARDS[kind].enemyStatus;
    if (status) {
      floaters.add("enemy", status, { kind: "status", ms: 1600 });
      setEnemyDaze(kind);
      later(() => setEnemyDaze(null), 1600);
    }
    return kind;
  };

  // After the hero's swing lands, the dragon winds up (2s) and strikes back (1s).
  const scheduleEnemyCounter = (attacker, guardKind) => {
    later(() => {
      setEnemyPose("attack");
      later(() => {
        enemyAttack(attacker, guardKind);
        setEnemyPose("idle");
        setActionDisabled(false);
        // The ward fades right after the blow it was raised against.
        if (guardKind) later(() => setGuard(null), 350);
      }, 1000);
    }, 2000);
  };

  const dealDamage = (move, attacker) => {
    if (enemyDefeated || isGameOver || actionDisabled) return false;

    setActionDisabled(true);
    const poseSetter = attacker === "Darklord" ? setDarklordPose : setChxospixiePose;
    const isDead = attacker === "Darklord" ? darklordDead : chxospixieDead;

    poseSetter("attack");

    later(() => {
      poseSetter(isDead ? "dead" : "idle");

      const newHealth = Math.max(enemyHealthRef.current - move.damage, 0);
      enemyHealthRef.current = newHealth;
      setEnemyHealth(newHealth);
      floaters.add("enemy", `-${move.damage}`);

      if (newHealth > 0) {
        scheduleEnemyCounter(attacker, raiseGuard(attacker, move.guard, true));
      } else {
        setActionDisabled(false);
      }
    }, 1000);
    return true;
  };

  const performMove = (move, attacker) => {
    if (!dealDamage(move, attacker)) return;
    if (move.staminaCost) {
      setChxospixieStamina((s) => Math.max(s - move.staminaCost, 0));
    }
  };

  const enemyAttack = (attacker, guardKind) => {
    if (enemyDefeated || isGameOver) return;

    // Determine valid targets
    const targets = [];
    if (!darklordDead) targets.push("Darklord");
    if (!chxospixieDead) targets.push("Chxospixie");

    if (targets.length === 0) return; // no one to attack

    // Attack the attacker if alive, otherwise the other target
    const target = targets.includes(attacker) ? attacker : targets.find((t) => t !== attacker);
    if (!target) return; // safety check

    const base = rollBetween(ENEMY_DAMAGE_RANGE[0], ENEMY_DAMAGE_RANGE[1]);
    // A guard only covers the hero who raised it.
    const { damage, label } = target === attacker ? resolveCounter(base, guardKind) : { damage: base, label: null };
    const setHealth = target === "Darklord" ? setDarklordHealth : setChxospixieHealth;

    setHealth((prev) => Math.max(prev - damage, 0));
    triggerRedFlash();
    floaters.add(target, `-${damage}`, { label, accent: GUARDS[guardKind]?.accent });
  };

  const enemySpritePath =
    enemyPose === "attack"
      ? "/assets/sprites/enemies/room4/dragon-attack.png"
      : "/assets/sprites/enemies/room4/dragon-idle.png";

  const darklordGuarded = guard?.hero === "Darklord" && GUARDS[guard.kind]?.heroGlow;
  const chxospixieGuarded = guard?.hero === "Chxospixie" && GUARDS[guard.kind]?.heroGlow;
  const enemyDazeClass = enemyDaze === "confuse" ? shared.dazed : enemyDaze === "distract" ? shared.distracted : "";

  // Keep full combat layout visible until continuePhase is true,
  // even after enemyDefeated, so everything disappears together.
  if (dragonAwakened && !continuePhase) {
    return (
      <div className={`${styles.roomBackground2}`}>
        {showRedFlash && <div className={shared.redFlash} />}

        <div className={`${shared.battlefield} ${styles.battlefield}`}>
          <div className={`${shared.leftSide} ${styles.leftSide}`}>
            <div className={`${shared.championWrapper} ${shared.heroSlot}`}>
              <div className={`${styles.spriteImage} ${darklordDead ? styles["dead-darklord"] : ""} ${darklordGuarded ? shared.guarded : ""}`}>
                <ChampionCard
                  championKey="Darklord"
                  pose={darklordDead ? "dead" : darklordPose}
                  isDead={darklordDead}
                  isPolymorphed={isPolymorphed}
                  size="large"
                />
              </div>
              <FloatingText items={floaters.forTarget("Darklord")} baseClass={shared.floatingDamage} />
            </div>

            <div className={`${shared.championWrapper} ${shared.heroSlot}`}>
              <div className={`${styles.spriteImage} ${chxospixieDead ? styles["dead-chxospixie"] : ""} ${chxospixieGuarded ? shared.guarded : ""}`}>
                <ChampionCard
                  championKey="Chxospixie"
                  pose={chxospixieDead ? "dead" : chxospixiePose}
                  isDead={chxospixieDead}
                  isPolymorphed={isPolymorphed}
                  size="large"
                />
              </div>
              <FloatingText items={floaters.forTarget("Chxospixie")} baseClass={shared.floatingDamage} />
            </div>
          </div>
          <div className={shared.rightSide}>
            <div className={`${shared.enemyWrapper} ${enemyDazeClass}`}>
              {/* Keep HUD visible until continuePhase triggers */}
              <EnemyHUD
                enemyName="Amethyst Dragon"
                health={enemyHealth}
                maxHealth={enemyMaxHealth}
                isDead={enemyDefeated}
              />
              <EnemyCard
                enemyName="Amethyst Dragon"
                spritePath={enemySpritePath}
                size="cinematic"
                isDead={enemyDefeated}
                className={styles.dragonEnemy}
              />
              <FloatingText items={floaters.forTarget("enemy")} baseClass={shared.floatingDamage} />
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

        {/* Bottom bar: show actions during combat, switch to feedback immediately on defeat */}
        <div className={`${shared.actionsContainer} ${styles.actionsContainer} ${(enemyDefeated ? styles.feedbackContainer : "")}`}>
          <CombatNotice notice={notice} />
          {enemyDefeated ? (
            <div className={styles.actionsInner}>
              <div className={styles.feedbackText}>{feedback}</div>
            </div>
          ) : (
            <div className={shared.actionsInnerRow}>
              <div className={shared.actionGroup}>
                <h4>{darklord.displayName}'s Actions:</h4>
                <div className={shared.actionButtonsRow}>
                  {darklord.moves.map((move) => (
                    <MoveButton
                      key={move.name}
                      move={move}
                      disabled={actionDisabled || darklordDead}
                      reason={disabledReason({ dead: darklordDead, enemyTurn: actionDisabled })}
                      onClick={() => performMove(move, "Darklord")}
                    />
                  ))}
                </div>
              </div>

              <div className={shared.actionGroup}>
                <h4>{chxospixie.displayName}'s Actions:</h4>
                <div className={shared.actionButtonsRow}>
                  {chxospixie.moves.map((move) => {
                    const staminaBlocked = !!move.staminaCost && chxospixieStamina < move.staminaCost;
                    return (
                      <MoveButton
                        key={move.name}
                        move={move}
                        disabled={chxospixieDead || actionDisabled || staminaBlocked}
                        reason={disabledReason({ dead: chxospixieDead, staminaBlocked, enemyTurn: actionDisabled })}
                        onClick={() => performMove(move, "Chxospixie")}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // HEALING / PRE-COMBAT
  return (
    <div className={(dragonAwakened || continuePhase) ? styles.roomBackground2 : styles.roomBackground1}>
      <div className={shared.battlefield}>
        {!continuePhase && (
          <div className={`${shared.leftSide} ${styles.leftSide}`}>
            <div className={shared.championWrapper}>
              <ChampionCard
                championKey="Darklord"
                pose="idle"
                size="large"
              />
              <FloatingText items={floaters.forTarget("Darklord")} baseClass={shared.floatingDamage} />
            </div>

            <div className={shared.championWrapper}>
              <ChampionCard
                championKey="Chxospixie"
                pose="idle"
                size="large"
              />
              <FloatingText items={floaters.forTarget("Chxospixie")} baseClass={shared.floatingDamage} />
            </div>
          </div>
        )}
      </div>

      {!continuePhase && (
        <ChampionHUD
          darklordHealth={darklordHealth}
          chxospixieHealth={chxospixieHealth}
          darklordDead={darklordDead}
          chxospixieDead={chxospixieDead}
          chxospixieStamina={chxospixieStamina}
          chxospixieMaxStamina={60}
          isPolymorphed={isPolymorphed}
        />
      )}

      <div className={`${shared.actionsContainer} ${styles.actionsContainer} ${styles.feedbackContainer}`}>
        <div className={styles.actionsInner}>
          {feedback || continuePhase ? (
            <div className={styles.feedbackText}>{feedback}</div>
          ) : (
            <>
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
                Fully Heal Darklord
              </button>
              <button
                className={styles.actionButton}
                disabled={actionDisabled || chxospixieDead}
                onClick={() => {
                  healOne("Chxospixie");
                  setActionDisabled(true);
                }}
              >
                Fully Heal Chxospixie
              </button>
              <button
                className={styles.actionButton}
                disabled={actionDisabled}
                onClick={() => {
                  attemptDualHeal();
                  setActionDisabled(true);
                }}
              >
                Fully Restore Both
                <br />
                <span className={shared.moveMeta}>Full HP + Stamina · May wake dragon</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
