// Music lifecycle for Shadowbane: the one owner of the current track, the unlocked state,
// pending playback that is waiting for a user gesture, and every suspension reason.
//
// Why it exists: browsers (iOS above all) only let audio start inside a real user gesture, an
// installed PWA keeps playing when it is sent to the Home Screen unless the page pauses it, and
// iOS ignores HTMLMediaElement.volume, so volume-ramp crossfades there just overlap two tracks
// at full level. This module handles those three facts in one place; the React hook only tells
// it which track the game wants and whether the orientation gate is up.
//
// Model
//   - one HTMLAudioElement per track, reused (a track re-entered is restarted from the top);
//   - `unlocked` becomes true the first time any play() resolves;
//   - a play() that rejects for lack of activation leaves the track pending, and the next real
//     gesture (pointerup / touchend / click / keydown) retries it;
//   - `suspensions` is a set of reasons ("hidden", "orientation"); while any reason is present
//     everything stays paused, and clearing the last reason resumes the same track at the same
//     position only if it had actually been playing when the suspension began;
//   - orientation changes, resize and effects never count as an unlock;
//   - `muted` is the player's choice for this page session: while set nothing plays (room
//     changes, gesture retries and suspension clears all stay silent), and unmuting starts the
//     intended track from the control's own tap, which is itself a valid activation gesture.

const DEV = import.meta.env.DEV;
const FADE_MS = 800;
const FADE_INTERVAL = 50;
const GESTURE_EVENTS = ["pointerup", "touchend", "click", "keydown"];

const elements = new Map(); // src -> HTMLAudioElement
const fades = new WeakMap(); // element -> interval id
const suspensions = new Set();

let current = null; // { src, audio, volume }
let unlocked = false;
let pendingGesture = false; // the current track wants to play but needs a user gesture
let resumeOnClear = false; // it was playing when the first suspension reason arrived
let volumeControllable = null; // lazily probed: false on iOS
let attachCount = 0;
let muted = false;
const muteListeners = new Set();

function canControlVolume() {
  if (volumeControllable === null) {
    const probe = new Audio();
    probe.volume = 0.5;
    volumeControllable = Math.abs(probe.volume - 0.5) < 0.01;
  }
  return volumeControllable;
}

function elementFor(src) {
  let audio = elements.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.loop = true;
    elements.set(src, audio);
  }
  return audio;
}

function isSuspended() {
  return suspensions.size > 0;
}

function cancelFade(audio) {
  const id = fades.get(audio);
  if (id) {
    clearInterval(id);
    fades.delete(audio);
  }
}

// Ramp an element's volume; resolves when the target is reached. Without volume control the
// target is applied at once (a no-op on iOS) and the promise resolves immediately.
function fadeTo(audio, target, ms) {
  cancelFade(audio);
  if (!canControlVolume() || ms <= 0) {
    audio.volume = target;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const steps = Math.max(1, Math.round(ms / FADE_INTERVAL));
    const start = audio.volume;
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      audio.volume = Math.max(0, Math.min(1, start + (target - start) * (step / steps)));
      if (step >= steps) {
        clearInterval(id);
        fades.delete(audio);
        resolve();
      }
    }, FADE_INTERVAL);
    fades.set(audio, id);
  });
}

// Try to start the current track now. Every rejection is handled: an interrupted play (paused
// again before it started) needs nothing, anything else waits for the next user gesture.
function attemptPlay(reason) {
  if (!current || isSuspended() || muted) return;
  const { audio } = current;
  // A track that was queued (suspended or waiting for a gesture) may still sit at volume 0;
  // unless a fade is already shaping it, start it at its target level.
  if (canControlVolume() && !fades.has(audio)) audio.volume = current.volume;
  let promise;
  try {
    promise = audio.play();
  } catch (error) {
    promise = Promise.reject(error);
  }
  Promise.resolve(promise).then(
    () => {
      unlocked = true;
      pendingGesture = false;
    },
    (error) => {
      if (error && error.name === "AbortError") return;
      pendingGesture = true;
      if (DEV) console.info(`[music] play() rejected on "${reason}" (${error && error.name}); waiting for a user gesture`);
    }
  );
}

function onGesture(event) {
  if (!pendingGesture || !current || isSuspended() || muted) return;
  // The mute control decides for itself what its tap means (see setMuted).
  if (event && event.target && typeof event.target.closest === "function" && event.target.closest("[data-music-control]")) return;
  attemptPlay("gesture");
}

// Genuine transition to a track (room change, restart, end): the incoming track starts from
// the top; the outgoing one fades out where volume control exists, otherwise it stops at once so
// two tracks never overlap. Asking for the track that is already current keeps it running.
export function switchTo(src, { volume = 1 } = {}) {
  const audio = elementFor(src);

  if (current && current.src === src) {
    current.volume = volume;
    fadeTo(audio, volume, FADE_MS);
    if (audio.paused && !isSuspended() && (unlocked || pendingGesture)) attemptPlay("same-track");
    return;
  }

  const previous = current;
  current = { src, audio, volume };
  cancelFade(audio);
  try {
    audio.currentTime = 0;
  } catch {
    /* metadata not loaded yet: playback starts at 0 anyway */
  }

  if (previous) {
    const old = previous.audio;
    if (canControlVolume()) {
      fadeTo(old, 0, FADE_MS).then(() => {
        if (!current || current.audio !== old) old.pause();
      });
    } else {
      cancelFade(old);
      old.pause();
    }
  }

  if (canControlVolume()) audio.volume = previous ? 0 : volume;

  if (isSuspended()) {
    // Deferred until the last suspension reason clears: resume it then if audio is already
    // unlocked, otherwise arm the gesture retry.
    if (unlocked) resumeOnClear = true;
    else pendingGesture = true;
    return;
  }

  // Muted: the element is parked at the top of its track; unmuting starts it at full level.
  if (muted) return;

  // The fade-in is registered first so attemptPlay leaves the ramp alone.
  if (canControlVolume() && previous) fadeTo(audio, volume, FADE_MS);
  attemptPlay("switch");
}

// ---------------------------------------------------------------------------
// Mute. Owned here so every path that could start audio (switch, gesture retry, resume)
// consults one flag; the UI only subscribes and toggles.
export function isMuted() {
  return muted;
}

export function subscribeMuted(listener) {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

export function setMuted(next) {
  next = Boolean(next);
  if (next === muted) return;
  muted = next;

  if (muted) {
    // Pause in place; the current track keeps its position for an unmute in the same room.
    for (const audio of elements.values()) {
      cancelFade(audio);
      if (!audio.paused) audio.pause();
    }
  } else if (current) {
    if (isSuspended()) {
      // Hidden or behind the orientation gate: play once the last reason clears.
      if (unlocked) resumeOnClear = true;
      else pendingGesture = true;
    } else {
      // Called from the control's own tap, so this play() runs inside a user activation and
      // can be the one that unlocks audio.
      attemptPlay("unmute");
    }
  }

  for (const listener of muteListeners) listener(muted);
}

export function toggleMuted() {
  setMuted(!muted);
}

// Temporary suspension (app hidden, orientation gate): pause in place, remember whether the
// track was really playing, resume that same position when every reason is gone.
export function suspend(reason) {
  if (suspensions.size === 0) resumeOnClear = Boolean(current) && !current.audio.paused;
  suspensions.add(reason);
  for (const audio of elements.values()) {
    cancelFade(audio);
    if (!audio.paused) audio.pause();
  }
}

export function unsuspend(reason) {
  suspensions.delete(reason);
  if (suspensions.size > 0 || !current) return;
  if (resumeOnClear) {
    resumeOnClear = false;
    if (canControlVolume()) current.audio.volume = current.volume;
    attemptPlay("resume");
  } else if (!unlocked) {
    // Nothing was playing (audio never unlocked): leave it for the next real gesture.
    pendingGesture = true;
  }
}

function onVisibilityChange() {
  if (document.visibilityState === "hidden") suspend("hidden");
  else unsuspend("hidden");
}

function onPageHide() {
  suspend("hidden");
}

function onPageShow() {
  if (document.visibilityState !== "hidden") unsuspend("hidden");
}

// Install the lifecycle and gesture listeners once (reference counted); returns the detach.
export function attach() {
  attachCount += 1;
  if (attachCount === 1) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    for (const type of GESTURE_EVENTS) window.addEventListener(type, onGesture, { capture: true, passive: true });
    if (document.visibilityState === "hidden") suspend("hidden");
  }
  return detach;
}

function detach() {
  attachCount = Math.max(0, attachCount - 1);
  if (attachCount > 0) return;
  document.removeEventListener("visibilitychange", onVisibilityChange);
  window.removeEventListener("pagehide", onPageHide);
  window.removeEventListener("pageshow", onPageShow);
  for (const type of GESTURE_EVENTS) window.removeEventListener(type, onGesture, { capture: true });
  for (const audio of elements.values()) {
    cancelFade(audio);
    audio.pause();
  }
  current = null;
  suspensions.clear();
  pendingGesture = false;
  resumeOnClear = false;
}

if (DEV) {
  // Test aid for the browser harness; absent from production builds.
  window.__shadowbaneMusic = {
    state: () => ({
      current: current ? current.src.split("/").pop() : null,
      paused: current ? current.audio.paused : null,
      time: current ? +current.audio.currentTime.toFixed(2) : null,
      volume: current ? +current.audio.volume.toFixed(2) : null,
      unlocked,
      pendingGesture,
      resumeOnClear,
      muted,
      suspensions: [...suspensions],
      elements: [...elements.entries()].map(([src, a]) => src.split("/").pop() + (a.paused ? "" : " ▶")),
      volumeControllable,
    }),
    suspend,
    unsuspend,
    setMuted,
    toggleMuted,
    setVolumeControllable: (value) => {
      volumeControllable = value;
    },
  };
}
