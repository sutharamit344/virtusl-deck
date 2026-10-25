import Button from "../../components/ui/Button";
import { FaGoogle } from "react-icons/fa";
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
      variant="primary"
      onClick={handleLogin}
      leftIcon={<FaGoogle />}
      className="w-full bg-[#00D8FF] text-[#121212] hover:bg-cyan-400 font-bold px-6 py-3 rounded-xl shadow-md transition-all"
    >
      Sign in with Google
    </Button>
  );
}

export default Googlesignin;
