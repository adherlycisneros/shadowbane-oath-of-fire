import { useEffect, useState } from "react";
import { characterStates } from "../../data/characterData";
import EnemyHUD from "../EnemyHUD";
import EnemyCard from "../EnemyCard"; 
import ChampionHUD from "../ChampionHUD";
import ChampionCard from "../ChampionCard";
import styles from "./Room6Final.module.css"


const beholderImages = {
    normal: "https://via.placeholder.com/150x150?text=Beholder",
    defeated: "https://via.placeholder.com/150x150?text=Beholder+Defeated"
};

export default function Room6Final({
    darklordHealth,
    chxospixieHealth,
    setDarklordHealth,
    setChxospixieHealth,
    chxospixieStamina,
    setChxospixieStamina,
    isPolymorphed,
    setActionLog,
    darklordDead,
    chxospixieDead,
    setCanContinue,
    onFinish
}) {
    const [beholderHealth, setBeholderHealth] = useState(200);
    const [playerTurn, setPlayerTurn] = useState(true);
    const [sleepTargets, setSleepTargets] = useState({ Darklord: false, Chxospixie: false });
    const [fearTargets, setFearTargets] = useState({ Darklord: 1, Chxospixie: 1 });
    const [victoryMessage, setVictoryMessage] = useState("");
    const [showTreasure, setShowTreasure] = useState(false);

    // Action Log helper
    const logAction = (entry) => {
        setActionLog((prev) => [entry, ...prev.slice(0, 1)]);
    };

    // Reset log on room entry
    useEffect(() => {
        setActionLog([]);
    }, [setActionLog]);

    // Dodge helper
    const playerDodgeChance = 0.2;
    const beholderDodgeChance = 0.1;

    // BEHOLDER ATTACKS
    const beholderAttacks = [
        {
            name: "Disintegration Ray",
            baseDamage: 30,
            effect: null,
            description: (dmg) => `fires a Disintegration Ray dealing ${dmg} damage!`
        },
        {
            name: "Sleep Ray",
            baseDamage: 0,
            effect: "sleep",
            description: () => `casts Sleep Ray! The target will miss their next turn!`,
        },
        {
            name: "Fear Ray",
            baseDamage: 0,
            effect: "fear",
            description: () => `casts Fear Ray! The target's attack damage is halved for 2 turns!`,
            duration: 2
        }
    ];

    // PLAYER ATTACK
    const playerAttack = (character, actionName, baseDamage) => {
        if (!playerTurn || beholderHealth <= 0) return; // prevent if not player's turn or enemy dead
        if ((character === "Darklord" && darklordDead) ||
            (character === "Chxospixie" && chxospixieDead)) return;

        // if fear is active
        const fearMultiplier = fearTargets[character] || 1;
        const damage = Math.floor(baseDamage * fearMultiplier);

        // Enemy dodges attack
        if (Math.random() < beholderDodgeChance) {
            logAction(`The Beholder narrowly evades ${character}'s ${actionName}!`);
            setPlayerTurn(false);
            setTimeout(() => enemyAttack(), 1000);
            return;
        }

        setBeholderHealth((prev) => Math.max(prev - damage, 0));
        logAction(`${character} uses ${actionName}, dealing ${damage} damage!`);

        // next turn
        setPlayerTurn(false);
        setTimeout(() => enemyAttack(), 1000);
    };

    // ENEMY ATTACK
    const enemyAttack = () => {
        if (beholderHealth <= 0) return; // if enemy is dead

        // Attack a target randomly, skip if target is asleep
        let possibleTargets = [];
        if (!darklordDead && !sleepTargets.Darklord) possibleTargets.push("Darklord");
        if (!chxospixieDead && !sleepTargets.Chxospixie) possibleTargets.push("Chxospixie");
        // Skip enemy turn if both asleep
        if (possibleTargets.length === 0) {
            logAction("Both heroes are asleep! Beholder's attack misses!");
            setSleepTargets({ Darklord: false, Chxospixie: false }); // Wake them up after skip
            setPlayerTurn(true);
            return;
        }

        const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

        // Player dodges attack
        if (Math.random() < playerDodgeChance) {
            logAction(`The Beholder attacks ${target}, but they dodge the attack!`);
            setPlayerTurn(true);
            return;
        }

        // Pick attack randomly
        const attack = beholderAttacks[Math.floor(Math.random() * beholderAttacks.length)];

        if (attack.effect === "sleep") {
            setSleepTargets((prev) => ({ ...prev, [target]: true }));
            logAction(`Beholder ${attack.description()} (${target} will skip their next turn)`);
        } else if (attack.effect === "fear") {
            setFearTargets((prev) => ({ ...prev, [target]: 0.5 }));
            logAction(`Beholder ${attack.description()} (${target}'s attacks deal half damage for 2 turns)`);
            // Remove after 2 turns
            setTimeout(() => {
                setFearTargets((prev) => ({ ...prev, [target]: 1 }));
                logAction(`${target} overcomes Fear Ray and regains full attack power!`);
            }, 6000);
        } else {
            const damage = attack.baseDamage;
            if (target === "Darklord") {
                setDarklordHealth((prev) => Math.max(prev - damage, 0));
            } else {
                setChxospixieHealth((prev) => Math.max(prev - damage, 0));
            }
            logAction(`Beholder ${attack.description(damage)} (${target} takes the hit)`);
        }

        // Clear sleep effect for whoever just lost turn
        if (sleepTargets[target]) {
            setSleepTargets((prev) => ({ ...prev, [target]: false }));
        }
        setPlayerTurn(true);
    };

    // Enemy attacks right after player's turn
    useEffect(() => {
        if (!playerTurn && beholderHealth > 0) {
            const timeout = setTimeout(enemyAttack, 1500);
            return () => clearTimeout(timeout);
        }
    }, [playerTurn, beholderHealth]);

    // VICTORY!!!! BEAT BEHOLDER
    useEffect(() => {
        if (beholderHealth <= 0) {
            if (isPolymorphed) {
                setVictoryMessage("Wahoo! 🎉 You have defeated the Beholder! A magical burst lifts the polymorph spell and the ancient vault opens.");
                setIsPolymorphed(false);
            } else {
                setVictoryMessage("Wahoo! 🎉 You have defeated the Beholder! The ancient vault is now open!");
            }

            setCanContinue(true);
        }
    }, [beholderHealth, isPolymorphed, setIsPolymorphed, setCanContinue]);

    // PLAYER ACTION BUTTONS
    const renderActions = () => {
        const stateKey = isPolymorphed ? "polymorphed" : "normal";
        const darklord = characterStates.Darklord[stateKey];
        const chxospixie = characterStates.Chxospixie[stateKey];

        return (
            <>
                {darklord.moves.map((move) => (
                    <button
                        key={move.name}
                        disabled={
                            !playerTurn ||
                            beholderHealth <= 0 ||
                            sleepTargets.Darklord || // disable if Darklord asleep
                            darklordDead
                        }
                        onClick={() => playerAttack("Darklord", move.name, move.damage)}
                    >
                        {move.name}
                    </button>
                ))}

                {chxospixie.moves.map((move) => (
                    <button
                        key={move.name}
                        disabled={
                            !playerTurn ||
                            beholderHealth <= 0 ||
                            sleepTargets.Chxospixie ||
                            chxospixieDead
                        }
                        onClick={() => {
                            if (move.staminaCost) {
                                if (chxospixieStamina >= move.staminaCost) {
                                    playerAttack("Chxospixie", move.name, move.damage);
                                    setChxospixieStamina((s) => s - move.staminaCost);
                                } else {
                                    logAction(`${chxospixie.displayName} is too exhausted to use ${move.name}!`);
                                }
                            } else {
                                playerAttack("Chxospixie", move.name, move.damage);
                            }
                        }}
                    >
                        {move.name}
                        {move.staminaCost ? ` (${move.damage} dmg, costs ${move.staminaCost} stamina)` : ""}
                    </button>
                ))}
            </>
        );
    };

    //--------------- UI RETURN --------------------------------------------//
    return (
        
        <div>
            {victoryMessage && (
                <div>
                    <p>{victoryMessage}</p>
                </div>
            )}

            {beholderHealth <= 0 && !showTreasure && (
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
                <>
                    <h3>Final Boss: The Beholder</h3>

                    <EnemyHUD
                        enemyName="Beholder"
                        health={beholderHealth}
                        maxHealth={200}
                        spritePath={beholderHealth > 0 ? beholderImages.normal : beholderImages.defeated}
                        isDead={beholderHealth <= 0}
                    />

                    <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
                        <div>
                            <img
                                src={characterStates.Darklord[isPolymorphed ? "polymorphed" : "normal"].sprite}
                                alt={characterStates.Darklord[isPolymorphed ? "polymorphed" : "normal"].displayName}
                            />
                            <p>Darklord HP: {darklordHealth}</p>
                            {renderActions()}
                        </div>

                        <div>
                            <img
                                src={characterStates.Chxospixie[isPolymorphed ? "polymorphed" : "normal"].sprite}
                                alt={characterStates.Chxospixie[isPolymorphed ? "polymorphed" : "normal"].displayName}
                            />
                            <p>Chxospixie HP: {chxospixieHealth}</p>
                            <p>Stamina: {chxospixieStamina}</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
