import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import axios from "axios";

import { auth, db } from "../firebase";
import { logoutUser, setUser } from "../pages/login/authSlice";

export type AppUser = {
  uid: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  createdAt: number;
};

export function useAuthWatcher() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);

        let userData: AppUser;

        if (snapshot.exists()) {
          userData = {
            uid: firebaseUser.uid,
            ...(snapshot.val() as Omit<AppUser, "uid">),
          };
        } else {
          userData = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL,
            createdAt: Date.now(),
          };

          try {
            await axios.post(
              "https://sendwelcomeemail-shakoavcgq-uc.a.run.app",
              {
                email: userData.email,
                name: userData.name,
              }
            );

            await set(userRef, userData);
          } catch (err) {
            dispatch(logoutUser());
            navigate("/login", { replace: true });
            return;
          }
        }

        sessionStorage.setItem("user", JSON.stringify(userData));
        dispatch(setUser(userData));
      } else {
        dispatch(logoutUser());

        if (location.pathname !== "/login") {
          navigate("/login", { replace: true });
        }
      }
    });

    return () => unsubscribe();
  }, [dispatch, navigate, location.pathname]);
}
