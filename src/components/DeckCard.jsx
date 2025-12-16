import React, { useEffect, useRef, useState } from "react";
import { Avatar, Box } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import useSound from "use-sound";
import { playExclusiveSound } from "../utilis/playExclusiveSound";
import "../index.css";

const suitSymbols = {
  Spades: "♠",
  Hearts: "♥",
  Clubs: "♣",
  Diamonds: "♦",
};

const suitColors = {
  Spades: "#000",
  Clubs: "#000",
  Hearts: "#e53935",
  Diamonds: "#e53935",
};

const DeckCard = ({
  face,
  cardW = 72,
  cardH = 104,
  playersUid = [],
  startFlipTimer,
  cancelFlipTimer,
  order,
  isSelected,
  pile,
  card,
  index,
  cards,
  reverseorder,
  layout,
  isShuffling,
  onClick,
  back,
  isDistributing,
  locationPath,
  setDraging,
  isDeckAccess,
}) => {
  const [faceUp, setFace] = useState(false);
  const flipRef = useRef(faceUp);
  const cardRef = useRef(null);
  const prevCardsRef = useRef(pile.map(c => c.faceUp));
  const [firstRender, setFirstRender] = useState(true);

  const [playTouch, { sound: touchSound }] = useSound("/sounds/touchCard.mp3", { volume: 0.3 });
  const [dragCard, { sound: dragSound }] = useSound("/sounds/drag.mp3", { volume: 1 });

  const { attributes, isOver, listeners, setNodeRef, transform, isDragging, } = useDraggable({
    id: card.id,
    data: { type: "card", cardId: card.id },
  });

  useEffect(() => {
    setDraging &&  setDraging(isDragging)
  },[isDragging])

  const playerIndex = index % playersUid.length;
  const anglePerPlayer = 360 / playersUid.length;
  const dealAngle = anglePerPlayer * playerIndex + anglePerPlayer;
  const radialStyle = {
    "--deal-angle": `${dealAngle}deg`,
    "--deal-radius": `180px`,
    "--deal-delay": `${(cards?.length - index) * 200}ms`,
  };

  useEffect(() => {
    setFace(face ?? card?.faceUp);
  }, [card, face]);

  useEffect(() => {
    playExclusiveSound(playTouch, touchSound);
  }, [isSelected]);

  useEffect(() => {
    playExclusiveSound(dragCard, dragSound);
  }, [isDragging]);

  const getAnimation = () => {
    const shuffle = isShuffling?.[locationPath];
    if (!shuffle) return "none";
    switch (shuffle.type) {
      case "fisher": return "fisherShuffle 1s ease";
      case "riffle": return "riffleShuffle 1s ease";
      case "pile": return "pileShuffle 1s ease";
      case "shuffleAllOnce": return "allShuffle 3s ease";
      default: return "none";
    }
  };

  const baseStyle = {
    boxSizing: "border-box",
    bgcolor: "transparent",
    width: cardW,
    height: cardH,
    position: "absolute",
    boxShadow: "0 0 8px hsla(0, 0%, 0%, 0.20)",
    borderRadius: 2,
    touchAction: "none",
    perspective: "1000px",
    transformOrigin: "bottom left",
    animation: getAnimation(),
  };

  const dragStyle = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    zIndex: isDragging ? 9999999999 : 1,
  };

  const selectedStyle = isSelected ? {
    marginTop: -(cardH / 50),
    marginBottom: cardH / 50,
  } : {};

  const normalLayout = reverseorder?.[locationPath]
    ? { bottom: order * 0.3, right: order * 0.3 }
    : { top: order * 0.3, left: order * 0.3 };

  const rowStyle = layout?.slide?.[locationPath]
    ? { left: index * (cardW / 2), bottom: 0, top: 0, right: 0 }
    : {};

  const fanCircleStyle = (() => {
    const total = pile.length;
    const angle = (320 / total) * index;
    const rad = (angle * Math.PI) / 180;
    const x = 90 * Math.cos(rad);
    const y = 90 * Math.sin(rad);
    return transform
      ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 99999 }
      : { top: `${y}px`, left: `${x}px`, transform: `rotate(${angle}deg)` };
  })();

  return (
    <Avatar
      id={card.id + card.order}
      className={`deck-card ${isDistributing ? "dealRadial" : ""}`}
      style={isDistributing ? radialStyle : {}}
      ref={(el) => {
        isDeckAccess && setNodeRef(el);
        cardRef.current = el;
      }}
      onClick={onClick}
      onMouseDown={startFlipTimer}
      onTouchStart={startFlipTimer}
      onMouseUp={cancelFlipTimer}
      onTouchEnd={cancelFlipTimer}
      onMouseLeave={cancelFlipTimer}
      {...(isDeckAccess && listeners)}
      {...(isDeckAccess && attributes)}
      sx={{
        zIndex: isOver ? order : order * 100,
        ...baseStyle,
        ...dragStyle,
        ...selectedStyle,
        ...(!layout?.slide?.[locationPath] && !layout?.fanCircle?.[locationPath] ? normalLayout : {}),
        ...rowStyle,
        ...(layout?.fanCircle?.[locationPath] ? fanCircleStyle : {}),
      }}
      variant="rounded"
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          position: "relative",
          transform: faceUp ? "rotateY(180deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
          transition: "0.6s",
        }}
      >
        {!faceUp && (
          <Box
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "8px",
              backfaceVisibility: "hidden",
              backgroundImage: `url("${back}")`,
              backgroundSize: "110% 110%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        )}

        {faceUp && (
          <Box
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              bgcolor: "rgb(248, 248, 248)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              borderRadius: "8px",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              color: suitColors[card.suit] || "#fff",
            }}
          >
            {/* Top Left */}
            <Box sx={{ position: "absolute", top: 6, left: 6, textAlign: "left", fontSize: cardH / 6, fontWeight: "bold" }}>
              <Box fontWeight="bold">{card.rank}</Box>
              <Box sx={{ fontSize: cardH / 5 }}>{suitSymbols[card.suit]}</Box>
            </Box>

            {/* Bottom Right */}
            <Box sx={{ position: "absolute", bottom: 6, right: 6, textAlign: "right", fontSize: cardH / 6, fontWeight: "bold" }}>
              <Box fontWeight="bold">{card.rank}</Box>
              <Box sx={{ fontSize: cardH / 5 }}>{suitSymbols[card.suit]}</Box>
            </Box>

            {/* Center Symbol */}
            <Box sx={{ fontSize: cardW / 2, opacity: 0.15 }}>{suitSymbols[card.suit]}</Box>
          </Box>
        )}
      </Box>
    </Avatar>
  );
};

export default DeckCard;
