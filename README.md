# Shadowbane: Oath of Fire

A mobile-first, landscape fantasy adventure built with React and Vite. You guide two heroes, Darklord and Chxospixie, through six rooms of a sealed vault: memory puzzles, turn-based fights, a healing chamber with a sleeping dragon, a psychic test and a final boss. It runs in any modern browser and can be installed as a Progressive Web App.

Repository: [github.com/adherlycisneros/shadowbane-oath-of-fire](https://github.com/adherlycisneros/shadowbane-oath-of-fire)

## 📜 The adventure

The Shadowbane vault has been sealed for centuries by the Oath of Fire, and its seal has started to burn. Each room plays differently:

1. **Antechamber:** meet the heroes, read their backstories, and watch the opening.
2. **Shrine of Luminous Trickery:** a pattern-memory puzzle with glowing floating heads. Mistakes cost health.
3. **Twin Displacer Lair:** turn-based combat against the Twin Displacer Beasts.
4. **The Slumbering Amethyst Dragon:** heal one hero safely, or try to restore both and risk waking the dragon into a fight.
5. **The Cerebral Vault:** type back the Omen the vault showed you earlier. Two wrong answers polymorph the party.
6. **Sanctum of Reckoning:** the Beholder boss, the treasure, and a short epilogue that recaps how your run went.

## ⚔️ Mechanics

- **Omen:** a randomly chosen phrase appears in one of rooms 2 to 4 and must be recalled in the Cerebral Vault.
- **Polymorph:** failing the Vault turns the heroes into Toadlord and Sheepspixie, with their own sprites and weaker moves, until the Beholder falls.
- **Stamina:** Chxospixie's special attacks cost stamina, which carries over between rooms.
- **Guard moves:** some moves soften the enemy's next counterattack instead of dealing full damage.
- **Branching dragon room:** the dragon either sleeps through the healing or wakes up, and the room plays out differently.
- **Party state:** health and stamina carry from room to room. A fallen hero returns at half strength in the next room, and a full-party defeat lets you retry the encounter from the state you entered it with.

Enemy behavior is stateful and partly randomized, including dodges, attack selection, and the dragon wake outcome.

## 📱 Presentation and accessibility

- Designed for phones in landscape. On touch devices held in portrait, a rotate prompt covers the game without losing progress.
- On desktop the game renders as a centered, scaled stage that keeps the landscape composition.
- Real buttons, visible focus, keyboard support, focus handling for overlays, and `prefers-reduced-motion` support.
- Room music that starts after the first interaction, with a mute toggle.

## 🛠️ Tech stack

- React 19 with JavaScript (JSX)
- Vite 7
- CSS Modules plus shared global CSS
- `vite-plugin-pwa` (Workbox) for the web app manifest and service worker
- Self-hosted fonts (Metal Mania and Quintessential, WOFF2, SIL Open Font License)
- ESLint

There is no backend. All game assets (backgrounds, sprites, audio, fonts) are served locally from `public/`.

## 📦 PWA and offline support

The build generates a web app manifest and a Workbox service worker:

- The app shell, icons, fonts, the title painting and the intro texture are precached.
- Backgrounds, sprites and treasure art are cached at runtime (stale-while-revalidate).
- Music is cached at runtime (cache-first) with Range request support, so installed copies do not re-stream tracks.

Offline play and installability have been verified against local production builds. Checks on real installed devices over the final HTTPS deployment are still to come.

## 🧑‍💻 Running locally

Requires a Node.js version supported by Vite 7 (Node 20.19+ or 22.12+).

```bash
git clone https://github.com/adherlycisneros/shadowbane-oath-of-fire.git
cd shadowbane-oath-of-fire
npm install
npm run dev
```

Other scripts:

```bash
npm run build     # production build in dist/
npm run preview   # serve the production build locally
npm run lint      # ESLint
```

Use `npm run build` and `npm run preview` when testing PWA behavior. The development server is useful for day-to-day work, but it is not a faithful test of production caching.

### Stale content during development

`npm run dev` also registers a development service worker so the manifest and install metadata can be tested. That worker can make an older build look like it is still running. If JavaScript, UI, icons or manifest data look stale:

1. Open Chrome DevTools.
2. Go to **Application → Service Workers**.
3. Enable **Update on reload**, or unregister the development service worker.
4. If needed, go to **Application → Storage**, clear site data, and reload.

## About this edition

Shadowbane began as a fantasy game made as a gift for the developer's partner and was later adapted into this standalone portfolio edition.

## License

Code is released under the [MIT License](LICENSE). The bundled fonts are licensed under the SIL Open Font License; see the license files in `public/assets/fonts/`.
