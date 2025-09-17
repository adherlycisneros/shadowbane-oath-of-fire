import { useState, useEffect } from "react";
import { characterStates } from "../../data/characterData";
import EnemyCard from "../EnemyCard";
import ChampionCard from "../ChampionCard";
import ChampionHUD from "../ChampionHUD";
import styles from "./Room5Brain.module.css"
import shared from "./Room3Displacers.module.css";

export default function Room5Brain({
  whisperedPhrase,
  darklordHealth,
  chxospixieHealth,
  chxospixieStamina,
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

  const [darklordPose, setDarklordPose] = useState("idle");
  const [chxospixiePose, setChxospixiePose] = useState("idle");


  const stateKey = isPolymorphed ? "polymorphed" : "normal";
  const darklord = characterStates.Darklord[stateKey];
  const chxospixie = characterStates.Chxospixie[stateKey];

  const enemySpritePath =
    enemyPose === "attack"
      ? "/assets/sprites/enemies/room5/brain-attack.png"
      : "/assets/sprites/enemies/room5/brain-idle.png";


  const logAction = (entry) => {
    setActionLog([entry]);
  };

  useEffect(() => {
    setActionLog([]);
  }, [setActionLog]);

  const checkPhrase = () => {
    const cleanedInput = input.trim().toLowerCase();
    const correct = whisperedPhrase.toLowerCase();

    if (cleanedInput === correct) {
      setActionLog({
        success: true,
        message: "🧠 The brain hums in approval. You may pass."
      })
      setCanContinue(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 2) {
        setEnemyPose("attack");
        setTimeout(() => {
          setActionLog({
            success: false,
            message: `🧠 The brain pulses angrily! It sees no hope in your cognitive abilities and polymorphs Darklord into a frumpy toad and Chxospixie into a bewildered sheep!
          
You must now continue your quest in this unfortunate form...`
        });

        setIsPolymorphed(true);
        setCanContinue(true);
        setEnemyPose("idle");
      }, 1000);
    } else {
        //First incorrect attempt
      setActionLog({
        success: false,
        message: "⚠️ Last chance..."
      });
    }
  }
};

  //Disable the input text and submit buttons when not allowed to be used
  const isLocked = logAction && (setActionLog.success || attempts >= 2);

  return (
    <div className={`${styles.roomBackground} fullscreen-fit`}>
      {/* Use shared.battlefield but add room-specific class for overrides */}
      <div className={`${shared.battlefield} ${styles.room5Battlefield}`}>

        {/* Left champion (Darklord) */}
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

        {/* Brain (top center), wrapped so we can absolutely position it */}
        <div className={`${styles.brainWrapper} ${shared.enemyWrapper}`}>
          <EnemyCard
            enemyName="Brain"
            spritePath={enemySpritePath}
            size="cinematic"
          />
        </div>

        {/* Right champion (Chxospixie) */}
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

      <div className={shared.actionsContainer}>
        <h3>💭 Remember what came in a whispering fog in rooms past?</h3>

        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setActionLog(null);
          }}
          disabled={isLocked}
        />
        <button onClick={checkPhrase} disabled={isLocked}>
          Submit
        </button>

      </div>
    </div>
  );
}
