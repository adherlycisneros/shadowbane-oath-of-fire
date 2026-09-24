const rooms = [
  {
    id: 1,
    name: "Shadowbane Dungeon Antechamber",
    type: "flavor",
    text: "You stand at the threshold of the Antechamber. The torches are burning. Nobody has tended them in a very long time.",
    continueBackground: "/assets/backgrounds/room1-bg.webp",
  },
  {
    id: 2,
    name: "Shrine of Luminous Trickery",
    type: "puzzle",
    text: "Strange floating heads glow in sequence. Remember the pattern or face their gleaming wrath.",
    continueBackground: "/assets/backgrounds/room2-bg.webp",
  },
  {
    id: 3,
    name: "Twin Displacer Lair",
    type: "combat",
    text: "Two Displacer Beasts materialize from the shadows, their forms flickering like illusions. Tentacles poised and eyes gleaming with hunger, they move as one, stalking the corridor.",
    continueBackground: "/assets/backgrounds/room3-bg.webp",
  },
  {
    id: 4,
    name: "The Slumbering Amethyst Dragon",
    type: "healing",
    text: "An ancient Amethyst Dragon sleeps among glowing crystals. One pulse from the crystals can heal you... but disturb the dragon, and it may awaken in fury.",
    // The dragon-free cave: the room itself shows this while the Continue button is up.
    continueBackground: "/assets/backgrounds/room4-bg2.webp",
  },
  {
    id: 5,
    name: "The Cerebral Vault",
    type: "puzzle",
    text: "A giant disembodied brain pulses with psychic energy. The omen stirs at the edge of your memory. Speak its words, or risk leaving this chamber in a very different shape.",
    continueBackground: "/assets/backgrounds/room5-bg.webp",
  },
  {
    id: 6,
    name: "Sanctum of Reckoning",
    type: "final",
    text: "The final chamber. The air thickens with arcane pressure. The Oath's last keeper is long dead, and the Beholder left behind as the vault's warden has spent centuries down here alone. It shows. That central eye is already on you.",
  },
];

export default rooms;
