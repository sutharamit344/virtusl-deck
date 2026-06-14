import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../pages/login/authSlice";
import deckReducer from "../pages/decks/deckSlice";
import roomReducer from "../pages/room/roomSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    deck: deckReducer,
    room: roomReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
