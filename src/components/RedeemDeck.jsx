import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import { getDatabase, ref, get, update } from "firebase/database";

const RedeemDeck = () => {
  const [deckId, setDeckId] = useState("");
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("info.main");
  const user = useSelector((state) => state.auth.user);

  const handleRedeem = async () => {
    setMessage(""); // reset before each attempt
    
    if (!user) {
      setMessage("❌ Please sign in to redeem a deck.");
      setMessageColor("warning.main");
      return;
    }

    if (!deckId.trim()) return;

    const db = getDatabase();
    const deckRef = ref(db, `decks/${deckId.trim()}`);
    const snapshot = await get(deckRef);

    if (!snapshot.exists()) {
      setMessage("❌ Invalid deck ID.");
      setMessageColor("error.main");
      return;
    }

    const data = snapshot.val();
    if (data.used) {
      setMessage("❌ This deck has already been redeemed.");
      setMessageColor("warning.main");
      return;
    }

    // Add to user’s deck list (append instead of overwrite)
    const userDecksRef = ref(db, `users/${user.uid}/decks`);
    const userDecksSnapshot = await get(userDecksRef);
    const userDecks = userDecksSnapshot.exists() ? userDecksSnapshot.val() : {};

    await update(userDecksRef, {
      ...userDecks,
      [deckId.trim()]: true,
    });

    await update(deckRef, {
      used: true,
      ownerUid: user.uid,
    });

    setDeckId(""); // clear input
    setMessage("✅ Deck redeemed successfully!");
    setMessageColor("success.main");
  };

  return (
    <Box sx={{ pb: 1 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <TextField
          label="Enter Deck ID"
          variant="outlined"
          value={deckId}
          onChange={(e) => setDeckId(e.target.value)}
          fullWidth
          sx={{
            input: { color: "#fff" },
            label: { color: "#ccc" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "#444" },
              "&:hover fieldset": { borderColor: "#888" },
              "&.Mui-focused fieldset": { borderColor: "#00D8FF" },
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleRedeem}
          sx={{
            backgroundColor: "#00D8FF",
            color: "#000",
            px: 4,
            "&:hover": {
              backgroundColor: "#00bcd4",
            },
          }}
        >
          Redeem
        </Button>
      </Box>

      {message && (
        <Typography sx={{ mt: 2 }} color={messageColor}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default RedeemDeck;
