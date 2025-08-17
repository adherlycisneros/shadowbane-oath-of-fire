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
    setActionLog,
    setCanContinue,
    isPolymorphed,
    setIsPolymorphed,
    darklordDead,
    chxospixieDead,
    onFinish
}) {
    const [enemyHealth, setEnemyHealth] = useState(300);
    const [enemyDefeated, setEnemyDefeated] = useState(false);
    const [showRedFlash, setShowRedFlash] = useState(false);
    const [enemyPose, setEnemyPose] = useState("idle");
    const [actionDisabled, setActionDisabled] = useState(false);
    const [darklordPose, setDarklordPose] = useState("idle");
    const [chxospixiePose, setChxospixiePose] = useState("idle");
    const [floatingDamage, setFloatingDamage] = useState(null);
    const [victoryMessage, setVictoryMessage] = useState("");
    const [showTreasure, setShowTreasure] = useState(false);

    const stateKey = isPolymorphed ? "polymorphed" : "normal";
    const darklord = characterStates.Darklord[stateKey];
    const chxospixie = characterStates.Chxospixie[stateKey];

    const isGameOver = darklordDead && chxospixieDead;
    const enemyMaxHealth = 300;

    const triggerRedFlash = () => {
        setShowRedFlash(true);
        setTimeout(() => setShowRedFlash(false), 300);
    };

    const logAction = (entry) => {
        setActionLog([entry]);
    };

    useEffect(() => {
        setActionLog([]);
    }, [setActionLog]);

    useEffect(() => {
        if (enemyHealth <= 0) {
            const timer = setTimeout(() => {
                setEnemyDefeated(true);

                // Polymorph-aware victory message logic
                if (isPolymorphed) {
                    setVictoryMessage(
                        "✅ Displacer defeated! Polymorph spell lifted!"
                    );
                    setIsPolymorphed(false);
                } else {
                    setVictoryMessage("✅ Displacer defeated!");
                }

                setTimeout(() => setCanContinue(true), 1500);
            }, 600);

            return () => clearTimeout(timer);
        }
    }, [enemyHealth, isPolymorphed, setIsPolymorphed, setCanContinue, setVictoryMessage]);

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

    const enemySpritePath =
        enemyPose === "attack"
            ? "/assets/sprites/enemies/room6/beholder-attack.png"
            : "/assets/sprites/enemies/room6/beholder-idle.png";

    // BEHOLDER ATTACKS
    const beholderAttacks = [
        { name: "Disintegration Ray", baseDamage: 8 },
        { name: "Necrotic Beam", baseDamage: 14 },
        { name: "Force Blast", baseDamage: 20 }
    ];

    // FIX: useRef (was useState before)
    const lastAttackerRef = useRef(null);

    // Helper to show floating damage (extend existing showDamage if you have one)
    // Assume existing setFloatingDamage({ value, target }) pattern
    const showEnemyDodge = () => {
        setFloatingDamage({ value: 0, target: "enemy", dodge: true });
        setTimeout(() => setFloatingDamage(null), 1500);
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
    return (
        <div className={`${styles.roomBackground} fullscreen-fit`}>
            {victoryMessage && (
                <div>
                    <p>{victoryMessage}</p>
                </div>
            )}

            {(enemyHealth <= 0) && !showTreasure && (
                <button onClick={() => setShowTreasure(true)}>
                    Continue →
                </button>
            )}

            {showTreasure ? (
                <div style={{ padding: "1rem", textAlign: "left", maxWidth: "600px", margin: "auto" }}>
                    <h2 style={{ color: "#a020f0", fontSize: "1.5rem" }}>
                        🎉 The Legend You Were Born To Claim 🎉
                    </h2>
                    <p style={{ fontSize: "1rem", lineHeight: 1.5, marginTop: "0.5rem" }}>
                        The quest ends, but the legend continues...
                    </p>
                    <p style={{ fontSize: "1rem", lineHeight: 1.5, margin: "1rem 0", color: "#4a235a" }}>
                        From the blood-forged arenas of Graal'kath to the infernal legacy of Emberreach,
                        two unlikely souls crossed paths and chose to walk the same road. Even the fates whispered:
                        <em>together, they are unstoppable.</em>

                        <br /><br />
                        Chxospixie and Darklord braved the twisting halls of the Shadowbane Dungeon,
                        unraveled the maddening whispers of cursed halls,
                        and faced Beholders whose gaze could unmake the strongest soul—
                        triumphing not through steel alone, but through unshaken bond.

                        <br /><br />
                        They... <em>we</em>, have laughed in the face of every trial and prevailed.

                        <br /><br />
                        Though <strong>Chxospixie</strong> has conquered dungeons and shattered curses,
                        her greatest quest has ever been to stand beside you.
                        For <strong>Darklord</strong> has found in her not only the light he vowed to protect,
                        but a blazing force that forged his purpose anew— and so her heart has chosen you.

                        <br /><br />
                        Through every quest, every sleepless battle, every storm,
                        even should the stars fall and the world burn,
                        the heart of Chxospixie shall remain yours—
                        steadfast as the oath that binds you, fierce as the fire in her blood.
                    </p>
                    <p style={{ fontSize: "1rem", lineHeight: 1.5, color: "#4a235a" }}>
                        On this day of your birth, my champion,
                        may your quests be ever-epic, your loot forever legendary,
                        and your aggro management (with me) remain top-tier.
                    </p>
                    <p style={{ fontStyle: "italic", fontSize: "0.9rem", color: "#777" }}>
                        P.S. No respecs allowed. You are stuck with me for the rest of the campaign. 💖
                    </p>
                    <button
                        onClick={onFinish}
                        style={{
                            marginTop: "1rem",
                            padding: "0.6rem 1rem",
                            fontSize: "1rem",
                            backgroundColor: "#6a1b9a",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                        }}
                    >
                        End Adventure
                    </button>
                </div>

            ) : (
                <div className={`${styles.roomBackground} fullscreen-fit`}>
                    {showRedFlash && <div className={shared.redFlash} />}

                    <div className={`${shared.battlefield} ${styles.battlefield}`}>
                        <div className={`${shared.leftSide} ${styles.leftSide}`}>
                            <div className={shared.championWrapper}>
                                <ChampionCard
                                    championKey="Darklord"
                                    pose={darklordDead ? "dead" : darklordPose}
                                    isDead={darklordDead}
                                    isPolymorphed={isPolymorphed}
                                    size="large"
                                />
                                {floatingDamage?.target === "Darklord" && (
                                    <div className={`${shared.floatingDamage} ${floatingDamage.status ? shared.status : ""}`}>
                                        {floatingDamage.status ? floatingDamage.value : `-${floatingDamage.value}`}
                                    </div>
                                )}
                            </div>

                            <div className={shared.championWrapper}>
                                <ChampionCard
                                    championKey="Chxospixie"
                                    pose={chxospixieDead ? "dead" : chxospixiePose}
                                    isDead={chxospixieDead}
                                    isPolymorphed={isPolymorphed}
                                    size="large"
                                />
                                {floatingDamage?.target === "Chxospixie" && (
                                    <div className={`${shared.floatingDamage} ${floatingDamage.status ? shared.status : ""}`}>
                                        {floatingDamage.status ? floatingDamage.value : `-${floatingDamage.value}`}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={shared.rightSide}>
                            <div className={shared.enemyWrapper}>
                                <EnemyCard
                                    enemyName="Twin Displacer Beasts"
                                    spritePath={enemySpritePath}
                                    size="xlarge"
                                    isDead={enemyDefeated}
                                />
                                {floatingDamage?.target === "enemy" && (
                                    <div className={`${shared.floatingDamage} ${floatingDamage.dodge ? shared.dodge : ""}`}>
                                        {floatingDamage.dodge ? "Dodge" : `-${floatingDamage.value}`}
                                    </div>
                                )}
                            </div>
                            <EnemyHUD
                                enemyName="Twin Displacer Beasts"
                                health={enemyHealth}
                                maxHealth={enemyMaxHealth}
                                isDead={enemyDefeated}
                            />
                        </div>
                    </div>

                    <ChampionHUD
                        darklordHealth={darklordHealth}
                        chxospixieHealth={chxospixieHealth}
                        darklordDead={darklordDead}
                        chxospixieDead={chxospixieDead}
                        chxospixieStamina={chxospixieStamina}
                        chxospixieMaxStamina={60}
                        isPolymorphed={isPolymorphed}
                    />

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
                </div>
            )}
        </div>
    );
}
