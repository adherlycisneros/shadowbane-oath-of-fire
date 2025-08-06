// src/components/ChampionCard.jsx  JUST TO SHOW IMAGE OF CHAMPIONS
import { characterStates } from "../data/characterData";
import "../styles/cards.css";

export default function ChampionCard({
  championKey,
  pose = "idle",
  isDead = false,
  isPolymorphed = false,
  size = "large",
}) {
  const championData = isPolymorphed
    ? characterStates[championKey].polymorphed
    : characterStates[championKey].normal;

  const spriteSrc = isDead
    ? championData.sprites.dead
    : championData.sprites[pose] || championData.sprites.idle;

  // Add a dead pose class specific to championKey for room-specific styling
  const deadClass = isDead ? `dead-${championKey.toLowerCase()}` : "";

  return (
    <div className={`cardContainer ${size} ${isDead ? "dead" : ""}`}>
      <img
        src={spriteSrc}
        alt={championData.displayName}
        className={`spriteImage ${deadClass}`}
      />
    </div>
  );
}
