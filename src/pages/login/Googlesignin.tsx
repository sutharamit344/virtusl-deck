import { Button } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { signInWithPopup } from "firebase/auth";

import { auth, googleProvider } from "../../firebase";

function Googlesignin() {
  const handleLogin = async (): Promise<void> => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
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
}

export default Googlesignin;
