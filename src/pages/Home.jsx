import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        color: "#fff",
        height:"100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        pt:6,
        px: { xs: 2, sm: 4 },
      }}
    >

      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <img
          src="/vc%20logo.png"
          alt="Virtual Deck Logo"
          style={{ height: 60 }}
        />
      </Box>      
      <Typography variant="h3" sx={{ fontWeight: "bold", mb: 1 }}>
        Virtual Deck
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 3, maxWidth: 500 }}>
        Play, shuffle, flip, and manage cards in real-time — all from your browser.
      </Typography>

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

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => navigate("/store")}
          sx={{
            bgcolor: "#00D8FF",
            color: "#121212",
            fontWeight: 600,
            "&:hover": { bgcolor: "#00bcd4" },
          }}
        >
          Buy Now
        </Button>
      </Box>

      <BottomNav />
    </Box>
  );
};

export default Home;
