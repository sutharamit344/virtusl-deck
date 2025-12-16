import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ref, get, onValue, update, set } from "firebase/database";
import { db } from "../firebase";

const initialState = {
  deckId: null,
  cards: {},
  loading: false,
  error: null,
  reverseorder: {},
  layout: {
    slide: {},
    fanCircle: {},
  },
};

// function generateUnoDeck() {
//   const colors = ["Red", "Green", "Blue", "Yellow"];
//   const cards = {};
//   let idCount = 0;

//   // Number + Action cards for each color
//   colors.forEach((color) => {
//     // 1 zero card per color
//     const id = `0${color[0]}`;
//     cards[id] = {
//       id,
//       type: "number",
//       color,
//       number: 0,
//       faceUp: false,
//       locationPath: "table/pile"
//     };

//     // 2 cards each for 1–9
//     for (let n = 1; n <= 9; n++) {
//       for (let i = 1; i <= 2; i++) {
//         const cid = `${n}${color[0]}${i}`;
//         cards[cid] = {
//           id: cid,
//           type: "number",
//           color,
//           number: n,
//           faceUp: false,
//           locationPath: "table/pile"
//         };
//       }
//     }

//     // 2 Skip, 2 Reverse, 2 Draw Two
//     const actions = [
//       { type: "skip", label: "Skip" },
//       { type: "reverse", label: "Reverse" },
//       { type: "draw2", label: "+2" },
//     ];

//     actions.forEach(({ type, label }) => {
//       for (let i = 1; i <= 2; i++) {
//         const aid = `${type}${color[0]}${i}`;
//         cards[aid] = {
//           id: aid,
//           type,
//           color,
//           label,
//           faceUp: false,
//           locationPath: "table/pile"
//         };
//       }
//     });
//   });

//   // 4 Wild and 4 Wild Draw Four
//   const wilds = [
//     { type: "wild", label: "Wild" },
//     { type: "wildDraw4", label: "+4" },
//   ];

//   wilds.forEach(({ type, label }) => {
//     for (let i = 1; i <= 4; i++) {
//       const wid = `${type}${i}`;
//       cards[wid] = {
//         id: wid,
//         type,
//         color: "Black",
//         label,
//         faceUp: false,
//         locationPath: "table/pile"
//       };
//     }
//   });

//   return cards;
// }



// await update(ref(db, "deckstore/aefda"), {
//   cards: generateUnoDeck()
// });


export const loadDeckWithRealtime = createAsyncThunk(
  "deck/loadDeckWithRealtime",
  async (deckId, { dispatch, rejectWithValue }) => {
    try {
      const snapshot = await get(ref(db, `decks/${deckId}`));
      if (!snapshot.exists()) return rejectWithValue("Deck not found");

      const data = snapshot.val();
      dispatch(setDeck({ deckId, ...data }));

      onValue(ref(db, `decks/${deckId}`), async (snap) => {
        const liveData = snap.val();
        if (!liveData) return;

        const cardsObj = liveData.cards || {};
        const cardsArray = Object.values(cardsObj);

        const grouped = {};
        cardsArray.forEach((card) => {
          const loc = card.locationPath || "__default__";
          if (!grouped[loc]) grouped[loc] = [];
          grouped[loc].push(card);
        });

        const updates = {};
        const finalCards = [];

        for (const [loc, group] of Object.entries(grouped)) {
          const sorted = group.sort((a, b) => a.order - b.order);
          sorted.forEach((card, index) => {
            const updatedCard = { ...card, order: index };
            finalCards.push(updatedCard);
            updates[`cards/${card.id}/order`] = index;
          });
        }

        await update(ref(db, `decks/${deckId}`), updates);

        liveData.cards = finalCards.reduce((acc, card) => {
          acc[card.id] = card;
          return acc;
        }, {});

        dispatch(setDeck({ deckId, ...liveData }));
        dispatch(setCards(finalCards));
      });

      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const togglePileDirection = createAsyncThunk(
  "deck/togglePileDirection",
  async ({ deckId, locationPath, pile }, thunkAPI) => {
    try {
      const reverseOrderSnap = await get(ref(db, `decks/${deckId}/reverseorder/${locationPath}`));
      const isCurrentlyReversed = reverseOrderSnap.exists() ? reverseOrderSnap.val() : false;
      const newDirection = !isCurrentlyReversed;

      const reversedCards = [...pile]
        .reverse()
        .map((card, index) => ({
          ...card,
          order: index,
          faceUp: !card.faceUp,
        }));

      const updates = {
        [`reverseorder/${locationPath}`]: newDirection,
      };

      reversedCards.forEach((card) => {
        updates[`cards/${card.id}`] = card;
      });

      await update(ref(db, `decks/${deckId}`), updates);

      return {
        reverseorder: { [locationPath]: newDirection },
        cards: reversedCards.reduce((acc, card) => {
          acc[card.id] = card;
          return acc;
        }, {}),
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);


export const shuffleDeck = createAsyncThunk(
  "deck/shuffleDeck",
  async ({ deckId, pile, type, locationPath }, thunkAPI) => {
    try {
      const cardList = Object.values(pile);

      await set(ref(db, `decks/${deckId}/isShuffling/${locationPath}`), {
        type,
        startedAt: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      let shuffled = [];

      if (type === "fisher") shuffled = fisherYatesShuffle(cardList);
      else if (type === "riffle") shuffled = riffleShuffle(cardList);
      else if (type === "pile") shuffled = pileShuffle(cardList);

      const updatedCards = Object.fromEntries(
        shuffled.map((card, i) => [ card.id, { ...card, order: i, }, ])
      );

      await update(ref(db, `decks/${deckId}/cards`), updatedCards);

       setTimeout(() => {
        set(ref(db, `decks/${deckId}/isShuffling/${locationPath}`), null);
      }, 1000);

      return updatedCards;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const shuffleAllOnce = createAsyncThunk(
  "deck/shuffleAllOnce",
    async ({ deckId, pile, locationPath }, thunkAPI) => {
    try {
      const deck = Object.values(pile);

      await set(ref(db, `decks/${deckId}/isShuffling/${locationPath}`), {
        type:"shuffleAllOnce",
        startedAt: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const shuffled = pileShuffle(riffleShuffle(fisherYatesShuffle(deck)));

      const updatedCards = Object.fromEntries(
        shuffled.map((card, i) => [ card.id, { ...card, order: i, }, ])
      );

      await update(ref(db, `decks/${deckId}/cards`), updatedCards);

       setTimeout(() => {
        set(ref(db, `decks/${deckId}/isShuffling/${locationPath}`), false);
      }, 1000);

      return updatedCards;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);


function fisherYatesShuffle(deck) {
  const array = [...deck];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function riffleShuffle(deck) {
  const half = Math.floor(deck.length / 2);
  const left = deck.slice(0, half);
  const right = deck.slice(half);
  const result = [];
  while (left.length || right.length) {
    if (Math.random() > 0.5 && left.length) result.push(left.shift());
    if (right.length) result.push(right.shift());
  }
  return result;
}

function pileShuffle(deck, piles = 5) {
  const pileArray = Array.from({ length: piles }, () => []);
  for (let i = 0; i < deck.length; i++) {
    pileArray[i % piles].push(deck[i]);
  }
  return pileArray.sort(() => Math.random() - 0.5).flat();
}

export const resetDeckInFirebase = createAsyncThunk(
  "deck/resetDeckInFirebase",
  async ({ deckId }, thunkAPI) => { try {
      const deckRef = ref(db, `decks/${deckId}`);
      const deckSnap = await get(deckRef);

      if (!deckSnap.exists()) {
        console.error("❌ Deck not found:", deckId);
        return thunkAPI.rejectWithValue("Deck not found.");
      }

      const currentDeck = deckSnap.val();

      if (currentDeck.product_id === undefined) {
        console.error("❌ Deck does not contain product_id to reset from template.");
        return thunkAPI.rejectWithValue("Deck is missing product_id.");
      }

      const templateRef = ref(db, `deckstore/${currentDeck.product_id}`);
      const templateSnap = await get(templateRef);

      if (!templateSnap.exists()) {
        console.error("❌ Template not found in deckstore:", currentDeck.product_id);
        return thunkAPI.rejectWithValue("Deck template not found.");
      }

      const templateDeck = templateSnap.val();

      await update(deckRef, {
        cards: templateDeck.cards,
        reverseorder: {},
        layout: {
          slide: {},
          fanCircle: {},
        },
        roomId:""
      });

      const updatedCardsArray = Object.values(templateDeck.cards || {}).sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );

      console.log(`✅ Replaced cards in deck ${deckId} using template ${currentDeck.product_id}`);
      return updatedCardsArray;
    } catch (error) {
      console.error("❌ Failed to reset deck:", error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateCardInDeck = createAsyncThunk(
  "deck/updateCard",
  async ({ deckId, cardId, updatedFields, cards }) => {
    await update(ref(db, `decks/${deckId}/cards/${cardId}`), updatedFields);
  }
);

export const updateAllCards = createAsyncThunk(
  "deck/updateAllCards",
  async ({ deckId, updatedCards }, thunkAPI) => {
    try {
      await update(ref(db, `decks/${deckId}/cards`), updatedCards);
      return updatedCards;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const handleLayout = createAsyncThunk(
  "deck/handleLayout",
  async ({ deckId, layout, locationPath }, thunkAPI) => {
    try {
      const layoutRef = ref(db, `decks/${deckId}/layout/${layout}/${locationPath}`);
      const layoutSnap = await get(layoutRef);
      const isCurrentLayout = layoutSnap.exists() ? layoutSnap.val() : false;

      const newLayout = !isCurrentLayout;

      // If newLayout is false, remove the locationPath key
        await update(ref(db, `decks/${deckId}/layout/${layout}`), {
          [locationPath]: newLayout,
        });

      return {
        layout,
        locationPath,
        newLayout,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const distributeCards = createAsyncThunk(
  "deck/distributeCards",
  async ({ roomId, deckId, pile, playersUid, faceUp = false }, thunkAPI) => {
    try {
      const deck = Object.values(pile).sort((a, b) => a.order - b.order);
      await update(ref(db, `decks/${deckId}`), { isDistributing: true });
      await update(ref(db, `decks/${deckId}`), { distributed: true });

      const updates = {};
      let order = 0;

      while (deck.length > 0) {
        for (let hand of playersUid) {
          const card = deck.pop();
          if (!card) break;

          updates[`cards/${card.id}`] = {
            ...card,
            locationPath: `${roomId}-${hand}-hand-pile`,
            order: order++,
            faceUp,
            hand
          };

          await new Promise((res) => setTimeout(res, 150));
        }
      }

      await update(ref(db, `decks/${deckId}`), updates);
      await update(ref(db, `decks/${deckId}`), { isDistributing: false });

      return updates;
    } catch (error) {
      await update(ref(db, `decks/${deckId}`), { isDistributing: false });
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);



const deckSlice = createSlice({
  name: "deck",
  initialState,
  reducers: {
    setDeck: (state, action) => {
      state.deckId = action.payload.deckId;
      state.back = action.payload.back || "/deck_standard_52.jpg";
      state.reverseorder = action.payload.reverseorder || false;
      state.layout = action.payload.layout || false;
      state.isShuffling = action.payload.isShuffling ?? null;
      state.isDistributing = action.payload.isDistributing ?? false;
      state.deckAccess = action.payload.deckAccess || action.payload.ownerUid
      state.deckInRoom = action.payload.roomId || null
    },
    setCards: (state, action) => {
      state.cards = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(shuffleDeck.fulfilled, (state, action) => {
        state.cards = action.payload;
      })
      .addCase(shuffleAllOnce.fulfilled, (state, action) => {
        state.cards = action.payload;
      })
      .addCase(resetDeckInFirebase.fulfilled, (state, action) => {
        state.cards = action.payload;
      })
      .addCase(loadDeckWithRealtime.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDeckWithRealtime.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(loadDeckWithRealtime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setDeck,
  setCards
} = deckSlice.actions;

export default deckSlice.reducer;
