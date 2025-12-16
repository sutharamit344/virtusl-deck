import React from "react";
import { Box, Typography, Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useNavigate } from "react-router-dom";

const RoomNotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      textAlign="center"
      sx={{ color: "#E6EDF3", px: 2 }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 80, color: "#f44336", mb: 2 }} />

      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Room Not Found
      </Typography>

      <Typography variant="body1" color="gray" mb={3}>
        The room you’re looking for doesn’t exist or was deleted.
      </Typography>

      <Button
        variant="contained"
        onClick={() => navigate("/")}
        sx={{
          bgcolor: "#00D8FF",
          color: "#121212",
          fontWeight: 600,
          textTransform: "none",
          "&:hover": { bgcolor: "#00bcd4" },
        }}
      >
        Back to Home
      </Button>
    </Box>
  );
};

export default RoomNotFound;
