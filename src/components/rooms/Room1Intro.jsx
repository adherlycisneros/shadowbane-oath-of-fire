import { useState, useEffect } from "react";
import { characterStates } from "../../data/characterData";
import styles from "./Room1Intro.module.css";

const cinematicLines = [
  "Rumors speak of a vault untouched by time...",
  "a hidden sanctum holding secrets and power beyond mortal reckoning.",
  "Today, two heroes descend into the unknown...",
  "not just for riches, but for legacy.",
  "But legend says... it only stirs once a year on the day the stars remember their vow",
  `Chxospixie: "Wait... isn't that today...?" Chxospixie smirks.`,
];

export default function Room1Intro({ setCanContinue }) {
  const [selected, setSelected] = useState({});
  const [showOverlay, setShowOverlay] = useState(null);
  const [showFinal, setShowFinal] = useState(false);
  const [allBackstoriesRead, setAllBackstoriesRead] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);

  const [isFading, setIsFading] = useState(false);

  const handleNext = () => {
    if (currentLineIndex < cinematicLines.length - 1) {
      // trigger fade out
      setIsFading(true);
      setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1);
        setIsFading(false); // fade in new line
      }, 300); // matches fade duration (300ms)
    } else {
      // last line -> finish cinematic
      setCurrentLineIndex(cinematicLines.length);
      setCanContinue(true);
      setShowFinal(false);
    }
  };

  const characters = [
    {
      key: "Darklord",
      data: characterStates.Darklord.normal,
      sprite: characterStates.Darklord.normal.sprites.idle,
      backstory: (
        <>
          <p>
            <strong>Darklord</strong> was born in the wild borderlands, an
            outcast from the start—half-orc, half-forgotten. From rough
            beginnings, he carved his place in the world not with words, but
            with bloodshed, rising through the brutal ranks of the Blood Arenas
            of Graal'kath.
          </p>
          <p style={{ fontStyle: "italic" }}>
            But everything changed the night he was struck by a divine
            vision—a burning world in ruin, with only him standing between
            salvation and annihilation.
          </p>
          <p>
            Guided by prophecy and a newfound sense of justice, he laid down his
            arena weapons and took up the sacred oath of a paladin.
          </p>
          <p>
            Now, as a half-orc paladin, <strong>Darklord</strong> roams the land
            seeking redemption, protecting the innocent, and chasing fragments
            of truth buried in legend.
          </p>
        </>
      ),
    },
    {
      key: "Chxospixie",
      data: characterStates.Chxospixie.normal,
      sprite: characterStates.Chxospixie.normal.sprites.idle,
      backstory: (
        <>
          <p>
            <strong>Chxospixie</strong> was born in the smoldering ruins of
            Emberreach, heir to a bloodline cursed by ancient infernal pacts. A
            tiefling warrior princess by birth—but never by choice—she fought
            from the start to rise above a damned legacy.
          </p>
          <p style={{ fontStyle: "italic" }}>
            She mastered the blade young, rejecting courtly spells and choosing
            grit over grandeur.
          </p>
          <p>Every scar she carries is a defiant mark against fate.</p>
          <p>
            Now, armed with steel and relentless will, <strong>Chxospixie</strong>{" "}
            roams the world with blade in hand and fire in her heart—
            <em>
              carving her own legend and forging a destiny that no curse can
              claim.
            </em>
          </p>
        </>
      ),
    },
  ];

  const handleClick = (key) => {
    const newSelected = { ...selected, [key]: true };
    setSelected(newSelected);
    setShowOverlay(key);

    const allViewed = characters.every((c) => newSelected[c.key]);
    if (allViewed) setAllBackstoriesRead(true);
  };

  useEffect(() => {
    if (showFinal) {
      setCurrentLineIndex(0);
      setCanContinue(false);
    }
  }, [showFinal, setCanContinue]);

  useEffect(() => {
    if (currentLineIndex === cinematicLines.length) {
      setCanContinue(true);
      setShowFinal(false);
    }
  }, [currentLineIndex, setCanContinue]);

  useEffect(() => {
    if (allBackstoriesRead && !showOverlay) {
      setShowFinal(true);
    }
  }, [allBackstoriesRead, showOverlay]);

  return (
    <div className={`${styles.roomBackground} fullscreen-fit`}>
      {!showFinal && (
        <>
          <h2 className={styles.heroTitle}>
            <span>Meet</span>
            <span>Your</span>
            <span>Heroes</span>
          </h2>
          <div className={styles.heroContainer}>
            {characters.map((char) => (
              <div
                key={char.key}
                className={`${styles.championCard} ${
                  char.key === "Chxospixie" ? styles.flip : ""
                }`}
              >
                <img
                  src={char.sprite}
                  alt={char.data.displayName}
                  className={styles.championSprite}
                />
                <button
                  className={styles.nameBanner}
                  onClick={() => handleClick(char.key)}
                >
                  {char.data.displayName}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {showOverlay && (
        <div className={styles.overlay}>
          <div className={styles.overlayContent}>
            <button
              className={styles.closeBtn}
              onClick={() => setShowOverlay(null)}
            >
              ×
            </button>
            <h3 className={styles.overlayTitle}>
              {characters.find((c) => c.key === showOverlay).data.displayName}
            </h3>
            <div className={styles.backstoryText}>
              {characters.find((c) => c.key === showOverlay).backstory}
            </div>
          </div>
        </div>
      )}

      {showFinal && (
        <div className={styles.cinematicContainer}>
          {currentLineIndex >= 0 && currentLineIndex < cinematicLines.length && (
            <p 
              key={currentLineIndex} 
              className={styles.cinematicLine}
              style={{ opacity: isFading ? 0 : 1 }}
            >
              {cinematicLines[currentLineIndex]}
            </p>
          )}

          {/* Navigation buttons */}
          <div className={styles.cinematicNav}>
            <button
              className={`${styles.cinematicButton} ${styles.skipButton}`}
              onClick={() => {
                setCurrentLineIndex(cinematicLines.length);
                setCanContinue(true);
                setShowFinal(false);
              }}
            >
              Skip
            </button>

            {/* Next arrow button (right side) */}
            <button
              className={`${styles.cinematicButton} ${styles.cinematicArrow}`}
              onClick={() =>
                setCurrentLineIndex((prev) =>
                  Math.min(prev + 1, cinematicLines.length)
                )
              }
            >
              ➜
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
