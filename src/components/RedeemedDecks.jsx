import React, { useEffect, useState } from "react";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Box,
} from "@mui/material";
import { getDatabase, ref, onValue } from "firebase/database";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const RedeemedDecks = () => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user?.email) return;

    const db = getDatabase();
    const decksRef = ref(db, "decks");

    const unsubscribe = onValue(decksRef, (snapshot) => {
      const data = snapshot.val();
      const allDecks = data ? Object.values(data) : [];

      const userDecks = allDecks.filter(
        (deck) => deck.email === user.email && deck.used === true
      );

      setDecks(userDecks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h6" sx={{ mb: 2, color: "#E6EDF3" }}>
        Your Redeemed Decks
      </Typography>

      {decks.length === 0 ? (
        <Typography variant="body2" sx={{ color: "#aaa", textAlign: "center", mt: 4 }}>
          You haven’t redeemed any decks yet. Visit the store or buy one to get started!
        </Typography>
      ) : (
        <Grid container spacing={2} mb={4}>
          {decks.map((deck) => (
            <Grid item width="100%" key={deck.deckId}>
              <Link to={`/deck-view/${deck.deckId}`} style={{ textDecoration: "none" }}>
                <Card
                  sx={{
                    backgroundColor: "#1e1e1e",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    p: 1,
                    borderRadius: 2,
                    transition: "0.3s",
                    "&:hover": {
                      backgroundColor: "#292929",
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    sx={{
                      width: 70,
                      height: 90,
                      objectFit: "contain",
                      borderRadius: 4,
                      mr: 2,
                    }}
                    image={deck.back}
                    alt="Deck"
                  />
                  <CardContent sx={{ flex: 1, p: 0 }}>
                    <Typography variant="subtitle" fontSize={20} fontWeight="bold">
                      {deck.product}
                    </Typography>
                    <Typography variant="h6" color="gray">
                      ID: {deck.deckId}
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      )}
      <br />
      <br />
    </>
  );
};

export default RedeemedDecks;
