import { Box, Typography, Paper } from "@mui/material";
import { Navigate } from "react-router-dom";
import Googlesignin from "./Googlesignin";
import { useAppSelector } from "../../app/hooks";
import { JSX } from "react";

function Login(): JSX.Element {
  const { user } = useAppSelector((state) => state.auth);

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        height: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          borderRadius: 5,
          maxWidth: 420,
          width: "100%",
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <img
            src="https://virtual-deck-52.web.app/vc%20logo.png"
            alt="Virtual Deck Logo"
            style={{ height: 60 }}
          />
        </Box>

        <Typography variant="h4" fontWeight="bold" mb={1}>
          Welcome to Virtual Deck
        </Typography>

        <Typography variant="body2" sx={{ color: "#aaa", mb: 3 }}>
          Sign in to unlock your cards, decks, and rooms.
        </Typography>

        <Googlesignin />
      </Paper>
    </Box>
  );
}

export default Login;
