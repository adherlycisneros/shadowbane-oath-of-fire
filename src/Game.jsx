import { useState, useEffect } from "react";
import rooms from "./data/rooms";
import Room1Intro from "./components/rooms/Room1Intro";
import Room2Heads from "./components/rooms/Room2Heads";
import Room3Displacers from "./components/rooms/Room3Displacers";
import Room4Dragon from "./components/rooms/Room4Dragon";
import Room5Brain from "./components/rooms/Room5Brain";
import Room6Final from "./components/rooms/Room6Final";
import TitleScreen from "./components/TitleScreen";
import ChampionCard from "./components/ChampionCard";
import ChampionHUD from "./components/ChampionHUD.jsx";

const DEV_ROOM_INDEX = import.meta.env.VITE_DEV_ROOM_INDEX
  ? parseInt(import.meta.env.VITE_DEV_ROOM_INDEX, 10)
  : null;


// Store whispered phrases
const whisperedPhrases = [
  "Memory is the key to the door",
  "The shadows hide the truth",
  "Light reveals the path",
  "Trust the whispering wind",
  "The silent watch guards the gate",
  "I've always been good enough",
  "That's the power of the keyblade",
];



function CharacterSprites({
  isPolymorphed,
  darklordDead,
  chxospixieDead,
  darklordPose,
  chxospixiePose,
  darklordHealth,
  chxospixieHealth,
}) {
  return (
    <div className="championSprites">
      <ChampionCard
        championKey="Darklord"
        health={darklordHealth}
        maxHealth={120}
        pose={darklordPose}
        isDead={darklordDead}
        isPolymorphed={isPolymorphed}
        size="large"
      />
      <ChampionCard
        championKey="Chxospixie"
        health={chxospixieHealth}
        maxHealth={120}
        pose={chxospixiePose}
        isDead={chxospixieDead}
        isPolymorphed={isPolymorphed}
        size="large"
      />
    </div>
  );
}

export default function Game() {
  const [gameStarted, setGameStarted] = useState(DEV_ROOM_INDEX !== null);
  const [roomIndex, setRoomIndex] = useState(DEV_ROOM_INDEX ?? 0);
  const [darklordHealth, setDarklordHealth] = useState(120);
  const [chxospixieHealth, setChxospixieHealth] = useState(120);
  const [chxospixieStamina, setChxospixieStamina] = useState(60);
  const [actionLog, setActionLog] = useState([]);
  const [dragonAwakened, setDragonAwakened] = useState(false);
  const [whisperedPhrase, setWhisperedPhrase] = useState("");
  const [showWhisper, setShowWhisper] = useState(false);
  const [whisperedRoomIndex, setWhisperedRoomIndex] = useState(null);
  const [canContinue, setCanContinue] = useState(false);
  const [isPolymorphed, setIsPolymorphed] = useState(false);
  const [darklordDead, setDarklordDead] = useState(false);
  const [chxospixieDead, setChxospixieDead] = useState(false);
  const [restartOverlayMessage, setRestartOverlayMessage] = useState("");
  const [showRoomIntro, setShowRoomIntro] = useState(true);
  const [delayedContinue, setDelayedContinue] = useState(false);

  // Sprite pose states
  const [darklordPose, setDarklordPose] = useState("idle"); // "idle", "attack", "dead"
  const [chxospixiePose, setChxospixiePose] = useState("idle");

  // Helper for consistent log updates
  const logAction = (entry) => {
    setActionLog([entry]);
  };

  //START GAME
  const startGame = () => {
    setGameStarted(true);
    setRoomIndex(0);
    setShowRoomIntro(true);
    setDarklordHealth(120);
    setChxospixieHealth(120);
    setChxospixieStamina(60);
    setDarklordDead(false);
    setChxospixieDead(false);
    setCanContinue(false);
    setActionLog([]);
    setIsPolymorphed(false);
    setDarklordPose("idle");
    setChxospixiePose("idle");
  };

  //FINISH GAME
  const finishAdventure = () => {
    setGameStarted(false);
    setRoomIndex(0);
  };

  //DEAD?
  useEffect(() => {
    if (darklordHealth <= 0) {
      setDarklordDead(true);
      setDarklordPose("dead");
    }
    if (chxospixieHealth <= 0) {
      setChxospixieDead(true);
      setChxospixiePose("dead");
    }
  }, [darklordHealth, chxospixieHealth]);

  //Restart room if both heroes dead
  useEffect(() => {
    if (darklordDead && chxospixieDead) {
      const overlayTimer = setTimeout(() => {
        setRestartOverlayMessage("Both heroes have fallen!");
      }, 5000);

      return () => clearTimeout(overlayTimer);
    } else {
      setRestartOverlayMessage("");
    }
  }, [darklordDead, chxospixieDead]);

  //Randomly pick a room excluding 5, 6 to whisper random phrase in
  useEffect(() => {
    const eligibleRooms = rooms
      .filter((r) => r.id !== 5 && r.id !== 6)
      .map((r) => r.id);

    const randomRoomId =
      eligibleRooms[Math.floor(Math.random() * eligibleRooms.length)];
    const randomPhrase =
      whisperedPhrases[Math.floor(Math.random() * whisperedPhrases.length)];

    setWhisperedRoomIndex(randomRoomId);
    setWhisperedPhrase(randomPhrase);
  }, []);
  //Make the whispered phrase disappear after a bit
  useEffect(() => {
    if (roomIndex === whisperedRoomIndex) {
      setShowWhisper(true);
      const timeout = setTimeout(() => setShowWhisper(false), 4000);
      return () => clearTimeout(timeout);
    }
  }, [roomIndex, whisperedRoomIndex]);

  // DELAYED CONTINUE BUTTON LOGIC
  useEffect(() => {
    if (canContinue && currentRoom.id !== 1) {
      const timer = setTimeout(() => {
        setDelayedContinue(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setDelayedContinue(false);
    }
  }, [canContinue, roomIndex]);

  //CLEAR ACTION BUBBLE AFTER DISPLAYED DONE//
  useEffect(() => {
    if (actionLog.length === 0) return;

    const timer = setTimeout(() => {
      setActionLog([]);
    }, 3000); // matches CSS fadeOut

    return () => clearTimeout(timer);
  }, [actionLog]);


  //RESTART ROOM IF HEROES DEAD
  const restartRoom = () => {
    setDarklordHealth(200);
    setChxospixieHealth(200);
    setChxospixieStamina(60);
    setDarklordDead(false);
    setChxospixieDead(false);
    setActionLog([]);
    setCanContinue(false);
    setRestartOverlayMessage("");
    setShowWhisper(false);
    setDarklordPose("idle");
    setChxospixiePose("idle");
  };

  // Sprite pose logic for attacks
  const handleAction = (character, action) => {
    let logEntry = "";

    if (character === "Darklord") {
      if (!isPolymorphed) {
        if (action === "Divine Strike") {
          setDarklordPose("attack");
          setTimeout(() => setDarklordPose(darklordDead ? "dead" : "idle"), 500);
        } else if (action === "Shield Block") {
          setDarklordPose("idle");
        }
      } else {
        if (action === "Toad Slap") {
        } else if (action === "Croak of Confusion") {
        }
      }
    }

    if (character === "Chxospixie") {
      if (!isPolymorphed) {
        if (action === "Savage Slash") {
          setChxospixiePose("attack");
          setTimeout(() => setChxospixiePose(chxospixieDead ? "dead" : "idle"), 500);
        } else if (action === "Fury Charge" && chxospixieStamina >= 12) {
          setChxospixiePose("attack");
          setTimeout(() => setChxospixiePose(chxospixieDead ? "dead" : "idle"), 500);
          setChxospixieStamina((prev) => prev - 12);
        } else if (action === "Fury Charge" && chxospixieStamina < 12) {
          setChxospixiePose("idle");
        }
      } else {
        if (action === "Woolly Bash") {
        } else if (action === "Baa of Distraction") {
        }
      }
    }
  };

  const nextRoom = () => {
    if (roomIndex >= rooms.length - 1) {
      finishAdventure();
      return;
    }

    if (darklordDead) {
      setDarklordHealth(120 * 0.5);
      setDarklordDead(false);
      setDarklordPose("idle");
    }
    if (chxospixieDead) {
      setChxospixieHealth(120 * 0.5);
      setChxospixieStamina(60 * 0.5);
      setChxospixieDead(false);
      setChxospixiePose("idle");
    }
    setRoomIndex(roomIndex + 1);
    setShowRoomIntro(true);
    setActionLog([]);
    setCanContinue(false);
    setDarklordPose("idle");
    setChxospixiePose("idle");
  };

  const currentRoom = rooms[roomIndex];

  return (
    <>
      {/*{currentRoom.id !== 1 && (
        <ChampionHUD
          darklordHealth={darklordHealth}
          chxospixieHealth={chxospixieHealth}
          chxospixieStamina={chxospixieStamina}
          chxospixieMaxStamina={60}
          darklordDead={darklordDead}
          chxospixieDead={chxospixieDead}
          isPolymorphed={isPolymorphed}
        />
      )} */}
      {!gameStarted ? (
        <TitleScreen onStart={startGame} />
      ) : (
        <div className="game-container">

          {/* Room Intro Overlay */}
          {gameStarted && showRoomIntro && currentRoom.id >= 1 && currentRoom.id <= 6 && (
            <div className="room-intro-overlay">
              <h2>{currentRoom.name}</h2>
              <p>{currentRoom.text}</p>
              <button onClick={() => setShowRoomIntro(false)}>
                ➔
              </button>
            </div>
          )}

          {/* Restart room if heroes are dead */}
          {restartOverlayMessage && (
            <div className="restart-overlay">
              <div className="restart-message">
                <p>{restartOverlayMessage}</p>
                <button className="restart-button" onClick={restartRoom}>
                  Restart Room
                </button>
              </div>
            </div>
          )}

          {/* Show whispered phrase in random room */}
          {currentRoom.id === whisperedRoomIndex && showWhisper && (
            <p style={{ fontStyle: "italic", color: "mediumvioletred" }}>
              {" "}
              👂 A whisper tickles your mind: "{whisperedPhrase}"
            </p>
          )}

          {/* Render Room Component only if overlay is dismissed */}
          {!showRoomIntro && (
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
                  setActionLog={setActionLog}
                  handleAction={handleAction}
                  restartOverlayMessage={restartOverlayMessage}
                />
              )}
              {currentRoom.id === 3 && (
                <Room3Displacers
                  key={`room3-${roomIndex}`}
                  darklordHealth={darklordHealth}
                  chxospixieHealth={chxospixieHealth}
                  chxospixieStamina={chxospixieStamina}
                  setRoomIndex={setRoomIndex}
                  setCanContinue={setCanContinue}
                  setDarklordHealth={setDarklordHealth}
                  setChxospixieHealth={setChxospixieHealth}
                  setChxospixieStamina={setChxospixieStamina}
                  isPolymorphed={isPolymorphed}
                  darklordDead={darklordDead}
                  chxospixieDead={chxospixieDead}
                  setActionLog={setActionLog}
                  handleAction={handleAction}
                />
              )}
              {currentRoom.id === 4 && (
                <Room4Dragon
                  key={`room4-${roomIndex}`}
                  darklordHealth={darklordHealth}
                  chxospixieHealth={chxospixieHealth}
                  chxospixieStamina={chxospixieStamina}
                  setChxospixieStamina={setChxospixieStamina}
                  setDarklordHealth={setDarklordHealth}
                  setChxospixieHealth={setChxospixieHealth}
                  dragonAwakened={dragonAwakened}
                  setDragonAwakened={setDragonAwakened}
                  setCanContinue={setCanContinue}
                  darklordDead={darklordDead}
                  chxospixieDead={chxospixieDead}
                  onAction={handleAction}
                  setActionLog={setActionLog}
                />
              )}
              {currentRoom.id === 5 && (
                <Room5Brain
                  key={`room5-${roomIndex}`}
                  whisperedPhrase={whisperedPhrase}
                  setCanContinue={setCanContinue}
                  setIsPolymorphed={setIsPolymorphed}
                  isPolymorphed={isPolymorphed}
                  setActionLog={setActionLog}
                  darklordDead={darklordDead}
                  chxospixieDead={chxospixieDead}
                  darklordHealth={darklordHealth}
                  chxospixieHealth={chxospixieHealth}
                  chxospixieStamina={chxospixieStamina}
                  setChxospixieStamina={setChxospixieStamina}
                  setDarklordHealth={setDarklordHealth}
                  setChxospixieHealth={setChxospixieHealth}

                />
              )}
              {currentRoom.id === 6 && (
                <Room6Final
                  key={`room6-${roomIndex}`}
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
                  setCanContinue={setCanContinue}
                  onFinish={finishAdventure}
                  setActionLog={setActionLog}
                  onAction={handleAction}
                />
              )}
            </>
          )}

          {/* Floating Action Bubbles */}
          {actionLog.length > 0 && !canContinue && !showRoomIntro && !restartOverlayMessage && (
            <div
              className={`actionLogBubble ${currentRoom.id === 2 ? "room2ActionLog" : ""}`}
              key="floating-action-bubble"
            >
              {actionLog[0]}
            </div>
          )}



          {/* Continue Button */}
          {roomIndex < rooms.length - 1 && canContinue && (currentRoom.id === 1 || delayedContinue) && (
            <div
              className="continue-overlay"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 3000,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: `url('/assets/backgrounds/room${currentRoom.id}-bg.png') center/cover no-repeat`
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

          {/* Finish Adventure Button on last room 
          {roomIndex === rooms.length - 1 && canContinue && !showRoomIntro && (
            <button className="continueBtn" onClick={finishAdventure}>Finish Adventure</button>
          )}*/}

        </div>
      )}
    </>
  );
}
