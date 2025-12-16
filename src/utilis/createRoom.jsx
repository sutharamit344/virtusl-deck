import { ref, set } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { db } from "../firebase";

export const createRoom = async (roomname, user, password) => {
  const roomId = `room_${uuidv4().slice(0, 6)}`;

  const roomRef = ref(db, `rooms/${roomId}`);

  const now = Date.now();

  await set(roomRef, {
    roomId,
    roomName: roomname || roomId,
    createdAt: now,
    hostUid: user.uid,
    hostName: user.name,
    hostAvatar: user.avatar,
    password: password || null,
    players: {
      [user.uid]: {
        avatar: user.avatar,
        displayName: user.name || "Player",
        joinedAt: now,
        host: true,
      },
    },
    deck: null,
    settings: {
      password: "",
      table: {
        cardFace: {
          Stacked: {
            strict: false,
          },
          Stacked_hand: {
            strict: false,
          },
          undefined: {
            strict: false,
          },
          undefined_hand: {
            strict: false,
          },
        },
        mode: "Stacked",
        turn: {
          Stacked: "None",
          skip: "manual",
        },
      },
    },
  });

  return roomId;
};
