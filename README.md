# 🧙‍♂️ "Shadowbane: Oath and Fire" -- A Fantasy PWA Quest

A mobile-first, turn-based fantasy adventure built in React — featuring unique room-based challenges, character transformations, stamina-based combat, and a final boss encounter. Designed as a progressive web app (PWA), it's installable and offline-ready.

## 📜 Game Overview

Join **Chxospixie**, a fierce tiefling warrior princess, and **Darklord**, a half-orc paladin, on a magical journey through a mysterious dungeon. Each room offers a different mechanic:

- Room 1: Cinematic intro with whispered prophecy
- Room 2: Memory-based puzzle with cursed floating heads
- Room 3: Turn-based combat with stamina management
- Room 4: Sleeping dragon encounter with branching outcomes
- Room 5: Whisper phrase logic with polymorph risk
- Room 6: Final boss fight against a D&D-style **Beholder**

Polymorph consequences, attack animations, and responsive design make this game immersive and dynamic.

---

## 🚀 Features

- 🧠 Unique room logic per stage
- 🧝 Custom characters with idle/attack poses & polymorph states
- ⚔️ Turn-based stamina combat system
- 🐸 Polymorph mechanic affecting gameplay across rooms
- 🐉 Dynamic enemy AI (e.g., dragon state, Beholder rays)
- 🧩 Puzzles and interaction without alerts
- 📱 Fully responsive + PWA support (installable on phone)
- 🌙 Fantasy-themed art & animations

---

## 🛠️ Tech Stack

- **React** (Vite or CRA)
- **JavaScript / JSX**
- **CSS Modules** for scoped styles
- **Service Workers** for offline support
- **Mobile-first design**
- **Modular architecture** (rooms, cards, characters split logically)

---

## 🧑‍💻 Running Locally

1. **Clone the repo**

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

2. **Install Dependencies**
npm install

3. **Run the development sever**
npm run dev 
# or if using CRA
npm start

4. **Build for production**
npm run build
```

### Stale content during development (service worker)

Local development registers a minimal service worker so the PWA manifest and install
metadata can be tested with `npm run dev`. Service-worker caching can make an older local
build appear to still be running. If changes look stale (old JavaScript, old UI, old icons or
old manifest data), check the worker before assuming the application code is broken:

1. Open Chrome DevTools.
2. Go to **Application → Service Workers**.
3. Enable **Update on reload**, or unregister the development service worker.
4. If needed, go to **Application → Storage**, clear the site's stored data, and reload.
