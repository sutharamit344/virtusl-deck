// components/Pile.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useDispatch, useSelector } from "react-redux";
import { useDraggable } from "@dnd-kit/core";
import DeckCard from "./DeckCard";
import UnoCard from "./UnoCard";
import {
  togglePileDirection,
  handleLayout,
  updateCardInDeck,
  updateAllCards,
  shuffleDeck,
  shuffleAllOnce,
  distributeCards,
  resetDeckInFirebase,
} from "../redux/deckSlice";
import useSound from "use-sound";
import { playExclusiveSound } from "../utilis/playExclusiveSound";
import { addDeckToRoom } from "../redux/roomSlice";
import GetAppIcon from "@mui/icons-material/GetApp";

// 🔹 Style
const actionButtonStyle = {
  height: 30,
  fontSize: "0.7rem",
  px: 1.5,
  borderRadius: 2,
  border: "1px solid #00D8FF",
  color: "#00D8FF",
  backgroundColor: "#1f1f1f",
  "&:hover": {
    backgroundColor: "#00D8FF",
    color: "#121212",
  },
};
const activeButtonStyle = {
  backgroundColor: "#00D8FF",
  color: "#121212",
  borderColor: "primary.main",
  "&:hover": {
    backgroundColor: "#00D8FF",
  },
};

const Pile = ({ face, cardW = 72, cardH = 104, rank = null, suit = null, playersUid, roomId, deckId, locationPath, isDeckAccess }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const divRef = useRef(null);
  const outerWidth = useRef(null);
  const holdTimeout = useRef(null);
  const [finalCards, setFinalCards] = useState([]);
  const [width, setWidth] = useState(0);
  const [outer, setOuter] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  const [pileMenuAnchor, setPileMenuAnchor] = useState(null);
  const [byRank, setByRank] = useState(null);
  const [bySuit, setBySuit] = useState(null);

  const { cards, reverseorder, layout, back, isShuffling, isDistributing } = useSelector((state) => state.deck);

  const [playFlip, { sound: flipSound }] = useSound("/sounds/flipCard.mp3");
  const [shuffleAll, { sound: shuffleAllSound }] = useSound("/sounds/shuffleAllOnce.mp3");
  const [playFisher, { sound: fisherSound }] = useSound("/sounds/fisherShuffle.mp3");
  const [playRiffle, { sound: riffleSound }] = useSound("/sounds/riffleShuffle.mp3");
  const [playPile, { sound: pileSound }] = useSound("/sounds/pileShuffle.mp3");
  const [playSlide, { sound: slideSound }] = useSound("/sounds/rowCards.mp3", { volume: 2 });
  const [playStack, { sound: stackSound }] = useSound("/sounds/stackCards.mp3");
  const [dragCard, { sound: dragSound }] = useSound("/sounds/drag.mp3");
  const [playTouch, { sound: touchSound }] = useSound("/sounds/touchCard.mp3", { volume: 0.3 });

  useEffect(() => {
    const unlockAndPlay = () => {
      if (window.Howler?.ctx?.state === "suspended") window.Howler.ctx.resume();
      window.removeEventListener("click", unlockAndPlay);
    };
    window.addEventListener("click", unlockAndPlay);
    return () => window.removeEventListener("click", unlockAndPlay);
  }, []);

  const handleSuit = () => {
    const suits = [null, "Clubs", "Diamonds", "Hearts", "Spades"];
    const nextIndex = (suits.indexOf(bySuit) + 1) % suits.length;
    setBySuit(suits[nextIndex]);
  };

  useEffect(() => {
    if (rank !== undefined) setByRank(rank);
    if (suit !== undefined) setBySuit(suit);
  }, [rank, suit]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${locationPath}`,
    data: {
      type: "pile",
      pileId: locationPath,
      pile: finalCards
    },
  });

  const startFlipTimer = (card) => {
    holdTimeout.current = setTimeout(() => {
      setSelectedCard(card);
      updateCard({ id: card.id, faceUp: !card.faceUp });
    }, 250);
  };

  const cancelFlipTimer = () => clearTimeout(holdTimeout.current);

  useEffect(() => {
  if (!divRef.current || !outerWidth.current) return;

  const updateWidth = () => {
    if (!divRef.current || !outerWidth.current) return;
    setWidth(divRef.current.getBoundingClientRect().width);
    setOuter(outerWidth.current.getBoundingClientRect().width);
  };

  updateWidth(); // Initial measurement

  const divObserver = new ResizeObserver(updateWidth);
  const outerObserver = new ResizeObserver(updateWidth);

  divObserver.observe(divRef.current);
  outerObserver.observe(outerWidth.current);

  return () => {
    divObserver.disconnect();
    outerObserver.disconnect();
  };
}, [layout]);
  
  const cardonLocation = useMemo(() => {
    return Object.entries(cards)
      .filter(([_, card]) => card.locationPath === locationPath)
  }, [cards, bySuit, byRank, locationPath]);

  const pile = useMemo(() => {
    return cardonLocation
      .filter(([_, card]) => card.locationPath === locationPath)
      .map(([_, card]) => ({ ...card }))
      .filter((card) => (bySuit ? card.suit === bySuit : true))
      .sort((a, b) => {
        if (byRank === "ASE") return a.position - b.position;
        if (byRank === "DESE") return b.position - a.position;
        return a.order - b.order;
      });
  }, [cards, bySuit, byRank, cardonLocation]);

  const cardsPerPage = useMemo(() => Math.max(1, Math.floor(width / (cardW / 2))), [width, cardW]);

  useEffect(() => {
    const isInPile = pile.some((card) => card.id === selectedCard?.id);
    if (!isInPile) setSelectedCard(null);
  }, [pile]);

  useEffect(() => {
    if (pile.length <= cardsPerPage) setStartIndex(0);
    else if (startIndex > pile.length - cardsPerPage) {
      setStartIndex(Math.max(pile.length - cardsPerPage, 0));
    }
  }, [pile.length, cardsPerPage]);

  useEffect(() => {
    if (!cardonLocation.length) setPileMenuAnchor(false);
  }, [pile]);

  const paginatedCards = useMemo(() => {
    if (layout?.fanCircle?.[locationPath]) return pile.slice(0, 8);
    if (layout?.slide?.[locationPath]) return pile.slice(startIndex, startIndex + cardsPerPage);
    return pile;
  }, [layout, pile, startIndex, cardsPerPage, locationPath]);

  const resetFace = useMemo(() => pile.every((c) => c.faceUp) || pile.every((c) => !c.faceUp), [pile]);

  const updateCard = async (updatedFields) => {
    if (!selectedCard) return;
    dispatch(updateCardInDeck({ deckId, cardId: selectedCard.id, updatedFields }));
  };

  const handleFlipAllCards = (faceUpValue) => {
    const updated = Object.fromEntries(
      pile.map((card) => [card.id, { ...card, faceUp: faceUpValue }])
    );
    dispatch(updateAllCards({ deckId, updatedCards: updated }));
  };

  const isUnoDeck = deckId?.startsWith("UNO");
  const CardComponent = isUnoDeck ? UnoCard : DeckCard;

useEffect(() => {
  setFinalCards(paginatedCards);
}, [paginatedCards]);

useEffect(() => {
  if (!isDistributing) return;

  const distribute = setInterval(() => {
    setFinalCards((prev) => {
      if (prev.length === 0) {
        clearInterval(distribute); // optional: stop distributing when done
        return prev;
      }

      const newCards = [...prev];
      newCards.pop(); // remove one card
      return newCards;
    });
  }, 200);

  return () => clearInterval(distribute);
}, [isDistributing]);

  useEffect(() => {
    !finalCards?.length && cardonLocation.length && bySuit && handleSuit()
  },[bySuit, finalCards])

  const dotOnNormal = {
    bottom: 0,
    left: 0,
  };
  const dotOnSlide = {
    bottom: 0,
    left: 0,
  };
  const dotOnFanCircle = {
    bottom: "50%",
    marginBottom: "-12px",
    left: -13,
  };

  const pileOnNormal = {
    height: pile.length * 0.3 + cardH,
    wisth: cardW + pile.length * 0.3,
  };
  const pileOnSlide = {
    height: cardH,
    minWidth: "100%",
  };
  const pileOnFanCircle = {
    height: "208px",
  };

  const pileInnerNormal = {
    width:  cardW + pile.length * 0.3,
  };
  const pileInnerSlide = {
    width: `${Math.round(outer / (cardW/2)) * (cardW/2) - (cardW/2+2)}px`,
  };
  const pileInnerFanCircle = {
    width: "auto",
  };
  
  return (
    <>
      {/* ⬅ Scroll Left */}
      {layout?.slide?.[locationPath] && (
        <IconButton
          sx={{
            display: `${pile.length <= cardsPerPage ? "none" : "flex"}`,
            flexDirection: "column",
            position: "absolute",
            top: "50%",
            left: -20,
            transform: "translateY(-50%)",
            zIndex: 1000,
            width: 29,
            minHeight: "8-px",
            borderRadius: "4px",
            backgroundColor: "#1f1f1f",
            color: "#00D8FF",
            border: "1px solid #00D8FF",
            "&:hover": {
              backgroundColor: "#00D8FF",
              color: "#121212",
            },
          }}
          onClick={() =>
            setStartIndex((prev) =>
              pile.length < cardsPerPage
                ? 0
                : prev === 0
                ? pile.length - cardsPerPage
                : Math.min(prev - 1, pile.length - cardsPerPage)
            )
          }
          size="small"
        >
          <ChevronLeftIcon />
          <div>{Math.max(startIndex, 0)}</div>
        </IconButton>
      )}

      {/* 🔹 Pile Container */}
      {cardonLocation.length ? (
        <Box
          ref={(e) => {
            outerWidth.current = e;
          }}
          sx={{
            transform: transform
              ? `translate(${transform.x}px, ${transform.y}px)`
              : "none",
            zIndex: isDragging ? 999999999 : 1,
            transition: "border 0.2s, background-color 0.2s",
            position: "relative",
            display: "flex",
            justifyContent: "center",
            ...pileOnNormal,
            ...(layout?.slide?.[locationPath] && pileOnSlide),
            ...(layout?.fanCircle?.[locationPath] && pileOnFanCircle),
          }}
        >
          <Box
          id={locationPath}
            ref={(e) => {
              isDeckAccess && setNodeRef(e);
              divRef.current = e}}
            {...(isDeckAccess && attributes)}
            {...(isDeckAccess && listeners)}
            sx={{
              height: "100%",
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-x",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              position: "relative",
              ...pileInnerNormal,
              ...(layout?.slide?.[locationPath] && pileInnerSlide),
              ...(layout?.fanCircle?.[locationPath] && pileInnerFanCircle),
            }}
          >
            {/* 🔹 Pile Size Badge */}
            <Box
              onClick={(e) => {
                if (pileMenuAnchor) {
                  setPileMenuAnchor(null);
                } else {
                  setSelectedCard(null);
                  setPileMenuAnchor(e.currentTarget);
                }
              }}
              sx={{
                userSelect: "none",
                position: "absolute",
                width: 30,
                height: 30,
                borderRadius: "25%",
                backgroundColor: "#1f1f1f",
                color: "#00D8FF",
                border: "1px solid #00D8FF",
                fontSize: "16px",
                fontWeight: "bold",
                display: pile.length ? "flex" : "none",
                alignItems: "center",
                justifyContent: "center",
                zIndex: pile.length + 10000,
                ...dotOnNormal,
                ...(layout?.slide?.[locationPath] && dotOnSlide),
                ...(layout?.fanCircle?.[locationPath] && dotOnFanCircle),
              }}
            >
              {finalCards?.length}
            </Box>

            {/* 🔹 Render Cards */}
            {finalCards?.map((card, index) => (
              <CardComponent
                key={`${card.id}-${card.order}`}
                isDeckAccess={isDeckAccess || card?.hand === user?.uid}
                isDistributing={isDistributing}
                playersUid={playersUid}
                cardH={cardH}
                cardW={cardW}
                back={back}
                card={card}
                face={face}
                cards={cards}
                pile={finalCards}
                order={card.order}
                index={index}
                reverseorder={reverseorder}
                layout={layout}
                isShuffling={isShuffling}
                isSelected={selectedCard?.id === card.id}
                locationPath={locationPath}
                onClick={() =>
                  isDeckAccess && selectedCard?.id !== card.id
                    ? (() => {
                        setSelectedCard(card);
                        setPileMenuAnchor(null);
                      })()
                    : setSelectedCard(null)
                }
                startFlipTimer={() => isDeckAccess && startFlipTimer(card)}
                cancelFlipTimer={cancelFlipTimer}
              />
            ))}
          </Box>
        </Box>
      ) : (
        isDeckAccess && roomId ? <>
          {/* <Button
            variant="outlined"
            color="primary"
            onClick={() => dispatch(addDeckToRoom({ roomId, deckId, locationPath, accessId: user?.uid }))}
          >
            <GetAppIcon/>
          </Button> */}
          </>

          :
          isDeckAccess && 
          <Button
            variant="outlined"
            color="primary"
            onClick={() => dispatch(resetDeckInFirebase({ deckId, cards }))}
          >
            Collect Cards
          </Button>
      )}

      {/* 🔸 Action Buttons */}
    { isDeckAccess && 
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          right: 0,
          left: 0,
          display: "flex",
          overflowX: "auto",
          gap: 1,
          zIndex: finalCards?.length+1,
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {selectedCard && (
          <>
            {/* <IconButton
              onClick={() => setSelectedCard(null)}
              size="small"
              sx={{
                ...actionButtonStyle,
                color: "#ff4d4d",
                borderColor: "#ff4d4d",
                fontWeight: "bold",
                ":hover": { bgcolor: "#ff4d4d", color: "white" },
              }}
            >
              ✕
            </IconButton> */}
            <IconButton
              onClick={() => {
                updateCard({ faceUp: !selectedCard?.faceUp });
                setSelectedCard((prev) => ({ ...prev, faceUp: !prev.faceUp }));
                playExclusiveSound(playFlip, flipSound);
              }}
              size="small"
              sx={{
                ...actionButtonStyle,
                m: "auto",
                ...(selectedCard.faceUp ? activeButtonStyle : {}),
              }}
            >
              {selectedCard?.faceUp ? "Face Down" : "Face Up"}
            </IconButton>
            {/* <IconButton
              onClick={() => {
                updateCard({ locationPath: "table-discard-pile" });
                setSelectedCard(null);
              }}
              size="small"
              sx={actionButtonStyle}
            >
              Discard
            </IconButton>
            <IconButton
              onClick={() => {
                updateCard({ visibleTo: [] });
                setSelectedCard(null);
              }}
              size="small"
              sx={actionButtonStyle}
            >
              Hide from All
            </IconButton> */}
          </>
        )}

        {pileMenuAnchor && (
          <>
            <IconButton
              onClick={() => setPileMenuAnchor(null)}
              size="small"
              sx={{
                ...actionButtonStyle,
                color: "#ff4d4d",
                borderColor: "#ff4d4d",
                fontWeight: "bold",
                ":hover": { bgcolor: "#ff4d4d", color: "white" },
              }}
            >
              ✕
            </IconButton>
            {playersUid &&
              playersUid.length > 1 &&
              pile.length >= playersUid.length && (
                <IconButton
                  onClick={() => {
                    dispatch(
                      distributeCards({
                        deckId: deckId,
                        roomId: roomId,
                        pile: pile,
                        playersUid: playersUid,
                      })
                    );
                  }}
                  size="small"
                  sx={{
                    ...actionButtonStyle,
                  }}
                >
                  Distrubute
                </IconButton>
              )}
            <IconButton
              onClick={() => {
                dispatch(
                  togglePileDirection({
                    deckId,
                    locationPath,
                    currentDirection: reverseorder,
                    pile,
                  })
                );
                playExclusiveSound(playFlip, flipSound);
              }}
              size="small"
              sx={{
                ...actionButtonStyle,
                ...(reverseorder?.[locationPath] ? activeButtonStyle : {}),
              }}
            >
              Face Up
            </IconButton>
            {!resetFace && (
              <IconButton
                onClick={() => handleFlipAllCards(reverseorder?.[locationPath])}
                size="small"
                sx={{
                  ...actionButtonStyle,
                  ...(resetFace ? activeButtonStyle : {}),
                }}
              >
                Reset Face
              </IconButton>
            )}
            <IconButton
              onClick={() => {
                dispatch(handleLayout({ deckId, layout:"slide", locationPath }));
                playExclusiveSound(playSlide, slideSound);
              }}
              size="small"
              sx={{
                ...actionButtonStyle,
                ...(layout?.slide?.[locationPath] ? activeButtonStyle : {}),
              }}
            >
              Slide
            </IconButton>
            <IconButton
              onClick={() => {
                dispatch(handleLayout({ deckId, layout:"fanCircle", locationPath }));
                !layout?.fanCircle?.[locationPath] && playExclusiveSound(playSlide, slideSound)
              }}
              size="small"
              sx={{
                ...actionButtonStyle,
                ...(layout?.fanCircle?.[locationPath] ? activeButtonStyle : {}),
              }}
            >
              Fan Circle
            </IconButton>
            <IconButton
              onClick={() => handleSuit()}
              size="small"
              sx={actionButtonStyle}
            >
              {bySuit ? `${bySuit}` : "Sort Suit"}
            </IconButton>
            <IconButton
              onClick={() => {
                    switch(byRank){
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
              size="small"
              sx={actionButtonStyle}
            >
              {byRank ? byRank === "ASE" ? "A>" : "<A" : "<A>"}
            </IconButton>
            <IconButton
              onClick={() => {
                dispatch(shuffleDeck({ deckId, pile, type: "fisher", locationPath }));
              }}
              size="small"
              sx={actionButtonStyle}
            >
              Fisher
            </IconButton>
            <IconButton
              onClick={() => {
                dispatch(shuffleDeck({ deckId, pile, type: "riffle", locationPath }));
              }}
              size="small"
              sx={actionButtonStyle}
            >
              Riffle
            </IconButton>
            <IconButton
              onClick={() => {
                dispatch(shuffleDeck({ deckId, pile, type: "pile", locationPath }));
              }}
              size="small"
              sx={actionButtonStyle}
            >
              Pile
            </IconButton>
            <IconButton
              onClick={() => {
                dispatch(shuffleAllOnce({ deckId, pile, locationPath }));
              }}
              size="small"
              sx={{
                ...actionButtonStyle,
                ...(isShuffling?.[locationPath] ? activeButtonStyle : {}),
              }}
            >
              All Shuffle
            </IconButton>
          </>
        )}
      </Box>
      }

      {/* ➡ Scroll Right */}
      {layout?.slide?.[locationPath] && (
        <IconButton
          sx={{
            display: `${pile.length <= cardsPerPage ? "none" : "flex"}`,
            flexDirection: "column",
            position: "absolute",
            top: "50%",
            right: -20,
            transform: "translateY(-50%)",
            zIndex: 1000,
            width: 29,
            minHeight: "8-px",
            borderRadius: "4px",
            backgroundColor: "#1f1f1f",
            color: "#00D8FF",
            border: "1px solid #00D8FF",
            "&:hover": {
              backgroundColor: "#00D8FF",
              color: "#121212",
            },
          }}
          onClick={() =>
            setStartIndex((prev) =>
              pile.length < cardsPerPage
                ? 0
                : prev === pile.length - cardsPerPage
                ? 0
                : Math.max(prev + 1, 0)
            )
          }
          size="small"
        >
          <ChevronRightIcon />
          <div>
            {pile.length - Math.min(startIndex + cardsPerPage, pile.length)}
          </div>
        </IconButton>
      )}
    </>
  );
};

export default Pile;
