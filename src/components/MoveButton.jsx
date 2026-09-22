import { useId } from "react";
import { moveMeta } from "../data/combat";
import shared from "./rooms/Room3Displacers.module.css";

// One combat action: the move name plus its stamina cost when it has one. A guard move's
// effect and the "not enough stamina" reason are not printed; they reach screen readers as
// the button's description.
export default function MoveButton({ move, disabled, reason, onClick }) {
  const staminaBlocked = reason === "stamina";
  const meta = moveMeta(move);
  const hintId = useId();
  const staminaId = useId();
  const describedBy = [move.hint ? hintId : null, staminaBlocked ? staminaId : null].filter(Boolean).join(" ") || undefined;
  const className = [
    shared.actionButton,
    shared.moveButton,
    disabled ? shared.disabled : "",
    staminaBlocked ? shared.staminaLocked : "",
  ].join(" ");

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      data-disabled-reason={disabled ? reason : undefined}
      title={staminaBlocked ? "Not enough stamina" : undefined}
      aria-describedby={describedBy}
      onClick={onClick}
    >
      <span className={shared.moveName}>{move.name}</span>
      {meta && <span className={shared.moveMeta}>{meta}</span>}
      {move.hint && (
        <span id={hintId} className="sr-only">
          {move.hint}
        </span>
      )}
      {staminaBlocked && (
        <span id={staminaId} className="sr-only">
          Not enough stamina
        </span>
      )}
    </button>
  );
}
