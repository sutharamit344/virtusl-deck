import { get, onValue, ref, set, update } from "firebase/database";
import { db } from "../../../firebase";
import { Player, updateRoomSettings } from "../../room/roomSlice";
import { Card } from "../deckModal";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { DeckData, setDeck } from "../deckSlice";
import { insertRoomHistory } from "../../room/services/rooms.services";

export const getDeckRealtime = (
  deckId: string,
  onUpdate: (data: DeckData) => void,
) => {
  const deckRef = ref(db, `decks/${deckId}`);

  return onValue(deckRef, (snap) => {
    const data = snap.val() as DeckData;
    if (data) onUpdate(data);
  });
};

export const loadDeckWithRealtime = createAsyncThunk(
  "deck/loadDeckWithRealtime",
  async (deckId: string, { dispatch }) => {
    const deckRef = ref(db, `decks/${deckId}`);

    onValue(deckRef, (snap) => {
      const liveData = snap.val() as DeckData;
      if (!liveData) return;

      dispatch(setDeck(liveData));
    });

    return null;
  },
);

interface TogglePileDirectionArgs {
  deckId: string;
  locationPath: string;
  pile: any;
}

export const togglePileDirection = createAsyncThunk<
  {
    reverseorder: { [locationPath: string]: boolean };
    cards: { [key: string]: Card };
  },
  TogglePileDirectionArgs,
  { rejectValue: string }
>(
  "deck/togglePileDirection",
  async ({ deckId, locationPath, pile }, thunkAPI) => {
    try {
      const reverseOrderSnap = await get(
        ref(db, `decks/${deckId}/reverseorder/${locationPath}`),
      );
      const isCurrentlyReversed = reverseOrderSnap.exists()
        ? reverseOrderSnap.val()
        : false;
      const newDirection = !isCurrentlyReversed;

      const reversedCards = [...pile].reverse().map((card, index) => ({
        ...card,
        order: index,
        faceUp: !card.faceUp,
      }));

      const updates: { [path: string]: any } = {
        [`reverseorder/${locationPath}`]: newDirection,
      };

      reversedCards.forEach((card) => {
        updates[`cards/${card.id}`] = card;
      });

      await update(ref(db, `decks/${deckId}`), updates);

      return {
        reverseorder: { [locationPath]: newDirection },
        cards: reversedCards.reduce(
          (acc, card) => {
            acc[card.id] = card;
            return acc;
          },
          {} as { [key: string]: Card },
        ),
      };
    } catch (error) {
      const err = error as Error;
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

interface ShuffleDeckArgs {
  deckId: string;
  pile: any;
  type: "fisher" | "riffle" | "pile";
  locationPath: string;
}

export const shuffleDeck = createAsyncThunk(
  "deck/shuffleDeck",
  async ({ deckId, pile, type, locationPath }: ShuffleDeckArgs, thunkAPI) => {
    try {
      thunkAPI.dispatch(
        insertRoomHistory({
          roomId: locationPath.split("-")[0],
          action: "Shuffle Started",
          details: `${type}`,
        }),
      );
      const cardList = Object.values(pile);

      await set(ref(db, `decks/${deckId}/isShuffling/${locationPath}`), {
        type,
        startedAt: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      let shuffled: Card[] = [];

      if (type === "fisher") shuffled = fisherYatesShuffle(cardList);
      else if (type === "riffle") shuffled = riffleShuffle(cardList);
      else if (type === "pile") shuffled = pileShuffle(cardList);

      const updatedCards = Object.fromEntries(
        shuffled.map((card, i) => [card.id, { ...card, order: i }]),
      );

      await update(ref(db, `decks/${deckId}/cards`), updatedCards);

      setTimeout(() => {
        set(ref(db, `decks/${deckId}/isShuffling/${locationPath}`), null);
      }, 1000);

      thunkAPI.dispatch(
        insertRoomHistory({
          roomId: pile[0]?.locationPath?.split("-")[0] || "unknown",
          action: "Shuffle Completed",
          details: `${type}`,
        }),
      );

      return updatedCards;
    } catch (error) {
      const err = error as Error;
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

interface ShuffleAllOnceArgs {
  deckId: string;
  pile: any;
  locationPath: string;
  roomId: string;
}

export const shuffleAllOnce = createAsyncThunk<
  { [key: string]: Card },
  ShuffleAllOnceArgs,
  { rejectValue: string }
>(
  "deck/shuffleAllOnce",
  async ({ deckId, pile, locationPath, roomId }, thunkAPI) => {
    try {
      const deck = Object.values(pile);

      thunkAPI.dispatch(
        insertRoomHistory({
          roomId,
          action: "Shuffle Started",
          details: "Shuffle All Once",
        }),
      );

      await set(ref(db, `decks/${deckId}/isShuffling/${locationPath}`), {
        type: "shuffleAllOnce",
        startedAt: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const shuffled = pileShuffle(riffleShuffle(fisherYatesShuffle(deck)));

      const updatedCards = Object.fromEntries(
        shuffled.map((card, i) => [card.id, { ...card, order: i }]),
      );

      await update(ref(db, `decks/${deckId}/cards`), updatedCards);

      setTimeout(() => {
        set(ref(db, `decks/${deckId}/isShuffling/${locationPath}`), false);
      }, 1000);

      thunkAPI.dispatch(
        insertRoomHistory({
          roomId,
          action: "Shuffle Completed",
          details: "Shuffle All Once",
        }),
      );

      return updatedCards;
    } catch (error) {
      const err = error as Error;
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

function fisherYatesShuffle(deck: any[]): Card[] {
  const array: any = [...deck];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function riffleShuffle(deck: any[]): Card[] {
  const half = Math.floor(deck.length / 2);
  const left = deck.slice(0, half);
  const right = deck.slice(half);
  const result: Card[] = [];
  while (left.length || right.length) {
    if (Math.random() > 0.5 && left.length) result.push(left.shift()!);
    if (right.length) result.push(right.shift()!);
  }
  return result;
}

function pileShuffle(deck: any[], piles: any = 5): Card[] {
  const pileArray: any = Array.from({ length: piles }, () => []);
  for (let i: any = 0; i < deck.length; i++) {
    pileArray[i % piles].push(deck[i]);
  }
  return pileArray.sort(() => Math.random() - 0.5).flat();
}

export const resetDeckInFirebase = createAsyncThunk(
  "deck/resetDeckInFirebase",
  async ({ deckId }: { deckId: string }, thunkAPI) => {
    try {
      const deckRef = ref(db, `decks/${deckId}`);
      const deckSnap = await get(deckRef);

      if (!deckSnap.exists()) {
        console.error("❌ Deck not found:", deckId);
        return thunkAPI.rejectWithValue("Deck not found.");
      }

      const currentDeck = deckSnap.val() as DeckData;

      if (currentDeck.product_id === undefined) {
        console.error(
          "❌ Deck does not contain product_id to reset from template.",
        );
        return thunkAPI.rejectWithValue("Deck is missing product_id.");
      }

      const templateRef = ref(db, `deckstore/${currentDeck.product_id}`);
      const templateSnap = await get(templateRef);

      if (!templateSnap.exists()) {
        console.error(
          "❌ Template not found in deckstore:",
          currentDeck.product_id,
        );
        return thunkAPI.rejectWithValue("Deck template not found.");
      }

      const templateDeck = templateSnap.val() as DeckData;

      await update(deckRef, {
        cards: templateDeck.cards,
        reverseorder: {},
        layout: {
          slide: {},
          fanCircle: {},
        },
        roomId: "",
      });

      const updatedCardsArray = Object.values(templateDeck.cards || {}).sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      );

      console.log(
        `✅ Replaced cards in deck ${deckId} using template ${currentDeck.product_id}`,
      );
      return updatedCardsArray;
    } catch (error) {
      const err = error as Error;
      console.error("❌ Failed to reset deck:", err.message);
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

interface UpdateCardArgs {
  deckId: string;
  cardId: string;
  updatedFields: Partial<Card>;
  cards?: { [key: string]: Card };
}

export const updateCardInDeck = createAsyncThunk(
  "deck/updateCard",
  async ({ deckId, cardId, updatedFields }: UpdateCardArgs) => {
    await update(ref(db, `decks/${deckId}/cards/${cardId}`), updatedFields);
  },
);

interface UpdateAllCardsArgs {
  deckId: string;
  updatedCards: Record<string, Card>;
}

export const updateAllCards = createAsyncThunk(
  "deck/updateAllCards",
  async ({ deckId, updatedCards }: UpdateAllCardsArgs, thunkAPI) => {
    try {
      await update(ref(db, `decks/${deckId}/cards`), updatedCards);
      return updatedCards;
    } catch (error) {
      const err = error as Error;
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

interface HandleLayoutArgs {
  deckId: string;
  layout: "slide" | "fanCircle";
  locationPath: string;
}

export const handleLayout = createAsyncThunk<
  { layout: string; locationPath: string; newLayout: boolean },
  HandleLayoutArgs,
  { rejectValue: string }
>("deck/handleLayout", async ({ deckId, layout, locationPath }, thunkAPI) => {
  try {
    const layoutRef = ref(
      db,
      `decks/${deckId}/layout/${layout}/${locationPath}`,
    );
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
    const err = error as Error;
    return thunkAPI.rejectWithValue(err.message);
  }
});

interface UpdateDeckArgs {
  deckId: string;
  updates: Partial<DeckData>;
}

export const updateDeck = createAsyncThunk<
  { deckId: string; updates: Partial<DeckData> },
  UpdateDeckArgs,
  { rejectValue: string }
>("deck/updateDeck", async ({ deckId, updates }, thunkAPI) => {
  try {
    await update(ref(db, `decks/${deckId}`), updates);

    return { deckId, updates };
  } catch (error) {
    const err = error as Error;
    return thunkAPI.rejectWithValue(err.message);
  }
});

interface DistributeCardsArgs {
  roomId: string;
  deckId: string;
  pile: any[];
  playersList: Player[];
  settings: { table: any };
  faceUp?: boolean;
}

export const distributeCards = createAsyncThunk(
  "deck/distributeCards",
  async (
    {
      roomId,
      deckId,
      pile,
      playersList,
      settings,
      faceUp = false,
    }: DistributeCardsArgs,
    thunkAPI,
  ) => {
    try {
      thunkAPI.dispatch(
        insertRoomHistory({
          roomId,
          action: "Distribute Cards",
          details: `Distributing ${pile.length} cards to ${playersList.length} players`,
        }),
      );

      const deck = Object.values(pile).sort((a, b) => a.order - b.order);

      const updates: Record<string, any> = {
        isDistributing: true,
        distributed: true,
      };

      const orderByLocation: Record<string, number> = {};

      while (deck.length > 0) {
        for (const player of playersList) {
          const card = deck.pop();
          if (!card) break;
          const hand = player.uid;
          const locationPath = `${roomId}-${hand}-hand-pile`;

          if (orderByLocation[locationPath] === undefined) {
            orderByLocation[locationPath] = 0;
          }

          updates[`cards/${card.id}`] = {
            ...card,
            locationPath,
            order: orderByLocation[locationPath]++,
            faceUp,
            hand,
          };
        }
      }

      await update(ref(db, `decks/${deckId}`), updates);

      // Async cleanup: Clear isDistributing in the database after 3 seconds of client-side animation
      setTimeout(() => {
        update(ref(db, `decks/${deckId}`), { isDistributing: false }).catch((err) =>
          console.error("Failed to reset isDistributing:", err)
        );
      }, 3000);

      thunkAPI.dispatch(
        updateRoomSettings({
          roomId,
          setting: "table",
          value: {
            ...settings.table,

            mode: "Circular",
          },
        }),
      );

      const cardCounts = Object.values(updates).reduce(
        (acc: any, card) => {
          if (card && typeof card === "object" && card.hand) {
            if (!acc[card.hand]) acc[card.hand] = 0;
            acc[card.hand]++;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      thunkAPI.dispatch(
        insertRoomHistory({
          roomId,
          action: "Cards Distributed",
          details: `${Object.entries(cardCounts)
            .map(
              ([hand, count]) =>
                `${playersList.find((p) => p.uid === hand)?.displayName || hand} (${count} cards)`,
            )
            .join(", ")}`,
        }),
      );

      return updates;
    } catch (error) {
      const err = error as Error;
      await update(ref(db, `decks/${deckId}`), { isDistributing: false });
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);
