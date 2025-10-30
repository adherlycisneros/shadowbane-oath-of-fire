export const characterStates = {
  Darklord: {
    normal: {
      displayName: "Darklord",
      maxHealth: 200,
      sprites: {
        idle: "/assets/sprites/champions/darklord-idle.png",
        attack: "/assets/sprites/champions/darklord-attack.png",
        dead: "/assets/sprites/champions/darklord-dead.png",
      },
      moves: [
        { name: "Divine Strike", damage: 20 },
        { name: "Shield Block", damage: 14 }
      ]
    },
    polymorphed: {
      displayName: "Toadlord",
      maxHealth: 150,
      sprites: {
        idle: "/assets/sprites/champions/toadlord-idle.png",
        attack: "/assets/sprites/champions/toadlord-attack.png",
        dead: "/assets/sprites/champions/toadlord-dead.png",
      },
      moves: [
        { name: "Toad Slap", damage: 16 },
        { name: "Croak of Confusion", damage: 10 }
      ]
    }
  },

  Chxospixie: {
    normal: {
      displayName: "Chxospixie",
      maxHealth: 200,
      sprites: {
        idle: "/assets/sprites/champions/chxospixie-idle.png",
        attack: "/assets/sprites/champions/chxospixie-attack.png",
        dead: "/assets/sprites/champions/chxospixie-dead.png",
      },
      moves: [
        { name: "Savage Slash", damage: 20 },
        { name: "Fury Charge", damage: 28, staminaCost: 12 }
      ]
    },
    polymorphed: {
      displayName: "Sheepspixie",
      maxHealth: 150,
      sprites: {
        idle: "/assets/sprites/champions/sheepspixie-idle.png",
        attack: "/assets/sprites/champions/sheepspixie-attack.png",
        dead: "/assets/sprites/champions/sheepspixie-dead.png",
      },
      moves: [
        { name: "Woolly Bash", damage: 17, staminaCost: 12 },
        { name: "Baa of Distraction", damage: 12 }
      ]
    }
  }
};
