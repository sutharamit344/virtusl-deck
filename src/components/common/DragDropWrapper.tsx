import React, { ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragMoveEvent,
  DragCancelEvent,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  moveCardAtomic,
  movePileAtomic,
  updateAllCards,
} from "../../pages/decks/services/decks.services";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Card } from "../../pages/decks/deckModal";
import { insertRoomHistory } from "../../pages/room/services/rooms.services";
import { Action } from "@dnd-kit/core/dist/store";

interface PileData {
  pileLocation: string;
  pile: Record<string, Card>;
}

interface DragDropWrapperProps {
  children: ReactNode;
  cards: Record<string, Card>;
  deckId: string | null;
  historyDetails?: {
    action: string;
    details?: string;
  };
  roomId?: string;
}

const DragDropWrapper: React.FC<DragDropWrapperProps> = ({
  children,
  cards,
  deckId,
  historyDetails,
  roomId,
}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isDistributing = useAppSelector((state) => state.deck.isDistributing);

  const handleDragEnd = async (event: DragEndEvent) => {
    if (isDistributing) return;
    const { active, over } = event;

    if (!deckId || !user) return;
    if (!over) return;

    const cardId: any = active?.id;
    const locationName = over.data?.current?.locationName || "Unknown Location";
    const newLocation = over.id as string;
    const activeType = active?.data?.current?.type as string;
    const currentCard = cards[cardId];
    const currentLoc = currentCard ? currentCard.locationPath : null;

    if (currentCard?.locationPath === newLocation) return;
    if (activeType === "card" && currentCard) {
      if (!newLocation || !currentLoc || newLocation === currentLoc) return;

      const isTable =
        newLocation.endsWith("-table-pile") || newLocation === "table-pile";
      const isHand = newLocation.endsWith("-hand-pile");
      const hand = isHand && roomId
        ? newLocation.replace(`${roomId}-`, "").replace("-hand-pile", "")
        : isTable
          ? (user?.uid || currentCard.hand || null)
          : (currentCard.hand || user?.uid || null);

      const cardsInNewLocation = Object.values(cards).filter(
        (card) => card.locationPath === newLocation,
      );
      const maxOrder = cardsInNewLocation.reduce(
        (max, c) =>
          typeof c.order === "number" && c.order > max ? c.order : max,
        -1,
      );
      const newOrder = maxOrder + 1;

      const result = await dispatch(
        moveCardAtomic({
          deckId,
          cardId: currentCard.id,
          expectedOldLocation: currentLoc,
          newLocation,
          newOrder,
          hand,
        }),
      );

      if (result.meta.requestStatus === "fulfilled" && roomId) {
        dispatch(
          insertRoomHistory({
            action: historyDetails?.action || "Moved a card",
            details:
              historyDetails?.details ||
              `${currentCard.faceUp ? currentCard.rank + " of " + currentCard.suit : "a Card"} to ${locationName}`,
            roomId: roomId,
          }),
        );
      }
    }
    if (activeType === "pile") {
      const pileData = active.data?.current as PileData | undefined;
      const pileLocation = pileData?.pileLocation;
      const pile = pileData?.pile;

      if (
        !pileLocation ||
        !pile ||
        !newLocation ||
        pileLocation === newLocation
      ) {
        return;
      }

      const pileCards = Object.values(pile);
      const cardIds = pileCards.map((card) => card.id);
      const startingOrder = Object.values(cards).filter(
        (card) => card.locationPath === newLocation,
      ).length;

      const result = await dispatch(
        movePileAtomic({
          deckId,
          cardIds,
          expectedOldLocation: pileLocation,
          newLocation,
          startingOrder,
        }),
      );

      if (result.meta.requestStatus === "fulfilled" && roomId) {
        const pileCards = Object.values(pile);
        const movedCount = pileCards.length;
        const cardsfaceup = pileCards
          .filter((card) => card.faceUp)
          .map((card) => `${card.rank} of ${card.suit}`)
          .join(", ");
        const cardsfacedown = pileCards.filter((card) => card.faceUp === false);
        let cardsfacedownText = "";

        if (cardsfaceup && cardsfacedown.length > 0) {
          cardsfacedownText = `${cardsfaceup} and ${cardsfacedown.length} Card${cardsfacedown.length > 1 ? "s" : ""} to ${locationName}`;
        }else if (cardsfaceup) {
          cardsfacedownText = `${cardsfaceup} to ${locationName}`;
        } else if (cardsfacedown.length > 0) {
          cardsfacedownText = `${cardsfacedown.length} Card${cardsfacedown.length > 1 ? "s" : ""} to ${locationName}`;
        }

        dispatch(
          insertRoomHistory({
            roomId,
            action: historyDetails?.action ?? `Moved ${movedCount} cards`,
            details: cardsfacedownText,
          }),
        );
      }
    }
  };

  // Optional: Add other drag event handlers if needed
  const handleDragStart = (event: DragStartEvent) => {
    // Handle drag start if needed
  };

  const handleDragMove = (event: DragMoveEvent) => {
    // Handle drag move if needed
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    // Handle drag cancel if needed
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 5 },
    }),
  );

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToWindowEdges]}
    >
      {children}
      {/* Optional: Add DragOverlay for custom drag preview */}
      {/* <DragOverlay>
        {activeId ? (
          // Your custom drag overlay component
        ) : null}
      </DragOverlay> */}
    </DndContext>
  );
};

export default DragDropWrapper;
