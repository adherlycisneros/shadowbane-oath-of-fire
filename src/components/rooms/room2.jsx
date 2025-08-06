import { useEffect, useState, useRef } from "react";
import ChampionCard from "../ChampionCard";
import ChampionHUD from "../ChampionHUD";
import styles from "./Room2Heads.module.css";

const headOptions = [
  { id: 0, label: "Head 1", img: "/assets/sprites/enemies/room2/head1.png" },
  { id: 1, label: "Head 2", img: "/assets/sprites/enemies/room2/head2.png" },
  { id: 2, label: "Head 3", img: "/assets/sprites/enemies/room2/head3.png" },
  { id: 3, label: "Head 4", img: "/assets/sprites/enemies/room2/head4.png" },
];

export default function Room2Heads({
  canContinue,
  setCanContinue,
  setDarklordHealth,
  setChxospixieHealth,
  darklordHealth,
  chxospixieHealth,
  darklordDead,
  chxospixieDead,
  isPolymorphedDarklord,
  isPolymorphedChxospixie,
  setActionLog,
}) {
  const [glowSequence, setGlowSequence] = useState([]);
  const [playerInput, setPlayerInput] = useState([]);
  const [isPlayingSequence, setIsPlayingSequence] = useState(true);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [glowingIndex, setGlowingIndex] = useState(null);

  const isDeadRef = useRef(false);

  useEffect(() => {
    setActionLog([]);
  }, [setActionLog]);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      generateNewSequence();
    }, 2000);
    return () => clearTimeout(startTimer);
  }, []);

  const prevBothDead = useRef(false);
  useEffect(() => {
    const bothDeadNow = darklordDead && chxospixieDead;
    isDeadRef.current = bothDeadNow;

    if (bothDeadNow) {
      prevBothDead.current = true;
      setIsPlayingSequence(false);
      setGlowingIndex(null);
      return;
    }
    if (prevBothDead.current && !bothDeadNow) {
      prevBothDead.current = false;
      setPlayerInput([]);
      setCanContinue(false);
      const timer = setTimeout(() => {
        generateNewSequence();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [darklordDead, chxospixieDead]);

  const generateNewSequence = () => {
    if (isDeadRef.current) return;
    setIsPlayingSequence(true);
    const newSeq = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * headOptions.length)
    );
    setGlowSequence(newSeq);
    setPlayerInput([]);
    playGlowSequence(newSeq);
    logAction("Heads shuffle glow...");
  };

  const playGlowSequence = async (sequence) => {
    for (let i = 0; i < sequence.length; i++) {
      if (isDeadRef.current) return;
      setGlowingIndex(sequence[i]);
      await new Promise((res) => setTimeout(res, 800));
      setGlowingIndex(null);
      await new Promise((res) => setTimeout(res, 400));
    }
    setIsPlayingSequence(false);
  };

  const triggerRedFlash = () => {
    setShowRedFlash(true);
    setTimeout(() => setShowRedFlash(false), 300);
  };

  const logAction = (entry) => {
    setActionLog([entry]);
  };

  const handleHeadClick = (index) => {
    if (isPlayingSequence) return;
    if (isDeadRef.current) return;

    setGlowingIndex(index);
    setTimeout(() => {
      if (!isDeadRef.current) setGlowingIndex(null);
    }, 700);

    const newInput = [...playerInput, index];
    setPlayerInput(newInput);

    const currentStep = newInput.length - 1;
    if (index !== glowSequence[currentStep]) {
      logAction(`⚡ Wrong!`);
      triggerRedFlash();
      logAction(`10 damage to the party`);

      if (!darklordDead) setDarklordHealth((hp) => Math.max(0, hp - 10));
      if (!chxospixieDead) setChxospixieHealth((hp) => Math.max(0, hp - 10));

      setTimeout(() => generateNewSequence(), 1500);
      return;
    }

    logAction(`✅ Correct`);

    if (newInput.length === glowSequence.length) {
      logAction("✅ Sequence matched! Safe passage unlocked.");
      setTimeout(() => {
        setCanContinue(true);
      }, 3000);
    }
  };

  return (
    <div className={`${styles.roomBackground} fullscreen-fit`}>
      {showRedFlash && <div className={styles.redFlash} />}

      <ChampionHUD
        darklordHealth={darklordHealth}
        chxospixieHealth={chxospixieHealth}
        darklordDead={darklordDead}
        chxospixieDead={chxospixieDead}
        chxospixieStamina={chxospixieStamina}         
        chxospixieMaxStamina={60}
      />

      {!canContinue && (
        <div className={styles.contentWrapper}>
          <div className={styles.leftSide}>
            <div
              className={`${styles.heroesContainer} ${
                darklordDead || chxospixieDead ? styles.dead : ""
              }`}
            >
              <ChampionCard
                championKey="Darklord"
                isDead={darklordDead}
                isPolymorphed={isPolymorphedDarklord}
                size="xlarge"
              />
              <ChampionCard
                championKey="Chxospixie"
                isDead={chxospixieDead}
                isPolymorphed={isPolymorphedChxospixie}
                size="xlarge"
              />
            </div>
          </div>

          <div className={styles.rightSide}>
            <div className={styles.headsGrid}>
              {headOptions.map((head) => (
                <button
                  key={head.id}
                  onClick={() => handleHeadClick(head.id)}
                  disabled={isPlayingSequence || darklordDead || chxospixieDead}
                  className={`${styles.headButton} ${
                    glowingIndex === head.id ? styles.glow : ""
                  }`}
                >
                  <img
                    src={head.img}
                    alt={head.label}
                    className={styles.headImage}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
