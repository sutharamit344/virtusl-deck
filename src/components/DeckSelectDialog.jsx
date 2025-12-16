import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import { getDatabase, ref, onValue } from "firebase/database";

const DeckSelectDialog = ({ open, onClose, onSelect }) => {
  const user = useSelector((state) => state.auth.user);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    const db = getDatabase();
    const decksRef = ref(db, "decks");

    const unsubscribe = onValue(decksRef, (snapshot) => {
      const data = snapshot.val();
      const allDecks = data ? Object.entries(data).map(([deckId, deck]) => ({
        deckId,
        ...deck,
      })) : [];

      const userDecks = allDecks.filter(
        (deck) => deck.email === user.email && deck.used === true
      );

      setDecks(userDecks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Select a Deck</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : decks.length === 0 ? (
          <Typography>No redeemed decks found.</Typography>
        ) : (
          <List>
            {decks.map((deck) => (
              <React.Fragment key={deck.deckId}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => onSelect(deck.deckId)}>
                    <ListItemText
                      primary={deck.product}
                      secondary={deck.deckId}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DeckSelectDialog;
