import React, { lazy, Suspense, useMemo, useState } from "react";
import { Box, Button } from "@mui/material";
import { useDroppable } from "@dnd-kit/core";
import { useDispatch, useSelector } from "react-redux";
import { addDeckToRoom } from "../redux/roomSlice";
import DeckSelectDialog from "./DeckSelectDialog"; // new import
import Pile from "./Pile";

const Board = ({ face = null, cardW = 72, cardH = 104, rank = null, suit = null, playersUid, roomId, deckId, locationPath, isDeckAccess }) => {
  const { isOver, setNodeRef } = useDroppable({ id: locationPath });

  return (
    <>
      <Box
        ref={setNodeRef}
        id={locationPath}
        sx={{
          boxSizing:"border-box",
          zIndex:isOver && 0,
          minHeight:"110px",
          border: isOver ? "2px dashed #4caf50" : "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          width: "100%",
          margin:"auto",
          borderRadius: "16px",
        }}
      >
        {deckId ? (
          <Suspense fallback="...">
          <Pile isDeckAccess={isDeckAccess} face={face} cardH={cardH} cardW={cardW} rank={rank} suit={suit} playersUid={playersUid} roomId={roomId} deckId={deckId} locationPath={locationPath} />
          </Suspense>
        ) : (
          null
        )}
      </Box>
    </>
  );
};

export default React.memo(Board);
