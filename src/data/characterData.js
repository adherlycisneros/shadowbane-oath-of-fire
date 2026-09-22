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
        // Guard: the enemy's immediate counterattack against Darklord is halved (see data/combat.js).
        { name: "Shield Block", damage: 12, guard: "block", hint: "Halves counterattack" }
      ]
    },
    polymorphed: {
      displayName: "Toadlord",
      maxHealth: 200,
      sprites: {
        idle: "/assets/sprites/champions/toadlord-idle.png",
        attack: "/assets/sprites/champions/toadlord-attack.png",
        dead: "/assets/sprites/champions/toadlord-dead.png",
      },
      moves: [
        { name: "Toad Slap", damage: 18 },
        // Guard: the confused enemy's immediate counterattack is halved.
        { name: "Croak of Confusion", damage: 10, guard: "confuse", hint: "Halves counterattack" }
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
      maxHealth: 200,
      sprites: {
        idle: "/assets/sprites/champions/sheepspixie-idle.png",
        attack: "/assets/sprites/champions/sheepspixie-attack.png",
        dead: "/assets/sprites/champions/sheepspixie-dead.png",
      },
      // Same slot order as the normal form: the stamina move stays in the second position.
      moves: [
        // Guard: the distracted enemy's immediate counterattack becomes a glancing 20.
        { name: "Baa of Distraction", damage: 12, guard: "distract", hint: "Forces glancing counterattack" },
        { name: "Woolly Bash", damage: 20, staminaCost: 12 }
      ]
    }
  }
};
