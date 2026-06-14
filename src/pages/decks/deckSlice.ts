import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loadDeckWithRealtime } from "./services/decks.services";
import { Card } from "./deckModal";

interface DeckState {
  deckId: string | null;
  deckAccess: string;
  cards: Record<string, Card>;
  cardsByLocation: { [location: string]: Card[] } | null;
  loading: boolean;
  error: string | null;
  reverseorder: { [locationPath: string]: boolean };
  distributionCards: { [key: string]: any };
  layout: {
    slide: { [locationPath: string]: boolean };
    fanCircle: { [locationPath: string]: boolean };
  };
  isShuffling?: {
    [locationPath: string]: { type: string; startedAt: number };
  } | null;
  isDistributing?: boolean;
  deckInRoom?: string | null;
  back?: string;
}

export interface DeckData {
  deckId: string;
  cards?: { [key: string]: Card };
  reverseorder?: { [locationPath: string]: boolean };
  layout?: {
    slide: { [locationPath: string]: boolean };
    fanCircle: { [locationPath: string]: boolean };
  };
  isShuffling?: {
    [locationPath: string]: { type: string; startedAt: number };
  } | null;
  isDistributing?: boolean;
  roomId?: string;
  deckAccess?: string;
  ownerUid?: string;
  back?: string;
  product_id?: string;
  [key: string]: any;
}

const initialState: DeckState = {
  deckId: null,
  deckAccess: "",
  cards: {},
  cardsByLocation: null,
  loading: false,
  error: null,
  reverseorder: {},
  distributionCards: {},
  layout: {
    slide: {},
    fanCircle: {},
  },
};

const deckSlice = createSlice({
  name: "deck",
  initialState,
  reducers: {
    setDeck: (state, action: PayloadAction<DeckData>) => {
      state.deckId = action.payload.deckId;
      state.back = action.payload.back || "/deck_standard_52.jpg";
      state.reverseorder = action.payload.reverseorder || {};
      state.layout = action.payload.layout || {
        slide: {},
        fanCircle: {},
      };
      state.isShuffling = action.payload.isShuffling ?? null;
      state.isDistributing = action.payload.isDistributing ?? false;
      state.deckAccess =
        action.payload.deckAccess || action.payload.ownerUid || "";
      state.deckInRoom = action.payload.roomId || null;
      state.cards = action.payload.cards || {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDeckWithRealtime.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDeckWithRealtime.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(loadDeckWithRealtime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setDeck } = deckSlice.actions;

export default deckSlice.reducer;
