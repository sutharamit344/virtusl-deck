import React, { useState, useMemo } from "react";
import CommonDialog from "../../components/ui/CustomDialog";
import Button from "../../components/ui/Button";
import { Player } from "./roomSlice";
import { Layers, Users, Sparkles, Check } from "lucide-react";

interface DistributeDialogProps {
  open: boolean;
  onClose: () => void;
  onDistribute: (batchSize: number, cardsPerPlayer: number | "all", saveAsDefault: boolean) => void;
  pileLength: number;
  playersList: Player[];
  initialBatchSize?: number;
  initialCardsPerPlayer?: number | "all";
}

const BATCH_PRESETS = [1, 2, 3, 4, 5, 6];
const CARD_PRESETS = [
  { label: "All Cards", value: "all" as const },
  { label: "2 Cards", value: 2, desc: "Hold'em" },
  { label: "3 Cards", value: 3, desc: "Teen Patti" },
  { label: "5 Cards", value: 5, desc: "Poker" },
  { label: "7 Cards", value: 7, desc: "Uno" },
  { label: "13 Cards", value: 13, desc: "Rummy" },
];

export const DistributeDialog: React.FC<DistributeDialogProps> = ({
  open,
  onClose,
  onDistribute,
  pileLength,
  playersList,
  initialBatchSize = 1,
  initialCardsPerPlayer = "all",
}) => {
  const numPlayers = Math.max(1, playersList.length);
  const maxEqualPerPlayer = Math.max(1, Math.floor(pileLength / numPlayers));

  const [batchSize, setBatchSize] = useState<number>(initialBatchSize || 1);
  const [cardsPerPlayerMode, setCardsPerPlayerMode] = useState<"all" | "custom">(
    initialCardsPerPlayer === "all" ? "all" : "custom",
  );
  const [customCardsCount, setCustomCardsCount] = useState<number>(
    typeof initialCardsPerPlayer === "number"
      ? Math.min(initialCardsPerPlayer, maxEqualPerPlayer)
      : Math.min(5, maxEqualPerPlayer),
  );
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(true);

  // Compute live deal calculations
  const effectiveCardsPerPlayer = useMemo(() => {
    if (cardsPerPlayerMode === "all") {
      return maxEqualPerPlayer;
    }
    return Math.min(customCardsCount, maxEqualPerPlayer);
  }, [cardsPerPlayerMode, customCardsCount, maxEqualPerPlayer]);

  const totalCardsToDeal = useMemo(() => {
    if (cardsPerPlayerMode === "all") {
      return pileLength;
    }
    return Math.min(pileLength, effectiveCardsPerPlayer * numPlayers);
  }, [cardsPerPlayerMode, pileLength, effectiveCardsPerPlayer, numPlayers]);

  const remainingOnTable = Math.max(0, pileLength - totalCardsToDeal);

  const handleConfirm = () => {
    const finalCardsPerPlayer = cardsPerPlayerMode === "all" ? "all" : effectiveCardsPerPlayer;
    onDistribute(batchSize, finalCardsPerPlayer, saveAsDefault);
    onClose();
  };

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title="Distribute Cards to Players"
      maxWidth="md"
      actions={
        <div className="flex w-full items-center justify-between">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            className="bg-[#00D8FF] text-black font-bold hover:bg-[#00c0e4] flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,216,255,0.3)]"
          >
            <Sparkles size={16} />
            Deal Cards Now
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-gray-200">
        {/* Table & Player Stats Banner */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-900/90 border border-white/10 text-center">
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Layers size={13} className="text-[#00D8FF]" /> Table Deck
            </span>
            <span className="text-lg font-bold text-white mt-0.5">{pileLength} Cards</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/10">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Users size={13} className="text-[#00D8FF]" /> Players
            </span>
            <span className="text-lg font-bold text-white mt-0.5">{numPlayers}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400">Max / Player</span>
            <span className="text-lg font-bold text-[#00D8FF] mt-0.5">
              {maxEqualPerPlayer} Cards
            </span>
          </div>
        </div>

        {/* 1. Cards Per Player Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-300">
            1. Cards Per Player
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CARD_PRESETS.map((preset) => {
              const isSelected =
                preset.value === "all"
                  ? cardsPerPlayerMode === "all"
                  : cardsPerPlayerMode === "custom" && customCardsCount === preset.value;
              const isExceeded =
                typeof preset.value === "number" && preset.value > maxEqualPerPlayer;

              return (
                <button
                  key={preset.label}
                  type="button"
                  disabled={isExceeded}
                  onClick={() => {
                    if (preset.value === "all") {
                      setCardsPerPlayerMode("all");
                    } else {
                      setCardsPerPlayerMode("custom");
                      setCustomCardsCount(preset.value);
                    }
                  }}
                  className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? "border-[#00D8FF] bg-[#00D8FF]/15 text-[#00D8FF] shadow-[0_0_12px_rgba(0,216,255,0.25)]"
                      : isExceeded
                        ? "border-zinc-800 bg-zinc-950/40 text-gray-600 cursor-not-allowed"
                        : "border-zinc-800 bg-zinc-900/60 text-gray-300 hover:border-zinc-700 hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-xs font-bold truncate">{preset.label}</span>
                  {preset.desc && (
                    <span className="text-[10px] text-gray-400 mt-1 truncate">{preset.desc}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Slider for custom cards count */}
          {cardsPerPlayerMode === "custom" && (
            <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-300">
                <span>Custom Cards per Player:</span>
                <span className="font-bold text-[#00D8FF] text-sm">
                  {customCardsCount} cards each
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={maxEqualPerPlayer}
                value={customCardsCount}
                onChange={(e) => setCustomCardsCount(Number(e.target.value))}
                className="w-full accent-[#00D8FF] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>1 card</span>
                <span>Max {maxEqualPerPlayer} cards</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Batch Deal Strategy (User: set of 1, 2, 3, 4, 5, 6 etc) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-300">
              2. Dealing Batch Size (Cards at a time)
            </label>
            <span className="text-xs text-[#00D8FF] font-medium">
              {batchSize === 1 ? "1-by-1 (Standard)" : `${batchSize} cards at a time`}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {BATCH_PRESETS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setBatchSize(count)}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all ${
                  batchSize === count
                    ? "border-[#00D8FF] bg-[#00D8FF] text-black shadow-[0_0_12px_rgba(0,216,255,0.3)]"
                    : "border-zinc-800 bg-zinc-900/60 text-gray-300 hover:border-zinc-700 hover:bg-zinc-800"
                }`}
              >
                {count === 1 ? "1 by 1" : `${count} by ${count}`}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 italic">
            * Cards are dealt in sets of {batchSize} round-robin. If fewer cards remain in the deck, the last player safely takes the remaining cards.
          </p>
        </div>

        {/* 3. Live Deal Summary Box */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-800 border border-[#00D8FF]/30 space-y-1.5 text-xs">
          <div className="font-semibold text-[#00D8FF] flex items-center gap-1.5 text-sm">
            <Check size={15} /> Distribution Summary
          </div>
          <div className="grid grid-cols-2 gap-y-1 text-gray-300 pt-1">
            <div>
              Cards per player:{" "}
              <span className="font-bold text-white">
                {cardsPerPlayerMode === "all" ? `~${effectiveCardsPerPlayer} (All)` : `${effectiveCardsPerPlayer}`}
              </span>
            </div>
            <div>
              Total cards dealt:{" "}
              <span className="font-bold text-white">{totalCardsToDeal}</span>
            </div>
            <div>
              Dealing method:{" "}
              <span className="font-bold text-white">{batchSize} by {batchSize}</span>
            </div>
            <div>
              Remaining on table:{" "}
              <span className="font-bold text-[#00D8FF]">{remainingOnTable} cards</span>
            </div>
          </div>
        </div>

        {/* Remember Setting Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400">
          <input
            type="checkbox"
            checked={saveAsDefault}
            onChange={(e) => setSaveAsDefault(e.target.checked)}
            className="rounded border-zinc-800 text-[#00D8FF] focus:ring-[#00D8FF]/30"
          />
          <span>Remember these distribution settings for this room</span>
        </label>
      </div>
    </CommonDialog>
  );
};

export default DistributeDialog;
