import { useCallback, useEffect, useRef, useState } from "react";

// One transient line of combat feedback ("Darklord has fallen", the Room 5 miss warning...).
// A new notice replaces the current one; each clears itself after `ms`.
export default function useNotice(defaultMs = 4000) {
  const [notice, setNotice] = useState(null);
  const timer = useRef(null);
  const nextId = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback(
    (text, ms = defaultMs) => {
      clearTimeout(timer.current);
      setNotice({ id: ++nextId.current, text });
      timer.current = setTimeout(() => setNotice(null), ms);
    },
    [defaultMs]
  );

  const clear = useCallback(() => {
    clearTimeout(timer.current);
    setNotice(null);
  }, []);

  return [notice, show, clear];
}
