import {
  useRef,
  useLayoutEffect,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import DeckCard from "../decks/cards/DeckCard";
import UnoCard from "../decks/cards/UnoCard";
import { updateCardInDeck } from "../decks/services/decks.services";
import {
  addDeckToRoom,
  Player,
  resetAllSkipTurn,
  updateRoomSettings,
  updateTurnState,
} from "./roomSlice";
import DeckSelectDialog from "./DeckSelectDialog";
import DropZone from "../../components/common/DropZone";
import Pile from "../decks/Pile";
import { Card } from "../decks/deckModal";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { HistoryIcon } from "lucide-react";
import CommonDialog from "../../components/ui/CustomDialog";

interface TableProps {
  cardW?: number;
  cardH?: number;
  locationPath: string;
  locationName?: string;
  roomId: string;
  playersList?: Player[];
  deckId: string | null;
  playersUid?: string[];
  isDeckAccess: boolean;
}

const Table: React.FC<TableProps> = ({
  cardW = 72,
  cardH = 104,
  locationPath,
  roomId,
  playersList = [],
  deckId,
  playersUid = [],
  isDeckAccess,
  locationName = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const [draging, setDraging] = useState<string | false>(false);
  const user = useAppSelector((state) => state.auth.user);
  const [finalCards, setFinalCards] = useState<Card[]>([]);
  const [radius, setRadius] = useState(200);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [face, setFace] = useState<boolean | null>(null);
  const [lastCardId, setLastCardId] = useState<string | null>(null);
  const { cards, back, deckInRoom } = useAppSelector((state) => state.deck);
  const { turnState, settings } = useAppSelector((state) => state.room);
  const [openDialog, setOpenDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const table = settings?.table;
  const mode = settings?.table?.mode || "Stacked";
  const currentCardFace = settings?.table?.cardFace?.[mode] || {};
  const nextTurn = user?.uid === turnState?.next;
  const currentTurn = settings?.table?.turn?.[mode] || "None";
  const turnAccess = settings?.table?.turnAccessEnabled?.[mode] || false;
  const zone1 = settings?.table?.zones?.zone1?.[mode] || false;
  const zone2 = settings?.table?.zones?.zone2?.[mode] || false;
  const zone3 = settings?.table?.zones?.zone3?.[mode] || false;
  const zone4 = settings?.table?.zones?.zone4?.[mode] || false;

  const { width = 1, height = 1 } =
    containerRef.current?.getBoundingClientRect() || {};

  const handleDeckSelect = (selectedDeckId: string) => {
    user &&
      dispatch(
        addDeckToRoom({
          roomId,
          deckId: selectedDeckId,
          locationPath,
        }),
      );
    dispatch(
      updateRoomSettings({
        roomId,
        setting: "table",
        value: {
          ...settings.table,
          mode: "Stacked",
        },
      }),
    );
    setOpenDialog(false);
  };

  useEffect(() => {
    setFace(currentCardFace?.strict ? (currentCardFace?.faceUp ?? null) : null);
  }, [currentCardFace]);

  const getCards = useMemo(() => Object.values(cards), [cards]);

  const getCardsByLocation = useCallback(
    () => getCards.filter((card) => card.locationPath === locationPath),
    [getCards, locationPath],
  );

  const pile = useMemo(() => {
    const mover = new Set<string>();
    const cardInRound: Card[] = [];
    const sliceIndex = playersList.length;
    getCardsByLocation()
      .sort((a, b) => b.order - a.order)
      .filter((card) => !!card?.hand)
      .forEach((card) => {
        if (mover.size !== sliceIndex) {
          mover.add(card.owner || card.hand || "");
          cardInRound.push(card);
        }
      });
    return cardInRound.reverse();
  }, [getCardsByLocation, playersList.length]);

  useEffect(() => {
    setFinalCards(pile);
  }, [pile]);

  const updateCard = (updatedFields: Partial<Card>) => {
    if (selectedCard && deckId) {
      dispatch(
        updateCardInDeck({ deckId, cardId: selectedCard.id, updatedFields }),
      );
    }
  };

  const isUnoDeck = deckId?.startsWith("UNO");
  // const CardComponent = isUnoDeck ? UnoCard : DeckCard;s

  useEffect(() => {
    if (!roomId || !pile.length) return;
    const latestCard = pile[pile.length - 1];
    if (lastCardId && latestCard?.id && latestCard.id !== lastCardId) {
      const willNext = playersUid.findIndex((uid) => uid === turnState?.next);
      dispatch(
        resetAllSkipTurn({
          roomId: roomId,
          playersUid: playersUid?.length
            ? [playersUid[(willNext + 1) % playersUid?.length]]
            : [],
        }),
      );
    }
    if (!lastCardId && latestCard?.id) {
      setLastCardId(latestCard.id);
    }
  }, [pile, roomId, lastCardId, turnState, playersUid, dispatch]);

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

  const renderPlayersAroundTable = () => {
    const angleStep = (2 * Math.PI) / playersList.length;
    const a = width / 2 - 30;
    const b = height / 2 - 30;
    const lastMove = pile[pile.length - 1];

    return playersList.map((player, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = -a * Math.cos(angle) * 1.15;
      const y = -b * Math.sin(angle) * 1.1;
      const pileRadius = playersList.length / 8 / 2;
      const pileX = x * pileRadius - 30;
      const pileY = y * pileRadius - 40;
      const playerPath = `${roomId}-${player.uid}-hand-pile`;
      const playerCards = getCards.filter((c) => c.locationPath === playerPath);
      const card = finalCards
        ?.filter((c) => c.hand === player.uid)
        .reverse()?.[0];

      const arrangedCards = finalCards.findLastIndex(
        (card) => card.hand === player.uid,
      );

      return (
        <div key={player.uid}>
          <div
            style={{
              position: "absolute",
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            <DropZone
              id={playerPath}
              locationName={player.displayName}
              style={{ padding: 1, cursor: "pointer" }}
            >
              <div style={{ borderRadius: 20, color: "#fff" }}>
                <Avatar
                  src={player?.avatar}
                  name={player.displayName}
                  className="w-12 h-12"
                />
                <div className="flex gap-2">
                  {player.displayName.slice(0, 5)}{" "}
                  <span className="bg-gray-100 text-black px-1 rounded-md text-bold">
                    {playerCards.length}
                  </span>
                </div>
              </div>
            </DropZone>
          </div>

          {card && table?.mode === "Circular" && (
            <div
              id={card.id}
              style={{
                height: cardH,
                width: cardW,
                zIndex: arrangedCards * 1,
                position: "absolute",
                ...(draging !== card.id && {
                  left: `calc(50% + ${pileX}px)`,
                  top: `calc(50% + ${pileY}px)`,
                  transform: `translate(-50%, -50%) rotate(${
                    draging !== card.id && `-25deg`
                  })}`,
                }),
              }}
            >
              <DeckCard
                isCardAccess={isDeckAccess}
                playersUid={playersUid}
                cardH={cardH}
                cardW={cardW}
                setDraging={setDraging}
                order={card?.order}
                back={back}
                card={card}
                pile={pile}
                faceUp={face ?? card?.faceUp}
                index={index}
                isSelected={selectedCard?.id === card.id}
                locationPath={locationPath}
                onClick={() =>
                  isDeckAccess &&
                  setSelectedCard(card.id === selectedCard?.id ? null : card)
                }
                updateCard={updateCard}
              />
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="table-container w-full h-[90%] border-2 border-[#444] rounded-[40%] bg-[#1e1e1e] flex justify-center items-center relative"
    >
      <div
        className="absolute bottom-4 right-4 cursor-pointer"
        onClick={() => setOpenHistoryDialog(true)}
      >
        <HistoryIcon />
      </div>
      <div
        style={{
          width: width / 2,
          height: height / 1.6,
        }}
      >
        <DropZone
          id={locationPath}
          locationName={locationName}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: "40%",
            margin: "auto",
          }}
        >
          {table?.mode === "Circular" && (
            <div
              style={{
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
            </div>
          )}
          {renderPlayersAroundTable()}

          {deckInRoom === roomId && deckId ? (
            table?.mode === "Stacked" && (
              <Pile
                face={face}
                isDeckAccess={isDeckAccess}
                playersList={playersList}
                cardH={cardH}
                cardW={cardW}
                roomId={roomId}
                deckId={deckId}
                locationPath={locationPath}
                isMainBoard={true}
              />
            )
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => setOpenDialog(true)}
              >
                Add Deck
              </Button>

              <DeckSelectDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                onSelect={handleDeckSelect}
              />
            </>
          )}
          <HistoryDialog
            open={openHistoryDialog}
            onClose={() => setOpenHistoryDialog(false)}
          />
        </DropZone>
      </div>
    </div>
  );
};

const HistoryDialog = ({ open, onClose }: any) => {
  const { history } = useAppSelector((state) => state.room);
  return (
    <CommonDialog open={open} title="Game History" onClose={onClose}>
      <div className="mb-4 flex flex-col gap-3 overflow-y-auto">
        {history && Object.entries(history).length > 0 ? (
          Object.values(history)
            ?.reverse()
            .map((entry: any, index: number) => (
              <div
                key={index}
                className="border-b border-gray-700 rounded-lg pb-3"
              >
                <div className="text-gray-400 text-sm flex items-center justify-between">
                  <span>{entry?.createdBy}</span>
                  <span className="text-xs">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 items-center justify-between">
                  <div className="font-semibold">{entry.action}</div>
                  <div className="text-gray-300 text-xs">{entry.details}</div>
                </div>
              </div>
            ))
        ) : (
          <p className="text-gray-400">No history available</p>
        )}
      </div>
    </CommonDialog>
  );
};

export default Table;
