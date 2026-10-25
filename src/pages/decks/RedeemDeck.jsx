import React, { useState } from "react";
import { useSelector } from "react-redux";
import { getDatabase, ref, get, update } from "firebase/database";
import Button from "../../components/ui/Button";

const RedeemDeck = ({ onRedeemSuccess }) => {
  const [deckId, setDeckId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // "info", "success", "error", "warning"
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.auth.user);

  const handleRedeem = async () => {
    setMessage("");
    setMessageType("info");
    
    if (!user) {
      setMessage("Please sign in to redeem a deck.");
      setMessageType("warning");
      return;
    }

    const trimmedDeckId = deckId.trim();
    if (!trimmedDeckId) {
      setMessage("Please enter a deck ID.");
      setMessageType("warning");
      return;
    }

    setLoading(true);

    try {
      const db = getDatabase();
      const deckRef = ref(db, `decks/${trimmedDeckId}`);
      const snapshot = await get(deckRef);

      if (!snapshot.exists()) {
        setMessage("Invalid deck ID.");
        setMessageType("error");
        return;
      }

      const data = snapshot.val();
      if (data.used) {
        setMessage("This deck has already been redeemed.");
        setMessageType("warning");
        return;
      }

      // Add to user's deck list
      const userDecksRef = ref(db, `users/${user.uid}/decks`);
      const userDecksSnapshot = await get(userDecksRef);
      const userDecks = userDecksSnapshot.exists() ? userDecksSnapshot.val() : {};

      await update(userDecksRef, {
        ...userDecks,
        [trimmedDeckId]: true,
      });

      await update(deckRef, {
        used: true,
        ownerUid: user.uid,
        redeemedAt: Date.now(),
      });

      // Success
      setDeckId("");
      setMessage("Deck redeemed successfully!");
      setMessageType("success");
      
      // Notify parent about successful redemption
      if (onRedeemSuccess) {
        onRedeemSuccess(trimmedDeckId);
      }
    } catch (error) {
      console.error("Redeem error:", error);
      setMessage("An error occurred. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleRedeem();
    }
  };

  const getAlertClasses = () => {
    const base = "mt-4 p-4 rounded-xl text-sm border font-medium ";
    if (messageType === "success") {
      return base + "bg-green-500/10 text-green-400 border-green-500/20";
    }
    if (messageType === "error") {
      return base + "bg-red-500/10 text-red-400 border-red-500/20";
    }
    if (messageType === "warning") {
      return base + "bg-orange-500/10 text-orange-400 border-orange-500/20";
    }
    return base + "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
  };

  return (
    <div className="pb-1">
      <div className="flex flex-col sm:flex-row gap-3 mb-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Enter Deck ID"
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
            className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-cyan-400 focus:outline-none text-white placeholder-zinc-500 disabled:opacity-50 transition-colors"
          />
        </div>
        <Button
          variant="primary"
          onClick={handleRedeem}
          disabled={loading || !deckId.trim()}
          className="h-12 px-6 rounded-xl font-bold bg-[#00D8FF] text-[#121212] hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
        >
          {loading ? "Processing..." : "Redeem"}
        </Button>
      </div>

      {message && (
        <div className={getAlertClasses()}>
          {message}
        </div>
      )}
    </div>
  );
};

export default RedeemDeck;