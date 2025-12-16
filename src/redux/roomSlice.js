import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ref, get, onValue, update, set, remove } from "firebase/database";
import { db } from "../firebase";

const initialState = {
  roomId: null,
  roomName: null,
  deckId: null,
  players: {},
  loading: false,
  error: null,
  joined: false,
  password: null,
  settings: {
    mode: true,
    faceUp: true,
  },
  settings: {
    table:null
  }
};

// 🔁 Load room with real-time updates
export const loadRoomRealtime = createAsyncThunk(
  "room/loadRoomRealtime",
  async (roomId, { dispatch, rejectWithValue }) => {
    try {
      const snapshot = await get(ref(db, `rooms/${roomId}`));
      if (!snapshot.exists()) return rejectWithValue("Room not found");

      const data = snapshot.val();
      dispatch(setRoom({ roomId, ...data }));

      onValue(ref(db, `rooms/${roomId}`), (snap) => {
        const liveData = snap.val();
        if (liveData) {
          dispatch(setRoom({ roomId, ...liveData }));
        } else {
          dispatch(clearRoom());
        }
      });

      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ✍️ Update any room fields
export const updateRoomFields = createAsyncThunk(
  "room/updateRoomFields",
  async ({ roomId, fields }, thunkAPI) => {
    try {
      await update(ref(db, `rooms/${roomId}`), fields);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// 👥 Update players list
export const updateRoomPlayers = createAsyncThunk(
  "room/updateRoomPlayers",
  async ({ roomId, players }, thunkAPI) => {
    try {
      await update(ref(db, `rooms/${roomId}/players`), players);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const addDeckToRoom = createAsyncThunk(
  "room/addDeckToRoom",
  async ({ roomId, deckId, locationPath, accessId }, thunkAPI) => {
    if (!roomId || !deckId) return thunkAPI.rejectWithValue("Room ID or Deck ID missing");
    try {
      await update(ref(db, `rooms/${roomId}`), { deckId });

      const deckSnap = await get(ref(db, `decks/${deckId}/cards`));
      if (!deckSnap.exists()) throw new Error("Deck not found or has no cards");

      const cards = deckSnap.val();
      const updates = {};

      for (const cardId in cards) {
        updates[`decks/${deckId}/cards/${cardId}/locationPath`] = locationPath;
        updates[`decks/${deckId}/cards/${cardId}/faceUp`] = false;
        updates[`decks/${deckId}/cards/${cardId}/hand`] = null;
      }

      updates[`decks/${deckId}/reverseorder`] = false;
      updates[`decks/${deckId}/layout`] = false;
      updates[`decks/${deckId}/roomId`] = roomId;
      updates[`decks/${deckId}/deckAccess`] = accessId;

      await update(ref(db), updates);

      return { roomId, deckId };
    } catch (error) {
      console.error("❌ Failed to add deck to room:", error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const joinRoom = createAsyncThunk(
  "room/joinRoom",
  async ({ roomId, user }, { rejectWithValue }) => {
    try {
      const playerData = {
        displayName: user.name,
        avatar: user.avatar || null,
        host: false,
        joinedAt: Date.now(),
      };

      await update(ref(db, `rooms/${roomId}/players/${user.uid}`), playerData);
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRoomSettings = createAsyncThunk(
  "room/updateRoomSettings",
  async ({ roomId, setting, value }, thunkAPI) => {
    try {
      const updates = {
        [`settings/${setting}`]: value
      };
      await update(ref(db, `rooms/${roomId}`), updates);
      return updates;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const resetAllSkipTurn = (roomId, playersList) => () => {
  const updates = {};
  playersList.forEach((player) => {
    updates[`rooms/${roomId}/players/${player}/skipTurn`] = false;
  });

  return update(ref(db), updates);
};


export const setPlayerSkipTurn = createAsyncThunk(
  "room/setPlayerSkipTurn",
  async ({ roomId, uid, skip }, thunkAPI) => {
    const playerRef = ref(db, `rooms/${roomId}/players/${uid}/skipTurn`);
    await set(playerRef, skip);
  }
);

export const updateTurnState = ({ roomId, turnState }) => async (dispatch) => {
  try {
    const turnRef = ref(db, `rooms/${roomId}/turnState`);
    await set(turnRef, turnState);
    dispatch(setTurnState(turnState));
  } catch (error) {
    console.error("Error updating turn data:", error);
  }
};

export const deleteRoom = createAsyncThunk(
  "rooms/deleteRoom",
  async ({ roomId }, thunkAPI) => {
    try {
      const roomRef = ref(db, `rooms/${roomId}`);
      await remove(roomRef);
      setRoom(null)
      return roomId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setRoom: (state, action) => {
      const { roomId, roomName, deckId, hostUid, password, settings, players = {}, } = action.payload;

      state.roomId = roomId;
      state.roomName = roomName;
      state.deckId = deckId || null;
      state.players = players;
      state.loading = false;
      state.error = null;
      state.joined = true;
      state.password = password || null;
      state.settings = settings;
      state.hostUid = hostUid
    },
    setTurnState: (state, action) => {
      state.turnState = action.payload;
    },
    clearRoom: (state) => {
      state.roomId = null;
      state.roomName = null;
      state.deckId = null;
      state.players = {};
      state.loading = false;
      state.error = null;
      state.joined = false;
      state.password = null;
    },

    setRoomLoading: (state, action) => {
      state.loading = action.payload ?? true;
      state.error = null;
    },

    setRoomError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },

  extraReducers: (builder) => {
  builder.addCase(updateRoomSettings.fulfilled, (state, action) => {
        const updates = action.payload;
        Object.entries(updates).forEach(([path, value]) => {
          const key = path.split("/")[1]; // 'faceUp', 'mode', etc.
          if (!state.settings) state.settings = {};
          state.settings[key] = value; // Will store the boolean
        });
      })
      .addCase(loadRoomRealtime.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRoomRealtime.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(loadRoomRealtime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addDeckToRoom.fulfilled, (state, action) => {
        if (action.payload?.deckId) {
          state.deckId = action.payload.deckId;
        }
      });
  },
});

export const {
  setRoom,
  setAllRoomData,
  clearRoom,
  setRoomLoading,
  setRoomError,
  setRoomSettings,
  setTurnState
} = roomSlice.actions;

export default roomSlice.reducer;
