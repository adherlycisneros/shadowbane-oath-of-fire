import { useEffect, useRef } from "react";

// Announces the moment a champion falls (a false -> true transition of a dead flag).
// When both fall in the same update (one event took them both, e.g. a Room 2 penalty),
// nothing is announced here: the party-defeat overlay is the only message for that.
export default function useHeroFallNotice({ darklordDead, chxospixieDead, darklordName, chxospixieName, showNotice }) {
  const prev = useRef({ darklordDead, chxospixieDead });

  useEffect(() => {
    const darklordFell = darklordDead && !prev.current.darklordDead;
    const chxospixieFell = chxospixieDead && !prev.current.chxospixieDead;
    prev.current = { darklordDead, chxospixieDead };
    if (darklordFell && chxospixieFell) return;
    if (darklordFell) showNotice(`${darklordName} has fallen`, 3500);
    if (chxospixieFell) showNotice(`${chxospixieName} has fallen`, 3500);
  }, [darklordDead, chxospixieDead, darklordName, chxospixieName, showNotice]);
}
