import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import rooms from "./data/rooms";
import { characterStates } from "./data/characterData";
import Room1Intro from "./components/rooms/Room1Intro";
import Room2Heads from "./components/rooms/Room2Heads";
import Room3Displacers from "./components/rooms/Room3Displacers";
import Room4Dragon from "./components/rooms/Room4Dragon";
import Room5Brain from "./components/rooms/Room5Brain";
import Room6Final from "./components/rooms/Room6Final";
import TitleScreen from "./components/TitleScreen";
import OmenOverlay from "./components/OmenOverlay";
import useRoomMusic from "./hooks/useRoomMusic";
import MuteButton from "./components/MuteButton";
import { useOrientationGate } from "./orientationGate";
import { primeChampionForm, primeIntroTexture, primeRewardScene, primeScene } from "./spritePreload";

const DEV_ROOM_INDEX = import.meta.env.VITE_DEV_ROOM_INDEX
  ? parseInt(import.meta.env.VITE_DEV_ROOM_INDEX, 10)
  : null;

// DEV TESTING launcher (title screen, development only). `import.meta.env.DEV` is a
// build-time constant, so in production this is `null` and the dev module is never bundled.
const DevLauncher = import.meta.env.DEV ? lazy(() => import("./dev/DevLauncher")) : null;

const HERO_MAX_HEALTH = 200;
const HERO_MAX_STAMINA = 60;
// A fallen hero rejoins at half strength when the party moves to the next room.
const REVIVE_FACTOR = 0.5;
// How long the fallen party is left looking at the field before the restart prompt appears.
const PARTY_DEFEAT_DELAY_MS = 2000;

// The omen's words; the brain in Room 5 demands them back.
const omenPhrases = [
  "Memory is the key to the door",
  "The shadows hide the truth",
  "Light reveals the path",
  "Trust the whispering wind",
  "The silent watch guards the gate",
  "Shadows speak in silence",
  "The night hides more than shadows",
];

// The omen appears in one of these rooms, once its intro is dismissed:
// never the antechamber, never the vault that tests it.
const OMEN_ROOM_IDS = [2, 3, 4];

function rollOmen() {
  return {
    roomId: OMEN_ROOM_IDS[Math.floor(Math.random() * OMEN_ROOM_IDS.length)],
    phrase: omenPhrases[Math.floor(Math.random() * omenPhrases.length)],
  };
}

export default function Game() {
  const initialRoomIndex = DEV_ROOM_INDEX ?? 0;
  const [gameStarted, setGameStarted] = useState(DEV_ROOM_INDEX !== null);
  const [roomIndex, setRoomIndex] = useState(initialRoomIndex);
  const [darklordHealth, setDarklordHealth] = useState(HERO_MAX_HEALTH);
  const [chxospixieHealth, setChxospixieHealth] = useState(HERO_MAX_HEALTH);
  const [chxospixieStamina, setChxospixieStamina] = useState(HERO_MAX_STAMINA);
  const [dragonAwakened, setDragonAwakened] = useState(false);
  const [omen, setOmen] = useState(rollOmen);
  const [showOmen, setShowOmen] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [isPolymorphed, setIsPolymorphed] = useState(false);
  const [darklordDead, setDarklordDead] = useState(false);
  const [chxospixieDead, setChxospixieDead] = useState(false);
  const [restartOverlayMessage, setRestartOverlayMessage] = useState("");
  const [showRoomIntro, setShowRoomIntro] = useState(true);
  const [delayedContinue, setDelayedContinue] = useState(false);
  const [roomResetTrigger, setRoomResetTrigger] = useState(0);
  // Set the moment the Beholder falls; drives the Room 6 reward track (see useRoomMusic).
  const [bossDefeated, setBossDefeated] = useState(false);
  // Champions who rose at half strength on entering the current room.
  const [revivalNotice, setRevivalNotice] = useState([]);
  // Run history for the epilogue recap: null until the room is left with its outcome settled.
  // Dragon: "slept" | "defeated". Cerebral Vault: "remembered" | "polymorphed".
  const [dragonOutcome, setDragonOutcome] = useState(null);
  const [vaultOutcome, setVaultOutcome] = useState(null);
  // Per-adventure bookkeeping: the omen is delivered once.
  const omenDeliveredRef = useRef(false);
  // Player state at the moment the current room's encounter began. A full-party defeat
  // restores exactly this, so retrying is never a heal or a stamina refill. Captured wherever
  // room-entry state is established (new adventure, next room, dev scenario). Both champions
  // always stand at room entry (a fallen one returns at the next room), so no dead flags here.
  // Room 4: the awakened dragon is fought from the values the party carried into the chamber
  // (a wake interrupts Heal Both before any healing), so the room-entry capture already is the
  // pre-heal fight-entry state.
  const encounterCheckpointRef = useRef({
    darklordHealth: HERO_MAX_HEALTH,
    chxospixieHealth: HERO_MAX_HEALTH,
    chxospixieStamina: HERO_MAX_STAMINA,
    isPolymorphed: false,
  });

  const captureEncounter = ({ darklordHealth, chxospixieHealth, chxospixieStamina, isPolymorphed }) => {
    encounterCheckpointRef.current = { darklordHealth, chxospixieHealth, chxospixieStamina, isPolymorphed };
  };

  // Defeat overlay: "Restart Adventure" asks for confirmation before abandoning the run.
  const [confirmRestart, setConfirmRestart] = useState(false);
  const cancelRestartRef = useRef(null);
  const retryEncounterRef = useRef(null);
  // DEV TESTING only: mount Room 6 already in its reward state ("Treasure / Epilogue").
  // Always false in production builds (only startScenario, itself DEV-only, sets it).
  const [devRewardStart, setDevRewardStart] = useState(false);

  const currentRoom = rooms[roomIndex];
  const isTitleScreen = !gameStarted;
  const orientationGated = useOrientationGate();

  //START GAME — every new adventure begins from clean run state
  const startGame = () => {
    setGameStarted(true);
    setRoomIndex(0);
    setShowRoomIntro(true);
    if (import.meta.env.DEV) setDevRewardStart(false);
    setDarklordHealth(HERO_MAX_HEALTH);
    setChxospixieHealth(HERO_MAX_HEALTH);
    setChxospixieStamina(HERO_MAX_STAMINA);
    setDarklordDead(false);
    setChxospixieDead(false);
    setCanContinue(false);
    setIsPolymorphed(false);
    setDragonAwakened(false);
    setRestartOverlayMessage("");
    setConfirmRestart(false);
    setBossDefeated(false);
    setRevivalNotice([]);
    setDragonOutcome(null);
    setVaultOutcome(null);
    setOmen(rollOmen());
    setShowOmen(false);
    omenDeliveredRef.current = false;
    captureEncounter({
      darklordHealth: HERO_MAX_HEALTH,
      chxospixieHealth: HERO_MAX_HEALTH,
      chxospixieStamina: HERO_MAX_STAMINA,
      isPolymorphed: false,
    });
  };

  // DEV TESTING: start a fresh run directly in a room with preset champion state
  // (see dev/scenarios.js). Progression, balance and room logic are untouched: this only
  // seeds the same state startGame() seeds. Absent from production builds.
  const startScenario = import.meta.env.DEV
    ? (scenario) => {
        const index = rooms.findIndex((room) => room.id === scenario.roomId);
        if (index < 0) return;
        setGameStarted(true);
        setRoomIndex(index);
        // The reward shortcut lands after the fight, where no room intro would be showing.
        setShowRoomIntro(!scenario.reward);
        setDevRewardStart(Boolean(scenario.reward));
        setDarklordHealth(scenario.darklordHealth);
        setChxospixieHealth(scenario.chxospixieHealth);
        setChxospixieStamina(scenario.chxospixieStamina);
        setDarklordDead(false);
        setChxospixieDead(false);
        setCanContinue(false);
        setIsPolymorphed(Boolean(scenario.polymorphed));
        setDragonAwakened(Boolean(scenario.dragonAwakened));
        setRestartOverlayMessage("");
        // Reward shortcut: the Beholder already fell, so the reward track plays as it would.
        setBossDefeated(Boolean(scenario.reward));
        setRevivalNotice([]);
        // No invented history: rooms skipped by the shortcut stay unresolved (neutral recap).
        setDragonOutcome(null);
        setVaultOutcome(null);
        // Omen: if the launched room can carry it, deliver it there so Room 5 is answerable;
        // rooms past the omen's window count it as already delivered.
        const omenHere = OMEN_ROOM_IDS.includes(scenario.roomId);
        const rolled = rollOmen();
        setOmen(omenHere ? { ...rolled, roomId: scenario.roomId } : rolled);
        setShowOmen(false);
        omenDeliveredRef.current = !omenHere;
        captureEncounter({
          darklordHealth: scenario.darklordHealth,
          chxospixieHealth: scenario.chxospixieHealth,
          chxospixieStamina: scenario.chxospixieStamina,
          isPolymorphed: Boolean(scenario.polymorphed),
        });
      }
    : null;

  //FINISH GAME
  const finishAdventure = () => {
    setGameStarted(false);
    setRoomIndex(0);
  };

  //DEAD?
  useEffect(() => {
    if (darklordHealth <= 0) {
      setDarklordDead(true);
    }
    if (chxospixieHealth <= 0) {
      setChxospixieDead(true);
    }
  }, [darklordHealth, chxospixieHealth]);

  //Restart room if both heroes dead
  useEffect(() => {
    if (darklordDead && chxospixieDead) {
      const overlayTimer = setTimeout(() => {
        setRestartOverlayMessage("Both heroes have fallen!");
      }, PARTY_DEFEAT_DELAY_MS);

      return () => clearTimeout(overlayTimer);
    } else {
      setRestartOverlayMessage("");
    }
  }, [darklordDead, chxospixieDead]);

  // DELAYED CONTINUE BUTTON LOGIC
  useEffect(() => {
    if (canContinue && currentRoom.id !== 1 && currentRoom.id !== 4) {
      const timer = setTimeout(() => {
        setDelayedContinue(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setDelayedContinue(false);
    }
  }, [canContinue, currentRoom.id]);

  // RETRY ENCOUNTER (full-party defeat): the party retries from its encounter-entry state, not
  // from full. Enemy health and the rooms' own fight state reset through roomResetTrigger; the
  // dragon's awakened flag is deliberately left alone so an awake dragon stays awake.
  const retryEncounter = () => {
    setConfirmRestart(false);
    const entry = encounterCheckpointRef.current;
    setDarklordHealth(entry.darklordHealth);
    setChxospixieHealth(entry.chxospixieHealth);
    setChxospixieStamina(entry.chxospixieStamina);
    setIsPolymorphed(entry.isPolymorphed);
    setDarklordDead(false);
    setChxospixieDead(false);
    setCanContinue(false);
    setRestartOverlayMessage("");
    setShowOmen(false);
    setBossDefeated(false);
    setRoomResetTrigger((prev) => prev + 1);
  };

  // RESTART ADVENTURE (confirmed): abandon the run. Returning to the title screen is the same
  // path the epilogue's "End Adventure" takes, and "Begin Your Journey" then runs startGame(),
  // the one place a fresh run is initialised. No second set of reset assignments exists.
  const restartAdventure = () => {
    setConfirmRestart(false);
    setRestartOverlayMessage("");
    finishAdventure();
  };

  // When the defeat overlay is up (and the confirmation is not), keyboard focus goes to
  // Retry Encounter instead of staying on a disabled move button behind the overlay.
  useEffect(() => {
    if (restartOverlayMessage && !confirmRestart) retryEncounterRef.current?.focus();
  }, [restartOverlayMessage, confirmRestart]);

  // Land focus on the safe choice when the confirmation opens; Escape backs out.
  useEffect(() => {
    if (!confirmRestart) return;
    cancelRestartRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") setConfirmRestart(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmRestart]);

  const nextRoom = () => {
    if (roomIndex >= rooms.length - 1) {
      finishAdventure();
      return;
    }

    // A fallen champion returns at half strength; survivors carry their remaining HP.
    // The values the party walks in with are the next room's encounter checkpoint.
    const stateKey = isPolymorphed ? "polymorphed" : "normal";
    const entry = {
      darklordHealth: darklordDead ? HERO_MAX_HEALTH * REVIVE_FACTOR : darklordHealth,
      chxospixieHealth: chxospixieDead ? HERO_MAX_HEALTH * REVIVE_FACTOR : chxospixieHealth,
      chxospixieStamina: chxospixieDead ? HERO_MAX_STAMINA * REVIVE_FACTOR : chxospixieStamina,
      isPolymorphed,
    };
    const revived = [];
    if (darklordDead) {
      setDarklordHealth(entry.darklordHealth);
      setDarklordDead(false);
      revived.push(characterStates.Darklord[stateKey].displayName);
    }
    if (chxospixieDead) {
      setChxospixieHealth(entry.chxospixieHealth);
      setChxospixieStamina(entry.chxospixieStamina);
      setChxospixieDead(false);
      revived.push(characterStates.Chxospixie[stateKey].displayName);
    }
    setRevivalNotice(revived);
    captureEncounter(entry);

    // Record the run's outcome for the room being left. Continue is the only way out, and it
    // only appears once the room is settled: in Room 4 after a heal the dragon slept through
    // or after the awakened dragon falls (an awake dragon hides the healing controls), in
    // Room 5 after the right words or the polymorph. A wipe and Retry never gets this far.
    if (currentRoom.id === 4) setDragonOutcome(dragonAwakened ? "defeated" : "slept");
    if (currentRoom.id === 5) setVaultOutcome(isPolymorphed ? "polymorphed" : "remembered");

    const nextIndex = roomIndex + 1;
    setRoomIndex(nextIndex);
    setShowRoomIntro(true);
    setCanContinue(false);
  };

  // Dismissing a room's intro is also the moment the omen appears, if this is its room.
  const dismissRoomIntro = () => {
    setShowRoomIntro(false);
    if (currentRoom.id === omen.roomId && !omenDeliveredRef.current) {
      omenDeliveredRef.current = true;
      setShowOmen(true);
    }
  };

  const handleOmenDismiss = useCallback(() => {
    setShowOmen(false);
  }, []);

  const handleBossDefeated = useCallback(() => {
    setBossDefeated(true);
  }, []);

  // ASSET READINESS (fire-and-forget; nothing below is ever awaited by gameplay).
  // Title: the parchment behind the first room intro. Each room, the moment its intro appears:
  // its own background(s) and critical enemy art first, then both champions' idle/attack/dead
  // artwork (normal form always; polymorphed form on entering the Cerebral Vault, before the
  // brain can transform anyone, and whenever the party is already transformed). Room 6 also
  // primes the treasure painting and chest once its own art is in, long before the chest appears.
  useEffect(() => {
    if (!gameStarted) {
      primeIntroTexture();
      return;
    }
    const scene = primeScene(currentRoom.id);
    primeChampionForm("normal");
    if (isPolymorphed || currentRoom.id >= 5) primeChampionForm("polymorphed");
    if (currentRoom.id === 6) scene.then(primeRewardScene);
  }, [gameStarted, isPolymorphed, currentRoom.id]);

  // While the Continue overlay is up, the next room's art is primed ahead of the move.
  useEffect(() => {
    if (!canContinue) return;
    const next = rooms[roomIndex + 1];
    if (next) primeScene(next.id);
  }, [canContinue, roomIndex]);

  // ROOM MUSIC HOOK
  useRoomMusic({
    roomIndex,
    isTitleScreen,
    room4Mode: dragonAwakened ? "battle" : "healing",
    room6Mode: currentRoom.id === 6 && bossDefeated ? "reward" : "boss",
    suspended: orientationGated,
  });

  return (
    <>
      {!gameStarted ? (
        <>
          <TitleScreen onStart={startGame} />
          {DevLauncher && (
            <Suspense fallback={null}>
              <DevLauncher onLaunch={startScenario} />
            </Suspense>
          )}
        </>
      ) : (
        <div className="game-container">

          {/* Room Intro Overlay */}
          {gameStarted && showRoomIntro && currentRoom.id >= 1 && currentRoom.id <= 6 && (
            <div className="room-intro-overlay">
              <h2>{currentRoom.name}</h2>
              <p>{currentRoom.text}</p>
              {revivalNotice.map((name) => (
                <p key={name} className="room-intro-notice">
                  {name} rises at half strength.
                </p>
              ))}
              <button type="button" aria-label="Continue" onClick={dismissRoomIntro}>
                ➔
              </button>
            </div>
          )}

          {/* Restart room if heroes are dead */}
          {restartOverlayMessage && (
            <div className="restart-overlay">
              {confirmRestart ? (
                <div
                  className="restart-message restart-confirm"
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="restart-confirm-title"
                  aria-describedby="restart-confirm-body"
                >
                  <p id="restart-confirm-title">Restart the entire adventure?</p>
                  <p id="restart-confirm-body" className="restart-confirm-body">
                    Your current progress will be lost.
                  </p>
                  <div className="restart-actions">
                    <button
                      ref={cancelRestartRef}
                      type="button"
                      className="restart-button"
                      onClick={() => setConfirmRestart(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="restart-button restart-button--secondary"
                      onClick={restartAdventure}
                    >
                      Restart Adventure
                    </button>
                  </div>
                </div>
              ) : (
                <div className="restart-message">
                  <p>{restartOverlayMessage}</p>
                  <div className="restart-actions">
                    <button ref={retryEncounterRef} type="button" className="restart-button" onClick={retryEncounter}>
                      Retry Encounter
                    </button>
                    <button
                      type="button"
                      className="restart-button restart-button--secondary"
                      onClick={() => setConfirmRestart(true)}
                    >
                      Restart Adventure
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* The omen: once, in its room, right after the intro. The room waits underneath it. */}
          {showOmen && (
            <OmenOverlay phrase={omen.phrase} onDismiss={handleOmenDismiss} />
          )}

          {/* Render Room Component only once the intro (and the omen, if any) is dismissed */}
          {!showRoomIntro && !showOmen && (
            <>
              {currentRoom.id === 1 && (
                <Room1Intro key={`room1-${roomIndex}`} setCanContinue={setCanContinue} />
              )}

              {currentRoom.id === 2 && (
                <Room2Heads
                  key={`room2-${roomIndex}`}
                  setCanContinue={setCanContinue}
                  setDarklordHealth={setDarklordHealth}
                  chxospixieStamina={chxospixieStamina}
                  setChxospixieHealth={setChxospixieHealth}
                  darklordHealth={darklordHealth}
                  chxospixieHealth={chxospixieHealth}
                  darklordDead={darklordDead}
                  chxospixieDead={chxospixieDead}
                />
              )}
              {currentRoom.id === 3 && (
                <Room3Displacers
                  key={`room3-${roomIndex}`}
                  roomResetTrigger={roomResetTrigger}
                  darklordHealth={darklordHealth}
                  chxospixieHealth={chxospixieHealth}
                  chxospixieStamina={chxospixieStamina}
                  setCanContinue={setCanContinue}
                  setDarklordHealth={setDarklordHealth}
                  setChxospixieHealth={setChxospixieHealth}
                  setChxospixieStamina={setChxospixieStamina}
                  isPolymorphed={isPolymorphed}
                  darklordDead={darklordDead}
                  chxospixieDead={chxospixieDead}
                />
              )}
              {currentRoom.id === 4 && (
                <Room4Dragon
                  key={`room4-${roomIndex}`}
                  roomResetTrigger={roomResetTrigger}
                  darklordHealth={darklordHealth}
                  chxospixieHealth={chxospixieHealth}
                  chxospixieStamina={chxospixieStamina}
                  setChxospixieStamina={setChxospixieStamina}
                  setDarklordHealth={setDarklordHealth}
                  setChxospixieHealth={setChxospixieHealth}
                  dragonAwakened={dragonAwakened}
                  setDragonAwakened={setDragonAwakened}
                  setCanContinue={setCanContinue}
                  isPolymorphed={isPolymorphed}
                  darklordDead={darklordDead}
                  chxospixieDead={chxospixieDead}
                  setDarklordDead={setDarklordDead}
                  setChxospixieDead={setChxospixieDead}
                />
              )}
              {currentRoom.id === 5 && (
                <Room5Brain
                  key={`room5-${roomIndex}`}
                  omenPhrase={omen.phrase}
                  setCanContinue={setCanContinue}
                  setIsPolymorphed={setIsPolymorphed}
                  isPolymorphed={isPolymorphed}
                  darklordDead={darklordDead}
                  chxospixieDead={chxospixieDead}
                />
              )}
              {currentRoom.id === 6 && (
                <Room6Final
                  key={`room6-${roomIndex}`}
                  roomResetTrigger={roomResetTrigger}
                  darklordHealth={darklordHealth}
                  chxospixieHealth={chxospixieHealth}
                  setDarklordHealth={setDarklordHealth}
                  setChxospixieHealth={setChxospixieHealth}
                  chxospixieStamina={chxospixieStamina}
                  setChxospixieStamina={setChxospixieStamina}
                  isPolymorphed={isPolymorphed}
                  setIsPolymorphed={setIsPolymorphed}
                  darklordDead={darklordDead}
                  chxospixieDead={chxospixieDead}
                  dragonOutcome={dragonOutcome}
                  vaultOutcome={vaultOutcome}
                  onBossDefeated={handleBossDefeated}
                  onFinish={finishAdventure}
                  devStartAtReward={import.meta.env.DEV && devRewardStart}
                />
              )}
            </>
          )}

          {/* Continue Button */}
          {roomIndex < rooms.length - 1 && canContinue && (currentRoom.id === 1 || delayedContinue || currentRoom.id === 4) && (
            <div
              className="continue-overlay"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 3000,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: `url('${currentRoom.continueBackground}') center/cover no-repeat`
              }}
            >
              <button
                className="continueBtn centered"
                onClick={nextRoom}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      )}
      {/* Music toggle: one fixed control for the title, every room, the reward scene and the
          epilogue. Last in DOM order so it follows the scene's own controls in the tab order. */}
      <MuteButton />
    </>
  );
}
