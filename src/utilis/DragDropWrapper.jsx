// utils/DragDropWrapper.jsx
import React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useDispatch, useSelector } from "react-redux";
import { updateCardInDeck, updateAllCards } from "../redux/deckSlice";

const DragDropWrapper = ({ children, cards, deckId }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id;
    const newLocation = over.id;
    const activeType = active?.data?.current?.type;

    if (activeType === "card" || cards[cardId]) {
      const currentLoc = cards[cardId]?.locationPath;
    const newOrder = cards.reduce((sum, card) => card.locationPath === newLocation ? sum+1 : sum, 0)
      if (cardId && newLocation && newLocation !== currentLoc) {
        dispatch(
          updateCardInDeck({
            deckId,
            cardId,
            updatedFields: {
              locationPath: newLocation,
              order:newOrder,
              faceUp: false
            },
          })
        );
      }
    }

  if (activeType === "pile") {
    const pileId = active.data.current.pileId;
    const pile = active.data.current.pile;
    if (!pileId || !newLocation || pileId === newLocation) return;
    let newOrder = cards.reduce((sum, card) => card.locationPath === newLocation ? sum+1 : sum, 0)
    const updatedCards = Object.fromEntries(
      Object.entries(pile)
        .filter(([_, card]) => card.locationPath === pileId)
        .map(([id, card]) => [card.id, {
           ...card, 
           locationPath: newLocation,
           order:newOrder++,
           faceUp: false
           }])
      );
      dispatch(updateAllCards({ deckId, updatedCards }));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 5 },
    })
  );

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToWindowEdges]}
    >
      {children}
    </DndContext>
  );
};

export default DragDropWrapper;
