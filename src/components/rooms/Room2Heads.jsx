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
  chxospixieStamina,
  darklordDead,
  chxospixieDead,
  isPolymorphed,
  setActionLog,
}) {
  const [glowSequence, setGlowSequence] = useState([]);
  const [playerInput, setPlayerInput] = useState([]);
  const [isPlayingSequence, setIsPlayingSequence] = useState(true);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [glowingIndex, setGlowingIndex] = useState(null);

  const isDeadRef = useRef(false);
  const timeouts = useRef([]);

  // Clear all timeouts on unmount
  useEffect(() => {
    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, []);

  useEffect(() => {
    setActionLog([]);
  }, [setActionLog]);

  useEffect(() => {
    const timer = setTimeout(() => {
      generateNewSequence();
    }, 2000);
    timeouts.current.push(timer);

    return () => {
      clearTimeout(timer);
      timeouts.current = timeouts.current.filter((t) => t !== timer);
    };
  }, []);

  // Track dead state changes
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
      timeouts.current.push(timer);
      return () => {
        clearTimeout(timer);
        timeouts.current = timeouts.current.filter((t) => t !== timer);
      };
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

  // Play glow sequence asynchronously
  const playGlowSequence = async (sequence) => {
    for (let i = 0; i < sequence.length; i++) {
      if (isDeadRef.current) return;

      setGlowingIndex(sequence[i]);

      // Use promise + timeout pattern
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 800);
        timeouts.current.push(timeout);
      });

      setGlowingIndex(null);

      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 400);
        timeouts.current.push(timeout);
      });
    }

    setIsPlayingSequence(false);
  };

  const triggerRedFlash = () => {
    setShowRedFlash(true);
    const timeout = setTimeout(() => setShowRedFlash(false), 300);
    timeouts.current.push(timeout);
  };

  const logAction = (entry) => {
    setActionLog([entry]);
  };

  const handleHeadClick = (index) => {
    if (isPlayingSequence) return;
    if (isDeadRef.current) return;

    setGlowingIndex(index);
    const timeout = setTimeout(() => {
      if (!isDeadRef.current) setGlowingIndex(null);
    }, 700);
    timeouts.current.push(timeout);

    const newInput = [...playerInput, index];
    setPlayerInput(newInput);

    const currentStep = newInput.length - 1;

    // Check if player input matches glow sequence
    if (index !== glowSequence[currentStep]) {
      logAction(`⚡ Wrong!`);
      triggerRedFlash();
      logAction(`20 damage to the party`);

      // Damage Darklord health with logging
      if (!darklordDead) {
        setDarklordHealth((prev) => {
          const newHealth = Math.max(prev - 20, 0);
          console.log("Darklord health reduced:", newHealth);
          return newHealth;
        });
      }

      // Damage Chxospixie health with logging
      if (!chxospixieDead) {
        setChxospixieHealth((prev) => {
          const newHealth = Math.max(prev - 20, 0);
          console.log("Chxospixie health reduced:", newHealth);
          return newHealth;
        });
      }

      const retryTimer = setTimeout(() => generateNewSequence(), 1500);
      timeouts.current.push(retryTimer);
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
        isPolymorphed={isPolymorphed}
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
                isPolymorphed={isPolymorphed}
                size="large"
              />
              <ChampionCard
                championKey="Chxospixie"
                isDead={chxospixieDead}
                isPolymorphed={isPolymorphed}
                size="large"
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