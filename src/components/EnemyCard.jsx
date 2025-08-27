// src/components/EnemyCard.jsx JUST TO SHOW IMAGE OF ENEMY 
import "../styles/cards.css";

export default function EnemyCard({
  enemyName,
  spritePath,
  size = "xlarge",
  className = "",
}) {
  return (
    <div className={`cardContainer ${size}`}>
      <img src={spritePath} alt={enemyName} className={`spriteImage ${className}`} />
    </div>
  );
}
