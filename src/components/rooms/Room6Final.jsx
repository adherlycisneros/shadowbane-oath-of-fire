import { useEffect, useState, useRef } from "react";
import { characterStates } from "../../data/characterData";
import { GUARDS, disabledReason, guardHolds, resolveCounter } from "../../data/combat";
import EnemyHUD from "../EnemyHUD";
import EnemyCard from "../EnemyCard";
import ChampionHUD from "../ChampionHUD";
import ChampionCard from "../ChampionCard";
import MoveButton from "../MoveButton";
import FloatingText from "../FloatingText";
import CombatNotice from "../CombatNotice";
import useFloatingText from "../../hooks/useFloatingText";
import useNotice from "../../hooks/useNotice";
import useTimeouts from "../../hooks/useTimeouts";
import useHeroFallNotice from "../../hooks/useHeroFallNotice";
import styles from "./Room6Final.module.css";
import shared from "./Room3Displacers.module.css";

const ENEMY_MAX_HEALTH = 220;
// Dodge chance (enemy only)
const ENEMY_DODGE_CHANCE = 0.1;
// BEHOLDER ATTACKS
const beholderAttacks = [
    { name: "Disintegration Ray", baseDamage: 20 },
    { name: "Necrotic Beam", baseDamage: 28 },
    { name: "Force Blast", baseDamage: 35 }
];

// Epilogue page 2 recaps this run's two outcomes (recorded by Game as the party leaves Room 4
// and Room 5). An outcome the run never recorded, e.g. a dev shortcut, reads neutrally.
const DRAGON_RECAP = {
    slept: "You passed through the Amethyst Dragon's chamber without waking its ancient guardian.",
    defeated: "You woke the Amethyst Dragon and survived the fight that followed.",
};
const DRAGON_RECAP_NEUTRAL = "You survived the Amethyst Dragon's chamber.";
const VAULT_RECAP = {
    remembered: "The Cerebral Vault tested your memory, and you gave it the words it demanded.",
    polymorphed: "The Cerebral Vault found your memory lacking and reshaped you for the final trial.",
};
const VAULT_RECAP_NEUTRAL = "The Cerebral Vault tested what you remembered.";

export default function Room6Final({
    darklordHealth,
    chxospixieHealth,
    chxospixieStamina,
    setDarklordHealth,
    setChxospixieHealth,
    setChxospixieStamina,
    onBossDefeated,
    dragonOutcome = null,
    vaultOutcome = null,
    isPolymorphed,
    setIsPolymorphed,
    darklordDead,
    chxospixieDead,
    onFinish,
    roomResetTrigger,
    devStartAtReward = false,
}) {
    // Development-only shortcut (DEV TESTING "Treasure / Epilogue"): mount already in the
    // post-victory reward state, exactly as the victory beat leaves it. Constant false in
    // production builds, so every initializer below reduces to its normal value.
    const startAtReward = import.meta.env.DEV && Boolean(devStartAtReward);

    const [currentPage, setCurrentPage] = useState(0);
    const [showOverlay, setShowOverlay] = useState(true);
    // When the last page is closed the parchment leaves and End Adventure takes its place;
    // keyboard focus follows it so the flow stays reachable.
    const endAdventureRef = useRef(null);
    useEffect(() => {
        if (!showOverlay) endAdventureRef.current?.focus();
    }, [showOverlay]);


    const pages = [
        `The quest ends, but the legend continues...`,

        `To reach this hall, you learned the floating heads' pattern and cut down the Twin Displacer
   Beasts. ${DRAGON_RECAP[dragonOutcome] ?? DRAGON_RECAP_NEUTRAL}

   ${VAULT_RECAP[vaultOutcome] ?? VAULT_RECAP_NEUTRAL}

   Then you brought down the warden, a Beholder that had kept the inner vault sealed for
   centuries.`,

        `The chest held an ember of the Oath's fire. Chxospixie knew its heat at once. The same
   infernal power lived in the curse carried through her blood, and for once, the curse was
   useful.

   Darklord swore the Oath of Fire over the ember, and the seal went cold.

   His vision had shown what happened if no one reached this place in time. You did.`,

        `The banners in the hall belong to those who kept the Oath before you. The seal is quiet
   again.

   Darklord keeps his word. Chxospixie takes some of the gold. It seems rude not to.

   At the far end, a door stands open to daylight and a road neither of you knows.
   Chxospixie is already walking. Darklord catches up.`
    ];

    const enemyMaxHealth = ENEMY_MAX_HEALTH;
    const [enemyHealth, setEnemyHealth] = useState(startAtReward ? 0 : enemyMaxHealth);
    // Mirrors enemyHealth for timer callbacks so damage math never runs inside a state
    // updater (React StrictMode double-invokes updaters in development).
    const enemyHealthRef = useRef(startAtReward ? 0 : enemyMaxHealth);
    const [enemyDefeated, setEnemyDefeated] = useState(startAtReward);
    const [showRedFlash, setShowRedFlash] = useState(false);
    const [enemyPose, setEnemyPose] = useState("idle");
    const [actionDisabled, setActionDisabled] = useState(false);
    const [darklordPose, setDarklordPose] = useState("idle");
    const [chxospixiePose, setChxospixiePose] = useState("idle");

    const [showTreasure, setShowTreasure] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [showChestPrompt, setShowChestPrompt] = useState(startAtReward);
    const [victoryProcessed, setVictoryProcessed] = useState(startAtReward);
    // Victory beat: fighting -> falling (the killing blow registers on the Beholder)
    // -> defeated (the chest appears) -> reward (the chest prompt is up).
    // The future audio stage can key the reward track off these phases.
    const [bossPhase, setBossPhase] = useState(startAtReward ? "reward" : "fighting");
    // One-shot guard raised by the acting hero's move ({ hero, kind }); gone once the counter lands.
    const [guard, setGuard] = useState(null);
    const [enemyDaze, setEnemyDaze] = useState(null);

    const later = useTimeouts();
    const floaters = useFloatingText();
    const [notice, showNotice] = useNotice();

    const stateKey = isPolymorphed ? "polymorphed" : "normal";
    const darklord = characterStates.Darklord[stateKey];
    const chxospixie = characterStates.Chxospixie[stateKey];

    const isGameOver = darklordDead && chxospixieDead;

    useHeroFallNotice({
        darklordDead,
        chxospixieDead,
        darklordName: darklord.displayName,
        chxospixieName: chxospixie.displayName,
        showNotice,
    });

    //Watch for reset trigger and restore defaults
    useEffect(() => {
        // Runs on mount as well; the dev reward shortcut keeps its post-victory values.
        enemyHealthRef.current = startAtReward ? 0 : ENEMY_MAX_HEALTH;
        setEnemyHealth(startAtReward ? 0 : ENEMY_MAX_HEALTH);
        setEnemyDefeated(startAtReward);
        setEnemyPose("idle");
        setBossPhase(startAtReward ? "reward" : "fighting");
        setGuard(null);
        setEnemyDaze(null);
    }, [roomResetTrigger, startAtReward]);


    const triggerRedFlash = () => {
        setShowRedFlash(true);
        later(() => setShowRedFlash(false), 300);
    };

    // Run the defeat beat exactly once: the Beholder stays up while the final hit registers,
    // the defeat is announced, then the chest takes its place.
    useEffect(() => {
        if (bossPhase !== "falling" || victoryProcessed) return;
        setVictoryProcessed(true);
        setFeedback("☠️ The Ancient Beholder has been defeated! ☠️");

        later(() => setBossPhase("defeated"), 1500);

        if (isPolymorphed) {
            later(() => {
                setFeedback("✨ The polymorph spell is lifted! ✨");
                setIsPolymorphed(false);
            }, 2000);
            later(() => {
                setFeedback(null);
                setShowChestPrompt(true);
                setBossPhase("reward");
            }, 4000);
        } else {
            later(() => {
                setFeedback(null);
                setShowChestPrompt(true);
                setBossPhase("reward");
            }, 3000);
        }
    }, [bossPhase, victoryProcessed, isPolymorphed, setIsPolymorphed, later]);

    // Helper to safely spend stamina
    const spendStamina = (cost) => {
        if (!cost) return;
        setChxospixieStamina(s => Math.max(s - cost, 0));
    };

    // Raise the acting move's guard (if any). Returns the guard kind the counter must respect.
    const raiseGuard = (hero, kind, landed) => {
        if (!guardHolds(kind, landed)) return null;
        setGuard({ hero, kind });
        const status = GUARDS[kind].enemyStatus;
        if (status) {
            floaters.add("enemy", status, { kind: "status", ms: 1600 });
            setEnemyDaze(kind);
            later(() => setEnemyDaze(null), 1600);
        }
        return kind;
    };

    // After the hero's swing lands (or is dodged), the beholder winds up (2s) and strikes back (1s).
    const scheduleEnemyCounter = (attacker, guardKind) => {
        later(() => {
            setEnemyPose("attack");
            later(() => {
                enemyAttack(attacker, guardKind);
                setEnemyPose("idle");
                setActionDisabled(false);
                // The ward fades right after the blow it was raised against.
                if (guardKind) later(() => setGuard(null), 350);
            }, 1000);
        }, 2000);
    };

    // PLAYER ATTACK
    const dealDamage = (move, attacker) => {
        if (enemyDefeated || isGameOver || actionDisabled) return false;

        setActionDisabled(true);
        const poseSetter = attacker === "Darklord" ? setDarklordPose : setChxospixiePose;
        const dead = attacker === "Darklord" ? darklordDead : chxospixieDead;
        poseSetter("attack");

        later(() => {
            poseSetter(dead ? "dead" : "idle");

            // Enemy dodge roll
            if (Math.random() < ENEMY_DODGE_CHANCE) {
                floaters.add("enemy", "Dodge", { kind: "dodge" });
                // A slipped strike still draws the counter; only a stance (Shield Block) survives the miss.
                scheduleEnemyCounter(attacker, raiseGuard(attacker, move.guard, false));
                return;
            }

            const newHP = Math.max(enemyHealthRef.current - move.damage, 0);
            enemyHealthRef.current = newHP;
            setEnemyHealth(newHP);
            floaters.add("enemy", `-${move.damage}`);
            if (newHP <= 0) {
                // The killing blow: the fight is over, the defeat beat takes it from here.
                setEnemyDefeated(true);
                setBossPhase("falling");
                onBossDefeated();
                setActionDisabled(false);
            } else {
                scheduleEnemyCounter(attacker, raiseGuard(attacker, move.guard, true));
            }
        }, 1000);
        return true;
    };

    const performMove = (move, attacker) => {
        if (!dealDamage(move, attacker)) return;
        if (move.staminaCost) {
            spendStamina(move.staminaCost);
        }
    };

    // ENEMY ATTACK (no sleep)
    const enemyAttack = (attacker, guardKind) => {
        if (enemyDefeated || isGameOver) return;

        // Target last attacker if alive, else the other
        let target = attacker;
        const isDead = t => (t === "Darklord" ? darklordDead : chxospixieDead);
        if (isDead(target)) {
            target = target === "Darklord" ? "Chxospixie" : "Darklord";
            if (isDead(target)) return;
        }

        const attack = beholderAttacks[Math.floor(Math.random() * beholderAttacks.length)];
        // A guard only covers the hero who raised it.
        const { damage, label } = target === attacker
            ? resolveCounter(attack.baseDamage, guardKind)
            : { damage: attack.baseDamage, label: null };
        const setHealth = target === "Darklord" ? setDarklordHealth : setChxospixieHealth;

        setHealth(prev => Math.max(prev - damage, 0));
        triggerRedFlash();
        floaters.add(target, `-${damage}`, { label, accent: GUARDS[guardKind]?.accent });
    };

    const darklordGuarded = guard?.hero === "Darklord" && GUARDS[guard.kind]?.heroGlow;
    const chxospixieGuarded = guard?.hero === "Chxospixie" && GUARDS[guard.kind]?.heroGlow;
    const enemyDazeClass = enemyDaze === "confuse" ? shared.dazed : enemyDaze === "distract" ? shared.distracted : "";
    const beholderVisible = bossPhase === "fighting" || bossPhase === "falling";
    // Reward presentation: from the moment the chest replaces the Beholder, the scene stops
    // looking like combat. Both champions stand (a fallen one is shown standing, not revived:
    // HP, stamina and dead flags are untouched), both are drawn in their original forms from the
    // first reward frame (the polymorph state and its "spell is lifted" message still run on their
    // own schedule underneath), and the combat HUD is gone.
    const rewardScene = !beholderVisible;

    //--------------- UI RETURN --------------------------------------------//
    return ( //START PART THAT CHANGED
        <div>
            {showTreasure ? (
                <div className={`${styles.treasureScreen} fullscreen-fit`}>
                    {showOverlay ? (
                        <div className={styles.treasureOverlay}>
                            {/* The changing page is a polite live region; the authored blank lines
                                in each page string become stanza paragraphs at render time. The
                                heading lives inside it so the whole page centres as one block and
                                the Next button below stays the same element (and keeps focus). */}
                            <div className={styles.pageText} aria-live="polite" aria-atomic="true">
                                {currentPage === 0 && (
                                    <h2 className={styles.storyTitle}>The Legend You Were Born To Claim</h2>
                                )}
                                {pages[currentPage]
                                    .split(/\n\s*\n/)
                                    .map((stanza) => stanza.replace(/\s+/g, " ").trim())
                                    .filter(Boolean)
                                    .map((stanza, index) => (
                                        <p key={`${currentPage}-${index}`}>{stanza}</p>
                                    ))}
                            </div>

                            <button
                                type="button"
                                className={styles.pageNext}
                                aria-label={currentPage < pages.length - 1 ? "Next page" : "Finish reading"}
                                onClick={() => {
                                    if (currentPage < pages.length - 1) {
                                        setCurrentPage((p) => p + 1);
                                    } else {
                                        setShowOverlay(false); // hides story overlay
                                    }
                                }}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                    <path
                                        d="M9 5l7 7-7 7"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            ref={endAdventureRef}
                            className={styles.finishadventurebtn}
                            onClick={onFinish}
                        >
                            End Adventure
                        </button>
                    )}


                    {/* HEROES AT BOTTOM */}
                    <div className={styles.heroContainer}>
                        {/* Darklord (left) */}
                        <div className={styles.championCard}>
                            <ChampionCard championKey="Darklord" pose="idle" size="cinematic" />
                        </div>

                        {/* Chxospixie (right, flipped) */}
                        <div className={`${styles.championCard} ${styles.flip}`}>
                            <ChampionCard championKey="Chxospixie" pose="idle" size="cinematic" />
                        </div>
                    </div>
                </div> //END PART THAT CHANGED 
            ) : (
                <div className={`${styles.roomBackground} fullscreen-fit`}>
                    {showRedFlash && <div className={shared.redFlash} />}

                    <div className={`${shared.battlefield} ${styles.battlefield}`}>
                        <div className={`${shared.leftSide} ${styles.leftSide}`}>
                            <div className={`${styles.leftChampionWrapper}`}>
                                <div className={`${shared.championWrapper} ${styles.polySlot}`}>
                                    <div className={`${styles.spriteImage} ${!rewardScene && darklordDead ? `${styles["dead-darklord"]} ${isPolymorphed ? styles["dead-darklord-polymorphed"] : ""}` : ""} ${!rewardScene && darklordGuarded ? shared.guarded : ""}`}>
                                        <ChampionCard
                                            championKey="Darklord"
                                            pose={rewardScene ? "idle" : darklordDead ? "dead" : darklordPose}
                                            isDead={!rewardScene && darklordDead}
                                            isPolymorphed={!rewardScene && isPolymorphed}
                                            size="large"
                                        />
                                    </div>
                                    <FloatingText items={floaters.forTarget("Darklord")} baseClass={shared.floatingDamage} />
                                </div>
                            </div>

                            <div className={`${styles.rightChampionWrapper}`}>
                                  <div className={`${shared.championWrapper} ${styles.polySlot}`}>
                                    <div className={`${styles.spriteImage} ${!rewardScene && chxospixieDead ? `${styles["dead-chxospixie"]} ${isPolymorphed ? styles["dead-chxospixie-polymorphed"] : ""}` : ""} ${!rewardScene && chxospixieGuarded ? shared.guarded : ""}`}>
                                        <ChampionCard
                                            championKey="Chxospixie"
                                            pose={rewardScene ? "idle" : chxospixieDead ? "dead" : chxospixiePose}
                                            isDead={!rewardScene && chxospixieDead}
                                            isPolymorphed={!rewardScene && isPolymorphed}
                                            size="large"
                                        />
                                    </div>
                                    <FloatingText items={floaters.forTarget("Chxospixie")} baseClass={shared.floatingDamage} />
                                </div>
                            </div>
                        </div>


                        <div className={`${shared.rightSide} ${styles.rightSide}`}>
                            <div className={shared.enemyWrapper} style={{ position: "relative" }}>
                                {/* Beholder sprite: stays through the defeat beat, then gives way to the chest */}
                                {beholderVisible && (
                                    <div className={`${enemyDazeClass} ${bossPhase === "falling" ? styles.beholderFalling : ""}`}>
                                        <EnemyCard
                                            enemyName="Ancient Beholder"
                                            spritePath={
                                                enemyPose === "attack"
                                                    ? "/assets/sprites/enemies/room6/beholder-attack.png"
                                                    : "/assets/sprites/enemies/room6/beholder-idle.png"
                                            }
                                            size="xlarge"
                                        />
                                    </div>
                                )}

                                {/* Treasure chest with sparkle */}
                                {!beholderVisible && (
                                    <div style={{ position: "relative" }}>
                                        <button
                                            type="button"
                                            className={styles.chestButton}
                                            aria-label="Open treasure chest"
                                            onClick={() => setShowTreasure(true)}
                                        >
                                            <EnemyCard
                                                enemyName="Treasure Chest"
                                                spritePath="/assets/treasure/treasure-chest.png"
                                                size="xlarge"
                                                className={styles.treasureChestImage}
                                            />
                                        </button>
                                        <div className={styles.treasureSparkle}></div>
                                    </div>
                                )}


                                {/* Floating damage */}
                                {beholderVisible && (
                                    <FloatingText items={floaters.forTarget("enemy")} baseClass={shared.floatingDamage} />
                                )}
                            </div>

                            {/* Enemy HUD */}
                            {beholderVisible && (
                                <EnemyHUD
                                    enemyName="Ancient Beholder"
                                    health={enemyHealth}
                                    maxHealth={enemyMaxHealth}
                                    isDead={enemyDefeated}
                                />
                            )}
                        </div>

                    </div>

                    {!showTreasure && !rewardScene && (
                        <ChampionHUD
                            darklordHealth={darklordHealth}
                            chxospixieHealth={chxospixieHealth}
                            darklordDead={darklordDead}
                            chxospixieDead={chxospixieDead}
                            chxospixieStamina={chxospixieStamina}
                            chxospixieMaxStamina={60}
                            isPolymorphed={isPolymorphed}
                        />
                    )}

                    {!enemyDefeated && (
                        <div className={shared.actionsContainer}>
                            <CombatNotice notice={notice} />
                            <div className={shared.actionsInnerRow}>
                                <div className={shared.actionGroup}>
                                    <h4>{darklord.displayName}'s Actions:</h4>
                                    <div className={shared.actionButtonsRow}>
                                        {darklord.moves.map(move => (
                                            <MoveButton
                                                key={move.name}
                                                move={move}
                                                disabled={actionDisabled || darklordDead}
                                                reason={disabledReason({ dead: darklordDead, enemyTurn: actionDisabled })}
                                                onClick={() => performMove(move, "Darklord")}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className={shared.actionGroup}>
                                    <h4>{chxospixie.displayName}'s Actions:</h4>
                                    <div className={shared.actionButtonsRow}>
                                        {chxospixie.moves.map(move => {
                                            const staminaBlocked = !!move.staminaCost && chxospixieStamina < move.staminaCost;
                                            return (
                                                <MoveButton
                                                    key={move.name}
                                                    move={move}
                                                    disabled={chxospixieDead || actionDisabled || staminaBlocked}
                                                    reason={disabledReason({ dead: chxospixieDead, staminaBlocked, enemyTurn: actionDisabled })}
                                                    onClick={() => performMove(move, "Chxospixie")}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {enemyDefeated && !showTreasure && (
                        <div className={`${shared.actionsContainer} ${styles.actionsContainer}`}>
                            <div
                                className={`${styles.actionsInner} ${shared.actionsInner}`}
                                style={{ justifyContent: "center" }}
                            >
                                {feedback ? (
                                    <span className={styles.feedbackText}>{feedback}</span>
                                ) : showChestPrompt ? (
                                    <p className={styles.feedbackText}>
                                        Firelight leaks from the chest's lock. Open it.
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
