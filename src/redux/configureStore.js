import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import deckReducer from "./deckSlice";
import roomReducer from "./roomSlice";

export const store = configureStore({
    reducer:{
        auth: authReducer,
        deck: deckReducer,
        room: roomReducer,
    }
})