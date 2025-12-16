import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
  Stack,
  Tooltip,
} from "@mui/material";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import AddIcon from "@mui/icons-material/Add";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import BottomNav from "../components/BottomNav";
import { deleteRoom } from "../redux/roomSlice";
import { ButtonGroup } from "react-bootstrap";

// ✅ Tooltip Share Button Component
const CopyShareButton = ({ roomId }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Tooltip title={copied ? "Copied!" : "Copy link"} arrow>
      <Button
        fullWidth
        size="small"
        variant="text"
        onClick={handleCopy}
        sx={{
          color: "#00D8FF",
          textTransform: "none",
          fontSize: "0.75rem",
          px: 1,
          width: "100%",
        }}
      >
        Share
      </Button>
    </Tooltip>
  );
};

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 🔁 Listen to all rooms and filter user-relevant ones
  useEffect(() => {
    const roomRef = ref(db, "rooms");
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data && user) {
        const roomArray = Object.entries(data)
          .map(([id, value]) => ({ id, ...value }))
          .filter(
            (room) => room.hostUid === user.uid || room.players?.[user.uid]
          );
        setRooms(roomArray);
      } else {
        setRooms([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleJoin = (roomId) => navigate(`/room/${roomId}`);
  const handleCreate = () => navigate("/create-room");
  const handleJoinWithCode = () => navigate("/join-room");

  return (
    <Box
      sx={{
        color: "#E6EDF3",
        mt: 6,
        pt: 6,
        px: { xs: 2, sm: 4 },
      }}
    >
      {/* ⚡ Action Buttons */}
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        sx={{ mb: 3, flexWrap: "wrap" }}
      >
        <Button
          variant="outlined"
          startIcon={<MeetingRoomIcon />}
          onClick={handleJoinWithCode}
          sx={{
            borderColor: "#00D8FF",
            color: "#00D8FF",
            fontWeight: 600,
            textTransform: "none",
          }}
        >
          Join Room
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{
            bgcolor: "#00D8FF",
            color: "#121212",
            fontWeight: 600,
            textTransform: "none",
            "&:hover": { bgcolor: "#00bcd4" },
          }}
        >
          Create Room
        </Button>
      </Stack>

      <Typography variant="h6" fontWeight="bold" mb={2}>
        Your Rooms
      </Typography>

      {rooms.length === 0 ? (
        <Typography color="gray">No rooms available right now.</Typography>
      ) : (
        <Grid container spacing={3}>
          {rooms.map((room) => (
            <Grid item width="100%" key={room.id}>
              <Card
                sx={{
                  bgcolor: "#181818",
                  borderRadius: 2,
                  border: "1px solid #2a2a2a",
                  px: 2,
                  py: 1.5,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: "#202020",
                    boxShadow: "0 0 12px rgba(0, 216, 255, 0.1)",
                    cursor: "pointer",
                  },
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  {/* 🧑 Host Info */}
                  <Box display="flex" alignItems="center" gap={1.2}>
                    <Avatar
                      src={room.hostAvatar}
                      alt={room.hostName}
                      sx={{ width: 30, height: 30 }}
                    />
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ color: "#E6EDF3", fontWeight: 500 }}
                      >
                        {room.roomName || "Untitled Room"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "gray" }}>
                        Host: {room.hostName || "Unknown"}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    icon={<PeopleIcon sx={{ color: "#888", fontSize: 16 }} />}
                    label={`${
                      room.players ? Object.keys(room.players).length : 0
                    } players`}
                    sx={{
                      bgcolor: "#202020",
                      color: "#bbb",
                      fontSize: "0.75rem",
                      height: 24,
                    }}
                    size="small"
                  />
                </Box>
                <Box display="flex" gap={1} mt={5} width="100%">
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    onClick={() => handleJoin(room.id)}
                    sx={{
                      flex: 1,
                      borderColor: "#00D8FF",
                      color: "#00D8FF",
                      textTransform: "none",
                      fontWeight: 500,
                      px: 2,
                      py: 0.5,
                    }}
                  >
                    Enter
                  </Button>

                  <Box sx={{ flex: 1 }}>
                    <CopyShareButton roomId={room.id} />
                  </Box>

                  {room.players[user?.uid] && (
                    <Button
                      fullWidth
                      size="small"
                      variant="text"
                      onClick={() => dispatch(deleteRoom({ roomId: room.id }))}
                      sx={{
                        flex: 1,
                        color: "#f44336",
                        textTransform: "none",
                        fontSize: "0.75rem",
                        px: 1,
                      }}
                      startIcon={<DeleteIcon fontSize="small" />}
                    >
                      Delete
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <BottomNav />
    </Box>
  );
};

export default RoomList;
