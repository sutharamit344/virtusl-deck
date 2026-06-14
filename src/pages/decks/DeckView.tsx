import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  getDeckRealtime,
  resetDeckInFirebase,
} from "./services/decks.services";
import Board from "../../components/Board";
import DragDropWrapper from "../../components/common/DragDropWrapper";
import { ConfirmationDialog } from "../../components/ui/CustomDialog";
import Spinner from "../../components/common/Spinner";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { BiAddToQueue, BiReset } from "react-icons/bi";
import Button from "../../components/ui/Button";
import { setDeck } from "./deckSlice";

const DeckView = () => {
  const params = useParams();
  const deckId = params.deckId || null;
  const dispatch = useAppDispatch();
  const [zones, setZones] = useState<string[]>([]);
  const [resetDialogOpen, setResetDialogOpen] = useState<boolean>(false);
  const [deleteHandDialogOpen, setDeleteHandDialogOpen] =
    useState<boolean>(false);
  const [handToDelete, setHandToDelete] = useState<string | null>(null);

  const { cards, loading } = useAppSelector((state) => state.deck);

  useEffect(() => {
    if (!deckId) return;

    const unsubscribe = getDeckRealtime(deckId, (data) => {
      dispatch(setDeck(data));
    });

    return () => unsubscribe();
  }, [deckId, dispatch]);

  const handleAddZone = useCallback(() => {
    const zoneId = `HAND-${Date.now()}`;
    setZones((prevZones) => [...prevZones, zoneId]);
  }, []);

  const handleDeleteHand = useCallback((locationPath: string) => {
    setHandToDelete(locationPath);
    setDeleteHandDialogOpen(true);
  }, []);

  const handleDeleteHandConfirm = useCallback(() => {
    if (handToDelete) {
      setZones((prevZones) =>
        prevZones.filter((zone) => zone !== handToDelete)
      );
    }
    setHandToDelete(null);
    setDeleteHandDialogOpen(false);
  }, [handToDelete]);

  const handleDeleteHandCancel = useCallback(() => {
    setHandToDelete(null);
    setDeleteHandDialogOpen(false);
  }, []);

  const handleResetClick = useCallback(() => {
    setResetDialogOpen(true);
  }, []);

  const handleResetConfirm = useCallback(() => {
    if (!deckId) return;
    dispatch(resetDeckInFirebase({ deckId }));
    setResetDialogOpen(false);
  }, [deckId, cards, dispatch]);

  const handleResetCancel = useCallback(() => {
    setResetDialogOpen(false);
  }, []);

  const locationPaths = useMemo(() => {
    const locations = new Set<string>();
    Object.values(cards)?.forEach((card: any) => {
      if (card?.locationPath) {
        locations.add(card?.locationPath);
      }
    });
    return Array.from(locations);
  }, [cards]);

  useEffect(() => {
    const combined = new Set([...locationPaths]);
    const combinedArray = Array.from(combined);
    setZones((prevZones) => [
      ...prevZones,
      ...combinedArray.filter(
        (loc) =>
          loc !== prevZones.find((zone) => zone === loc) && loc !== "table-pile"
      ),
    ]);
  }, [locationPaths]);

  if (loading) {
    return <Spinner center={true} />;
  }

  if (!deckId) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Deck ID is missing
      </div>
    );
  }

  return (
    <>
      <DragDropWrapper cards={cards} deckId={deckId}>
        <div className=" py-20 lg:px-6 text-gray-100 bg-gray-900 min-h-screen">
          <div className="flex flex-col mx-auto lg:max-w-287.5 px-4 gap-4">
            {/* Header */}
            <div className="flex flex-col justify-between">
              <p className="text-lg font-mono">DECK ID: {deckId}</p>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  leftIcon={<BiReset />}
                  onClick={handleResetClick}
                >
                  Reset
                </Button>

                <Button
                  leftIcon={<BiAddToQueue />}
                  variant="secondary"
                  onClick={handleAddZone}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Main table pile */}
            <Board
              deckId={deckId}
              isDeckAccess={true}
              isMainBoard={true}
              locationPath="table-pile"
            />

            {/* All other locations/hands */}
            {zones.map((location) => (
              <Board
                key={location}
                handleDeleteand={() => handleDeleteHand(location)}
                deckId={deckId}
                isDeckAccess={true}
                locationPath={location}
                showLocation={true}
              />
            ))}
          </div>
        </div>
      </DragDropWrapper>

      <ConfirmationDialog
        open={deleteHandDialogOpen}
        onClose={handleDeleteHandCancel}
        onConfirm={handleDeleteHandConfirm}
        title="Delete Hand"
        message={`Are you sure you want to delete the hand "${handToDelete}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmationDialog
        open={resetDialogOpen}
        onClose={handleResetCancel}
        onConfirm={handleResetConfirm}
        title="Confirm Reset"
        message="Are you sure you want to reset the deck? This action will reset all cards to their original positions and cannot be undone."
        confirmText="Reset"
        variant="danger"
      />
    </>
  );
};

export default DeckView;
