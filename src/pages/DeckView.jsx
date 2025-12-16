import React, { lazy, Suspense, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Button, CircularProgress, Container, Grid } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { loadDeckWithRealtime, resetDeckInFirebase, } from "../redux/deckSlice";
import Board from "../components/Board";
import DragDropWrapper from "../utilis/DragDropWrapper";

const DeckView = () => {
  const { deckId } = useParams();
  const dispatch = useDispatch();
  const { cards, loading } = useSelector((state) => state.deck);

  useEffect(() => {
    const unsub = dispatch(loadDeckWithRealtime(deckId));
    return () => unsub;
  }, [deckId]);

  const locationPaths = useMemo(() => {
    const locations = new Set();
    Object.values(cards).forEach((card) => {
      locations.add(card.locationPath);
    });
    return Array.from(locations);
  }, [cards]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DragDropWrapper cards={cards} deckId={deckId}>
      <Grid
        container
        direction="column"
        spacing={2}
        sx={{ color: "#E6EDF3", p:3, pt:10 }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="p">DECK ID : {deckId}</Typography>
        </Box>
        

            <Board deckId={deckId} isDeckAccess={true} locationPath={"table-pile"} />
        {locationPaths
          .filter((loc) => loc !== "table-pile")
          .map((location) => (
            <Board key={location} isDeckAccess={true} deckId={deckId} locationPath={location} />
          ))}
      </Grid>
    </DragDropWrapper>
  );
};

export default DeckView;
