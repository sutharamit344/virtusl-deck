import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppUser } from "../../_hooks/useAuthWatcher";

type AuthState = {
  user: AppUser | null;
  loading: boolean;
};

const initialState: AuthState = {
  user: null,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.loading = false;
    },
    logoutUser(state) {
      state.user = null;
      state.loading = false;
    },
  },
});

export const { setUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;
