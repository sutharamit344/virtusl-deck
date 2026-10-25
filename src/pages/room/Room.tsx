import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Board from "../../components/Board";
import {
  clearRoom,
  joinRoom,
  loadRoomRealtime,
  Player,
  resetAllSkipTurn,
  setPlayerSkipTurn,
  setRoom,
} from "./roomSlice";
import {
  subscribeRoomRealtime,
  setupPlayerPresence,
} from "./services/rooms.services";
import {
  getDeckRealtime,
  handleLayout,
  togglePileDirection,
} from "../decks/services/decks.services";
import PasswordDialog from "./PasswordDialog";
import { TableSettingsDialog } from "../../components/TableSettingsDialog";
import Loader from "../../components/common/Loader";
import DragDropWrapper from "../../components/common/DragDropWrapper";
import { Settings, SkipForward } from "lucide-react";
import Pile from "../decks/Pile";
import { MdLoop } from "react-icons/md";
import { enterFullscreen, getLocationPath } from "../../__Helper/common";
import Table from "./Table";
import DropZone from "../../components/common/DropZone";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Card as CardType } from "../decks/deckModal";
import { setDeck, clearDeck } from "../decks/deckSlice";
import Button from "../../components/ui/Button";
import { toast } from "react-toastify";

const actionButtonStyle =
  "h-[30px] text-[0.7rem] px-[6px] rounded-[8px] border-1 border-[#00D8FFs] bg-[#1f1f1f] text-[#00D8FF] hover:bg-[#00D8FF] hover:text-[#121212] z-[10000] font-bold";
const activeButtonStyle =
  "h-[30px] text-[0.7rem] px-[6px] rounded-[8px] border-1 border-[#00D8FFs] bg-[#00D8FF] text-[#121212] hover:bg-[#1f1f1f] hover:text-[#00D8FF] z-[10000] font-bold";

const Room: React.FC = () => {
  const params = useParams();
  const roomId = params.roomId || "";
  const dispatch = useAppDispatch();
  const [radius, setRadius] = useState(200);
  const [showSettings, setShowSettings] = useState(false);
  const { cards, deckAccess, reverseorder, layout } = useAppSelector(
    (state) => state.deck,
  );
  const user = useAppSelector((state) => state.auth.user);
  const {
    turnState,
    settings,
    deckId,
    roomName,
    hostName,
    createdAt,
    hostUid,
    password,
    players,
    loading,
  } = useAppSelector((state) => state.room);
  const [playersUid, setPlayersUid] = useState<string[]>([]);
  const [allowedIn, setAllowedIn] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [playersList, setPlayersList] = useState<Player[]>([]);
  const [byRank, setByRank] = useState<string | null>(null);
  const [bySuit, setBySuit] = useState<string | null>(null);
  const [face, setFace] = useState<boolean | null>(null);
  const [cardBySuit, setCardBySuit] = useState<Record<string, CardType[]>>({});
  const locationPath = (user && getLocationPath(roomId!, user?.uid)) ?? "";
  const isDeckAccess = deckAccess === user?.uid;
  const mode = settings?.table?.mode || "Stacked";
  const currentCardFace = settings?.table?.cardFace?.[mode] || {};
  const currentTurn = settings?.table?.turn?.[mode] || "None";
  const zone1 = settings?.table?.zones?.zone1?.[mode] || false;
  const zone2 = settings?.table?.zones?.zone2?.[mode] || false;
  const zone3 = settings?.table?.zones?.zone3?.[mode] || false;
  const zone4 = settings?.table?.zones?.zone4?.[mode] || false;

  const cardsOnLocation = useMemo(() => {
    return Object.values(cards)
      .filter((card) => card.locationPath === locationPath)
      .sort((a, b) => a.order - b.order);
  }, [cards, locationPath]);

  useEffect(() => {
    if (allowedIn) {
      setTimeout(() => {
        const roomRoot = document.getElementById("room-root");
        if (roomRoot) enterFullscreen(roomRoot);
      }, 300);
    }
  }, [allowedIn]);

  const cardFace = useMemo(() => {
    const findFace = cardsOnLocation.some((card) => card.faceUp === false);
    if (currentCardFace?.strict) {
      return currentCardFace?.faceUp ? false : true;
    } else {
      return findFace;
    }
  }, [currentCardFace, face, cardsOnLocation]);

  const isMyTurn = turnState?.current === user?.uid;
  const isNextTurn = turnState?.next === user?.uid;
  const isTurn =
    currentTurn === "Current"
      ? isMyTurn
      : currentTurn === "Next"
        ? isNextTurn
        : false;
  const willNext = playersUid.findIndex((uid) => uid === turnState?.next);

  const handleSkipTurn = () => {
    const nextPlayerUid = playersUid?.[willNext + 1];
    if (nextPlayerUid) {
      dispatch(
        resetAllSkipTurn({
          roomId: roomId!,
          playersUid: [nextPlayerUid],
        }),
      );
    }
    user &&
      dispatch(
        setPlayerSkipTurn({ roomId: roomId!, uid: user.uid, skip: true }),
      );
  };

  const cardsGroupedBySuit = useMemo<Record<string, CardType[]>>(() => {
    const grouped: Record<string, CardType[]> = {};
    cardsOnLocation.forEach((card) => {
      if (!card.suit) return;
      (grouped[card.suit] ||= []).push(card);
    });
    return grouped;
  }, [cardsOnLocation]);

  useEffect(() => {
    setFace(currentCardFace?.strict ? (currentCardFace.faceUp ?? false) : null);
  }, [currentCardFace]);

  useEffect(() => {
    if (!players || !user?.uid) return;

    const playerWithUid = Object.entries(players).map(([uid, player]) => ({
      ...player,
      uid,
    }));

    const sorted = playerWithUid.sort((a, b) => a.joinedAt - b.joinedAt);

    const index = sorted.findIndex((player) => player.uid === user.uid);
    if (index === -1) return;

    const rotated = [...sorted.slice(index), ...sorted.slice(0, index)];

    setPlayersList(rotated.map((player) => player));
  }, [players, user]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeRoomRealtime(
      roomId,
      (data) => {
        if (data) {
          dispatch(setRoom(data));
        } else {
          dispatch(clearRoom());
        }
      },
      (error) => {
        console.error("Room sync error:", error);
      },
    );

    return () => {
      unsubscribe();
      dispatch(clearRoom());
      dispatch(clearDeck());
    };
  }, [roomId, dispatch]);

  useEffect(() => {
    if (!roomId || !user?.uid || !allowedIn) return;

    const cleanupPresence = setupPlayerPresence(roomId, user.uid);
    return () => {
      cleanupPresence();
    };
  }, [roomId, user?.uid, allowedIn]);

  useEffect(() => {
    if (!deckId || !roomId) return;

    const unsubscribe = getDeckRealtime(deckId, (data) => {
      dispatch(setDeck(data));
    });

    return () => unsubscribe();
  }, [deckId, roomId, dispatch]);

  useEffect(() => {
    if (!roomId || !user || !hostUid) return;

    const alreadyJoined = !!players?.[user.uid];
    if (alreadyJoined) {
      setAllowedIn(true);
      setShowPasswordDialog(false);
      setCheckingAccess(false);
      return;
    }

    if (password) {
      setShowPasswordDialog(true);
      setAllowedIn(false);
    } else {
      dispatch(joinRoom({ roomId, user }));
      setAllowedIn(true);
      setShowPasswordDialog(false);
    }
    setCheckingAccess(false);
  }, [roomId, user, players, password, hostUid, dispatch]);

  const handlePasswordSubmit = (enteredPassword: string) => {
    if (enteredPassword === password && user) {
      dispatch(joinRoom({ roomId: roomId!, user }));
      setAllowedIn(true);
      setShowPasswordDialog(false);
    } else {
      toast("❌ Incorrect password.");
    }
  };

  useEffect(() => {
    const uids = playersList.map((player) => player.uid);
    setPlayersUid(uids);
  }, [playersList]);

  const handleSuit = () => {
    const findSuit = Object.keys(cardsGroupedBySuit).map((suit) => suit);
    const suits = [null, ...findSuit];
    const nextIndex = (suits.indexOf(bySuit) + 1) % suits.length;
    setBySuit(suits[nextIndex] ?? null);
  };

  if (loading || checkingAccess || !hostUid)
    return <Loader />;

  if (!allowedIn && showPasswordDialog) {
    return <PasswordDialog onSubmit={handlePasswordSubmit} open />;
  }

  return (
    <DragDropWrapper cards={cards} deckId={deckId} roomId={roomId!}>
      <TableSettingsDialog
        roomId={roomId!}
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <div
        id="room-root"
        className="flex flex-col h-screen bg-[#121212] text-[#E6EDF3] overflow-hidden p-3 -mb-12"
      >
        <div className="flex relative justify-between">
          {zone1 && (
            <DropZone
              id={`${roomId}-discard-pile`}
              locationName={`Discard-pile`}
              text="Z 1"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 60,
                minHeight: 60,
                backgroundColor: " #252525ff",
              }}
            >
              <Pile
                cardH={90}
                cardW={60}
                roomId={roomId}
                deckId={deckId}
                locationPath={`${roomId}-discard-pile`}
                isDeckAccess={isDeckAccess}
                isMainBoard={false}
              />
            </DropZone>
          )}
          {zone2 && (
            <DropZone
              id={`${roomId}-locked-pile`}
              locationName={`Locked-pile`}
              text="Z 2"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 60,
                minHeight: 60,
                backgroundColor: " #252525ff",
              }}
            >
              <Pile
                cardH={90}
                cardW={60}
                roomId={roomId}
                deckId={deckId}
                locationPath={`${roomId}-locked-pile`}
                isDeckAccess={isDeckAccess}
                isMainBoard={false}
              />
            </DropZone>
          )}
        </div>

        {/* Shared Board */}
        <div className="my-4 h-px w-full flex-1 items-center justify-center content-center">
          <Table
            key={settings?.table?.mode}
            cardH={90}
            cardW={60}
            isDeckAccess={isDeckAccess}
            playersUid={playersUid}
            playersList={playersList}
            roomId={roomId!}
            deckId={deckId}
            locationPath={`${roomId}-table-pile`}
            locationName="Table"
          />

          <div className="flex relative justify-between">
            {zone3 && (
              <DropZone
                id={`${roomId}-reveal-pile`}
                locationName={`Reveal-pile`}
                text="Z 3"
                style={{
                  position: "absolute",
                  bottom: -35,
                  right: 0,
                  width: 60,
                  minHeight: 60,
                  backgroundColor: " #252525ff",
                }}
              >
                <Pile
                  cardH={90}
                  cardW={60}
                  roomId={roomId}
                  deckId={deckId}
                  locationPath={`${roomId}-reveal-pile`}
                  isDeckAccess={isDeckAccess}
                  isMainBoard={false}
                />
              </DropZone>
            )}
            {zone4 && (
              <DropZone
                id={`${roomId}-${user?.uid}-private-pile`}
                locationName={`Private-pile`}
                text="Z 4"
                style={{
                  position: "absolute",
                  bottom: -35,
                  left: 0,
                  width: 60,
                  minHeight: 60,
                  backgroundColor: " #252525ff",
                }}
              >
                <Pile
                  cardH={90}
                  cardW={60}
                  roomId={roomId}
                  deckId={deckId}
                  locationPath={`${roomId}-${user?.uid}-private-pile`}
                  isDeckAccess={isDeckAccess}
                  isMainBoard={false}
                />
              </DropZone>
            )}
          </div>
        </div>

        {/* Your Hand */}
        <div className="flex-0">
          <Board
            handleCardBySuit={(suited: Record<string, CardType[]>) => {
              setCardBySuit(suited);
            }}
            isDeckAccess={true}
            face={face}
            cardH={90}
            cardW={60}
            rank={byRank}
            suit={bySuit}
            roomId={roomId!}
            deckId={deckId}
            locationPath={locationPath}
            locationName={`${user?.name}`}
          />
          <div className="flex items-center justify-center">
            <div className="flex gap-1">
              <Button
                variant="secondary"
                onClick={handleSkipTurn}
                disabled={!isTurn}
                className={actionButtonStyle}
              >
                <SkipForward size={18} />
              </Button>
              <Button
                variant="secondary"
                disabled={cardsOnLocation.length < 2}
                onClick={() => {
                  deckId &&
                    locationPath &&
                    dispatch(
                      togglePileDirection({
                        deckId,
                        locationPath,
                        pile: cardsOnLocation,
                      }),
                    );
                }}
                size="sm"
                className={`${actionButtonStyle} `}
              >
                <span
                  style={{
                    transform:
                      locationPath && reverseorder?.[locationPath]
                        ? "rotate(0deg)"
                        : "rotate(180deg)",
                    transition: "1s",
                  }}
                >
                  <MdLoop size={20} />
                </span>
              </Button>
              <Button
                variant="secondary"
                disabled={cardsOnLocation.length < 2}
                onClick={() => {
                  deckId &&
                    locationPath &&
                    dispatch(
                      handleLayout({ deckId, layout: "slide", locationPath }),
                    );
                }}
                size="sm"
                className={`${actionButtonStyle}`}
              >
                Slide
              </Button>
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
              <Button
                variant="secondary"
                disabled={cardFace || !Object.keys(cardsGroupedBySuit).length}
                onClick={() => handleSuit()}
                size="sm"
                className={actionButtonStyle}
              >
                {bySuit ? `${bySuit}` : "Sort Suit"}
              </Button>

              {hostUid === user?.uid && (
                <Button
                  variant="secondary"
                  onClick={() => setShowSettings(true)}
                  className={actionButtonStyle}
                >
                  <Settings size={18} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DragDropWrapper>
  );
};

export default Room;
