const rooms = [
  {
    id: 1,
    name: "Shadowbane Dungeon Antechamber",
    type: "flavor",
    text: "You stand at the threshold of the Antechamber, a tranquil space where legends begin and destinies are forged.",
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
    text: "A giant disembodied brain pulses with psychic energy. It demands the words the dark omen branded into your memory. Fail, and your forms shall be... altered.",
    continueBackground: "/assets/backgrounds/room5-bg.webp",
  },
  {
    id: 6,
    name: "Sanctum of Reckoning",
    type: "final",
    text: "The final chamber. The air thickens with arcane pressure. A Beholder, ancient and deranged, glares at you with its central eye. It won't let you claim the prize without a fight.",
  },
];

export default rooms;
