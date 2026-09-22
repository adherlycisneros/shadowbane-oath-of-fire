// Development-only test scenarios for the DEV TESTING launcher on the title screen.
// This module is only ever imported from dev/DevLauncher.jsx, which Game.jsx loads
// behind `import.meta.env.DEV`, so none of it reaches a production build.
//
// Values are deliberately not full so the launcher can exercise carried-over
// state (and, later, encounter-retry checkpoints). Every scenario starts a fresh
// run with both champions alive; `polymorphed` and `dragonAwakened` default to false.
const scenarios = [
  {
    id: "room2",
    label: "Room 2 — Heads",
    roomId: 2,
    darklordHealth: 200,
    chxospixieHealth: 200,
    chxospixieStamina: 60,
  },
  {
    id: "room3",
    label: "Room 3 — Displacers",
    roomId: 3,
    darklordHealth: 130,
    chxospixieHealth: 110,
    chxospixieStamina: 24,
  },
  {
    id: "room4-healing",
    label: "Room 4 — Healing",
    roomId: 4,
    darklordHealth: 120,
    chxospixieHealth: 90,
    chxospixieStamina: 24,
  },
  {
    id: "room4-dragon",
    label: "Room 4 — Dragon Awake",
    roomId: 4,
    darklordHealth: 120,
    chxospixieHealth: 110,
    chxospixieStamina: 24,
    dragonAwakened: true,
  },
  {
    id: "room6",
    label: "Room 6 — Beholder",
    roomId: 6,
    darklordHealth: 130,
    chxospixieHealth: 100,
    chxospixieStamina: 24,
  },
  {
    id: "room6-polymorphed",
    label: "Room 6 — Polymorphed Beholder",
    roomId: 6,
    darklordHealth: 130,
    chxospixieHealth: 100,
    chxospixieStamina: 24,
    polymorphed: true,
  },
  {
    // The post-Beholder reward state itself (chest, treasure background, narrative pages,
    // End Adventure) without replaying the fight. `reward` asks Game to mount Room 6 already
    // past the victory beat; the values below are what the champions carry into it.
    id: "treasure",
    label: "Treasure / Epilogue",
    roomId: 6,
    darklordHealth: 130,
    chxospixieHealth: 100,
    chxospixieStamina: 24,
    reward: true,
  },
];

export default scenarios;
