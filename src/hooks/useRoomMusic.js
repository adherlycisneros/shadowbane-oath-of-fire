// src/hooks/useRoomMusic.js
import { useEffect } from "react";
import { attach, suspend, switchTo, unsuspend } from "../audio/musicManager";

const roomMusicMap = {
  title: "/assets/audio/title_screen.mp3",
  1: "/assets/audio/title_screen.mp3",
  2: "/assets/audio/room2_puzzle.mp3",
  3: "/assets/audio/combat.mp3",
  4: {
    healing: "/assets/audio/healing.mp3",
    battle: "/assets/audio/combat.mp3",
  },
  5: "/assets/audio/room5_puzzle.mp3",
  6: {
    boss: "/assets/audio/room6_boss.mp3",
    reward: "/assets/audio/room6_reward.mp3",
  },
};

// Every track plays at the same runtime level; loudness differences are handled in the
// source files (Room 5 was normalized to about -16 LUFS on 2026-09-22).
const DEFAULT_VOLUME = 0.35;

// Tells the music manager which track the game wants right now and whether the orientation
// gate is covering the screen. Unlocking, gesture retries, hidden/visible handling and track
// switching all live in audio/musicManager.js.
export default function useRoomMusic({
  isTitleScreen = false,
  roomIndex,
  room4Mode = "healing",
  room6Mode = "boss",
  suspended = false, // true while the orientation gate covers the game
}) {
  useEffect(() => attach(), []);

  useEffect(() => {
    if (suspended) suspend("orientation");
    else unsuspend("orientation");
  }, [suspended]);

  useEffect(() => {
    // Normalize incoming value to a room id that matches roomMusicMap keys (1..6)
    let roomId;
    if (isTitleScreen) {
      roomId = "title";
    } else if (typeof roomIndex === "number" && roomIndex >= 0 && roomIndex <= 5) {
      roomId = roomIndex + 1;
    } else {
      roomId = roomIndex;
    }

    let trackSrc = null;
    if (roomId === "title") trackSrc = roomMusicMap.title;
    else if (roomId === 4) trackSrc = roomMusicMap[4][room4Mode];
    else if (roomId === 6) trackSrc = roomMusicMap[6][room6Mode];
    else trackSrc = roomMusicMap[roomId];

    if (!trackSrc) return;

    switchTo(trackSrc, { volume: DEFAULT_VOLUME });
  }, [isTitleScreen, roomIndex, room4Mode, room6Mode]);
}
