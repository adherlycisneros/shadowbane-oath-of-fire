// Shared combat rules for the three combat rooms (Rooms 3, 4 and 6).
//
// Guard effects are one-shot: a move that carries one only changes the enemy's
// immediate counterattack against the hero who used it, and then it is gone.
// Nothing persists, stacks, or cools down.
export const GUARDS = {
  // Shield Block — Darklord braces behind his shield: the retaliation against him is halved.
  // `accent` styles the floating label on the reduced hit (see components/FloatingText).
  block: {
    heroGlow: true,        // show the ward around the hero until the blow has landed
    appliesOnMiss: true,   // a stance: it holds even if the enemy slipped the strike itself
    enemyStatus: null,
    accent: "ward",
    resolve: (damage) => ({ damage: halve(damage), label: "Blocked" }),
  },
  // Croak of Confusion — the confused enemy's retaliation is halved.
  confuse: {
    heroGlow: false,
    appliesOnMiss: false,  // the croak has to land to rattle the enemy
    enemyStatus: "Confused",
    accent: "daze",
    resolve: (damage) => ({ damage: halve(damage), label: "Halved" }),
  },
  // Baa of Distraction — the distracted enemy only manages a glancing hit.
  distract: {
    heroGlow: false,
    appliesOnMiss: false,
    enemyStatus: "Distracted",
    accent: "glance",      // lifted clear of the small sheep sprite so the word stays readable
    resolve: () => ({ damage: 20, label: "Glances" }),
  },
};

// Halving rule used by every guard: half the hit, rounded up (a guarded hero still feels it).
const halve = (damage) => Math.ceil(damage / 2);

// Damage the enemy's counterattack actually deals once a guard is applied.
export function resolveCounter(baseDamage, guardKind) {
  const guard = guardKind ? GUARDS[guardKind] : null;
  return guard ? guard.resolve(baseDamage) : { damage: baseDamage, label: null };
}

// Whether a guard raised by a hero's move is in effect, given whether the move connected.
export function guardHolds(guardKind, landed) {
  const guard = guardKind ? GUARDS[guardKind] : null;
  if (!guard) return false;
  return landed || guard.appliesOnMiss;
}

// Uniform integer roll in [min, max].
export const rollBetween = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

// Secondary line shown under a move name on its button.
// Visible secondary line of a move button: the exact stamina cost, always, so the player can
// plan ahead; the disabled styling says when it cannot be afforded. A guard move's effect
// (`hint`) is conveyed by the shield/status visuals and floating feedback; MoveButton exposes
// it, and the insufficient-stamina reason, to assistive technology instead of printing them.
export function moveMeta(move) {
  if (move.staminaCost) return `${move.staminaCost} stamina`;
  return null;
}

// Why a move button is disabled right now; the most permanent reason wins.
export function disabledReason({ dead = false, staminaBlocked = false, enemyTurn = false }) {
  if (dead) return "dead";
  if (staminaBlocked) return "stamina";
  if (enemyTurn) return "turn";
  return null;
}
