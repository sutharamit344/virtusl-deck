import { useRef, useLayoutEffect, useState, useMemo, useEffect, useCallback, } from "react";
import { Box, Typography, Avatar, Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import DropZone from "./DropZone";
import Pile from "./Pile";
import DeckCard from "./DeckCard";
import UnoCard from "./UnoCard";
import { updateCardInDeck } from "../redux/deckSlice";
import { addDeckToRoom, resetAllSkipTurn, updateTurnState } from "../redux/roomSlice";
import DeckSelectDialog from "./DeckSelectDialog";

const Table = ({ cardW = 72, cardH = 104, locationPath, roomId, playersList = [], deckId, playersUid = [], isDeckAccess, }) => {
  const containerRef = useRef(null);
  const holdTimeout = useRef();
  const [userDecks] = useState();
  const dispatch = useDispatch();
  const [draging, setDraging] = useState(false)
  const user = useSelector((state) => state.auth.user);
  const [finalCards, setFinalCards] = useState([]);
  const [radius, setRadius] = useState(200);
  const [selectedCard, setSelectedCard] = useState(null);
  const [face, setFace] = useState(null);
  const [lastCardId, setLastCardId] = useState(null);
  const { cards, back, deckInRoom } = useSelector((state) => state.deck);
  const { turnState, settings } = useSelector((state) => state.room);
  const [openDialog, setOpenDialog] = useState(false);
  const table = settings?.table;
  const mode = settings?.table?.mode || "Stacked";
  const currentCardFace = settings?.table?.cardFace?.[mode] || {};
  const handKey = `${mode}_hand`;
  const isCurrentTurn = user.uid === turnState?.current;
  const nextTurn = user.uid === turnState?.next;
  const currentHandFace = settings?.table?.cardFace?.[handKey] || {};
  const currentTurn = settings?.table?.turn?.[mode] || false;
  const turnAccess = settings?.table?.turnAccessEnabled?.[mode] || false;
  const zone1 = settings?.table?.zones?.zone1?.[mode] || false;
  const zone2 = settings?.table?.zones?.zone2?.[mode] || false;
  const zone3 = settings?.table?.zones?.zone3?.[mode] || false;
  const zone4 = settings?.table?.zones?.zone4?.[mode] || false;

  const { width = 1, height = 1 } = containerRef.current?.getBoundingClientRect() || {};

  const handleDeckSelect = (selectedDeckId) => {
    dispatch(addDeckToRoom({ roomId, deckId: selectedDeckId, locationPath, accessId: user?.uid }));
    setOpenDialog(false);
  };

  useEffect(() => {
    setFace(currentCardFace?.strict ? currentCardFace.faceUp ?? false : null);
  }, [currentCardFace]);

  const getCards = useMemo(() => Object.values(cards), [cards]);

  const getCardsByLocation = useCallback(() =>
    getCards.filter((card) => card.locationPath === locationPath
  ),[getCards, locationPath]);

  const pile = useMemo(() => {
    const mover = new Set();
    const cardInRound = [];
    const sliceIndex = playersList.length;
    getCardsByLocation()
      .sort((a, b) => b.order - a.order)
      .filter((card) => !!card?.hand)
      .forEach((card) => {
        if (mover.size !== sliceIndex) {
          mover.add(card.owner);
          cardInRound.push(card);
        }
      });
    return cardInRound.reverse();
  }, [getCardsByLocation, playersList.length]);

  useEffect(() => {
    setFinalCards(pile);
  }, [pile]);

  const updateCard = (updatedFields) => {
    if (selectedCard) {
      dispatch(
        updateCardInDeck({ deckId, cardId: selectedCard.id, updatedFields })
      );
    }
  };

  const startFlipTimer = (card) => {
    holdTimeout.current = setTimeout(() => {
      setSelectedCard(card);
      updateCard({ id: card.id, faceUp: !card.faceUp });
    }, 500);
  };

  const cancelFlipTimer = () => clearTimeout(holdTimeout.current);
  const isUnoDeck = deckId?.startsWith("UNO");
  const CardComponent = isUnoDeck ? UnoCard : DeckCard;

  useEffect(() => {
    if (!roomId || !pile.length) return;
    const latestCard = pile[pile.length - 1];
    if (lastCardId && latestCard?.id && latestCard.id !== lastCardId) {
      const willNext = playersUid.findIndex((uid) => uid === turnState?.next);
      dispatch(
        resetAllSkipTurn(roomId, [
          playersUid[(willNext + 1) % playersUid?.length],
        ])
      );
    }
    if (!lastCardId && latestCard?.id) {
      setLastCardId(latestCard.id);
    }
  }, [pile]);

  useLayoutEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setRadius(Math.min(width, height) / 2.5);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const getTurnState = () => {
    if (!pile.length || !playersList.length){
       dispatch(updateTurnState({roomId, turnState:{ prev:"", current:"", next:"" }}))
    }
    const lastCard = pile[pile.length - 1];
    const currentIndex = playersList.findIndex((p) => p.uid === lastCard?.hand);
    if (currentIndex === -1) return null;
    const skipMode = table?.turn?.skip || "manual";
    const hasCards = (uid) => {
      const path = `${roomId}-${uid}-hand-pile`;
      return getCards.some((c) => c.locationPath === path);
    };

    const getNextPlayer = () => {
      for (let i = 1; i <= playersList.length; i++) {
        const nextIndex = (currentIndex + i) % playersList.length;
        const nextPlayer = playersList[nextIndex];
        const canPlay = hasCards(nextPlayer.uid) && !nextPlayer.skipTurn;
        if (skipMode === "auto") {
          if (canPlay) return nextPlayer.uid;
        } else {
          if (!nextPlayer.skipTurn) return nextPlayer.uid;
        }
      }
      return null;
    };

    const getPrevPlayer = () => {
      for (let i = 1; i <= playersList.length; i++) {
        const prevIndex =
          (currentIndex - i + playersList.length) % playersList.length;
        const prevPlayer = playersList[prevIndex];
        const canPlay = hasCards(prevPlayer.uid) && !prevPlayer.skipTurn;
        if (skipMode === "auto") {
          if (canPlay) return prevPlayer.uid;
        } else {
          if (!prevPlayer.skipTurn) return prevPlayer.uid;
        }
      }
      return null;
    };

    const next = getNextPlayer();
    const prev = getPrevPlayer();
    const current = playersList[currentIndex]?.uid;
    return { prev, current, next };
  };

  useEffect(() => {
    const turnState = getTurnState();
    if (turnState) {
      dispatch(updateTurnState({ roomId, turnState }));
    } else {
      // dispatch(updateTurnState({roomId, turnState:{ prev:"", current:"", next:"" }}))
    }
  }, [pile, playersList, table]);


  const renderPlayersAroundTable = () => {
    const angleStep = (2 * Math.PI) / playersList.length;
    const a = width / 2 - 30;
    const b = height / 2 - 30;
    const lastMove = pile[pile.length - 1];
    const lastIndex = playersList.findIndex((p) => p.uid === lastMove?.hand);
    const nextTurnUid = playersUid[lastIndex + 1];

    return playersList.map((player, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = -a * Math.cos(angle) * 1.15;
      const y = -b * Math.sin(angle) * 1.1;
      const pileRadius = playersList.length / 8 / 2;
      const pileX = x * pileRadius;
      const pileY = y * pileRadius;
      const playerPath = `${roomId}-${player.uid}-hand-pile`;
      const playerCards = getCards.filter((c) => c.locationPath === playerPath);
      const card = finalCards ?.filter((c) => c.hand === player.uid) .reverse()?.[0];a
      const isMyTurn = player.uid === turnState?.current;
      const isNextTurn = player.uid === turnState?.next;
      const isTurn = currentTurn === "Current" ? isMyTurn : currentTurn === "Next" ? isNextTurn : false;

      return (
        <Box key={player.uid}>
          <Box
            sx={{
              position: "absolute",
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            <DropZone id={playerPath} sx={{ p: 1 }}>
              <Box
                sx={{ borderRadius: 20, color: isTurn ? "#00D8FF" : "#fff" }}
              >
                <Avatar
                  src={player.avatar}
                  alt={player.displayName}
                  sx={{
                    border: isTurn ? "5px solid #00D8FF" : "1px solid #fff",
                    width: 48,
                    height: 48,
                  }}
                />
                <Box
                  sx={{
                    height: 18,
                    width: 18,
                    position: "absolute",
                    bottom: 28,
                    right: "50%",
                    marginRight: "-9px",
                    borderRadius: "50%",
                    backgroundColor: "#000",
                    border: "2px solid #121212",
                    lineHeight: "18px",
                    display: "flex",
                    justifyContent: "center",
                    alignContent: "center",
                  }}
                >
                  {playerCards.length}
                </Box>
                <Typography variant="caption">
                  {player.displayName.slice(0, 5)}
                </Typography>
              </Box>
            </DropZone>
          </Box>

          {card && table?.mode === "Circular" && (
            <Box
              sx={{
                height: cardH,
                width: cardW,
                position: "absolute",
                left: `calc(50% + ${pileX}px)`,
                top: `calc(50% + ${pileY}px)`,
                transform:  `translate(-50%, -50%) rotate(${ !draging && `-35deg`})}`,
                zIndex: card.order,
              }}
            >
              <CardComponent
                key={`${card.id}-${card.order}`}
                isDeckAccess={isMyTurn && card?.hand === user?.uid}
                playersUid={playersUid}
                cardH={cardH}
                cardW={cardW}
                setDraging={setDraging}
                order={card?.order}
                back={back}
                card={card}
                pile={pile}
                face={face}
                index={index}
                isSelected={selectedCard?.id === card.id}
                locationPath={locationPath}
                onClick={() =>
                  isDeckAccess || card?.hand === user?.uid &&
                  setSelectedCard(card.id === selectedCard?.id ? null : card)
                }
                startFlipTimer={() => isDeckAccess || card?.hand === user?.uid && startFlipTimer(card)}
                cancelFlipTimer={cancelFlipTimer}
              />
            </Box>
          )}
        </Box>
      );
    });
  };

  return (
      <Box
        ref={containerRef}
        className="table-container"
        sx={{
          width: "100%",
          height: "90%",
          border: "2px solid #444",
          borderRadius: "40%",
          backgroundColor: "#1e1e1e",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            width: width / 2,
            height: height / 1.6,
            // width: isDragging ? cardW*2 : width / 2,
            // height: isDragging ? cardH*2 : height / 2,
          }}
        >
          <DropZone
            id={locationPath}
            disabled={isCurrentTurn}
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: "40%",
              margin: "auto",
            }}
          >
            {
              table?.mode === "Circular" &&
            <Box
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
                zIndex: pile.length + 1,
              }}
            >
              {finalCards?.length}
            </Box>
            }
            {renderPlayersAroundTable()}

          {deckInRoom === roomId && deckId ? (
            table?.mode === "Stacked" &&
              <Pile
                face={face}
                isDeckAccess={isDeckAccess}
                playersUid={playersUid}
                cardH={cardH}
                cardW={cardW}
                roomId={roomId}
                deckId={deckId}
                locationPath={locationPath}
              />
      ) : (
        <>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setOpenDialog(true)}
          >
            Add Deck
          </Button>

          <DeckSelectDialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            decks={userDecks}
            onSelect={handleDeckSelect}
          />
        </>
      )}
          </DropZone>
        </Box>
    </Box>
  );
};

export default Table;
