import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ref, get, onValue, update, set, remove } from "firebase/database";
import { db } from "../../firebase";
import {
  exitRoomSafely,
  findAllRooms,
  insertRoomHistory,
} from "./services/rooms.services";
import { AppUser } from "../../_hooks/useAuthWatcher";

export interface Player {
  uid: string;
  displayName: string;
  avatar: string | null;
  host: boolean;
  joinedAt: number;
  skipTurn?: boolean;
}

export interface TableZones {
  zone1: Record<string, boolean>;
  zone2: Record<string, boolean>;
  zone3: Record<string, boolean>;
  zone4: Record<string, boolean>;
}

export interface TableSettings {
  mode: string;
  skip: boolean | "manual" | "auto";
  turn: Record<string, string>;
  cardFace: {
    faceUp: boolean;
    current: boolean;
    [key: string]: any;
  };
  turnAccessEnabled: Record<string, boolean>;
  zones: TableZones;
}

export interface RoomSettings {
  mode: boolean;
  faceUp: boolean;
  table: TableSettings;
  private?: boolean;
  password?: string;
  allowSpectators?: boolean;
  shuffleOnJoin?: boolean;
  allowDuplicates?: boolean;
  allowDiscard?: boolean;
  enableLog?: boolean;
  showLogTop?: boolean;
  strict?: {
    card?: {
      cardFace: boolean;
    };
    cardDrag?: boolean;
  };
}

export interface RoomState {
  roomId: string | null;
  roomName: string | null;
  hostName: string | null;
  hostAvatar?: string | null;
  createdAt: string | null;
  deckId: string | null;
  players: Record<string, Player>;
  roomsList: RoomState[];
  loading: boolean;
  error: string | null;
  joined: boolean;
  password: string | null;
  hostUid: string;
  turnState: { current: string; next: string; prev: string };
  settings: RoomSettings;
  history: any[];
}

export const initialState: RoomState = {
  roomId: null,
  roomName: null,
  deckId: null,
  players: {},
  roomsList: [],
  loading: false,
  hostName: null,
  createdAt: null,
  error: null,
  joined: false,
  password: null,
  hostUid: "",
  history: [],
  turnState: { current: "", next: "", prev: "" },
  settings: {
    mode: true,
    faceUp: true,
    table: {
      skip: false,
      turnAccessEnabled: {},
      mode: "",
      turn: {},
      cardFace: { faceUp: true, current: true },
      zones: {
        zone1: {},
        zone2: {},
        zone3: {},
        zone4: {},
      },
    },
  },
};

export const loadRoomRealtime = createAsyncThunk<
  boolean,
  string,
  { rejectValue: string }
>("room/loadRoomRealtime", async (roomId, { dispatch, rejectWithValue }) => {
  try {
    const snapshot = await get(ref(db, `rooms/${roomId}`));
    if (!snapshot.exists()) return rejectWithValue("Room not found");

    const data = snapshot.val() as RoomState;
    dispatch(setRoom(data));

    onValue(ref(db, `rooms/${roomId}`), (snap) => {
      const liveData = snap.val() as RoomState | null;
      if (liveData) {
        dispatch(setRoom(liveData));
      } else {
        dispatch(clearRoom());
      }
    });

    return true;
  } catch (err) {
    const error = err as Error;
    return rejectWithValue(error.message);
  }
});

// ✍️ Update any room fields
interface UpdateRoomFieldsArgs {
  roomId: string;
  fields: { [key: string]: any };
}

export const updateRoomFields = createAsyncThunk<
  void,
  UpdateRoomFieldsArgs,
  { rejectValue: string }
>("room/updateRoomFields", async ({ roomId, fields }, thunkAPI) => {
  try {
    await update(ref(db, `rooms/${roomId}`), fields);
  } catch (error) {
    const err = error as Error;
    return thunkAPI.rejectWithValue(err.message);
  }
});

// 👥 Update players list
interface UpdateRoomPlayersArgs {
  roomId: string;
  players: { [uid: string]: Player };
}

export const updateRoomPlayers = createAsyncThunk<
  void,
  UpdateRoomPlayersArgs,
  { rejectValue: string }
>("room/updateRoomPlayers", async ({ roomId, players }, thunkAPI) => {
  try {
    await update(ref(db, `rooms/${roomId}/players`), players);
  } catch (error) {
    const err = error as Error;
    return thunkAPI.rejectWithValue(err.message);
  }
});

interface CollectCardsArgs {
  deckId: string;
  locationPath: string;
}

export const collectCards = createAsyncThunk(
  "room/collectDeck",
  async ({ deckId, locationPath }: CollectCardsArgs, thunkAPI) => {
    if (!deckId) return thunkAPI.rejectWithValue("Deck ID missing");
    try {
      const deck = await get(ref(db, `decks/${deckId}`));
      const deckSnap = await get(ref(db, `decks/${deckId}/cards`));
      if (!deckSnap.exists()) throw new Error("Deck not found or has no cards");

      const cards = deckSnap.val() as { [key: string]: any };
      const updates: { [key: string]: any } = {};
      let order = 0;

      for (const cardId in cards) {
        updates[`decks/${deckId}/cards/${cardId}/locationPath`] = locationPath;
        updates[`decks/${deckId}/cards/${cardId}/faceUp`] = false;
        updates[`decks/${deckId}/cards/${cardId}/hand`] = null;
        updates[`decks/${deckId}/cards/${cardId}/order`] = order++;
      }

      updates[`decks/${deckId}/reverseorder`] = false;
      updates[`decks/${deckId}/layout`] = false;
      updates[`decks/${deckId}/roomId`] = "";

      await update(ref(db), updates);

      await thunkAPI.dispatch(
        insertRoomHistory({
          roomId: deck.val().roomId,
          action: "Deck Removed",
          details: deckId,
        }),
      );

      return { deckId };
    } catch (error) {
      const err = error as Error;
      console.error("❌ Failed to add deck to room:", err.message);
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

interface AddDeckToRoomArgs {
  roomId: string;
  deckId: string;
  locationPath: string;
}
export const addDeckToRoom = createAsyncThunk<
  { roomId: string; deckId: string },
  AddDeckToRoomArgs,
  { rejectValue: string }
>("room/addDeckToRoom", async ({ roomId, deckId, locationPath }, thunkAPI) => {
  if (!roomId || !deckId) {
    return thunkAPI.rejectWithValue("Room ID or Deck ID missing");
  }

  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    const roomSnap = await get(roomRef);
    if (!roomSnap.exists()) {
      return thunkAPI.rejectWithValue("Room not found");
    }

    await update(roomRef, { deckId });

    const deckCardsRef = ref(db, `decks/${deckId}`);
    const deckSnap = await get(deckCardsRef);

    if (!deckSnap.exists()) {
      return thunkAPI.rejectWithValue("Deck not found or has no cards");
    }

    const deck = deckSnap.val() as Record<string, any>;
    const updates: Record<string, any> = {};

    for (const cardId in deck.cards) {
      updates[`decks/${deckId}/cards/${cardId}/locationPath`] = locationPath;
      updates[`decks/${deckId}/cards/${cardId}/faceUp`] = false;
      updates[`decks/${deckId}/cards/${cardId}/hand`] = null;
    }

    updates[`decks/${deckId}/reverseorder`] = false;
    updates[`decks/${deckId}/layout`] = false;
    updates[`decks/${deckId}/roomId`] = roomId;

    await update(ref(db), updates);

    await thunkAPI.dispatch(
      insertRoomHistory({
        roomId,
        action: "Deck added to room",
        details: deckId,
      }),
    );

    if (deck?.roomId) {
      await thunkAPI.dispatch(
        insertRoomHistory({
          roomId: deck.roomId,
          action: `Deck Moved`,
          details: `Deck Moved to ${deck.roomId}`,
        }),
      );
    }

    return { roomId, deckId };
  } catch (error) {
    const err = error as Error;
    console.error("❌ Failed to add deck to room:", err.message);
    return thunkAPI.rejectWithValue(err.message);
  }
});

interface JoinRoomArgs {
  roomId: string;
  user: AppUser;
}

export const joinRoom = createAsyncThunk<
  boolean,
  JoinRoomArgs,
  { rejectValue: string }
>("room/joinRoom", async ({ roomId, user }: JoinRoomArgs, thunkAPI) => {
  try {
    const playerData = {
      displayName: user.name,
      avatar: user.avatar || null,
      host: false,
      joinedAt: Date.now(),
    };

    await update(ref(db, `rooms/${roomId}/players/${user.uid}`), playerData);

    thunkAPI.dispatch(
      insertRoomHistory({
        roomId,
        action: "Player Joined",
        details: `${user.name} joined`,
      }),
    );
    return true;
  } catch (error) {
    const err = error as Error;
    return thunkAPI.rejectWithValue(err.message);
  }
});

interface UpdateRoomSettingsArgs {
  roomId: string;
  setting: string;
  value: any;
}

export const updateRoomSettings = createAsyncThunk<
  { [key: string]: any },
  UpdateRoomSettingsArgs,
  { rejectValue: string }
>(
  "room/updateRoomSettings",
  async ({ roomId, setting, value }: UpdateRoomSettingsArgs, thunkAPI) => {
    try {
      const updates = {
        [`settings/${setting}`]: value,
      };
      await update(ref(db, `rooms/${roomId}`), updates);
      return updates;
    } catch (error) {
      const err = error as Error;
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

interface ResetAllSkipTurnArgs {
  roomId: string;
  playersUid: any[];
}

export const resetAllSkipTurn =
  ({ roomId, playersUid }: ResetAllSkipTurnArgs) =>
  () => {
    const updates: { [key: string]: boolean } = {};
    playersUid.forEach((player) => {
      updates[`rooms/${roomId}/players/${player}/skipTurn`] = false;
    });

    return update(ref(db), updates);
  };

interface SetPlayerSkipTurnArgs {
  roomId: string;
  uid: string;
  skip: boolean;
}

export const setPlayerSkipTurn = createAsyncThunk<
  void,
  SetPlayerSkipTurnArgs,
  { rejectValue: string }
>(
  "room/setPlayerSkipTurn",
  async ({ roomId, uid, skip }: SetPlayerSkipTurnArgs, thunkAPI) => {
    const playerRef = ref(db, `rooms/${roomId}/players/${uid}/skipTurn`);
    await set(playerRef, skip);
  },
);

interface UpdateTurnStateArgs {
  roomId: string;
  turnState: { current: string; next: string; prev: string };
}

export const updateTurnState =
  ({ roomId, turnState }: UpdateTurnStateArgs) =>
  async (dispatch: any) => {
    try {
      const turnRef = ref(db, `rooms/${roomId}/turnState`);
      await set(turnRef, turnState);
      dispatch(setTurnState(turnState));
    } catch (error) {
      console.error("Error updating turn data:", error);
    }
  };

interface DeleteRoomArgs {
  roomId: string;
}

export const deleteRoom = createAsyncThunk<
  string,
  DeleteRoomArgs,
  { rejectValue: string }
>("rooms/deleteRoom", async ({ roomId }: DeleteRoomArgs, thunkAPI) => {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    await remove(roomRef);
    // Note: setRoom should be dispatched, not called directly
    return roomId;
  } catch (error) {
    const err = error as Error;
    return thunkAPI.rejectWithValue(err.message);
  }
});

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setRoom: (state, action: PayloadAction<RoomState>) => {
      const {
        roomId,
        roomName,
        deckId,
        hostUid,
        password,
        settings,
        players = {},
        history = [],
      } = action.payload;

      state.roomId = roomId;
      state.roomName = roomName;
      state.deckId = deckId || null;
      state.players = players;
      state.loading = false;
      state.error = null;
      state.joined = true;
      state.password = password;
      state.settings = settings || initialState.settings;
      state.hostUid = hostUid;
      state.history = history;
    },
    setTurnState: (
      state,
      action: PayloadAction<{ current: string; next: string; prev: string }>,
    ) => {
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
      state.hostUid = "";
      state.turnState = { current: "", next: "", prev: "" };
      state.settings = initialState.settings;
      state.history = [];
    },
    setRoomLoading: (state, action: PayloadAction<boolean | undefined>) => {
      state.loading = action.payload ?? true;
      state.error = null;
    },
    setRoomError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateRoomSettings.fulfilled, (state, action) => {
        const updates = action.payload;
        Object.entries(updates).forEach(([path, value]) => {
          const key: any = path.split("/")[1]; // 'faceUp', 'mode', etc.
          if (!state.settings) state.settings = initialState.settings;
          (state.settings as any)[key] = value; // Will store the boolean
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
        state.error = action.payload as string;
      })
      .addCase(addDeckToRoom.fulfilled, (state, action) => {
        if (action.payload?.deckId) {
          state.deckId = action.payload.deckId;
        }
      })
      .addCase(exitRoomSafely.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exitRoomSafely.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exitRoomSafely.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(findAllRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findAllRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.roomsList = action.payload as RoomState[];
      })
      .addCase(findAllRooms.rejected, (state, action) => {
        state.loading = false;
        state.roomsList = [];
        state.error = action.payload as string;
      });
  },
});

export const {
  setRoom,
  clearRoom,
  setRoomLoading,
  setRoomError,
  setTurnState,
} = roomSlice.actions;

export default roomSlice.reducer;
