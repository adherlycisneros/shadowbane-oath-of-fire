import { useState, useEffect, useRef } from "react";
import { characterStates } from "../../data/characterData";
import { GUARDS, disabledReason, guardHolds, resolveCounter, rollBetween } from "../../data/combat";
import EnemyHUD from "../EnemyHUD";
import EnemyCard from "../EnemyCard";
import ChampionCard from "../ChampionCard";
import ChampionHUD from "../ChampionHUD";
import MoveButton from "../MoveButton";
import FloatingText from "../FloatingText";
import CombatNotice from "../CombatNotice";
import useFloatingText from "../../hooks/useFloatingText";
import useNotice from "../../hooks/useNotice";
import useTimeouts from "../../hooks/useTimeouts";
import useHeroFallNotice from "../../hooks/useHeroFallNotice";
import styles from "./Room3Displacers.module.css";

const ENEMY_MAX_HEALTH = 220;
const ENEMY_DAMAGE_RANGE = [16, 20];

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
  const [continuePhase, setContinuePhase] = useState(false);

  const [darklordPose, setDarklordPose] = useState("idle");
  const [chxospixiePose, setChxospixiePose] = useState("idle");
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

  const triggerRedFlash = () => {
    setShowRedFlash(true);
    later(() => setShowRedFlash(false), 300);
  };

  // Watch for reset trigger and restore defaults (reset enemy health upon hero death)
  useEffect(() => {
    enemyHealthRef.current = ENEMY_MAX_HEALTH;
    setEnemyHealth(ENEMY_MAX_HEALTH);
    setEnemyDefeated(false);
    setEnemyPose("idle");
    setGuard(null);
    setEnemyDaze(null);
  }, [roomResetTrigger]);

  useEffect(() => {
    if (enemyHealth > 0) return;
    later(() => {
      // Mark defeated but DON'T hide UI yet
      setEnemyDefeated(true);
      // Switch to continue phase (clean view) after a short pause
      later(() => {
        setContinuePhase(true);
        setCanContinue(true);
      }, 800);
    }, 400);
  }, [enemyHealth, setCanContinue, later]);

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

  // After the hero's swing lands, the enemy winds up (2s) and strikes back (1s).
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

    const targets = [];
    if (!darklordDead) targets.push("Darklord");
    if (!chxospixieDead) targets.push("Chxospixie");

    if (targets.length === 0) return;

    // Strike back at the attacker if alive, otherwise the other hero
    const target = targets.includes(attacker) ? attacker : targets.find((t) => t !== attacker);
    if (!target) return;

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
      ? "/assets/sprites/enemies/room3/displacer-attack.png"
      : "/assets/sprites/enemies/room3/displacer-idle.png";

  const darklordGuarded = guard?.hero === "Darklord" && GUARDS[guard.kind]?.heroGlow;
  const chxospixieGuarded = guard?.hero === "Chxospixie" && GUARDS[guard.kind]?.heroGlow;
  const enemyDazeClass = enemyDaze === "confuse" ? styles.dazed : enemyDaze === "distract" ? styles.distracted : "";

  // ✅ Unified conditional render — hides EVERYTHING simultaneously
  if (continuePhase) {
    return (
      <div className={`${styles.roomBackground} fullscreen-fit`}>
        <div className={`${styles.actionsContainer} ${styles.actionsContainerFeedback}`}>
          <div className={styles.actionsInner}>
            <span className={styles.feedbackText}>
              ✨ Displacers defeated! Safe passage unlocked! ✨
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Normal rendering below
  return (
    <div className={`${styles.roomBackground} fullscreen-fit`}>
      {showRedFlash && <div className={styles.redFlash} />}

      <div className={`${styles.battlefield} ${styles.battlefieldGap}`}>
        <div className={styles.leftSide}>
          <div className={`${styles.championWrapper} ${styles.heroSlot}`}>
            <div className={`${styles.spriteImage} ${darklordDead ? styles["dead-darklord"] : ""} ${darklordGuarded ? styles.guarded : ""}`}>
              <ChampionCard
                championKey="Darklord"
                pose={darklordDead ? "dead" : darklordPose}
                isDead={darklordDead}
                isPolymorphed={isPolymorphed}
                size="large"
              />
            </div>
            <FloatingText items={floaters.forTarget("Darklord")} baseClass={styles.floatingDamage} />
          </div>

          <div className={`${styles.championWrapper} ${styles.heroSlot}`}>
            <div className={`${styles.spriteImage} ${chxospixieDead ? styles["dead-chxospixie"] : ""} ${chxospixieGuarded ? styles.guarded : ""}`}>
              <ChampionCard
                championKey="Chxospixie"
                pose={chxospixieDead ? "dead" : chxospixiePose}
                isDead={chxospixieDead}
                isPolymorphed={isPolymorphed}
                size="large"
              />
            </div>
            <FloatingText items={floaters.forTarget("Chxospixie")} baseClass={styles.floatingDamage} />
          </div>
        </div>

        <div className={`${styles.rightSide} ${styles.specificrightSide}`}>
          <div className={`${styles.enemyWrapper} ${enemyDazeClass}`}>
            <EnemyCard
              enemyName="Twin Displacer Beasts"
              spritePath={enemySpritePath}
              size="xlarge"
              isDead={enemyDefeated}
            />
            <FloatingText items={floaters.forTarget("enemy")} baseClass={styles.floatingDamage} />
          </div>

          {/* keep HUD visible until continuePhase */}
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

      <div className={`${styles.actionsContainer} ${styles.actionsContainerFeedback}`}>
        <CombatNotice notice={notice} />
        <div className={styles.actionsInner}>
          {enemyDefeated ? (
            <span className={styles.feedbackText}>✨ Displacers defeated! Safe passage unlocked! ✨</span>
          ) : (
            <div className={styles.actionsInnerRow}>
              <div className={styles.actionGroup}>
                <h4>{darklord.displayName}'s Actions:</h4>
                <div className={styles.actionButtonsRow}>
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

              <div className={styles.actionGroup}>
                <h4>{chxospixie.displayName}'s Actions:</h4>
                <div className={styles.actionButtonsRow}>
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
    </div>
  );
}
