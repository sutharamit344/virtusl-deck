import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  get,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { db } from "../../../firebase";
import { RoomState } from "../roomSlice";

export const subscribeRoomRealtime = (
  roomId: string,
  onUpdate: (data: RoomState | null) => void,
  onError?: (error: Error) => void,
) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  return onValue(
    roomRef,
    (snap) => {
      onUpdate(snap.val() as RoomState | null);
    },
    (err) => {
      if (onError) onError(err);
    },
  );
};

export const setupPlayerPresence = (roomId: string, userId: string) => {
  const connectedRef = ref(db, ".info/connected");
  const playerOnlineRef = ref(db, `rooms/${roomId}/players/${userId}/online`);
  const playerLastSeenRef = ref(
    db,
    `rooms/${roomId}/players/${userId}/lastSeen`,
  );

  const unsub = onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      onDisconnect(playerOnlineRef).set(false);
      onDisconnect(playerLastSeenRef).set(serverTimestamp());

      set(playerOnlineRef, true);
      set(playerLastSeenRef, serverTimestamp());
    }
  });

  return () => {
    unsub();
    set(playerOnlineRef, false);
    set(playerLastSeenRef, serverTimestamp());
  };
};

export const insertRoomHistory = createAsyncThunk(
  "room/insertRoomHistory",
  async (historyData: any, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const user = state.auth.user;

      const historyRef = ref(db, `rooms/${historyData.roomId}/history`);

      await push(historyRef, {
        ...historyData,
        createdBy: user?.name || "system",
        timestamp: serverTimestamp(),
      });
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const findAllRooms = createAsyncThunk(
  "room/findAllRooms",
  async ({ uid }: { uid?: string }, { rejectWithValue }) => {
    try {
      const snapshot = await get(ref(db, "rooms"));

      if (!snapshot.exists()) return [];

      const data = snapshot.val();

      const roomsArray = Object.entries(data).map(
        ([id, value]: [string, any]) => ({
          id,
          ...value,
        }),
      );

      if (uid) {
        return roomsArray.filter(
          (room) => room.hostUid === uid || (room.players && room.players[uid]),
        );
      }

      return roomsArray;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const exitRoomSafely = createAsyncThunk(
  "room/exitRoomSafely",
  async (
    {
      roomId,
      userId,
    }: {
      roomId: string;
      userId: string;
    },
    { rejectWithValue },
  ) => {
    try {
      if (!roomId || !userId) {
        throw new Error("Room ID and User ID are required");
      }

      const roomRef = ref(db, `rooms/${roomId}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        throw new Error("Room does not exist");
      }

      const roomData = snapshot.val();
      const players = roomData.players || {};

      const playerIds = Object.keys(players);

      // 🔹 If last user → delete entire room
      if (playerIds.length <= 1) {
        await remove(roomRef);
        return {
          roomId,
          deleted: true,
        };
      }

      // 🔹 Otherwise → remove this user and transfer host if necessary
      const updates: Record<string, any> = {
        [`rooms/${roomId}/players/${userId}`]: null,
      };

      if (roomData.hostUid === userId) {
        const remainingPlayerIds = playerIds.filter((id) => id !== userId);
        const nextHostUid = remainingPlayerIds[0];
        if (nextHostUid) {
          updates[`rooms/${roomId}/hostUid`] = nextHostUid;
          updates[`rooms/${roomId}/hostName`] =
            players[nextHostUid]?.displayName || "Host";
          updates[`rooms/${roomId}/players/${nextHostUid}/host`] = true;
        }
      }

      await update(ref(db), updates);

      return {
        roomId,
        userId,
        deleted: false,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);
