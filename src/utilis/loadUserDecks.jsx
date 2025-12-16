// utils/loadUserDecks.js
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import { setDeckList } from "../redux/authSlice";

export const loadUserDecks = async (uid, dispatch) => {
  const deckRef = ref(db, "decks");
  const snapshot = await get(deckRef);

  if (snapshot.exists()) {
    const allDecks = snapshot.val();

    const userDecks = Object.entries(allDecks)
      .filter(([_, deck]) => deck.ownerUid === uid)
      .reduce((acc, [deckId, deck]) => {
        acc[deckId] = { deckId, ...deck };
        return acc;
      }, {});

    dispatch(setDeckList(userDecks));
  }
};
