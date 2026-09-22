import styles from "./FloatingText.module.css";

// Renders the floating text entries for one target (see hooks/useFloatingText).
// `baseClass` is the room's positioned floating-damage class; kinds add colour.
// Vertical anchor overrides (the room class anchors at 30% of the sprite slot):
//   status words sit high over the enemy; a glancing hit sits above the polymorphed
//   sheep, whose 165px sprite fills only the lower part of the slot.
const TOP_OVERRIDES = { status: "4%", glance: "8%" };

function topOverride(item) {
  const top = TOP_OVERRIDES[item.kind] ?? TOP_OVERRIDES[item.accent];
  return top ? { top } : undefined;
}

export default function FloatingText({ items, baseClass }) {
  return items.map((item) => (
    <div
      key={item.id}
      className={`${baseClass} ${styles[item.kind] || ""}`}
      style={topOverride(item)}
      aria-hidden="true"
    >
      {item.text}
      {item.label && (
        <span className={`${styles.label} ${item.accent === "ward" ? styles.ward : ""}`}>{item.label}</span>
      )}
    </div>
  ));
}
