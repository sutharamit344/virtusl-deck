// JoinRoom.jsx
import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const JoinRoom = () => {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (roomCode.trim()) {
      navigate(`/room/${roomCode.trim()}`);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "#121212",
        color: "#E6EDF3",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        px: 3,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          bgcolor: "#1e1e1e",
          px: 4,
          py: 5,
          borderRadius: 3,
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" fontWeight="bold" sx={{color: "#00D8FF",}} mb={2}>
          Join a Room
        </Typography>
        <TextField
          label="Room Code"
          variant="outlined"
          fullWidth
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          sx={{
            mb: 3,
            input: { color: "#fff" },
            label: { color: "#ccc" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "#444" },
              "&:hover fieldset": { borderColor: "#888" },
              "&.Mui-focused fieldset": { borderColor: "#00D8FF" },
            },
          }}
          InputLabelProps={{ style: { color: "#ccc" } }}
          InputProps={{ style: { color: "#E6EDF3" } }}
        />
        <Button
          variant="contained"
          fullWidth
          onClick={handleJoin}
          sx={{ bgcolor: "#00D8FF", color: "#121212", fontWeight: 600 }}
        >
          Join
        </Button>
      </Paper>
    </Box>
  );
};

export default JoinRoom;