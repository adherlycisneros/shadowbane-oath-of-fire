// src/components/ChampionCard.jsx  JUST TO SHOW IMAGE OF CHAMPIONS
import { characterStates } from "../data/characterData";
import "../styles/cards.css";

export default function ChampionCard({
  championKey,
  pose = "idle",
  isDead = false,
  isPolymorphed = false,
  size = "large",
  className = "",
}) {
  const championData = isPolymorphed
    ? characterStates[championKey].polymorphed
    : characterStates[championKey].normal;

  const spriteSrc = isDead
    ? championData.sprites.dead
    : championData.sprites[pose] || championData.sprites.idle;

  // Adjust size dynamically for polymorphed attack poses
  const effectiveSize =
    isDead
      ? "dead" // force a special size class for dead sprites
      : isPolymorphed
        ? pose === "attack"
          ? "medium"
          : "small"
        : size;

  // Add a dead pose class specific to championKey for room-specific styling
  const deadClass = isDead ? `dead-${championKey.toLowerCase()}` : "";

  return (
    <div className={`cardContainer ${effectiveSize} ${isDead ? "dead" : ""}`}>
      <img
        src={spriteSrc}
        alt={championData.displayName}
        className={`spriteImage ${deadClass} ${className}`}
      />
    </div>
  );
}
