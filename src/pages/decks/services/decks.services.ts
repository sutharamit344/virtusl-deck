import { get, onValue, ref, runTransaction, set, update } from "firebase/database";
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

export function fisherYatesShuffle(deck: any[]): Card[] {
  const array: any = [...deck];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function riffleShuffle(deck: any[]): Card[] {
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

export function pileShuffle(deck: any[], piles: any = 5): Card[] {
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

export interface MoveCardAtomicArgs {
  deckId: string;
  cardId: string;
  expectedOldLocation: string;
  newLocation: string;
  newOrder: number;
  hand?: string | null;
}

export const moveCardAtomic = createAsyncThunk<
  Card,
  MoveCardAtomicArgs,
  { rejectValue: string }
>(
  "deck/moveCardAtomic",
  async (
    { deckId, cardId, expectedOldLocation, newLocation, newOrder, hand },
    thunkAPI,
  ) => {
    try {
      const cardRef = ref(db, `decks/${deckId}/cards/${cardId}`);
      const txResult = await runTransaction(cardRef, (current: Card | null) => {
        if (!current) return current;
        // Verify card is still at the location user dragged from (prevents concurrent overwrite / race conditions)
        if (current.locationPath !== expectedOldLocation) {
          return; // Aborts transaction
        }
        return {
          ...current,
          locationPath: newLocation,
          order: newOrder,
          hand: hand !== undefined ? hand : current.hand || null,
        };
      });

      if (!txResult.committed || !txResult.snapshot.exists()) {
        return thunkAPI.rejectWithValue(
          "Move rejected: Card was already moved or does not exist",
        );
      }

      return txResult.snapshot.val() as Card;
    } catch (error) {
      const err = error as Error;
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export interface MovePileAtomicArgs {
  deckId: string;
  cardIds: string[];
  expectedOldLocation: string;
  newLocation: string;
  startingOrder: number;
}

export const movePileAtomic = createAsyncThunk<
  { cardIds: string[]; newLocation: string },
  MovePileAtomicArgs,
  { rejectValue: string }
>(
  "deck/movePileAtomic",
  async (
    { deckId, cardIds, expectedOldLocation, newLocation, startingOrder },
    thunkAPI,
  ) => {
    try {
      const updates: Record<string, any> = {};
      cardIds.forEach((cardId, index) => {
        updates[`decks/${deckId}/cards/${cardId}/locationPath`] = newLocation;
        updates[`decks/${deckId}/cards/${cardId}/order`] = startingOrder + index;
      });

      await update(ref(db), updates);
      return { cardIds, newLocation };
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
  settings: {
    table: any;
    distribution?: {
      random?: boolean;
      cardsPerRound?: number;
    };
    [key: string]: any;
  };
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
      const isRandom = Boolean(settings?.distribution?.random);
      const totalCards = pile.length;
      const numPlayers = Math.max(1, playersList.length);

      // Integer division without decimal numbers
      const baseCount = Math.floor(totalCards / numPlayers);
      const remainder = totalCards % numPlayers;

      // Default count is cards/players properly without decimal numbers
      const cardsPerRound = Math.max(
        1,
        settings?.distribution?.cardsPerRound ?? baseCount,
      );

      // Quotas per player: last player takes remaining cards so all cards are cleanly distributed
      const playerQuotas: Record<string, number> = {};
      playersList.forEach((p, idx) => {
        playerQuotas[p.uid] =
          idx === playersList.length - 1 ? baseCount + remainder : baseCount;
      });

      thunkAPI.dispatch(
        insertRoomHistory({
          roomId,
          action: "Distribute Cards",
          details: isRandom
            ? `Distributing ${totalCards} cards randomly among ${numPlayers} players (${baseCount} each, ${baseCount + remainder} to last player)`
            : `Distributing ${totalCards} cards in sets of ${cardsPerRound} among ${numPlayers} players (${baseCount} each, ${baseCount + remainder} to last player)`,
        }),
      );

      // Phase 1: Signal distribution start in database so all clients trigger dealing animation & action blocker
      await update(ref(db, `decks/${deckId}`), {
        isDistributing: true,
        distributionConfig: {
          random: isRandom,
          cardsPerRound,
        },
      });

      // Phase 2: Allow dealing & stacking animation to play across all connected screens (~2200ms)
      await new Promise((resolve) => setTimeout(resolve, 2200));

      // Phase 3: Assign cards into players' hands and finalize distribution
      let deck = Object.values(pile).sort((a, b) => a.order - b.order);

      if (isRandom) {
        deck = fisherYatesShuffle(deck);
      }

      const updates: Record<string, any> = {
        isDistributing: false,
        distributed: true,
        distributionConfig: null,
      };

      const orderByLocation: Record<string, number> = {};
      const cardsDealtCount: Record<string, number> = {};
      playersList.forEach((p) => {
        cardsDealtCount[p.uid] = 0;
      });

      if (isRandom) {
        // Random distribution: assign cards from the shuffled deck according to quotas
        for (let i = 0; i < playersList.length; i++) {
          const player = playersList[i]!;
          const quota = playerQuotas[player.uid] ?? baseCount;
          const hand = player.uid;
          const locationPath = `${roomId}-${hand}-hand-pile`;

          if (orderByLocation[locationPath] === undefined) {
            orderByLocation[locationPath] = 0;
          }

          for (let c = 0; c < quota; c++) {
            const card = deck.pop();
            if (!card) break;

            updates[`cards/${card.id}`] = {
              ...card,
              locationPath,
              order: orderByLocation[locationPath]++,
              faceUp,
              hand,
            };
            cardsDealtCount[player.uid] = (cardsDealtCount[player.uid] ?? 0) + 1;
          }
        }
      } else {
        // Distribute by set (cardsPerRound round-robin):
        // Each player receives cardsPerRound cards per round until their quota is filled
        while (
          deck.length > 0 &&
          playersList.some(
            (p) =>
              (cardsDealtCount[p.uid] ?? 0) <
              (playerQuotas[p.uid] ?? baseCount),
          )
        ) {
          for (let i = 0; i < playersList.length; i++) {
            const player = playersList[i]!;
            if (deck.length === 0) break;
            const quota = playerQuotas[player.uid] ?? baseCount;
            const current = cardsDealtCount[player.uid] ?? 0;
            if (current >= quota) continue;

            const remainingNeeded = quota - current;
            const toDeal = Math.min(cardsPerRound, deck.length, remainingNeeded);

            const hand = player.uid;
            const locationPath = `${roomId}-${hand}-hand-pile`;

            if (orderByLocation[locationPath] === undefined) {
              orderByLocation[locationPath] = 0;
            }

            for (let b = 0; b < toDeal; b++) {
              const card = deck.pop();
              if (!card) break;

              updates[`cards/${card.id}`] = {
                ...card,
                locationPath,
                order: orderByLocation[locationPath]++,
                faceUp,
                hand,
              };
              cardsDealtCount[player.uid] =
                (cardsDealtCount[player.uid] ?? 0) + 1;
            }
          }
        }
      }

      await update(ref(db, `decks/${deckId}`), updates);

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

      const totalDealt = Object.values(cardCounts).reduce(
        (a: number, b: any) => a + Number(b),
        0,
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
            .join(", ")} (${totalDealt} total)`,
        }),
      );

      return updates;
    } catch (error) {
      const err = error as Error;
      await update(ref(db, `decks/${deckId}`), {
        isDistributing: false,
        distributionConfig: null,
      }).catch(() => {});
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);
