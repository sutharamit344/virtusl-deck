import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { createRoom } from "../utilis/createRoom";

const CreateRoom = () => {
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState(""); // ✅ NEW
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleCreate = async () => {
    if (!user) return;
    const roomId = await createRoom(roomName.trim(), user, password.trim()); // ✅ send password
    navigate(`/room/${roomId}`);
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
        <Typography variant="h5" fontWeight="bold" sx={{ color: "#00D8FF" }} mb={2}>
          Create a Room
        </Typography>

        <TextField
          label="Name (Optional)"
          variant="outlined"
          fullWidth
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
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
        />

        <TextField
          label="Password (Optional)"
          type="password"
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleCreate}
          sx={{ bgcolor: "#00D8FF", color: "#121212", fontWeight: 600 }}
        >
          Create
        </Button>
      </Paper>
    </Box>
  );
};

export default CreateRoom;
