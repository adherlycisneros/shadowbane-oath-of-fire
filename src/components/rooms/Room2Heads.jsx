import { useEffect, useState, useRef } from "react";
import ChampionCard from "../ChampionCard";
import ChampionHUD from "../ChampionHUD";
import styles from "./Room2Heads.module.css";
import shared from "./Room3Displacers.module.css";

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
}) {
  const [glowSequence, setGlowSequence] = useState([]);
  const [playerInput, setPlayerInput] = useState([]);
  const [isPlayingSequence, setIsPlayingSequence] = useState(true);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [glowingIndex, setGlowingIndex] = useState(null);
  const [feedback, setFeedback] = useState(["Heads shuffle their glow... Watch carefully."]);
  const [floatingDamage, setFloatingDamage] = useState([]);

  const isDeadRef = useRef(false);
  const timeouts = useRef([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, []);

  // Initial start
  useEffect(() => {
    const timer = setTimeout(() => generateNewSequence(), 2000);
    timeouts.current.push(timer);
    return () => clearTimeout(timer);
  }, []);

  // Handle both heroes dying and reviving
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
      addFeedback("Heads shuffle their glow... Watch carefully.")
      const timer = setTimeout(() => generateNewSequence(), 2000);
      timeouts.current.push(timer);
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
  };

  const playGlowSequence = async (sequence) => {
    for (let i = 0; i < sequence.length; i++) {
      if (isDeadRef.current) return;

      setGlowingIndex(sequence[i]);
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

  const showDamage = (value, targets) => {
    const entries = targets.map((target) => ({ id: Date.now() + Math.random(), value, target }));
    setFloatingDamage((prev) => [...prev, ...entries]);
    entries.forEach((entry) => {
      const t = setTimeout(() => {
        setFloatingDamage((prev) => prev.filter((d) => d.id !== entry.id));
      }, 1800);
      timeouts.current.push(t);
    });
  };

  const addFeedback = (text) => {
    setFeedback([text]); // only one line visible
  };

  const handleHeadClick = (index) => {
    if (isPlayingSequence || isDeadRef.current) return;

    setGlowingIndex(index);
    const timeout = setTimeout(() => {
      if (!isDeadRef.current) setGlowingIndex(null);
    }, 700);
    timeouts.current.push(timeout);

    const newInput = [...playerInput, index];
    setPlayerInput(newInput);
    const currentStep = newInput.length - 1;

    // Wrong input
    if (index !== glowSequence[currentStep]) {
      addFeedback("⚡ Wrong head ⚡");
      triggerRedFlash();

      const damage = 20;
      const targets = [];
      if (!darklordDead) {
        setDarklordHealth((prev) => Math.max(prev - damage, 0));
        targets.push("Darklord");
      }
      if (!chxospixieDead) {
        setChxospixieHealth((prev) => Math.max(prev - damage, 0));
        targets.push("Chxospixie");
      }

      showDamage(damage, targets);

      const retryTimer = setTimeout(() => {
        addFeedback("Heads shuffle their glow... Watch carefully.");
        generateNewSequence();
      }, 1500);
      timeouts.current.push(retryTimer);

      return;
    }

    // Correct input
    addFeedback("✔️ Correct Head ✔️ ");

    if (newInput.length === glowSequence.length) {
      addFeedback("✨ Sequence matched! Safe passage unlocked! ✨");
      setTimeout(() => setCanContinue(true), 3000);
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
              className={`${styles.heroesContainer} ${darklordDead || chxospixieDead ? styles.dead : ""}`}
            >
              <div className={shared.championWrapper}>
                <ChampionCard
                  championKey="Darklord"
                  isDead={darklordDead}
                  isPolymorphed={isPolymorphed}
                  size="large"
                />
                {floatingDamage
                  .filter((d) => d.target === "Darklord")
                  .map((d) => (
                    <div key={d.id} className={shared.floatingDamage}>
                      -{d.value}
                    </div>
                  ))}
              </div>

              <div className={shared.championWrapper}>
                <ChampionCard
                  championKey="Chxospixie"
                  isDead={chxospixieDead}
                  isPolymorphed={isPolymorphed}
                  size="large"
                />
                {floatingDamage
                  .filter((d) => d.target === "Chxospixie")
                  .map((d) => (
                    <div key={d.id} className={shared.floatingDamage}>
                      -{d.value}
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className={styles.rightSide}>
            <div className={styles.headsGrid}>
              {headOptions.map((head) => (
                <button
                  key={head.id}
                  onClick={() => handleHeadClick(head.id)}
                  disabled={isPlayingSequence || darklordDead || chxospixieDead}
                  className={`${styles.headButton} ${glowingIndex === head.id ? styles.glow : ""
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

      {/* Bottom feedback bar */}
      <div className={`${styles.actionsContainer} ${shared.actionsContainer}`}>
        <div className={`${styles.actionsInner} ${shared.actionsInnerRow}`}>
          <span className={styles.feedbackText}>{actionLog[0]}</span>
        </div>
      </div>
    </div>
  );
}
