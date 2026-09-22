import { characterStates } from "./data/characterData";

// Asset readiness for scene art and champion sprites.
//
// ChampionCard swaps an <img> src and its size class in the same render, and a room's
// background is a CSS url() that is only fetched when the room mounts; if the file is not
// already loaded and decoded, the browser paints the previous artwork (or nothing) until it
// arrives. Priming an image ahead of time makes the first paint land on a file the browser
// already holds. Nothing here is awaited by gameplay: state changes and reveals stay
// synchronous and immediate. Keeping the Image objects referenced keeps the fetched resources
// resident for the page, and every unique URL is requested and decoded at most once.
const primed = new Map();

function primeImage(src, { priority } = {}) {
  if (primed.has(src)) return primed.get(src);
  const image = new Image();
  image.decoding = "async";
  // Scene backgrounds ask the browser for the front of the queue; harmless where unsupported.
  if (priority && "fetchPriority" in image) image.fetchPriority = priority;
  // `loaded` settles on the network result and is what later stages chain on. `decode()` is
  // requested as well so the bitmap is ready, but nothing waits on it: browsers only fulfil
  // decode promises at a rendering opportunity, so a hidden page would leave them pending.
  const loaded = new Promise((resolve) => {
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
  });
  image.src = src;
  if (typeof image.decode === "function") {
    image.decode().catch(() => {
      /* decode can reject (e.g. aborted or unsupported); the fetch alone still warms the cache */
    });
  }
  const entry = { image, loaded };
  primed.set(src, entry);
  return entry;
}

// Prime every sprite (idle, attack, dead) of both champions for one form ("normal" | "polymorphed").
export function primeChampionForm(stateKey) {
  const entries = [];
  for (const championKey of Object.keys(characterStates)) {
    const form = characterStates[championKey][stateKey];
    if (!form) continue;
    for (const src of Object.values(form.sprites)) entries.push(primeImage(src));
  }
  return Promise.all(entries.map((entry) => entry.loaded));
}

// Whether a primed image has finished loading (diagnostic aid; no gameplay use).
export function isPrimed(src) {
  const entry = primed.get(src);
  return Boolean(entry && entry.image.complete && entry.image.naturalWidth > 0);
}

// ---------------------------------------------------------------------------
// Scene art. Each room lists its background(s) first, then the enemy artwork whose first
// appearance would otherwise be a first-use fetch (idle at mount, attack at the first strike).
// Backgrounds are requested first and at high priority; the rest follow at default priority.
const BACKGROUNDS = "/assets/backgrounds";
const ENEMIES = "/assets/sprites/enemies";

const ROOM_SCENES = {
  1: { backgrounds: [`${BACKGROUNDS}/room1-bg.webp`], sprites: [] },
  2: {
    backgrounds: [`${BACKGROUNDS}/room2-bg.webp`],
    sprites: [1, 2, 3, 4].map((n) => `${ENEMIES}/room2/head${n}.png`),
  },
  3: {
    backgrounds: [`${BACKGROUNDS}/room3-bg.webp`],
    sprites: [`${ENEMIES}/room3/displacer-idle.png`, `${ENEMIES}/room3/displacer-attack.png`],
  },
  // Both chamber states: the dragon can wake at any moment, and the awake painting also backs
  // the Continue overlay. Sleeping first, awake immediately after.
  4: {
    backgrounds: [`${BACKGROUNDS}/room4-bg1.webp`, `${BACKGROUNDS}/room4-bg2.webp`],
    sprites: [`${ENEMIES}/room4/dragon-idle.png`, `${ENEMIES}/room4/dragon-attack.png`],
  },
  5: {
    backgrounds: [`${BACKGROUNDS}/room5-bg.webp`],
    sprites: [`${ENEMIES}/room5/brain-idle.png`, `${ENEMIES}/room5/brain-attack.png`],
  },
  6: {
    backgrounds: [`${BACKGROUNDS}/room6-bg.webp`],
    sprites: [`${ENEMIES}/room6/beholder-idle.png`, `${ENEMIES}/room6/beholder-attack.png`],
  },
};

// The reward reveal and the epilogue share one painting; the chest appears the moment the boss falls.
const REWARD_SCENE = {
  backgrounds: [`${BACKGROUNDS}/treasure-bg.webp`],
  sprites: ["/assets/treasure/treasure-chest.png"],
};

// Parchment behind every room intro, backstory and the orientation gate.
const INTRO_TEXTURE = "/assets/textures/aged-paper.webp";

function primeSet({ backgrounds, sprites }) {
  const entries = [
    ...backgrounds.map((src) => primeImage(src, { priority: "high" })),
    ...sprites.map((src) => primeImage(src)),
  ];
  return Promise.all(entries.map((entry) => entry.loaded));
}

// Prime a room's background(s) and critical enemy artwork. Resolves once everything has loaded.
export function primeScene(roomId) {
  const scene = ROOM_SCENES[roomId];
  return scene ? primeSet(scene) : Promise.resolve();
}

// Prime the treasure painting and chest (called once Room 6's own art is in).
export function primeRewardScene() {
  return primeSet(REWARD_SCENE);
}

// Prime the intro parchment so the very first room intro paints complete.
export function primeIntroTexture() {
  return primeImage(INTRO_TEXTURE, { priority: "high" }).loaded;
}

if (import.meta.env.DEV) {
  // Test aid for the browser harness; absent from production builds.
  window.__shadowbaneIsPrimed = isPrimed;
}
