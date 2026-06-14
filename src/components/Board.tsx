import React, { Suspense, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { MdDelete } from "react-icons/md";
import Pile from "../pages/decks/Pile";
import { useAppSelector } from "../app/hooks";
import { Loader } from "lucide-react";

interface BoardProps {
  face?: boolean | null;
  cardW?: number;
  cardH?: number;
  rank?: string | null;
  suit?: string | null;
  playersUid?: string[] | undefined;
  roomId?: string;
  deckId?: string | null;
  locationPath: string;
  locationName?: string;
  isMainBoard?: boolean;
  isDeckAccess?: boolean;
  showLocation?: boolean;
  handleDeleteand?: (locationPath: string) => void;
  handleCardBySuit?: (suited: Record<string, any[]>) => void;
}

const Board: React.FC<BoardProps> = ({
  face = null,
  cardW = 72,
  cardH = 104,
  rank = null,
  suit = null,
  roomId = "",
  deckId,
  locationPath = "",
  isMainBoard = false,
  isDeckAccess = false,
  showLocation = false,
  locationName = "",
  handleDeleteand = () => {},
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: locationPath,
    data: { locationName },
  });
  const { cards } = useAppSelector((state) => state.deck);

  const cardonLocation = useMemo(() => {
    return Object.entries(cards).filter(
      ([_, card]: any) => card.locationPath === locationPath,
    );
  }, [cards, locationPath]);

  return (
    <div
      ref={setNodeRef}
      id={locationPath}
      className={`
        relative
        box-border
        flex
        justify-center
        items-center
        w-full
        mx-auto
        rounded-2xl
        shadow-lg
        transition-all
        duration-200
        ${
          isOver
            ? "border-2 border-dashed border-green-500 bg-opacity-10"
            : "border-2 border-transparent bg-gray-800 bg-opacity-50"
        }
        hover:bg-gray-800 hover:bg-opacity-70
      `}
      style={{
        height: cardH + cardonLocation.length * 0.3 + 40,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        zIndex: isOver ? 0 : "auto",
      }}
    >
      {deckId ? (
        <Suspense fallback={<Loader />}>
          <Pile
            isMainBoard={isMainBoard}
            isDeckAccess={isDeckAccess}
            face={face}
            cardH={cardH}
            cardW={cardW}
            rank={rank}
            suit={suit}
            roomId={roomId}
            deckId={deckId}
            locationPath={locationPath}
          />
        </Suspense>
      ) : null}

      {showLocation && (
        <div className="absolute bottom-1 right-2 flex items-center gap-1">
          <span className="text-xs text-gray-400">
            {!isMainBoard ? locationPath : "Main Table"}
          </span>

          {!isMainBoard && cardonLocation?.length === 0 && (
            <button
              onClick={() => handleDeleteand(locationPath)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              aria-label={`Delete ${locationPath}`}
            >
              <MdDelete size={14} className="text-red-500" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(Board);
