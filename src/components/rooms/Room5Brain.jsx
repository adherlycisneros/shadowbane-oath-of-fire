import { useState, useRef } from "react";
import EnemyCard from "../EnemyCard";
import ChampionCard from "../ChampionCard";
import CombatNotice from "../CombatNotice";
import useNotice from "../../hooks/useNotice";
import styles from "./Room5Brain.module.css"
import shared from "./Room3Displacers.module.css";

export default function Room5Brain({
  omenPhrase,
  setCanContinue,
  setIsPolymorphed,
  isPolymorphed,
  darklordDead,
  chxospixieDead,
}) {
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [enemyPose, setEnemyPose] = useState("idle");
  const [feedback, setFeedback] = useState(null);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [shakeInput, setShakeInput] = useState(false);
  const [notice, showNotice, clearNotice] = useNotice();

  const enemySpritePath =
    enemyPose === "attack"
      ? "/assets/sprites/enemies/room5/brain-attack.png"
      : "/assets/sprites/enemies/room5/brain-idle.png";

  const timeouts = useRef([]);

  const triggerRedFlash = () => {
    setShowRedFlash(true);
    const t = setTimeout(() => setShowRedFlash(false), 300);
    timeouts.current.push(t);
  };

  const checkPhrase = () => {
    const cleanedInput = input.trim().toLowerCase();
    const correct = omenPhrase.toLowerCase();
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (cleanedInput === correct) {
      clearNotice();
      setFeedback({
        success: true,
        message: "✨ The brain hums in approval. Safe passage unlocked! ✨ ."
      });

      setEnemyPose("idle");
      setIsPolymorphed(false);

      const tContinue = setTimeout(() => {
        setCanContinue(true);
      }, 2500);
      timeouts.current.push(tContinue);

    } else if (newAttempts === 1) {
      // First wrong attempt: shake, red flash, and a warning (the words themselves stay secret)
      setShakeInput(true);
      triggerRedFlash();
      showNotice("The brain recoils. Those are not the omen's words.", 6000);
      const t = setTimeout(() => setShakeInput(false), 500);
      timeouts.current.push(t);
    } else {
      // Second wrong attempt: brain attack
      clearNotice();
      setEnemyPose("attack");
      triggerRedFlash();

      // Show feedback text immediately
      setFeedback({
        success: false,
        message: "🧠 The brain lashes out. You forgot the omen, and must continue your quest in these pitiful forms. 🧠"
      });

      // Delay polymorph sprites slightly to emphasize the attack
      const tPolymorph = setTimeout(() => {
        setIsPolymorphed(true);
      }, 1000); // adjust delay for best visual effect
      timeouts.current.push(tPolymorph);

      // show continue button
      const tEnd = setTimeout(() => {
        setCanContinue(true);
      }, 2500); // attack duration
      timeouts.current.push(tEnd);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault(); // Enter key and the Submit button both land here
    checkPhrase();
  };

  const isLocked = feedback?.success || attempts >= 2;

  return (
    <div className={`${styles.roomBackground} fullscreen-fit`}>
      {showRedFlash && <div className={shared.redFlash} />}
      <div className={`${shared.battlefield} ${styles.room5Battlefield}`}>
        <div className={`${styles.leftChampionWrapper} ${isPolymorphed ? styles.polymorphed : ""}`}>
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

        <div className={`${styles.rightChampionWrapper} ${isPolymorphed ? styles.polymorphed : ""}`}>
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
        <CombatNotice notice={notice} />
        {!isLocked ? (
          <form className={styles.actionsInner} onSubmit={handleSubmit}>
            <label htmlFor="omen-phrase" className="sr-only">
              The omen's words
            </label>
            <input
              id="omen-phrase"
              name="omen-phrase"
              type="text"
              value={input}
              placeholder="💭 Impress the brain. Recall the words of the omen and type them here…"
              onChange={(e) => setInput(e.target.value)}
              className={`${styles.inputField} ${shakeInput ? styles.shake : ""}`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="go"
            />
            <button
              type="submit"
              className={styles.submitButton}
            >
              Submit
            </button>
          </form>
        ) : (
          <div className={styles.actionsInner}>
            <span className={styles.feedbackText}>{feedback?.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
