import { useEffect, useState, useRef } from "react";
import { characterStates } from "../../data/characterData";
import EnemyHUD from "../EnemyHUD";
import EnemyCard from "../EnemyCard";
import ChampionHUD from "../ChampionHUD";
import ChampionCard from "../ChampionCard";
import styles from "./Room6Final.module.css";
import shared from "./Room3Displacers.module.css";

export default function Room6Final({
    darklordHealth,
    chxospixieHealth,
    chxospixieStamina,
    setDarklordHealth,
    setChxospixieHealth,
    setChxospixieStamina,
    setCanContinue,
    isPolymorphed,
    setIsPolymorphed,
    darklordDead,
    chxospixieDead,
    onFinish,
    roomResetTrigger,
}) {

    const [currentPage, setCurrentPage] = useState(0);
    const [showOverlay, setShowOverlay] = useState(true);


    const pages = [
        `The quest ends, but the legend continues...`,

        `From the blood-forged arenas of Graal'kath to the infernal legacy of Emberreach,
   two unlikely souls crossed paths and chose to walk the same road.  
   Even the fates whispered: together, they are unstoppable.`,

        `Chxospixie and Darklord braved the twisting halls of the Shadowbane Dungeon,  
   unraveled the maddening whispers of cursed halls,  
   and faced Beholders whose gaze could unmake the strongest soul—  
   triumphing not through steel alone, but through unshaken bond.`,

        `They... we, have laughed in the face of every trial and prevailed.  

   Now, though Chxospixie has conquered dungeons and shattered curses in the past,  
   her greatest quest has ever been to stand beside you.  

   And as for Darklord, he's found in her not only the light he vowed to protect,  
   but a blazing force that forged his purpose anew—  
   and so their hearts have chosen true.`,

        `Through every quest, every sleepless battle, every storm,  
   even should the stars fall and the world burn,  
   Chxospixie's heart shall remain yours—  
   steadfast as the oath that binds you, fierce as the fire in her blood.`,

        `On this day and hereafter, my champion,  
   may your quests be ever-epic, your loot forever legendary,  
   and your aggro management (with me) top-tier.`,

        `P.S. No respecs allowed. You are stuck with me for the rest of the campaign. 💖`
    ];

    const [enemyHealth, setEnemyHealth] = useState(300); //480 health TEST
    const [enemyDefeated, setEnemyDefeated] = useState(false);
    const [showRedFlash, setShowRedFlash] = useState(false);
    const [enemyPose, setEnemyPose] = useState("idle");
    const [actionDisabled, setActionDisabled] = useState(false);
    const [darklordPose, setDarklordPose] = useState("idle");
    const [chxospixiePose, setChxospixiePose] = useState("idle");
    const [floatingDamage, setFloatingDamage] = useState(null);
    
    const [showTreasure, setShowTreasure] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [showChestPrompt, setShowChestPrompt] = useState(false);
    const [victoryProcessed, setVictoryProcessed] = useState(false);

    const stateKey = isPolymorphed ? "polymorphed" : "normal";
    const darklord = characterStates.Darklord[stateKey];
    const chxospixie = characterStates.Chxospixie[stateKey];

    const isGameOver = darklordDead && chxospixieDead;
    const enemyMaxHealth = 300;

    //Watch for reset trigger and restore defaults
    useEffect(() => {
        setEnemyHealth(enemyMaxHealth);
        setEnemyDefeated(false);
        setEnemyPose("idle");
    }, [roomResetTrigger]);


    const triggerRedFlash = () => {
        setShowRedFlash(true);
        setTimeout(() => setShowRedFlash(false), 300);
    };

    useEffect(() => {
        // run the defeat flow exactly once
        if (enemyHealth <= 0 && !victoryProcessed) {
            setVictoryProcessed(true);      // prevent re-run
            setEnemyDefeated(true);

            // If they were polymorphed, show that message and revert, then show chest prompt
            if (isPolymorphed) {
                setFeedback("✨ Beholder defeated! Polymorph spell lifted! ✨");

                setTimeout(() => {
                    setIsPolymorphed(false);
                }, 1800);

                setTimeout(() => {
                    setFeedback(null);
                    setShowChestPrompt(true);
                    setCanContinue(true);
                }, 3500);
            } else {

                // Non-polymorphed flow: show a shorter message, then chest prompt
                setFeedback("✨ Beholder defeated! ✨");

                setTimeout(() => {
                    setFeedback(null);
                    setShowChestPrompt(true);
                    setCanContinue(true);
                }, 2500);
            }
        }
    }, [enemyHealth, victoryProcessed, isPolymorphed, setIsPolymorphed, setCanContinue]);

    const showDamage = (damage, target) => {
        setFloatingDamage({ value: damage, target });
        setTimeout(() => setFloatingDamage(null), 1500);
    };

    // Helper to safely spend stamina
    const spendStamina = (cost) => {
        if (!cost) return;
        setChxospixieStamina(s => Math.max(s - cost, 0));
    };

    // Dodge chance (enemy only)
    const ENEMY_DODGE_CHANCE = 0.3;

    // BEHOLDER ATTACKS
    const beholderAttacks = [
        { name: "Disintegration Ray", baseDamage: 20 }, //TEST 
        { name: "Necrotic Beam", baseDamage: 28 }, //TEST
        { name: "Force Blast", baseDamage: 35 } //TEST
    ];

    const lastAttackerRef = useRef(null);

    // Helper to show floating damage (extend existing showDamage if you have one)
    // Assume existing setFloatingDamage({ value, target }) pattern
    const showEnemyDodge = () => {
        setFloatingDamage({ value: 0, target: "enemy", dodge: true });
        setTimeout(() => setFloatingDamage(null), 1800);
    };

    // PLAYER ATTACK
    const dealDamage = (damage, attacker) => {
        if (enemyDefeated || isGameOver || actionDisabled) return;

        lastAttackerRef.current = attacker;
        setActionDisabled(true);
        const poseSetter = attacker === "Darklord" ? setDarklordPose : setChxospixiePose;
        const dead = attacker === "Darklord" ? darklordDead : chxospixieDead;
        poseSetter("attack");

        setTimeout(() => {
            poseSetter(dead ? "dead" : "idle");

            // Enemy dodge roll
            if (Math.random() < ENEMY_DODGE_CHANCE) {
                showEnemyDodge();
                // Still lets enemy counter
                setTimeout(() => {
                    setEnemyPose("attack");
                    setTimeout(() => {
                        enemyAttack(attacker);
                        setEnemyPose("idle");
                        setActionDisabled(false);
                    }, 1000);
                }, 2000);
                return;
            }

            setEnemyHealth(prev => {
                const newHP = Math.max(prev - damage, 0);
                showDamage(damage, "enemy");
                if (newHP <= 0) {
                    // defeat flow
                    setEnemyDefeated(true);
                    setCanContinue(true);
                    setActionDisabled(false);
                } else {
                    setTimeout(() => {
                        setEnemyPose("attack");
                        setTimeout(() => {
                            enemyAttack(attacker);
                            setEnemyPose("idle");
                            setActionDisabled(false);
                        }, 1000);
                    }, 2000);
                }
                return newHP;
            });
        }, 1000);
    };

    // ENEMY ATTACK (no sleep)
    const enemyAttack = (attacker) => {
        if (enemyDefeated || isGameOver) return;

        // Target last attacker if alive, else the other
        let target = attacker;
        const isDead = t => (t === "Darklord" ? darklordDead : chxospixieDead);
        if (isDead(target)) {
            target = target === "Darklord" ? "Chxospixie" : "Darklord";
            if (isDead(target)) return;
        }

        const attack = beholderAttacks[Math.floor(Math.random() * beholderAttacks.length)];
        const dmg = attack.baseDamage;

        if (target === "Darklord") {
            setDarklordHealth(prev => Math.max(prev - dmg, 0));
            triggerRedFlash();
            showDamage(dmg, "Darklord");
        } else {
            setChxospixieHealth(prev => Math.max(prev - dmg, 0));
            triggerRedFlash();
            showDamage(dmg, "Chxospixie");
        }
    };

    //--------------- UI RETURN --------------------------------------------//
    return ( //START PART THAT CHANGED
        <div>
            {showTreasure ? (
                <div className={`${styles.treasureScreen} fullscreen-fit`}>
                    {showOverlay ? (
                        <div className={styles.treasureOverlay}>
                            {currentPage === 0 && (
                                <h2>The Legend You Were Born To Claim</h2>
                            )}

                            <div
                                className={styles.pageContainer}
                                onClick={() => {
                                    if (currentPage < pages.length - 1) {
                                        setCurrentPage((p) => p + 1);
                                    } else {
                                        setShowOverlay(false); // hides story overlay
                                    }
                                }}
                            >
                                <p>{pages[currentPage]}</p>
                                <div className={styles.tapHint}>▶</div>
                            </div>
                        </div>
                    ) : (
                        <button
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
                                    <div className={`${styles.spriteImage} ${darklordDead ? `${styles["dead-darklord"]} ${isPolymorphed ? styles["dead-darklord-polymorphed"] : ""}` : ""}`}>
                                        <ChampionCard
                                            championKey="Darklord"
                                            pose={darklordDead ? "dead" : darklordPose}
                                            isDead={darklordDead}
                                            isPolymorphed={isPolymorphed}
                                            size="large"
                                        />
                                    </div>
                                    {floatingDamage?.target === "Darklord" && (
                                        <div className={`${shared.floatingDamage} ${floatingDamage.status ? shared.status : ""}`}>
                                            {floatingDamage.status ? floatingDamage.value : `-${floatingDamage.value}`}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`${styles.rightChampionWrapper}`}>
                                  <div className={`${shared.championWrapper} ${styles.polySlot}`}>
                                    <div className={`${styles.spriteImage} ${chxospixieDead ? `${styles["dead-chxospixie"]} ${isPolymorphed ? styles["dead-chxospixie-polymorphed"] : ""}` : ""}`}>
                                        <ChampionCard
                                            championKey="Chxospixie"
                                            pose={chxospixieDead ? "dead" : chxospixiePose}
                                            isDead={chxospixieDead}
                                            isPolymorphed={isPolymorphed}
                                            size="large"
                                        />
                                    </div>
                                    {floatingDamage?.target === "Chxospixie" && (
                                        <div className={`${shared.floatingDamage} ${floatingDamage.status ? shared.status : ""}`}>
                                            {floatingDamage.status ? floatingDamage.value : `-${floatingDamage.value}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>


                        <div className={`${shared.rightSide} ${styles.rightSide}`}>
                            <div className={shared.enemyWrapper} style={{ position: "relative" }}>
                                {/* Beholder sprite (only if not defeated) */}
                                {!enemyDefeated && (
                                    <EnemyCard
                                        enemyName="Ancient Beholder"
                                        spritePath={
                                            enemyPose === "attack"
                                                ? "/assets/sprites/enemies/room6/beholder-attack.png"
                                                : "/assets/sprites/enemies/room6/beholder-idle.png"
                                        }
                                        size="xlarge"
                                    />
                                )}

                                {/* Treasure chest with sparkle */}
                                {enemyDefeated && (
                                    <div style={{ position: "relative" }}>
                                        <div
                                            onClick={() => setShowTreasure(true)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <EnemyCard
                                                enemyName="Treasure Chest"
                                                spritePath="/assets/treasure/treasure-chest.png"
                                                size="xlarge"
                                                className={styles.treasureChestImage}
                                            />
                                        </div>
                                        <div className={styles.treasureSparkle}></div>
                                    </div>
                                )}


                                {/* Floating damage */}
                                {floatingDamage?.target === "enemy" && !enemyDefeated && (
                                    <div className={`${shared.floatingDamage} ${floatingDamage.dodge ? shared.dodge : ""}`}>
                                        {floatingDamage.dodge ? "Dodge" : `-${floatingDamage.value}`}
                                    </div>
                                )}
                            </div>

                            {/* Enemy HUD */}
                            {!enemyDefeated && (
                                <EnemyHUD
                                    enemyName="Ancient Beholder"
                                    health={enemyHealth}
                                    maxHealth={enemyMaxHealth}
                                    isDead={enemyDefeated}
                                />
                            )}
                        </div>

                    </div>

                    {!showTreasure && (
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
                            <div className={shared.actionsInnerRow}>
                                <div className={shared.actionGroup}>
                                    <h4>{darklord.displayName}'s Actions:</h4>
                                    <div className={shared.actionButtonsRow}>
                                        {darklord.moves.map(move => {
                                            const isDisabled = actionDisabled || darklordDead;
                                            return (
                                                <button
                                                    key={move.name}
                                                    className={`${shared.actionButton} ${isDisabled ? styles.disabled : ""}`}
                                                    disabled={isDisabled}
                                                    onClick={() => dealDamage(move.damage, "Darklord", move.name)}
                                                >
                                                    {move.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className={shared.actionGroup}>
                                    <h4>{chxospixie.displayName}'s Actions:</h4>
                                    <div className={shared.actionButtonsRow}>
                                        {chxospixie.moves.map(move => {
                                            const staminaBlocked = move.staminaCost && chxospixieStamina < move.staminaCost;
                                            const isDisabled = chxospixieDead || actionDisabled || staminaBlocked;
                                            return (
                                                <button
                                                    key={move.name}
                                                    className={`${shared.actionButton} ${isDisabled ? shared.disabled : ""}`}
                                                    disabled={isDisabled}
                                                    title={
                                                        staminaBlocked
                                                            ? "Not enough stamina"
                                                            : ""
                                                    }
                                                    onClick={() => {
                                                        dealDamage(move.damage, "Chxospixie", move.name);
                                                        if (move.staminaCost) {
                                                            spendStamina(move.staminaCost);
                                                        }
                                                        if (move.name === "Piercing Shot" && enemyHealth > 0) {
                                                            setTimeout(() => {
                                                                setEnemyPose("attack");
                                                                setTimeout(() => {
                                                                    enemyAttack("Chxospixie");
                                                                    setEnemyPose("idle");
                                                                }, 1000);
                                                            }, 1000);
                                                        }
                                                    }}
                                                >
                                                    {move.name}
                                                </button>
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
                                        🌟 Open the treasure chest and fulfill your destiny! 🌟
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
