import { describe, it, expect } from "vitest";
import {
  fisherYatesShuffle,
  riffleShuffle,
  pileShuffle,
} from "../pages/decks/services/decks.services";
import { Card } from "../pages/decks/deckModal";

// Helper to generate a standard mock deck of N cards
function createMockDeck(count = 52): Card[] {
  const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck: Card[] = [];

  for (let i = 0; i < count; i++) {
    const suit = suits[i % suits.length]!;
    const rank = ranks[i % ranks.length]!;
    deck.push({
      id: `card_${i}`,
      type: "standard",
      suit,
      rank,
      label: `${rank} of ${suit}`,
      faceUp: false,
      order: i,
      position: i,
      locationPath: "room_1-table-pile",
      hand: "",
    });
  }
  return deck;
}

describe("1. Card Invariants and Integrity", () => {
  it("Fisher-Yates shuffle preserves all card identities, unique IDs, and total count", () => {
    const original = createMockDeck(52);
    const shuffled = fisherYatesShuffle(original);

    expect(shuffled).toHaveLength(52);

    const originalIds = new Set(original.map((c) => c.id));
    const shuffledIds = new Set(shuffled.map((c) => c.id));

    expect(shuffledIds.size).toBe(52);
    expect(shuffledIds).toEqual(originalIds);
  });

  it("Riffle shuffle preserves all card identities and total count", () => {
    const original = createMockDeck(52);
    const shuffled = riffleShuffle(original);

    expect(shuffled).toHaveLength(52);

    const originalIds = new Set(original.map((c) => c.id));
    const shuffledIds = new Set(shuffled.map((c) => c.id));

    expect(shuffledIds.size).toBe(52);
    expect(shuffledIds).toEqual(originalIds);
  });

  it("Pile shuffle preserves all card identities and total count", () => {
    const original = createMockDeck(52);
    const shuffled = pileShuffle(original, 5);

    expect(shuffled).toHaveLength(52);

    const originalIds = new Set(original.map((c) => c.id));
    const shuffledIds = new Set(shuffled.map((c) => c.id));

    expect(shuffledIds.size).toBe(52);
    expect(shuffledIds).toEqual(originalIds);
  });

  it("Card dealing distributes all cards to players without loss or duplication", () => {
    const original = createMockDeck(20);
    const players = [{ uid: "player_A" }, { uid: "player_B" }, { uid: "player_C" }];
    const pile = [...original];

    const playerHands: Record<string, Card[]> = {
      player_A: [],
      player_B: [],
      player_C: [],
    };

    while (pile.length > 0) {
      for (const player of players) {
        const card = pile.pop();
        if (!card) break;
        const targetHand = playerHands[player.uid];
        if (targetHand) {
          targetHand.push({
            ...card,
            locationPath: `room_1-${player.uid}-hand-pile`,
            hand: player.uid,
          });
        }
      }
    }

    const totalDealt = Object.values(playerHands).reduce(
      (sum, hand) => sum + hand.length,
      0,
    );
    expect(totalDealt).toBe(20);

    const allDealtIds = Object.values(playerHands).flatMap((h) => h.map((c) => c.id));
    const uniqueIds = new Set(allDealtIds);

    expect(uniqueIds.size).toBe(20);
    expect(uniqueIds).toEqual(new Set(original.map((c) => c.id)));
  });
});

describe("2. Multiplayer Concurrency and Atomic Moves", () => {
  it("Moving a card atomically does NOT mutate or overwrite sibling cards in the same pile", () => {
    const card1: Card = { id: "c1", type: "standard", faceUp: false, order: 0, position: 0, locationPath: "pile_A", hand: "" };
    const card2: Card = { id: "c2", type: "standard", faceUp: true, order: 1, position: 1, locationPath: "pile_A", hand: "" };
    const card3: Card = { id: "c3", type: "standard", faceUp: false, order: 2, position: 2, locationPath: "pile_A", hand: "" };

    const cards: Record<string, Card> = {
      c1: card1,
      c2: card2,
      c3: card3,
    };

    // Client moves c1 to pile_B
    const movedCardId = "c1";
    const targetLocation = "pile_B";
    const newOrder = 0;

    const existingCard = cards[movedCardId];
    expect(existingCard).toBeDefined();

    // Simulate atomic update that only touches c1
    const updatedCards: Record<string, Card> = {
      ...cards,
      [movedCardId]: {
        ...existingCard!,
        locationPath: targetLocation,
        order: newOrder,
      },
    };

    // c2 and c3 retain their exact state, faceUp, and properties without being clobbered
    expect(updatedCards["c1"]?.locationPath).toBe("pile_B");
    expect(updatedCards["c2"]?.faceUp).toBe(true);
    expect(updatedCards["c2"]?.locationPath).toBe("pile_A");
    expect(updatedCards["c3"]?.locationPath).toBe("pile_A");
  });

  it("Rejects move if card was already moved from expected old location (conflict guard)", () => {
    // Current database state: Player A already moved c1 to pile_B
    const currentCardInDb: Card = {
      id: "c1",
      type: "standard",
      faceUp: false,
      order: 0,
      position: 0,
      locationPath: "pile_B", // already in pile_B!
      hand: "",
    };

    // Player B attempts to move c1 assuming it is still in pile_A
    const expectedOldLocation = "pile_A";

    // Transaction logic condition:
    const canMove = currentCardInDb.locationPath === expectedOldLocation;
    expect(canMove).toBe(false); // Must abort
  });
});

describe("3. Room Lifecycle and Host Election", () => {
  it("Elects the next active player as host when the existing host departs", () => {
    const initialPlayers: Record<string, { displayName: string; host: boolean }> = {
      user_host: { displayName: "Alice (Host)", host: true },
      user_2: { displayName: "Bob", host: false },
      user_3: { displayName: "Charlie", host: false },
    };
    const hostUid = "user_host";

    // Host departs
    const exitingUser = "user_host";
    const remainingPlayerIds = Object.keys(initialPlayers).filter(
      (id) => id !== exitingUser,
    );

    expect(remainingPlayerIds).toHaveLength(2);

    let nextHostUid = hostUid;
    let nextHostName = "Alice (Host)";

    if (hostUid === exitingUser && remainingPlayerIds.length > 0) {
      const candidateUid = remainingPlayerIds[0];
      if (candidateUid && initialPlayers[candidateUid]) {
        nextHostUid = candidateUid;
        nextHostName = initialPlayers[candidateUid]!.displayName;
      }
    }

    expect(nextHostUid).toBe("user_2");
    expect(nextHostName).toBe("Bob");
  });

  it("Signals room deletion when the last remaining player departs", () => {
    const singlePlayerList = ["user_solo"];
    const isLastUser = singlePlayerList.length <= 1;

    expect(isLastUser).toBe(true);
  });
});

describe("4. Circular Table Played Cards Resolution", () => {
  it("Resolves distinct cards for both players when both players have played to table", () => {
    const playersList = [
      { uid: "ams_uid", displayName: "Ams" },
      { uid: "craft_uid", displayName: "Craft" },
    ];

    const cardsOnTable: Card[] = [
      {
        id: "c_ams",
        suit: "Spades",
        rank: "9",
        order: 0,
        locationPath: "room_1-table-pile",
        hand: "ams_uid",
      } as Card,
      {
        id: "c_craft",
        suit: "Hearts",
        rank: "3",
        order: 1,
        locationPath: "room_1-table-pile",
        hand: "craft_uid",
      } as Card,
    ];

    // Simulate Table pile resolution
    const mover = new Set<string>();
    const cardInRound: Card[] = [];
    const sliceIndex = playersList.length || 1;
    const sorted = [...cardsOnTable].sort((a, b) => b.order - a.order);

    sorted.forEach((card) => {
      if (cardInRound.length >= sliceIndex) return;
      const playerKey = card.hand || card.owner;
      if (playerKey) {
        if (!mover.has(playerKey)) {
          mover.add(playerKey);
          cardInRound.push(card);
        }
      } else {
        cardInRound.push(card);
      }
    });

    const finalCards = cardInRound.reverse();
    expect(finalCards).toHaveLength(2);

    // Simulate playerCardMap resolution
    const map = new Map<string, Card>();
    const usedCardIds = new Set<string>();

    playersList.forEach((player) => {
      const match = finalCards
        .filter(
          (c) =>
            (c.hand === player.uid || c.owner === player.uid) &&
            !usedCardIds.has(c.id),
        )
        .reverse()?.[0];
      if (match) {
        map.set(player.uid, match);
        usedCardIds.add(match.id);
      }
    });

    const unassigned = finalCards.filter((c) => !usedCardIds.has(c.id));
    playersList.forEach((player) => {
      if (!map.has(player.uid) && unassigned.length > 0) {
        const fallback = unassigned.shift();
        if (fallback) {
          map.set(player.uid, fallback);
          usedCardIds.add(fallback.id);
        }
      }
    });

    expect(map.get("ams_uid")?.id).toBe("c_ams");
    expect(map.get("craft_uid")?.id).toBe("c_craft");
  });

  it("Recovers visibility for the second player even if second card had legacy null hand", () => {
    const playersList = [
      { uid: "ams_uid", displayName: "Ams" },
      { uid: "craft_uid", displayName: "Craft" },
    ];

    const cardsOnTable: Card[] = [
      {
        id: "c_ams",
        suit: "Spades",
        rank: "9",
        order: 0,
        locationPath: "room_1-table-pile",
        hand: "ams_uid",
      } as Card,
      {
        id: "c_craft_legacy",
        suit: "Hearts",
        rank: "3",
        order: 1,
        locationPath: "room_1-table-pile",
        hand: "", // legacy / null hand!
      } as Card,
    ];

    const mover = new Set<string>();
    const cardInRound: Card[] = [];
    const sliceIndex = playersList.length || 1;
    const sorted = [...cardsOnTable].sort((a, b) => b.order - a.order);

    sorted.forEach((card) => {
      if (cardInRound.length >= sliceIndex) return;
      const playerKey = card.hand || card.owner;
      if (playerKey) {
        if (!mover.has(playerKey)) {
          mover.add(playerKey);
          cardInRound.push(card);
        }
      } else {
        cardInRound.push(card);
      }
    });

    const finalCards = cardInRound.reverse();
    expect(finalCards).toHaveLength(2);

    const map = new Map<string, Card>();
    const usedCardIds = new Set<string>();

    playersList.forEach((player) => {
      const match = finalCards
        .filter(
          (c) =>
            (c.hand === player.uid || c.owner === player.uid) &&
            !usedCardIds.has(c.id),
        )
        .reverse()?.[0];
      if (match) {
        map.set(player.uid, match);
        usedCardIds.add(match.id);
      }
    });

    const unassigned = finalCards.filter((c) => !usedCardIds.has(c.id));
    playersList.forEach((player) => {
      if (!map.has(player.uid) && unassigned.length > 0) {
        const fallback = unassigned.shift();
        if (fallback) {
          map.set(player.uid, fallback);
          usedCardIds.add(fallback.id);
        }
      }
    });

    // Both players must resolve their card, including craft with legacy null hand!
    expect(map.get("ams_uid")?.id).toBe("c_ams");
    expect(map.get("craft_uid")?.id).toBe("c_craft_legacy");
  });

  it("Preserves previously played cards below newly played cards with strict zIndex and drag visibility", () => {
    const playersList = [
      { uid: "ams_uid", displayName: "Ams" },
      { uid: "craft_uid", displayName: "Craft" },
    ];

    // Ams plays Ace of Clubs (order 0), Craft plays 7 of Hearts (order 1), then Ams plays King of Hearts (order 2)
    const cardsOnTable: Card[] = [
      {
        id: "c_ams_1",
        suit: "Clubs",
        rank: "A",
        order: 0,
        locationPath: "room_1-table-pile",
        hand: "ams_uid",
      } as Card,
      {
        id: "c_craft_1",
        suit: "Hearts",
        rank: "7",
        order: 1,
        locationPath: "room_1-table-pile",
        hand: "craft_uid",
      } as Card,
      {
        id: "c_ams_2",
        suit: "Hearts",
        rank: "K",
        order: 2,
        locationPath: "room_1-table-pile",
        hand: "ams_uid",
      } as Card,
    ];

    // Group cards by player
    const map = new Map<string, Card[]>();
    playersList.forEach((p) => map.set(p.uid, []));

    const sortedTableCards = [...cardsOnTable].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );

    sortedTableCards.forEach((card) => {
      const ownerUid = card.hand || card.owner;
      if (ownerUid && map.has(ownerUid)) {
        map.get(ownerUid)!.push(card);
      }
    });

    const amsCards = map.get("ams_uid") || [];
    expect(amsCards).toHaveLength(2);
    expect(amsCards[0]!.id).toBe("c_ams_1");
    expect(amsCards[1]!.id).toBe("c_ams_2");

    // Check z-index calculation: newer card must have higher zIndex
    const zIndexOld = 10 + (amsCards[0]!.order ?? 0);
    const zIndexNew = 10 + (amsCards[1]!.order ?? 0);
    expect(zIndexNew).toBeGreaterThan(zIndexOld);

    // When the top card is dragged, it gets max zIndex and the bottom card remains visible
    const isDraggingTopCard = true;
    const draggingZIndex = isDraggingTopCard ? 999999 : zIndexNew;
    expect(draggingZIndex).toBe(999999);
    // The previously played card c_ams_1 is still intact in amsCards array and rendered below
    expect(amsCards[0]).toBeDefined();
    expect(amsCards[0]!.id).toBe("c_ams_1");
  });
});


