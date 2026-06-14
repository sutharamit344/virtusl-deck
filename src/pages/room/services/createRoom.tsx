import { ref, set } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../../firebase";

type User = {
  uid: string;
  name?: string;
  avatar?: string;
};

export async function createRoom(
  roomName: string | undefined,
  user: User,
  password?: string,
) {
  if (!user?.uid) {
    throw new Error("User is required to create a room");
  }

  const roomId = `room_${uuidv4().slice(0, 6)}`;
  const now = Date.now();

  const roomRef = ref(db, `rooms/${roomId}`);

  await set(roomRef, {
    roomId,
    roomName: roomName?.trim() || roomId,
    createdAt: now,

    hostUid: user.uid,
    hostName: user.name || "Host",
    hostAvatar: user.avatar || null,

    password: password || "",

    players: {
      [user.uid]: {
        avatar: user.avatar || null,
        displayName: user.name || "Player",
        joinedAt: now,
        host: true,
      },
    },

    deckId: null,

    settings: {
      table: {
        mode: "Stacked",

        cardFace: {
          Stacked: { strict: false },
          Stacked_hand: { strict: false },
        },

        turn: {
          Stacked: "None",
          skip: "manual",
        },

        zones: {
          zone1: {},
          zone2: {},
          zone3: {},
          zone4: {},
        },
      },
    },
  });

  return roomId;
}
