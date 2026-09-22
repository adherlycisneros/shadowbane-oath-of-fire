import { useCallback, useEffect, useState, useRef } from "react";
import ChampionCard from "../ChampionCard";
import ChampionHUD from "../ChampionHUD";
import CombatNotice from "../CombatNotice";
import useNotice from "../../hooks/useNotice";
import useHeroFallNotice from "../../hooks/useHeroFallNotice";
import { characterStates } from "../../data/characterData";
import styles from "./Room2Heads.module.css";
import shared from "./Room3Displacers.module.css";

const headOptions = [
  { id: 0, label: "Head 1", img: "/assets/sprites/enemies/room2/head1.png" },
  { id: 1, label: "Head 2", img: "/assets/sprites/enemies/room2/head2.png" },
  { id: 2, label: "Head 3", img: "/assets/sprites/enemies/room2/head3.png" },
  { id: 3, label: "Head 4", img: "/assets/sprites/enemies/room2/head4.png" },
];

export default function Room2Heads({
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
  // Once the sequence is matched the heads are locked; extra taps can't punish or reshuffle.
  const [solved, setSolved] = useState(false);

  const [notice, showNotice] = useNotice();
  const stateKey = isPolymorphed ? "polymorphed" : "normal";
  useHeroFallNotice({
    darklordDead,
    chxospixieDead,
    darklordName: characterStates.Darklord[stateKey].displayName,
    chxospixieName: characterStates.Chxospixie[stateKey].displayName,
    showNotice,
  });

  const isDeadRef = useRef(false);
  const solvedRef = useRef(false);
  // Set after a wrong tap: further taps are ignored until the reshuffled sequence has played.
  const inputLockedRef = useRef(false);
  const timeouts = useRef([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, []);

  const addFeedback = useCallback((text) => {
    setFeedback([text]); // only one line visible
  }, []);

  const playGlowSequence = useCallback(async (sequence) => {
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
  }, []);

  const generateNewSequence = useCallback(() => {
    if (isDeadRef.current || solvedRef.current) return;
    inputLockedRef.current = false;
    setIsPlayingSequence(true);

    const newSeq = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * headOptions.length)
    );
    setGlowSequence(newSeq);
    setPlayerInput([]);

    playGlowSequence(newSeq);
  }, [playGlowSequence]);

  // Initial start
  useEffect(() => {
    const timer = setTimeout(() => generateNewSequence(), 2000);
    timeouts.current.push(timer);
    return () => clearTimeout(timer);
  }, [generateNewSequence]);

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
  }, [darklordDead, chxospixieDead, setCanContinue, addFeedback, generateNewSequence]);

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

  const handleHeadClick = (index) => {
    if (isPlayingSequence || isDeadRef.current || solvedRef.current || inputLockedRef.current) return;

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
      // Lock the heads until the new sequence has played, so taps during the
      // reshuffle delay can't be scored against the old sequence.
      inputLockedRef.current = true;
      setIsPlayingSequence(true);
      setPlayerInput([]);
      addFeedback("⚡ Wrong head ⚡");
      triggerRedFlash();

      // Each living hero pays for a wrong head.
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
      solvedRef.current = true;
      setSolved(true);
      addFeedback("✨ Sequence matched! Safe passage unlocked! ✨");
      const continueTimer = setTimeout(() => setCanContinue(true), 3000);
      timeouts.current.push(continueTimer);
    }
  };

  const headsLocked = isPlayingSequence || solved || darklordDead || chxospixieDead;

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

      <div className={styles.contentWrapper}>
        <div className={styles.leftSide}>
          <div
            className={`${styles.heroesContainer} ${darklordDead || chxospixieDead ? styles.dead : ""}`}
          >
            <div className={shared.championWrapper}>
              <div className={`${styles.spriteImage} ${darklordDead ? styles["dead-darklord"] : ""}`}>
                <ChampionCard
                  championKey="Darklord"
                  isDead={darklordDead}
                  isPolymorphed={isPolymorphed}
                  size="large"
                />
              </div>
              {floatingDamage
                .filter((d) => d.target === "Darklord")
                .map((d) => (
                  <div key={d.id} className={shared.floatingDamage}>
                    -{d.value}
                  </div>
                ))}
            </div>

            <div className={shared.championWrapper}>
              <div className={`${styles.spriteImage} ${chxospixieDead ? styles["dead-chxospixie"] : ""}`}>
                <ChampionCard
                  championKey="Chxospixie"
                  isDead={chxospixieDead}
                  isPolymorphed={isPolymorphed}
                  size="large"
                />
              </div>
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
                disabled={headsLocked}
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

      {/* Bottom feedback bar */}
      <div className={`${styles.actionsContainer} ${shared.actionsContainer}`}>
        <CombatNotice notice={notice} />
        <div className={`${styles.actionsInner} ${shared.actionsInnerRow}`}>
          <span className={styles.feedbackText}>{feedback[0]}</span>
        </div>
      </div>
    </div>
  );
}
