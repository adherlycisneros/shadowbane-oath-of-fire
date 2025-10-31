// src/hooks/useRoomMusic.js
import { useEffect, useRef } from "react";

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

const DEFAULT_VOLUME = 0.35;
// Per-track volume overrides (use room id keys). Room 5 slightly louder.
const PER_TRACK_VOLUME = {
  5: 0.80,
};
const FADE_MS = 800; // crossfade duration, tweak as needed
const FADE_INTERVAL = 50;

function rampVolume(audio, from, to, duration) {
  return new Promise((resolve) => {
    if (!audio) return resolve();
    // cancel existing timer if present
    if (audio._fadeTimer) {
      clearInterval(audio._fadeTimer);
      audio._fadeTimer = null;
    }
    const steps = Math.max(1, Math.floor(duration / FADE_INTERVAL));
    const stepAmount = (to - from) / steps;
    let currentStep = 0;
    audio.volume = Math.max(0, Math.min(1, from));
    audio._fadeTimer = setInterval(() => {
      currentStep += 1;
      const next = audio.volume + stepAmount;
      audio.volume = Math.max(0, Math.min(1, next));
      if (currentStep >= steps) {
        clearInterval(audio._fadeTimer);
        audio._fadeTimer = null;
        audio.volume = Math.max(0, Math.min(1, to));
        resolve();
      }
    }, FADE_INTERVAL);
  });
}

export default function useRoomMusic({
  isTitleScreen = false,
  roomIndex,
  showRoomIntro, // kept for API compatibility — used to decide Room1 behavior elsewhere
  room4Mode = "healing",
  room6Mode = "boss",
  firstInteractionRef, // shared ref: { current: bool, audio?: Audio }
}) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!firstInteractionRef?.current) return;

    // Normalize incoming value to a room id that matches roomMusicMap keys (1..6)
    let roomId;
    if (isTitleScreen) {
      roomId = "title";
    } else {
      if (typeof roomIndex === "number") {
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

    // target volume for this track (apply per-track overrides)
    let targetVolume = DEFAULT_VOLUME;
    if (roomId !== "title") {
      if (PER_TRACK_VOLUME[roomId]) targetVolume = PER_TRACK_VOLUME[roomId];
    }

    let cancelled = false;

    async function switchToTrack() {
      // If current audio already matches desired track, keep it (no restart)
      if (audioRef.current && audioRef.current.src && audioRef.current.src.includes(trackSrc)) {
        audioRef.current.loop = true;
        audioRef.current.volume = targetVolume;
        audioRef.current.play().catch(() => {});
        return;
      }

      // determine old audio(s) to fade out: audioRef.current and possibly firstInteractionRef.audio
      const oldAudio = audioRef.current;
      const storedTitleAudio = firstInteractionRef?.audio && firstInteractionRef.audio !== oldAudio ? firstInteractionRef.audio : null;

      // create and start new audio at volume 0
      const newAudio = new Audio(trackSrc);
      newAudio.loop = true;
      newAudio.volume = 0;
      try {
        await newAudio.play();
      } catch (e) {
        // play may fail without user gesture; still proceed with fade attempts
        console.warn("Audio play failed (new):", trackSrc, e);
      }

      if (cancelled) {
        try { newAudio.pause(); } catch (e) {}
        return;
      }

      // start crossfade: fade in new while fading out old(s)
      const fadeInPromise = rampVolume(newAudio, 0, targetVolume, FADE_MS);

      const fadeOutPromises = [];
      if (oldAudio && oldAudio !== newAudio) {
        fadeOutPromises.push(
          rampVolume(oldAudio, oldAudio.volume ?? DEFAULT_VOLUME, 0, FADE_MS).then(() => {
            try { oldAudio.pause(); } catch (e) {}
            if (oldAudio._fadeTimer) { clearInterval(oldAudio._fadeTimer); oldAudio._fadeTimer = null; }
          })
        );
      }
      if (storedTitleAudio && storedTitleAudio !== newAudio && storedTitleAudio !== oldAudio) {
        fadeOutPromises.push(
          rampVolume(storedTitleAudio, storedTitleAudio.volume ?? DEFAULT_VOLUME, 0, FADE_MS).then(() => {
            try { storedTitleAudio.pause(); } catch (e) {}
            if (storedTitleAudio._fadeTimer) { clearInterval(storedTitleAudio._fadeTimer); storedTitleAudio._fadeTimer = null; }
            // clear stored title audio reference so hook can manage future tracks normally
            try { firstInteractionRef.audio = null; } catch (e) {}
          })
        );
      }

      // wait for fades to finish
      await Promise.all([fadeInPromise, ...fadeOutPromises]);

      if (cancelled) {
        try { newAudio.pause(); } catch (e) {}
        return;
      }

      // set new audio as current
      audioRef.current = newAudio;
    }

    switchToTrack();

    return () => {
      cancelled = true;
    };
    // run effect when these change
  }, [
    isTitleScreen,
    roomIndex,
    showRoomIntro,
    room4Mode,
    room6Mode,
    firstInteractionRef?.current,
    firstInteractionRef?.audio,
  ]);
 }
