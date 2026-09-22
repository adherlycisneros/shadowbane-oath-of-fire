import { useCallback, useEffect, useRef, useState } from "react";

// Short-lived floating text over a sprite: damage numbers, heals, dodges and one-word statuses.
// Each entry removes itself after `ms`; several can be up at once (e.g. a hit plus a status).
export default function useFloatingText(defaultMs = 1800) {
  const [items, setItems] = useState([]);
  const timers = useRef(new Set());
  const nextId = useRef(0);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const add = useCallback(
    (target, text, { kind = "damage", label = null, accent = null, ms = defaultMs } = {}) => {
      const id = ++nextId.current;
      setItems((prev) => [...prev, { id, target, text, kind, label, accent }]);
      const t = setTimeout(() => {
        timers.current.delete(t);
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, ms);
      timers.current.add(t);
    },
    [defaultMs]
  );

  const forTarget = useCallback((target) => items.filter((item) => item.target === target), [items]);

  return { items, add, forTarget };
}
