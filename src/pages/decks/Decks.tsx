import { useState } from "react";
import RedeemDeck from "./RedeemDeck";
import RedeemedDecks from "./DeckListCard";
import BottomNav from "../../layout/footer/BottomNav";
import { CommonDialog } from "../../components/ui/CustomDialog";
import Button from "../../components/ui/Button";

function Decks() {
  const [redeemDialogOpen, setRedeemDialogOpen] = useState<boolean>(false);
  const [redeemedDeckId, setRedeemedDeckId] = useState<string>("");
  const [successDialogOpen, setSuccessDialogOpen] = useState<boolean>(false);

  const handleRedeemSuccess = (deckId: string): void => {
    setRedeemedDeckId(deckId);
    setRedeemDialogOpen(false);
    setSuccessDialogOpen(true);
  };

  const handleCloseSuccess = (): void => {
    setSuccessDialogOpen(false);
    setRedeemedDeckId("");
  };

  return (
    <div className="relative z-10 py-20">
      <div className="flex flex-col mx-auto lg:max-w-287.5 px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row items-start justify-between gap- w-100">
          <div className="text-left">
            <h1 className="text-xl font-bold">Your Decks</h1>
            <p className="mt-1 text-sm text-gray-400">
              Redeem and manage your virtual card decks
            </p>
          </div>

          <Button
            size="sm"
            className="shrink-0"
            onClick={() => setRedeemDialogOpen(true)}
          >
            <span className="text-lg">＋</span>
            Redeem Deck
          </Button>
        </div>

        {/* Divider */}
        <div className="mb-8 h-px w-full bg-white/10" />

        {/* Redeemed Decks */}
        <RedeemedDecks />

        <CommonDialog
          open={redeemDialogOpen}
          onClose={() => setRedeemDialogOpen(false)}
          title="Redeem a Deck"
          maxWidth="sm"
        >
          <RedeemDeck onRedeemSuccess={handleRedeemSuccess} />
        </CommonDialog>

        {/* Success Dialog */}
        <CommonDialog
          open={successDialogOpen}
          onClose={handleCloseSuccess}
          title="🎉 Deck Redeemed Successfully!"
          maxWidth="xs"
          actions={
            <button
              onClick={handleCloseSuccess}
              className="w-full rounded-xl bg-[#00D8FF] py-3 font-semibold text-[#121212] transition hover:bg-[#00bcd4]"
            >
              Continue
            </button>
          }
        >
          <div className="py-4 text-center">
            <p className="mb-3 leading-relaxed text-[#E6EDF3]">
              Deck{" "}
              <span className="font-semibold text-[#00D8FF]">
                {redeemedDeckId}
              </span>{" "}
              has been successfully added to your collection!
            </p>
            <p className="text-sm text-gray-400">
              You can now use this deck in your card games.
            </p>
          </div>
        </CommonDialog>
      </div>

      <BottomNav select={1} />
    </div>
  );
}

export default Decks;
