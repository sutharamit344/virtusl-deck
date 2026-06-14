import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useDispatch } from "react-redux";
import { logoutUser } from "./authSlice";
import Button from "../../components/ui/Button";

export default function LogoutButton() {
  const dispatch = useDispatch();
  const handleLogout = () => {
    signOut(auth);
    dispatch(logoutUser());
  };

  return (
    <Button variant="danger" color="error" onClick={handleLogout}>
      Logout
    </Button>
  );
}
