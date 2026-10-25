// components/Pile.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import DeckCard from "./cards/DeckCard";
import UnoCard from "./cards/UnoCard";
import {
  togglePileDirection,
  handleLayout,
  updateCardInDeck,
  updateAllCards,
  shuffleDeck,
  shuffleAllOnce,
  distributeCards,
} from "./services/decks.services";
import useSound from "use-sound";
import { playExclusiveSound } from "../../components/common/playExclusiveSound";
import { collectCards, Player } from "../room/roomSlice";
import { MdLoop } from "react-icons/md";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Card } from "./deckModal";
import Button from "../../components/ui/Button";

interface PileProps {
  face?: boolean | null;
  cardW?: number;
  cardH?: number;
  rank?: string | null;
  suit?: string | null;
  playersList?: Player[];
  roomId?: string;
  deckId: string | null;
  locationPath: string;
  isDeckAccess: boolean;
  isMainBoard: boolean;
}

// Style constants (converted to Tailwind classes reference)
const actionButtonStyle =
  "h-[30px] text-[0.7rem] px-[6px] rounded-[8px] border-1 border-[#00D8FFs] bg-[#1f1f1f] text-[#00D8FF] hover:bg-[#00D8FF] hover:text-[#121212] z-[10000] font-bold";
const activeButtonStyle =
  "h-[30px] text-[0.7rem] px-[6px] rounded-[8px] border-1 border-[#00D8FFs] bg-[#00D8FF] text-[#121212] hover:bg-[#1f1f1f] hover:text-[#00D8FF] z-[10000] font-bold";

const Pile: React.FC<PileProps> = ({
  face,
  cardW = 72,
  cardH = 104,
  rank = null,
  suit = null,
  playersList = [],
  roomId,
  deckId,
  locationPath,
  isDeckAccess,
  isMainBoard,
}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const divRef = useRef<HTMLDivElement>(null);
  const outerWidth = useRef<HTMLDivElement>(null);
  const [finalCards, setFinalCards] = useState<Card[]>([]);
  const [width, setWidth] = useState(0);
  const [outer, setOuter] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [pileMenuAnchor, setPileMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const { settings } = useAppSelector((state) => state.room);
  const mode = settings?.table?.mode || "Stacked";
  const currentCardFace = settings?.table?.cardFace?.[`${mode}_hand`] || {};
  const [byRank, setByRank] = useState<string | null>(null);
  const [bySuit, setBySuit] = useState<string | null>(null);

  const { cards, reverseorder, layout, back, isShuffling, isDistributing } =
    useAppSelector((state) => state.deck);
  const [playFlip, { sound: flipSound }] = useSound("/sounds/flipCard.mp3");
  const [playSlide, { sound: slideSound }] = useSound("/sounds/rowCards.mp3", {
    volume: 2,
  });

  const cardsOnLocation = useMemo(() => {
    return Object.values(cards)
      .filter((card) => card.locationPath === locationPath)
      .sort((a, b) => a.order - b.order);
  }, [cards, dispatch, locationPath]);

  useEffect(() => {
    const unlockAndPlay = () => {
      if (window.Howler?.ctx?.state === "suspended") window.Howler.ctx.resume();
      window.removeEventListener("click", unlockAndPlay);
    };
    window.addEventListener("click", unlockAndPlay);
    return () => window.removeEventListener("click", unlockAndPlay);
  }, []);

  const cardsGroupedBySuit = useMemo<Record<string, Card[]>>(() => {
    const grouped: Record<string, Card[]> = {};
    cardsOnLocation.forEach((card) => {
      if (!card.suit) return;
      (grouped[card.suit] ||= []).push(card);
    });
    return grouped;
  }, [cardsOnLocation]);

  const cardFace = useMemo(() => {
    const findFace = cardsOnLocation.some((card) => card.faceUp === false);
    if (currentCardFace?.strict) {
      return currentCardFace?.faceUp ? false : true;
    } else {
      return findFace;
    }
  }, [currentCardFace, face, cardsOnLocation]);

  const handleSuit = () => {
    const suits: (string | null)[] = [null, ...Object.keys(cardsGroupedBySuit)];
    const nextIndex = (suits.indexOf(bySuit) + 1) % suits.length;
    setBySuit(suits[nextIndex] ?? null);
  };

  useEffect(() => {
    if (rank !== undefined) setByRank(rank);
    if (suit !== undefined) setBySuit(suit);
  }, [rank, suit]);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${locationPath}`,
      data: {
        type: "pile",
        pileLocation: locationPath,
        pile: finalCards,
      },
    });

  useEffect(() => {
    if (!divRef.current || !outerWidth.current) return;

    const updateWidth = () => {
      if (!divRef.current || !outerWidth.current) return;
      setWidth(divRef.current.getBoundingClientRect().width);
      setOuter(outerWidth.current.getBoundingClientRect().width);
    };

    updateWidth();

    const divObserver = new ResizeObserver(updateWidth);
    const outerObserver = new ResizeObserver(updateWidth);

    divObserver.observe(divRef.current);
    outerObserver.observe(outerWidth.current);

    return () => {
      divObserver.disconnect();
      outerObserver.disconnect();
    };
  }, [layout]);

  const pile = useMemo(() => {
    return cardsOnLocation
      .filter((card) => (bySuit ? card.suit === bySuit : true))
      .sort((a, b) => {
        if (byRank === "ASE") return a.position - b.position;
        if (byRank === "DESE") return b.position - a.position;
        return a.order - b.order;
      });
  }, [cardsOnLocation, bySuit, byRank]);

  const cardsPerPage = useMemo(
    () => Math.max(1, Math.floor(width / (cardW / 2))),
    [width, cardW],
  );

  useEffect(() => {
    const isInPile = pile.some((card) => card.id === selectedCard?.id);
    if (!isInPile) setSelectedCard(null);
  }, [pile, selectedCard]);

  useEffect(() => {
    if (pile.length <= cardsPerPage) setStartIndex(0);
    else if (startIndex > pile.length - cardsPerPage) {
      setStartIndex(Math.max(pile.length - cardsPerPage, 0));
    }
  }, [pile.length, cardsPerPage, startIndex]);

  useEffect(() => {
    if (!cardsOnLocation.length) setPileMenuAnchor(null);
    if (isDistributing) setPileMenuAnchor(null);
  }, [cardsOnLocation]);

  const paginatedCards = useMemo(() => {
    if (layout?.fanCircle?.[locationPath]) return pile.slice(0, 8);
    if (layout?.slide?.[locationPath])
      return pile.slice(startIndex, startIndex + cardsPerPage);
    return pile;
  }, [layout, pile, startIndex, cardsPerPage, locationPath]);

  const resetFace = useMemo(
    () => pile.every((c) => c.faceUp) || pile.every((c) => !c.faceUp),
    [pile],
  );

  const updateCard = async (updatedFields: Partial<Card>) => {
    if (!selectedCard) return;
    deckId &&
      dispatch(
        updateCardInDeck({ deckId, cardId: selectedCard.id, updatedFields }),
      );
  };

  const handleFlipAllCards = (faceUpValue: boolean) => {
    const updated = Object.fromEntries(
      pile.map((card) => [card.id, { ...card, faceUp: faceUpValue }]),
    );
    deckId && dispatch(updateAllCards({ deckId, updatedCards: updated }));
  };

  const isUnoDeck = deckId?.startsWith("UNO");
  const CardComponent = isUnoDeck ? UnoCard : DeckCard;

  useEffect(() => {
    setFinalCards(paginatedCards);
  }, [paginatedCards]);

  const handleDistribute = async () => {
    if (!roomId || !playersList || playersList.length === 0 || isDistributing) return;
    try {
      if (deckId) {
        await dispatch(
          distributeCards({
            deckId,
            roomId,
            pile,
            playersList,
            settings,
          }),
        ).unwrap();
      }
    } catch (error) {
      console.error("Distribute failed:", error);
    }
  };

  useEffect(() => {
    !finalCards?.length && cardsOnLocation.length && bySuit && handleSuit();
  }, [bySuit, finalCards, cardsOnLocation.length]);

  const cardDistributed = useMemo(() => {
    return finalCards.filter((card) => !card?.IsDistributed);
  }, [finalCards]);

  return (
    <>
      {/* ⬅ Scroll Left */}
      {layout?.slide?.[locationPath] && pile.length > cardsPerPage && (
        <Button
          variant="secondary"
          className={`flex-col absolute top-1/2 -left-5 -translate-y-1/2 z-1000 w-[29px] min-h-[8px] rounded-[4px] bg-[#1f1f1f] text-[#121212] border-1 border-[#00D8FF] hover:bg-[#00D8FF] hover:text-[#121212]`}
          onClick={() =>
            setStartIndex((prev) =>
              pile.length < cardsPerPage
                ? 0
                : prev === 0
                  ? pile.length - cardsPerPage
                  : Math.min(prev - 1, pile.length - cardsPerPage),
            )
          }
          size="sm"
        >
          <ChevronLeft />
          <div>{Math.max(startIndex, 0)}</div>
        </Button>
      )}

      {/* 🔹 Pile Container */}
      {cardsOnLocation.length ? (
        <div
          id={locationPath + "_outer"}
          ref={outerWidth}
          style={{
            height: layout?.slide?.[locationPath]
              ? cardH
              : cardH + pile.length * 0.3,
            width: layout?.slide?.[locationPath]
              ? "100%"
              : cardW + pile.length * 0.3,
            transform: transform
              ? `translate(${transform.x}px, ${transform.y}px)`
              : "none",
            zIndex: isDragging ? 999999999 : 1,
            transition: "border-1 0.2s, background-color 0.2s",
          }}
          className={`relative flex justify-center `}
        >
          <div
            id={locationPath}
            ref={(e: HTMLDivElement) => {
              !isDistributing && isDeckAccess && setNodeRef(e);
              if (e) divRef.current = e;
            }}
            {...(isDeckAccess && attributes)}
            {...(isDeckAccess && listeners)}
            className={`h-full touch-pan-x scrollbar-hide relative flex justify-center items-center`}
            style={{
              height: "100%",
              width: layout?.slide?.[locationPath]
                ? `${
                    Math.round(outer / (cardW / 2)) * (cardW / 2) -
                    (cardW / 2 + 2)
                  }px`
                : "100%",
            }}
          >
            <div
              id="Pile-vutton"
              onClick={(e) => {
                if (isDistributing) return;
                if (!isDeckAccess) return;
                if (pileMenuAnchor) {
                  setPileMenuAnchor(null);
                } else {
                  setSelectedCard(null);
                  setPileMenuAnchor(e.currentTarget);
                }
              }}
              className={` ${
                pileMenuAnchor ? activeButtonStyle : actionButtonStyle
              } select-none absolute w-[30px] h-[30px] text-[16px] font-bold ${
                pile.length ? "flex" : "hidden"
              } items-center justify-center z-[${pile.length + 10000}] ${
                layout?.fanCircle?.[locationPath]
                  ? "bottom-1 mb-[-12px] left-[-15px] top-1/2 mt-[-15px]"
                  : layout?.slide?.[locationPath]
                    ? "bottom-0 left-0"
                    : "bottom-0 left-0"
              }`}
            >
              {isDistributing ? cardDistributed.length : finalCards?.length}
            </div>

            {/* 🔹 Render Cards */}
            {finalCards?.map((card, index) => (
              <CardComponent
                key={card.id}
                isCardAccess={isDeckAccess || card?.hand === user?.uid}
                playersUid={playersList.map((p) => p.uid)}
                cardH={cardH}
                cardW={cardW}
                back={back}
                card={card}
                faceUp={face ?? card?.faceUp}
                pile={finalCards}
                order={card.order}
                index={index}
                reverseorder={reverseorder}
                layout={layout}
                isShuffling={isShuffling}
                isSelected={selectedCard?.id === card.id}
                locationPath={locationPath}
                setSelectedCard={setSelectedCard}
                updateCard={updateCard}
                isDistributing={isDistributing}
                onClick={() =>
                  isDeckAccess && selectedCard?.id !== card.id
                    ? (() => {
                        setSelectedCard(card);
                        setPileMenuAnchor(null);
                      })()
                    : setSelectedCard(null)
                }
              />
            ))}
          </div>
        </div>
      ) : isDeckAccess && roomId ? (
        <>
          {/* <Button
            variant="outlined"
            color="primary"
            onClick={() => dispatch(addDeckToRoom({ roomId, deckId, locationPath, accessId: user?.uid }))}
          >
            <GetAppIcon/>
          </Button> */}
        </>
      ) : (
        isMainBoard &&
        deckId && (
          <Button
            variant="secondary"
            color="primary"
            onClick={() =>
              dispatch(
                collectCards({
                  deckId,
                  locationPath,
                }),
              )
            }
          >
            Collect Cards
          </Button>
        )
      )}

      {/* 🔸 Action Buttons */}
      {isDeckAccess && (
        <div className="absolute bottom-0 right-0 left-0 flex overflow-x-auto gap-1 z-[${finalCards?.length + 1}] scrollbar-hide">
          {pileMenuAnchor && deckId && (
            <>
              <Button
                variant="danger"
                onClick={() => setPileMenuAnchor(null)}
                size="sm"
                className={`${actionButtonStyle}`}
              >
                ✕
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  dispatch(
                    togglePileDirection({
                      deckId,
                      locationPath,
                      pile,
                    }),
                  );
                  playExclusiveSound(playFlip, flipSound);
                }}
                size="sm"
                className={`${actionButtonStyle} `}
              >
                <span
                  style={{
                    transform: reverseorder?.[locationPath]
                      ? "rotate(0deg)"
                      : "rotate(180deg)",
                    transition: "1s",
                  }}
                >
                  <MdLoop size={20} />
                </span>
              </Button>
              {!resetFace && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    handleFlipAllCards(!!reverseorder?.[locationPath])
                  }
                  size="sm"
                  className={`${actionButtonStyle} ${
                    resetFace ? activeButtonStyle : ""
                  }`}
                >
                  Reset Face
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  dispatch(
                    handleLayout({ deckId, layout: "slide", locationPath }),
                  );
                  playExclusiveSound(playSlide, slideSound);
                }}
                size="sm"
                className={`${actionButtonStyle}`}
              >
                Slide
              </Button>
              {!(cardFace || cardsOnLocation.length < 2) && (
                <Button
                  variant="secondary"
                  disabled={cardFace || cardsOnLocation.length < 2}
                  onClick={() => {
                    switch (byRank) {
                      case null:
                        setByRank("ASE");
                        break;
                      case "ASE":
                        setByRank("DESE");
                        break;
                      case "DESE":
                        setByRank(null);
                        break;
                    }
                  }}
                  size="sm"
                  className={actionButtonStyle}
                >
                  {byRank ? (byRank === "ASE" ? "A>" : "<A") : "<A>"}
                </Button>
              )}
              {!(cardFace || !Object.keys(cardsGroupedBySuit).length) && (
                <Button
                  variant="secondary"
                  disabled={cardFace || !Object.keys(cardsGroupedBySuit).length}
                  onClick={() => handleSuit()}
                  size="sm"
                  className={actionButtonStyle}
                >
                  {bySuit ? `${bySuit}` : "Sort Suit"}
                </Button>
              )}
              {(isMainBoard ||
                (playersList &&
                  playersList.length > 1 &&
                  pile.length >= playersList.length)) && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      dispatch(
                        shuffleDeck({
                          deckId,
                          pile,
                          type: "fisher",
                          locationPath,
                        }),
                      );
                    }}
                    size="sm"
                    className={actionButtonStyle}
                  >
                    Fisher
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      dispatch(
                        shuffleDeck({
                          deckId,
                          pile,
                          type: "riffle",
                          locationPath,
                        }),
                      );
                    }}
                    size="sm"
                    className={actionButtonStyle}
                  >
                    Riffle
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      dispatch(
                        shuffleDeck({
                          deckId,
                          pile,
                          type: "pile",
                          locationPath,
                        }),
                      );
                    }}
                    size="sm"
                    className={actionButtonStyle}
                  >
                    Pile
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      dispatch(
                        shuffleAllOnce({ deckId, pile, locationPath, roomId: roomId || "" }),
                      );
                    }}
                    size="sm"
                    className={`${actionButtonStyle} ${
                      isShuffling?.[locationPath] ? activeButtonStyle : ""
                    }`}
                  >
                    Shuffle
                  </Button>
                  {roomId && playersList && playersList.length >= 1 && (
                    <Button
                      variant="secondary"
                      disabled={Boolean(isDistributing)}
                      onClick={handleDistribute}
                      size="sm"
                      className={`${actionButtonStyle} ${
                        isDistributing ? activeButtonStyle : ""
                      }`}
                    >
                      {isDistributing ? "Dealing..." : "Distribute"}
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ➡ Scroll Right */}
      {layout?.slide?.[locationPath] && pile.length > cardsPerPage && (
        <Button
          variant="secondary"
          className={`${
            pile.length <= cardsPerPage ? "hidden" : "flex"
          } flex-col absolute top-1/2 right-[-20px] -translate-y-1/2 z-[1000] w-[29px] min-h-[8px] rounded-[4px] bg-[#1f1f1f] text-[#00D8FF] border-1 border-[#00D8FF] hover:bg-[#00D8FF] hover:text-[#121212]`}
          onClick={() =>
            setStartIndex((prev) =>
              pile.length < cardsPerPage
                ? 0
                : prev === pile.length - cardsPerPage
                  ? 0
                  : Math.max(prev + 1, 0),
            )
          }
          size="sm"
        >
          <ChevronRight />
          <div>
            {pile.length - Math.min(startIndex + cardsPerPage, pile.length)}
          </div>
        </Button>
      )}
    </>
  );
};

export default Pile;
