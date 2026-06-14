export interface Card {
  id: string;
  type: string;
  color?: string;
  number?: number;
  label?: string;
  faceUp: boolean;
  IsDistributed?: boolean;
  locationPath: string;
  order: number;
  position: number;
  owner?: string;
  hand: string;
  suit?: string;
  rank?: string;
}

export interface DeckState {
  deckId: string | null;
  deckAccess: string;
  cards: Record<string, Card>;
  cardsByLocation: Record<string, Card[]> | null;
  loading: boolean;
  error: string | null;
  reverseorder: Record<string, boolean>;
  distributionCards: Record<string, any>;
  layout: {
    slide: Record<string, boolean>;
    fanCircle: Record<string, boolean>;
  };
  isShuffling: Record<
    string,
    { type: string; startedAt: number } | null
  > | null;
  isDistributing: boolean;
  distributed: boolean;
  back?: string;
  deckInRoom?: string | null;
}

export interface ShuffleParams {
  deckId: string;
  pile: Record<string, Card>;
  type: "fisher" | "riffle" | "pile";
  locationPath: string;
}

export interface LayoutParams {
  deckId: string;
  layout: keyof DeckState["layout"];
  locationPath: string;
}

export interface TogglePileDirectionParams {
  deckId: string;
  locationPath: string;
  pile: Card[];
}

export interface DistributeCardsParams {
  roomId: string;
  deckId: string;
  pile: Record<string, Card>;
  playersUid: string[];
  settings: any;
  faceUp?: boolean;
}

export interface UpdateCardParams {
  deckId: string;
  cardId: string;
  updatedFields: Partial<Card>;
}

export interface UpdateAllCardsParams {
  deckId: string;
  updatedCards: Record<string, Card>;
}

export interface UpdateDeckParams {
  deckId: string;
  updates: Partial<DeckState>;
}

// Type definitions
export interface SuitSymbols {
  [key: string]: string;
}

export interface SuitColors {
  [key: string]: string;
}

export interface DeckCardProps {
  faceUp: boolean;
  cardW?: number;
  cardH?: number;
  playersUid?: string[] | undefined;
  order: number;
  isSelected: boolean;
  setSelectedCard?: (card: any) => void;
  updateCard: (update: { faceUp: boolean }) => void;
  pile: Card[];
  card: Card;
  index: number;
  reverseorder?: { [key: string]: boolean };
  layout?: {
    slide?: { [key: string]: boolean };
    fanCircle?: { [key: string]: boolean };
  };
  isShuffling?:
    | {
        [locationPath: string]: {
          type: string;
          startedAt?: number;
        };
      }
    | null
    | undefined;

  onClick?: () => void;
  back?: string | undefined;
  isDistributing?: boolean | undefined;
  locationPath: string;
  setDraging?: (id: any) => void;
  isCardAccess: boolean;
}

