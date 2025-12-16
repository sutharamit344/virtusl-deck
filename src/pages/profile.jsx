import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Grid,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import EditIcon from "@mui/icons-material/Edit";
import { useDispatch, useSelector } from "react-redux";
import { auth, db } from "../firebase";
import { logoutUser, setUser } from "../redux/authSlice";
import { ref, get, update } from "firebase/database";

// Predefined avatar URLs
const predefinedAvatars = [
  "https://i.pravatar.cc/150?img=1",
  "https://i.pravatar.cc/150?img=3",
  "https://i.pravatar.cc/150?img=8",
  "https://i.pravatar.cc/150?img=10",
  "https://i.pravatar.cc/150?img=15",
];

const dicebearStyles = [
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "bottts",
  "croodles",
  "fun-emoji",
  "lorelei",
  "notionists",
  "big-ears-neutral",
];

const sampleSeeds = ["Alice", "Bob", "Charlie", "Delta", "Echo", "Fiona", "Gamer"];

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [editAvatarOpen, setEditAvatarOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState("bottts");

  const fetchUserData = async () => {
    if (!user?.uid) return;
    const snapshot = await get(ref(db, `users/${user.uid}`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      setName(data.name);
      setAvatar(data.avatar);
      dispatch(setUser({ ...user, name: data.name, avatar: data.avatar }));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, [user?.uid]);

  const handleLogout = async () => {
    await auth.signOut();
    dispatch(logoutUser());
  };

  const handleAvatarSave = async () => {
    await update(ref(db, `users/${user.uid}`), { avatar });
    dispatch(setUser({ ...user, avatar }));
    setEditAvatarOpen(false);
  };

  const handleNameSave = async () => {
    await update(ref(db, `users/${user.uid}`), { name });
    dispatch(setUser({ ...user, name }));
    setEditNameOpen(false);
  };
  
const generateAvatarUrl = (style, seed) =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

const googleAvatar = auth.currentUser?.photoURL || "";


  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", pt: 9, px: 2 }}>
      <Card sx={{ backgroundColor: "#1f1f1f", borderRadius: 4, color: "#fff", boxShadow: 5 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" position="relative">
        {/* Avatar with absolute Edit button */}
        <Box position="relative" sx={{ width: 80, height: 80 }}>
          <Avatar
            src={avatar}
            alt={name}
            sx={{ width: 80, height: 80, border: "2px solid #00D8FF" }}
          />
          <Button
            size="small"
            onClick={() => setEditAvatarOpen(true)}
            sx={{
              position: "absolute",
              bottom: 0,
              right: 0,
              minWidth: 0,
              padding: "4px",
              borderRadius: "50%",
              bgcolor: " #00D8FF",
              color: "#fff",
              '&:hover': { backgroundColor: " #00D8FF" },
            }}
          >
            <EditIcon fontSize="small" />
          </Button>
        </Box>

        {/* Name and inline edit button */}
        <Box flexGrow={1} minWidth={200}>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="h5" sx={{ fontWeight: 600 }}>{name}</Typography>
            <Button
              size="small"
              onClick={() => setEditNameOpen(true)}
              startIcon={<EditIcon />}
              sx={{ textTransform: "none", padding: 0, minWidth: "auto",
              color: " #00D8FF", }}
            >
            </Button>
          </Box>
          <Typography variant="body2" color="gray">{user?.email}</Typography>
        </Box>
      </Box>


                <Divider sx={{ my: 3, backgroundColor: "#333" }} />

                <Button
                  onClick={handleLogout}
                  variant="contained"
                  color="error"
                  fullWidth
                  startIcon={<LogoutIcon />}
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                >
                  Logout
                </Button>
              </CardContent>
            </Card>

            {/* Edit Avatar Dialog */}
            <Dialog open={editAvatarOpen} onClose={() => setEditAvatarOpen(false)} fullWidth>
              <DialogTitle>Edit Avatar</DialogTitle>
              <DialogContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Choose an Avatar Style:
      </Typography>

      <TextField
        select
        fullWidth
        label="Avatar Style"
        value={selectedStyle}
        onChange={(e) => setSelectedStyle(e.target.value)}
        SelectProps={{ native: true }}
        sx={{ mb: 3 }}
      >
        {dicebearStyles.map((style) => (
          <option key={style} value={style}>{style}</option>
        ))}
      </TextField>

      <Grid container spacing={2}>

        {/* Google Auth Avatar */}
        {googleAvatar && (
          <Grid item xs={4} sm={3} md={2}>
            <Avatar
              src={googleAvatar}
              alt="Google Avatar"
              sx={{
                width: 64,
                height: 64,
                border: avatar === googleAvatar ? "3px solid #2196f3" : "2px solid #888",
                cursor: "pointer",
                mx: "auto",
              }}
              onClick={() => setAvatar(googleAvatar)}
            />
            <Typography variant="caption" display="block" textAlign="center" mt={0.5}>
              G Avatar
            </Typography>
          </Grid>
        )}

        {/* DiceBear Avatars */}
        {sampleSeeds.map((seed) => {
          const url = generateAvatarUrl(selectedStyle, seed);
          return (
            <Grid item xs={4} sm={3} md={2} key={seed}>
              <Avatar
                src={url}
                alt={seed}
                sx={{
                  width: 64,
                  height: 64,
                  border: avatar === url ? "3px solid #2196f3" : "2px solid #888",
                  cursor: "pointer",
                  mx: "auto",
                }}
                onClick={() => setAvatar(url)}
              />
              <Typography variant="caption" display="block" textAlign="center" mt={0.5}>
                {seed}
              </Typography>
            </Grid>
          );
        })}

      </Grid>

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAvatarOpen(false)}>Cancel</Button>
          <Button onClick={handleAvatarSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Name Dialog */}
      <Dialog open={editNameOpen} onClose={() => {setEditNameOpen(false);fetchUserData();}} fullWidth>
        <DialogTitle>Edit Name</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            sx={{ my: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {setEditNameOpen(false);fetchUserData();}}>Cancel</Button>
          <Button onClick={handleNameSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
