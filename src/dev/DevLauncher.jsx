import { useEffect, useRef, useState } from "react";
import scenarios from "./scenarios";
import styles from "./DevLauncher.module.css";

// DEV TESTING launcher: a small control on the title screen that starts the game
// directly in a chosen room and state. Only mounted by Game.jsx in development
// (see the `import.meta.env.DEV` guard there), so it never ships.
//
// Desktop convenience: `?scenario=<id>` on the dev URL launches that scenario on load.
// Only once per page load: returning to the title (End / Restart Adventure) must not relaunch it.
let queryLaunchDone = false;

export default function DevLauncher({ onLaunch }) {
  const [open, setOpen] = useState(false);

  // Run once on mount; the latest onLaunch is read through a ref.
  const onLaunchRef = useRef(onLaunch);
  onLaunchRef.current = onLaunch;
  useEffect(() => {
    if (queryLaunchDone) return;
    queryLaunchDone = true;
    const wanted = new URLSearchParams(window.location.search).get("scenario");
    const scenario = wanted && scenarios.find((s) => s.id === wanted);
    if (scenario) onLaunchRef.current(scenario);
  }, []);

  return (
    <div className={styles.launcher}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="dev-testing-panel"
        onClick={() => setOpen((v) => !v)}
      >
        DEV TESTING
      </button>

      {open && (
        <div id="dev-testing-panel" className={styles.panel} role="group" aria-label="Development test scenarios">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className={styles.scenario}
              onClick={() => onLaunch(scenario)}
            >
              <span>{scenario.label}</span>
              <span className={styles.state}>
                {scenario.darklordHealth} / {scenario.chxospixieHealth} HP · {scenario.chxospixieStamina} stamina
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
