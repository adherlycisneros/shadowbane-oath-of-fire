import { useState } from "react";
import EnemyCard from "../EnemyCard"; 
import ChampionCard from "../ChampionCard";
import styles from "./Room5Brain.module.css"

export default function Room5Brain({ 
  whisperedPhrase,
  setCanContinue,
  setIsPolymorphed,
  setActionLog
 }) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [attempts, setAttempts] = useState(0);

  const checkPhrase = () => {
    const cleanedInput = input.trim().toLowerCase();
    const correct = whisperedPhrase.toLowerCase();

    if (cleanedInput === correct) {
      setFeedback({
        success: true,
        message: "The brain hums in approval. Your minds are sharp. You may pass."
      })
      setCanContinue(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 2) {
      setFeedback({
  success: false,
  message: `🧠 The brain pulses angrily! It sees no hope in your cognitive abilities and polymorphs Darklord into a frumpy toad and Chxospixie into a bewildered sheep!
          
You must now continue your quest in this unfortunate form...`
});

      setIsPolymorphed(true);
      setCanContinue(true);
    } else {
      //First incorrect attempt
      setFeedback({
        success: false,
        message: "⚠️ You are incorrect, the brain grumbles angrily. One more mistake and it may retaliate..."
      });
    }
  }
};

//Disable the input text and submit buttons when not allowed to be used
const isLocked = feedback && (feedback.success || attempts >= 2);

  return (
    <div>
      <h3>💭 What was whispered before?</h3>
      <p>Impress the Cerebral Vault by entering the exact phrase:</p>

      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setFeedback(null);
        }}
        disabled={isLocked}
      />
      <button onClick={checkPhrase} disabled={isLocked}>
        Submit
      </button>
      
      {feedback && (
        <p style={{ whiteSpace: "pre-wrap", color: feedback.success? "green" : "crimson"}}>
          {feedback.message}
        </p>
      )}
    </div>
  );
}
