import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { useSelector } from "react-redux";
import { getDatabase, ref, get, update } from "firebase/database";

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

  return (
    <Box sx={{ pb: 1 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 2,
        }}
      >
        <TextField
          label="Enter Deck ID"
          variant="outlined"
          value={deckId}
          onChange={(e) => setDeckId(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          fullWidth
          sx={{
            input: { color: "#fff" },
            label: { color: "#ccc" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "#444" },
              "&:hover fieldset": { borderColor: "#888" },
              "&.Mui-focused fieldset": { borderColor: "#00D8FF" },
              "&.Mui-disabled fieldset": { borderColor: "#666" },
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleRedeem}
          disabled={loading || !deckId.trim()}
          sx={{
            backgroundColor: "#00D8FF",
            color: "#000",
            px: 4,
            minWidth: "120px",
            height: "56px",
            "&:hover": {
              backgroundColor: "#00bcd4",
            },
            "&:disabled": {
              backgroundColor: "#666",
              color: "#999",
            },
          }}
        >
          {loading ? "Processing..." : "Redeem"}
        </Button>
      </Box>

      {message && (
        <Alert 
          severity={messageType === "success" ? "success" : 
                   messageType === "error" ? "error" : 
                   messageType === "warning" ? "warning" : "info"}
          sx={{ 
            mt: 2,
            borderRadius: "8px",
            backgroundColor: messageType === "success" 
              ? "rgba(76, 175, 80, 0.1)" 
              : messageType === "error"
              ? "rgba(244, 67, 54, 0.1)"
              : messageType === "warning"
              ? "rgba(255, 193, 7, 0.1)"
              : "rgba(33, 150, 243, 0.1)",
          }}
        >
          {message}
        </Alert>
      )}
    </Box>
  );
};

export default RedeemDeck;