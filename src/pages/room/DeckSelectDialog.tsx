import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { useAppSelector } from "../../app/hooks";
import CommonDialog from "../../components/ui/CustomDialog";

type Deck = {
  deckId: string;
  roomId: string;
  product?: string;
  email?: string;
  used?: boolean;
};

type DeckSelectDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (deckId: string) => void;
};

const DeckSelectDialog: React.FC<DeckSelectDialogProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const user = useAppSelector((state) => state.auth.user);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!open || !user?.email) return;

    const db = getDatabase();
    const decksRef = ref(db, "decks");

    const unsubscribe = onValue(
      decksRef,
      (snapshot) => {
        const data = snapshot.val() as Record<string, any> | null;

        const allDecks: Deck[] = data
          ? Object.entries(data).map(([deckId, deck]) => ({
              deckId,
              ...deck,
            }))
          : [];

        const userDecks = allDecks.filter(
          (deck) => deck.email === user.email && deck.used === true,
        );

        setDecks(userDecks);
        setLoading(false);
      },
      (error) => {
        console.error("Error reading decks in dialog:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [open, user?.email]);

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title="Select a Deck"
      maxWidth="sm"
      isLoading={loading}
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : decks.length === 0 ? (
        <p className="text-center text-sm text-gray-400">No decks found.</p>
      ) : (
        <div className="divide-y divide-white/10">
          {decks.map((deck) => (
            <div key={deck.deckId}>
              <button
                onClick={() => {
                  onSelect(deck.deckId);
                  onClose();
                }}
                className="
                  w-full px-3 py-3 text-left transition
                  hover:bg-cyan-400/10
                  focus:outline-none focus:ring-2 focus:ring-cyan-400
                "
              >
                <div className="font-semibold text-cyan-400">
                  {deck.product || "Untitled Deck"}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <div>{deck.deckId}</div>
                  {deck?.roomId && <div>In {deck.roomId}</div>}
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </CommonDialog>
  );
};

export default DeckSelectDialog;
