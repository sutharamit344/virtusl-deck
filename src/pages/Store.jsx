import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Chip,
  Paper,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BottomNav from "../components/BottomNav";
import { db } from "../firebase";
import { onValue, ref } from "firebase/database";

const Store = () => {
  const [decks, setDecks] = useState([]);

  useEffect(() => {
    const decksRef = ref(db, "deckstore");

    const unsubscribe = onValue(decksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const decksArray = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setDecks(decksArray);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Box sx={{
      color: "#E6EDF3",
        py: 6,
        mt:6,
        px: { xs: 2, sm: 4 }
        }}>
      
      {/* 💥 Promo Offer Banner */}
      <Paper
        elevation={5}
        sx={{
          bgcolor: "#1e1e1e",
          color: "#00D8FF",
          px: 3,
          py: 2,
          mb: 4,
          border: "1px dashed #00D8FF",
          borderRadius: 2,
          textAlign: "center",
          maxWidth: 400,
        }}
      >
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          🎉 Limited Time Offer!
        </Typography>
        <Typography variant="body2">
          Use promo code <strong>FLAT50</strong> to get <strong>50% OFF</strong> on any premium deck.
        </Typography>
      </Paper>

      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={4}>
        <StorefrontIcon sx={{ color: "#00D8FF", fontSize: 30 }} />
        <Typography variant="h6" fontWeight="bold">
          Deck Store
        </Typography>
      </Box>

      {/* Deck List */}
      <Grid container spacing={4} mb={4}>
        {decks.map((deck) => (
          <Grid item xs={12} sm={6} md={4} key={deck.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                bgcolor: "#1E1E1E",
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: 6,
              }}
            >
              <CardMedia
                component="img"
                height="180"
                image={deck.banner}
                alt={deck.name}
                sx={{
                  objectFit: "contain",
                  bgcolor: "#2a2a2a",
                  p: 2,
                }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "#00D8FF", mb: 1 }}
                >
                  {deck.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "#ccc" }}>
                  {deck.description}
                </Typography>
              </CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  pt: 0,
                }}
              >
                <Chip
                  label={deck.price ? `₹${deck.price.toFixed(2)}` : "Free"}
                  sx={{
                    bgcolor: deck.price ? "#2a2a2a" : "#00D8FF",
                    color: deck.price ? "#ccc" : "#121212",
                    fontWeight: "bold",
                  }}
                />
                <Button
                  variant="contained"
                  href={deck.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: "#00D8FF",
                    color: "#121212",
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: "#00bcd4",
                    },
                  }}
                >
                  Buy
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Bottom Navigation */}
      <BottomNav select={3} />
    </Box>
  );
};

export default Store;
