import React, { useEffect, useRef, useState } from "react";
import { Avatar, Box, Typography } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import useSound from "use-sound";
import { playExclusiveSound } from "../utilis/playExclusiveSound";

const unoColors = {
  Red: "#e53935",
  Yellow: "#fdd835",
  Green: "#43a047",
  Blue: "#1e88e5",
  Black: "#424242",
};

const textColors = {
  Red: "#fff",
  Yellow: "#000",
  Green: "#fff",
  Blue: "#fff",
  Black: "#fff",
};

const getUnoLabel = (card) => {
  if (card.type === "number") return card.number;
  if (card.type === "skip") return "⛔";
  if (card.type === "reverse") return "🔁";
  if (card.type === "draw2") return "+2";
  if (card.type === "wild") return "★";
  if (card.type === "wildDraw4") return "+4";
  return "?";
};

const UnoCard = ({order, isSelected, pile, card, index, reverseorder, layout, isShuffling, onClick, back }) => {
 
   const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
     id: card.id,
     data: { type: "card", cardId: card.id, },
   });
 
   const flipRef = useRef(card.faceUp);
   const prevCardsRef = useRef(pile.map(c => c.faceUp));

  const [playFlip, { sound: flipSound }] = useSound("/sounds/flipCard.mp3", { volume: 0.3 });
  const [playFisher, { sound: fisherSound }] = useSound("/sounds/fisherShuffle.mp3", { volume: 0.3 });
  const [playRiffle, { sound: riffleSound }] = useSound("/sounds/riffleShuffle.mp3", { volume: 0.3 });
  const [playPile, { sound: pileSound }] = useSound("/sounds/pileShuffle.mp3", { volume: 0.3 });
  const [playTouch, { sound: touchSound }] = useSound("/sounds/touchCard.mp3", { volume: 0.3 });
  const [dragCard, { sound: dragSound }] = useSound("/sounds/drag.mp3", { volume: 0.3 });
  const [shuffleAllOnce, { sound: shuffleAllSound }] = useSound("/sounds/shuffleAllOnce.mp3", { volume: 0.3 });

   const getAnimation = () => {
     if (!isShuffling) return "none";
     switch (isShuffling.type) {
       case "fisher": return "fisherShuffle 1s ease";
       case "riffle": return "riffleShuffle 1s ease";
       case "pile": return "pileShuffle 1s ease";
       case "shuffleAllOnce": return "allShuffle 3s ease";
       default: return "none";
     }
   };
   
      useEffect(() => {
       if (!isShuffling || !isShuffling.type) return;
       switch (isShuffling.type) {
         case "fisher":
           playExclusiveSound(playFisher, fisherSound);
           break;
         case "riffle":
           playExclusiveSound(playRiffle, riffleSound);
           break;
         case "pile":
           playExclusiveSound(playPile, pileSound);
           break;
         case "shuffleAllOnce":
           playExclusiveSound(shuffleAllOnce, shuffleAllSound);
           break;
         default:
           break;
       }
     }, [isShuffling]);
   
     useEffect(() => {
       playExclusiveSound(playTouch, touchSound);
     },[isSelected])
   
     useEffect(() => {
       playExclusiveSound(dragCard, dragSound);
     },[isDragging])

  const frontBg = unoColors[card.color] || "#333";
  const textColor = textColors[card.color] || "#fff";
  const label = getUnoLabel(card);

const cardStyle = {
        boxSizing:"border-box",
        cursor: "grab",
        bgcolor: "transparent",
        width: 72,
        height: 104,
        position: "absolute",
        transition: "0.5st",
        boxShadow: "0 4px 8px hsla(0, 0%, 0%, 0.20)",
        borderRadius: 2,
        touchAction: "none",
        perspective: "1000px",
        transformOrigin: "bottom left",
        animation: getAnimation(),
}

const selectedCard = {
        marginTop: -2,
        marginBottom: 2,
      }

const drag = {
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : null,
        zIndex: isDragging ? 99999 : order,
      }

const normalLayout = {
        top: reverseorder ? "" : order * 0.3,
        left: reverseorder ? "": order * 0.3,
        bottom: reverseorder ? (order * 0.3) : "",
        right: reverseorder ? (order * 0.3): "",
}

const rowStyle = {
        left: index*37,
}

const fanCircle = {
        transform: (() => {
        const total = pile.length;
        const radius = 0; 
        const angle = (360 / total) * index;
        const rad = (angle * Math.PI) / 180;

        const x = radius * Math.cos(rad);
        const y = radius * Math.sin(rad);
        const rotation = angle + 90;

        return transform
          ? `translate(${transform.x}px, ${transform.y}px)`
          : `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
      })(),
}


  return (
    <Avatar
      className="deck-card"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      sx={{
        zIndex: index,
        ...cardStyle,
        ...drag,
        ...(isSelected ? selectedCard : {}),
        ...(!layout && normalLayout),
        ...(layout?.slide && rowStyle),
        ...(layout?.fanCircle && fanCircle),
      }}
      variant="rounded"
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          position: "relative",
          transform: card.faceUp ? "rotateY(180deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
          transition: "0.6s",
        }}
      >
        {!card.faceUp && (
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

        {card.faceUp && (
          <Box
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              bgcolor: frontBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              borderRadius: "8px",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              color: textColor,
              fontWeight: "bold",
              flexDirection: "column",
              border:"2px solid #ffffffff"
            }}
          >
            {/* Top-left badge */}
            <Typography
              sx={{
                position: "absolute",
                top: 3,
                left: 6,
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              {label}
            </Typography>

            {/* Center large */}
            <Typography
              sx={{
                color: frontBg,
                fontSize: "32px",
                fontWeight: "bold",
                width:"40px",
                height:"70px",
                bgcolor: "white",
                borderRadius: "50%",
                transform: "rotate(30deg)",
                display: "inline-block",
              }}
            >
              <Box
                component="span"
                sx={{
                  transform: "rotate(-30deg)",
                  display: "inline-block",
                  width:"100%",
                  height:"100%",
                  textAlign:"center",
                  lineHeight:"70px"
                }}
              >
                {label}
              </Box>
            </Typography>

            {/* Bottom-right badge (rotated) */}
            <Typography
              sx={{
                position: "absolute",
                bottom: 3,
                right: 6,
                fontSize: "18px",
                fontWeight: "bold",
                transform: "rotate(180deg)",
              }}
            >
              {label}
            </Typography>
          </Box>
        )}
      </Box>
    </Avatar>
  );
};

export default UnoCard;
