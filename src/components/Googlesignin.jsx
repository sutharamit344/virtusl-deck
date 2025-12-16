import React, { use, useEffect } from "react";
import { Button } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { setUser } from "../redux/authSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";


const Googlesignin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async () => {
        try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        dispatch(setUser({ uid: user.uid, name: user.displayName, email: user.email, avatar: user.photoURL }));
        navigate("/");
        } catch (err) {
        console.error("Google Sign-In Error:", err);
        }
    };

  return (
    <Button
      variant="contained"
      onClick={handleLogin}
      startIcon={<GoogleIcon />}
      sx={{
        backgroundColor: "#00D8FF",
        color: "#121212",
        fontWeight: "bold",
        "&:hover": {
          backgroundColor: "#00bcd4",
        },
        px: 3,
        py: 1.2,
        borderRadius: "12px",
      }}
    >
      Sign in with Google
    </Button>
  );
};

export default Googlesignin;
