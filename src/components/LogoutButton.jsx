import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useDispatch } from "react-redux";
import { logoutUser } from "../redux/authSlice";
import { Button } from '@mui/material';

export default function LogoutButton() {
  const dispatch = useDispatch();
  const handleLogout = () => {
    signOut(auth);
    dispatch(logoutUser());
  };

  return <Button variant="text" color="error" onClick={handleLogout}>Logout</Button>;
}
