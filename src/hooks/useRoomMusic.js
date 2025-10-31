// src/hooks/useRoomMusic.js
import { useEffect, useRef } from "react";

const roomMusicMap = {
  title: "/assets/audio/title_screen.mp3",
  1: "/assets/audio/room1_intro.mp3",
  2: "/assets/audio/puzzle.mp3",
  3: "/assets/audio/combat.mp3",
  4: {
    healing: "/assets/audio/healing.mp3",
    battle: "/assets/audio/combat.mp3",
  },
  5: "/assets/audio/puzzle.mp3",
  6: {
    boss: "/assets/audio/room6_boss.mp3",
    reward: "/assets/audio/room6_reward.mp3",
  },
};

export default function useRoomMusic({
  isTitleScreen = false,
  roomIndex,
  showRoomIntro, // kept for API compatibility
  room4Mode = "healing",
  room6Mode = "boss",
  firstInteractionRef, // shared ref: { current: bool, audio?: Audio }
}) {
  const audioRef = useRef(null);

  useEffect(() => {
    // wait for first interaction unlock
    if (!firstInteractionRef?.current) return;

    // Normalize incoming value to a room id that matches roomMusicMap keys (1..6)
    let roomId;
    if (isTitleScreen) {
      roomId = "title";
    } else {
      if (typeof roomIndex === "number") {
        // convert 0-based index (0..5) to 1-based room ids (1..6)
        if (roomIndex >= 0 && roomIndex <= 5) roomId = roomIndex + 1;
        else roomId = roomIndex;
      } else {
        roomId = roomIndex;
      }
    }

    let trackSrc = null;
    if (roomId === "title") trackSrc = roomMusicMap.title;
    else if (roomId === 4) trackSrc = roomMusicMap[4][room4Mode];
    else if (roomId === 6) trackSrc = roomMusicMap[6][room6Mode];
    else trackSrc = roomMusicMap[roomId];

    if (!trackSrc) return;

    // If we already have an unlocked title audio (played inside TitleScreen), reuse it for the title
    if (firstInteractionRef?.audio && isTitleScreen) {
      audioRef.current = firstInteractionRef.audio;
      audioRef.current.loop = true;
      audioRef.current.volume = 0.35;
      audioRef.current.play().catch(() => {});
      return () => {};
    }

    // If a stored title audio exists and we're switching to a room track, stop and clear it
    if (firstInteractionRef?.audio && !isTitleScreen) {
      try {
        firstInteractionRef.audio.pause();
      } catch (e) {}
      firstInteractionRef.audio = null;
    }

    // stop previous music if any
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (e) {}
      audioRef.current = null;
    }

    const audio = new Audio(trackSrc);
    audio.loop = true;
    audio.volume = 0.35;
    audio.play().catch(() => {
      console.warn("Audio play failed:", audio.src);
    });
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (e) {}
      }
    };
  }, [
    isTitleScreen,
    roomIndex,
    // showRoomIntro intentionally left in dependencies for future use but not used to block playback
    showRoomIntro,
    room4Mode,
    room6Mode,
    firstInteractionRef?.current,
    firstInteractionRef?.audio,
  ]);
}
