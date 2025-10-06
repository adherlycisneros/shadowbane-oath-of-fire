import { useState, useEffect, useRef } from "react";
import { characterStates } from "../../data/characterData";
import EnemyCard from "../EnemyCard";
import ChampionCard from "../ChampionCard";
import styles from "./Room5Brain.module.css"
import shared from "./Room3Displacers.module.css";

export default function Room5Brain({
  whisperedPhrase,
  setCanContinue,
  setIsPolymorphed,
  isPolymorphed,
  darklordDead,
  chxospixieDead,
  setActionLog,
}) {
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [enemyPose, setEnemyPose] = useState("idle");
  const [feedback, setFeedback] = useState(null);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [shakeInput, setShakeInput] = useState(false);

  const stateKey = isPolymorphed ? "polymorphed" : "normal";
  const darklord = characterStates.Darklord[stateKey];
  const chxospixie = characterStates.Chxospixie[stateKey];

  const enemySpritePath =
    enemyPose === "attack"
      ? "/assets/sprites/enemies/room5/brain-attack.png"
      : "/assets/sprites/enemies/room5/brain-idle.png";

  const timeouts = useRef([]);

  useEffect(() => {
    setActionLog([]);
    return () => timeouts.current.forEach(clearTimeout);
  }, [setActionLog]);

  const triggerRedFlash = () => {
    setShowRedFlash(true);
    const t = setTimeout(() => setShowRedFlash(false), 300);
    timeouts.current.push(t);
  };

  const checkPhrase = () => {
    const cleanedInput = input.trim().toLowerCase();
    const correct = whisperedPhrase.toLowerCase();
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (cleanedInput === correct) {
      setFeedback({ success: true, message: "🧠 The brain hums in approval. You may pass." });
      setCanContinue(true);
    } else if (newAttempts === 1) {
      // First wrong attempt: shake input and red flash, no message yet
      setShakeInput(true);
      triggerRedFlash();
      const t = setTimeout(() => setShakeInput(false), 500);
      timeouts.current.push(t);
    } else {
      // Second wrong attempt: polymorph and show message
      setEnemyPose("attack");
      triggerRedFlash();
      const t = setTimeout(() => {
        setFeedback({
          success: false,
          message: "🧠 The brain lashes out, polymorphing you both into pitiful forms."
        });
        setIsPolymorphed(true);
        setCanContinue(true);
        setEnemyPose("idle");
      }, 800);
      timeouts.current.push(t);
    }
  };

  const isLocked = feedback?.success || attempts >= 2;

  return (
    <div className={`${styles.roomBackground} fullscreen-fit`}>
      {showRedFlash && <div className={shared.redFlash} />}
      <div className={`${shared.battlefield} ${styles.room5Battlefield}`}>
        <div className={styles.leftChampionWrapper}>
          <div className={shared.championWrapper}>
            <ChampionCard
              championKey="Darklord"
              pose="idle"
              isDead={darklordDead}
              isPolymorphed={isPolymorphed}
              size="large"
            />
          </div>
        </div>

        <div className={`${styles.brainWrapper} ${shared.enemyWrapper}`}>
          <EnemyCard
            enemyName="Brain"
            spritePath={enemySpritePath}
            size="cinematic"
          />
        </div>

        <div className={styles.rightChampionWrapper}>
          <div className={shared.championWrapper}>
            <ChampionCard
              championKey="Chxospixie"
              pose="idle"
              isDead={chxospixieDead}
              isPolymorphed={isPolymorphed}
              size="large"
            />
          </div>
        </div>
      </div>

      <div className={`${styles.actionsContainer} ${shared.actionsContainer}`}>
        <div className={styles.actionsInner}>
          {!isLocked ? (
            <>
              <input
                type="text"
                value={input}
                placeholder="💭 Impress the brain. Recall the fog’s whisper from rooms past and type it here…"
                onChange={(e) => setInput(e.target.value)}
                className={`${styles.inputField} ${shakeInput ? styles.shake : ""}`}
              />
              <button
                onClick={checkPhrase}
                className={styles.submitButton}
              >
                Submit
              </button>
            </>
          ) : (
            <span className={styles.feedbackText}>{feedback?.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
