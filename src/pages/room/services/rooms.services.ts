import { createAsyncThunk } from "@reduxjs/toolkit";
import { get, push, ref, remove, serverTimestamp } from "firebase/database";
import { db } from "../../../firebase";

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

      // 🔹 Otherwise → remove only this user
      await remove(ref(db, `rooms/${roomId}/players/${userId}`));

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
