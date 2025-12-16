import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Avatar, Grid, IconButton, Card } from "@mui/material";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Board from "../components/Board";
import { joinRoom, loadRoomRealtime, resetAllSkipTurn, setPlayerSkipTurn, updateTurnState } from "../redux/roomSlice";
import { loadDeckWithRealtime } from "../redux/deckSlice";
import PasswordDialog from "../components/PasswordDialog";
import Loader from "../components/Loader";
import DragDropWrapper from "../utilis/DragDropWrapper";
import Table from "../components/Table";
import SettingsIcon from '@mui/icons-material/Settings';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import TableSettingsDialog from "../components/TableSettingsDialog";
import DropZone from "../components/DropZone";
import Pile from "../components/Pile";

const actionButtonStyle = {
  height: 30,
  fontSize: "0.8rem",
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

const Room = () => {
  const {roomId } = useParams();
  const dispatch = useDispatch();
  const [radius, setRadius] = useState(200);
  const [showSettings, setShowSettings] = useState(false);
  const {cards, deckAccess } = useSelector((state) => state.deck);
  const user = useSelector((state) => state.auth.user);
  const {turnState, settings, deckId, roomName, hostName, createdAt, hostUid, password, players, loading } = useSelector( (state) => state.room );
  const [playersUid, setPlayersUid] = useState([])
  const [allowedIn, setAllowedIn] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [playersList, setPlayersList] = useState([]);
  const [byRank, setByRank] = useState(null)
  const [bySuit, setBySuit] = useState(null)
  const [face, setFace] = useState(null);
  const [cardBySuit, setCardBySuit] = useState({})
  const locationPath = `${roomId}-${user?.uid}-hand-pile`
  const isDeckAccess = deckAccess === user?.uid
  const mode = settings?.table?.mode || "Stacked";
  const currentCardFace = settings?.table?.cardFace?.[mode] || {};
  const handKey = `${mode}_hand`;
  const currentHandFace = settings?.table?.cardFace?.[handKey] || {};
  const currentTurn = settings?.table?.turn?.[mode] || "None";
  const zone1 = settings?.table?.zones?.zone1?.[mode] || false;
  const zone2 = settings?.table?.zones?.zone2?.[mode] || false;
  const zone3 = settings?.table?.zones?.zone3?.[mode] || false;
  const zone4 = settings?.table?.zones?.zone4?.[mode] || false;

  const isMyTurn = turnState?.current === user?.uid;
  const isNextTurn = turnState?.next === user?.uid;
  const isTurn = currentTurn === "Current" ? isMyTurn : currentTurn === "Next" ? isNextTurn : false;
  const willNext = playersUid.findIndex((uid) => uid === turnState?.next)

  const handleSkipTurn = () => {
  dispatch(resetAllSkipTurn(roomId, [playersUid[willNext+1]]));
  dispatch(setPlayerSkipTurn({ roomId, uid: user.uid, skip: true }));
};


const cardsGroupedBySuit = useMemo(() => {
  const grouped = {};
  Object.entries(cards).forEach(([_, card]) => {
    if (card.locationPath === locationPath) {
      if (!grouped[card.suit]) grouped[card.suit] = [];
      grouped[card.suit].push(card);
    }
  });
  return grouped;
}, [cards]);

  useEffect(() => {
    setFace(currentCardFace?.strict ? currentCardFace.faceUp ?? false : null);
  }, [currentCardFace]);

  useEffect(() => {
    if (!players || !user?.uid) return;
    const sorted = Object.entries(players).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);
    const index = sorted.findIndex(([uid]) => uid === user.uid);
    const rotated = [...sorted.slice(index), ...sorted.slice(0, index)];
    const playerArray = rotated.map(([uid, data]) => ({ uid, ...data }));
    setPlayersList(playerArray);
  }, [players, user?.uid]);

  useEffect(() => {
    if (roomId) dispatch(loadRoomRealtime(roomId));
  }, [roomId, dispatch]);

  useEffect(() => {
    const unsub = dispatch(loadDeckWithRealtime(deckId));
    return () => unsub;
  }, [deckId, roomId]);

  useEffect(() => {
    if (!roomId || !user) return;
    const alreadyJoined = !!players?.[user.uid];
    if (alreadyJoined) {
      setAllowedIn(true);
      setShowPasswordDialog(false);
      setCheckingAccess(false);
      return;
    }
    if (password) {
      setShowPasswordDialog(true);
    } else {
      dispatch(joinRoom({ roomId, user }));
    }
    setCheckingAccess(false);
  }, [roomId, user, players]);

  const handlePasswordSubmit = (enteredPassword) => {
    if (enteredPassword === password) {
      dispatch(joinRoom({ roomId, user }));
      setAllowedIn(true);
      setShowPasswordDialog(false);
    } else {
      alert("❌ Incorrect password.");
    }
  };

  useEffect(() => {
    const uids = playersList.map((player) => player.uid)
    setPlayersUid(uids)
  },[players])

  const handleSuit = (suit) => {
    bySuit !== suit ? setBySuit(suit) : setBySuit(null)
  }

  if (loading || checkingAccess || !hostUid || !allowedIn) return <Loader />;

  if (!allowedIn) {
    return (
      <PasswordDialog
        open={showPasswordDialog}
        onSubmit={handlePasswordSubmit}
        onClose={() => setShowPasswordDialog(false)}
      />
    );
  }

  return (
    <DragDropWrapper cards={cards} deckId={deckId}>
        <TableSettingsDialog
          roomId={roomId}
          open={showSettings}
          onClose={() => setShowSettings(false)}
          radius={radius}
          setRadius={setRadius}
        />
      <Grid
        container
        direction="column"
        spacing={2}
        sx={{ height: "100vh", color: "#E6EDF3", overflow: "hidden", p:3 }}
      >
          <Box
          sx={{
            display:"flex",
            position:"relative",
            justifyContent:"space-between"
          }}>
            {
              zone1 && 
            <DropZone id={`${roomId}-discard-pile`}
             text="Z 1"
             sx={{
              position:"absolute",
              top:0,
              left:0,
              width:60,
              minHeight:60,
              backgroundColor:" #252525ff"
            }}>
            <Pile playersUid={playersUid} cardH={90} cardW={60} roomId={roomId} deckId={deckId} locationPath={`${roomId}-discard-pile`} />
            </DropZone>
            }
            {
              zone2 && 
            <DropZone id={`${roomId}-locked-pile`}
             text="Z 2"
             sx={{
              position:"absolute",
              top:0,
              right:0,
              width:60,
              minHeight:60,
              backgroundColor:" #252525ff"
              }}>
            <Pile playersUid={playersUid} cardH={90} cardW={60} roomId={roomId} deckId={deckId} locationPath={`${roomId}-locked-pile`} />
            </DropZone>
            }
          </Box>
        {/* Players List */}
        {/* <Grid item sx={{ flex: "0 0 auto", borderBottom: "1px solid #2a2a2a" }}>
          <Typography variant="subtitle2" textTransform="uppercase">
            {roomName} - {roomId} - {deckId}
          </Typography>
          
          <Box
            sx={{
              display: "flex",
              overflowX: "auto",
              py: 1,
            }}
          >
            {playersList.map((player) => (
              <DropZone key={player.uid} id={`${roomId}/${player.uid}/hand/pile`}>
              <Box
                sx={{ display: "flex", flexDirection: "column", alignItems: "center",px:1 }}
              >
                <Box position="relative">
                  <Avatar
                    src={player.avatar}
                    sx={{
                      width: 40,
                      height: 40,
                      border: player?.host ? "2px solid #00D8FF" : "2px solid transparent",
                    }}
                  />
                  {player?.host && (
                    <Box
                      component="img"
                      src="/vc logo.png"
                      sx={{
                        height: 15,
                        width: 15,
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        borderRadius: "50%",
                        border: "1px solid #121212",
                      }}
                    />
                  )}
                </Box>
                <Typography variant="caption" sx={{ mt: 0.5 }}>
                  {player.displayName.split(" ")[0]}
                </Typography>
              </Box>
              </DropZone>
            ))}
          </Box>
        </Grid> */}

        {/* Shared Board */}
        <Grid item flex="1 1 auto" sx={{alignItems:"center", justifyContent:"center", alignContent:"center"}}>
        {/* <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <Board
            playersUid={playersUid}
            roomId={roomId}
            deckId={deckId}
            locationPath={`${roomId}-table-pile`}
          />
        </Box> */}
        <Table
            key={settings?.table?.mode}
            cardH={90}
            cardW={60}
            isDeckAccess={isDeckAccess}
            playersUid={playersUid}
            playersList={playersList}
            roomId={roomId}
            deckId={deckId}
            locationPath={`${roomId}-table-pile`}
        />
        
          <Box
          sx={{
            display:"flex",
            position:"relative",
            justifyContent:"space-between"
          }}>
            {
              zone3 && 
            <DropZone id={`${roomId}-reveal-pile`}
             text="Z 3"
              sx={{
              position:"absolute",
              bottom:-35,
              right:0,
              width:60,
              minHeight:60,
              backgroundColor:" #252525ff"
              }}>
            <Pile playersUid={playersUid} cardH={90} cardW={60} roomId={roomId} deckId={deckId} locationPath={`${roomId}-reveal-pile`} />
            </DropZone>
            }
            {
              zone4 && 
            <DropZone id={`${roomId}-${user.uid}-private-pile`}
             text="Z 4"
              sx={{
              position:"absolute",
              bottom:-35,
              left:0,
              width:60,
              minHeight:60,
              backgroundColor:" #252525ff"
              }}>
            <Pile playersUid={playersUid} cardH={90} cardW={60} roomId={roomId} deckId={deckId} locationPath={`${roomId}-${user.uid}-private-pile`} />
            </DropZone>
            }
          </Box>
      </Grid>
      

        {/* Your Hand */}
        <Grid item flex="0 0 auto">
          <Board
            handleCardBySuit={(suited) => {
              setCardBySuit(suited)
            }}
            isDeckAccess={true}
            face={face}
            cardH={90}
            cardW={60}
            rank={byRank}
            suit={bySuit}
            roomId={roomId}
            deckId={deckId}
            locationPath={locationPath}
          />
          <Box sx={{display: "flex", alignItems: "center", justifyContent:"center"}}>
            {/* <Avatar
              src={user.avatar}
              sx={{
                width: 40,
                height: 40,
                border: user?.host ? "2px solid #00D8FF" : "2px solid transparent",
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: user?.host ? "#00D8FF" : "#ccc" }}
            >
              {user?.name?.split(" ")[0]}
            </Typography> */}

            <Box sx={{display:"flex", gap:1}}>
              
            <IconButton
              onClick={handleSkipTurn}
              disabled={!isTurn}
              sx={{
                ...actionButtonStyle
              }}
            >
              <SkipNextIcon/>
            </IconButton>
            <IconButton
            disabled={!Object.keys(cardsGroupedBySuit).length}
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
              disabled={!cardsGroupedBySuit?.Spades?.length}
              onClick={() => handleSuit("Spades")}
              size="small"
              sx={{
                ...actionButtonStyle,
                ...(bySuit === "Spades" ? activeButtonStyle : {})
              }}
            >
              {`\u2660`}
            </IconButton>
            <IconButton
              disabled={!cardsGroupedBySuit?.Hearts?.length}
              onClick={() => handleSuit("Hearts")}
              size="small"
              sx={{
                ...actionButtonStyle,
                ...(bySuit === "Hearts" ? activeButtonStyle : {})
              }}
            >
              {`\u2665	`}
            </IconButton>
            <IconButton
              disabled={!cardsGroupedBySuit?.Diamonds?.length}
              onClick={() => handleSuit("Diamonds")}
              size="small"
              sx={{
                ...actionButtonStyle,
                ...(bySuit === "Diamonds" ? activeButtonStyle : {})
              }}
            >
              {`\u2666`}
            </IconButton>
            <IconButton
              disabled={!cardsGroupedBySuit?.Clubs?.length}
              onClick={() => handleSuit("Clubs")}
              size="small"
              sx={{
                ...actionButtonStyle,
                ...(bySuit === "Clubs" ? activeButtonStyle : {})
              }}
            >
              {`\u2663`}
            </IconButton>
            {
              hostUid === user.uid &&
            <IconButton
              onClick={() => setShowSettings(true)}
              sx={{
                ...actionButtonStyle,
              }}>
              <SettingsIcon/>
            </IconButton>
            }
            </Box>
          </Box>
        </Grid>
      </Grid>
    </DragDropWrapper>
  );
};

export default Room;
