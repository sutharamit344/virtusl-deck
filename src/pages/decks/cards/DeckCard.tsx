import React, { useEffect, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import useSound from "use-sound";
import { MdLoop } from "react-icons/md";
import { playExclusiveSound } from "../../../components/common/playExclusiveSound";
import { Card, DeckCardProps, SuitColors, SuitSymbols } from "../deckModal";

const suitSymbols: SuitSymbols = {
  Spades: "♠",
  Hearts: "♥",
  Clubs: "♣",
  Diamonds: "♦",
};

const suitColors: SuitColors = {
  Spades: "#000",
  Clubs: "#000",
  Hearts: "#e53935",
  Diamonds: "#e53935",
};
const DeckCard = ({
  faceUp,
  cardW = 72,
  cardH = 104,
  playersUid = [],
  order,
  isSelected,
  setSelectedCard,
  updateCard,
  pile,
  card,
  index,
  reverseorder,
  layout,
  isShuffling,
  onClick,
  back = "",
  locationPath,
  setDraging,
  isCardAccess,
  isDistributing,
}: DeckCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const [playFlip] = useSound("/sounds/flipCard.mp3", { volume: 0 });
  const [playTouch] = useSound("/sounds/touchCard.mp3", { volume: 0 });
  const [dragCard] = useSound("/sounds/drag.mp3", { volume: 0 });

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: card.id,
      data: { type: "card", cardId: card.id },
    });

  useEffect(() => {
    card.id && playExclusiveSound(dragCard);
    isDragging ? setDraging?.(card.id) : setDraging?.(null);
  }, [isDragging]);

  useEffect(() => {
    card.id && playExclusiveSound(playTouch);
  }, [isSelected]);

  const getAnimation = (): React.CSSProperties => {
    const shuffle = isShuffling?.[locationPath];
    if (!shuffle) return {};

    const animations: { [key: string]: string } = {
      fisher: "fisherShuffle 1s ease",
      riffle: "riffleShuffle 1s ease",
      pile: "pileShuffle 1s ease",
      shuffleAllOnce: "allShuffle 3s ease",
    };
    return { animation: animations[shuffle.type] || "none" };
  };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFaceUp = !faceUp;
    updateCard({ faceUp: newFaceUp });
    setSelectedCard?.((prev: any) => ({ ...prev, faceUp: newFaceUp }));
    playExclusiveSound(playFlip);
  };

  const getPositionStyles = (): React.CSSProperties => {
    if (layout?.slide?.[locationPath]) {
      return { left: index * (cardW / 2), bottom: 0, top: 0, right: 0 };
    }

    if (layout?.fanCircle?.[locationPath]) {
      const total = pile.length;
      const angle = (360 / total) * index;
      const rad = (angle * Math.PI) / 180;
      const x = 20 * Math.cos(rad);
      const y = 20 * Math.sin(rad);

      if (transform) {
        return {
          transform: `translate(${transform.x}px, ${transform.y}px)`,
          zIndex: 99999,
        };
      }

      return {
        top: `${y}px`,
        left: `${x}px`,
        transform: `rotate(${angle}deg)`,
      };
    }

    if (reverseorder?.[locationPath]) {
      return { bottom: order * 0.3, right: order * 0.3 };
    }

    return { top: order * 0.3, left: order * 0.3 };
  };

  const baseStyle: React.CSSProperties = {
    boxSizing: "border-box",
    backgroundColor: "transparent",
    width: cardW,
    height: cardH,
    position: "absolute",
    boxShadow: "0 0 8px hsla(0, 0%, 22%, 0.20)",
    cursor: !isDistributing && isCardAccess ? "grab" : "default",
    userSelect: "none",
    borderRadius: "8px",
    touchAction: "none",
    perspective: "1000px",
    transformOrigin: "bottom left",
    ...getAnimation(),
    ...getPositionStyles(),
  };

  // Base Tailwind classes
  const baseClasses = `
    absolute
    shadow-[0_0_8px_hsla(0,0%,22%,0.20)]
    rounded-lg
    select-none
    touch-none
    origin-bottom-left
    ${!isDistributing && isSelected ? `mt-[-25px] mb-[25px]` : ""}
    ${!isDistributing && isDragging ? "z-[9999999999]" : ""}
    ${
      !isDistributing && !isDragging && isCardAccess
        ? "hover:shadow-[0_4px_16px_hsla(0,0%,22%,0.40)] hover:transition-transform hover:duration-200 hover:ease-in-out"
        : ""
    }
    ${!isDistributing && !isDragging && isCardAccess ? "hover:-rotate-3" : ""}
  `;

  const hoverStyle: React.CSSProperties = !isDragging
    ? {
        boxShadow: "0 2px 8px hsla(0, 0%, 22%, 0.40)",
        transform: !isDistributing && isCardAccess ? "rotate(-3deg)" : "none",
        transition: "transform 0.2s ease-in-out",
      }
    : {};

  const transformStyle: React.CSSProperties = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 9999999999,
      }
    : {};

  const combinedStyle = {
    ...baseStyle,
    ...hoverStyle,
    ...transformStyle,
  };

  if (isDistributing) {
    const playerIndex = index % playersUid.length;
    const anglePerPlayer = 360 / playersUid.length;
    const dealAngle = -(180 + anglePerPlayer * playerIndex);

    return (
      <div
        id={card.id}
        className={`${card?.IsDistributed ? " dealRadial" : ""}`}
        style={
          {
            ...combinedStyle,
            "--deal-angle": `${dealAngle}deg`,
            "--deal-radius": `200px`,
          } as React.CSSProperties
        }
        {...(isCardAccess && listeners)}
        {...(isCardAccess && attributes)}
      >
        <CardFace
          faceUp={faceUp}
          card={card}
          cardH={cardH}
          cardW={cardW}
          back={back}
        />
      </div>
    );
  }

  return (
    <div
      id={card.id}
      className={baseClasses}
      ref={(el) => {
        if (isCardAccess && el) {
          setNodeRef(el);
        }
        cardRef.current = el;
      }}
      onClick={onClick}
      {...(isCardAccess && listeners)}
      {...(isCardAccess && attributes)}
      style={combinedStyle}
    >
      <CardFace
        faceUp={faceUp}
        card={card}
        cardH={cardH}
        cardW={cardW}
        back={back}
      />
      {isSelected && <FlipButton faceUp={faceUp} onClick={handleFlip} />}
    </div>
  );
};

interface CardFaceProps {
  faceUp: boolean;
  card: Card;
  cardH: number;
  cardW: number;
  back?: string;
}

const CardFace: React.FC<CardFaceProps> = ({
  faceUp,
  card,
  cardH,
  cardW,
  back,
}) => (
  <div
    className="w-full h-full relative preserve-3d transition-transform duration-600"
    style={{
      transform: faceUp ? "rotateY(180deg)" : "rotateY(0deg)",
    }}
  >
    {/* Card Back */}
    {
      <div
        className="absolute w-full h-full rounded-lg backface-hidden"
        style={{
          backgroundImage: `url("${back}")`,
          backgroundSize: "110% 110%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
    }

    {/* Card Front */}
    {
      <div
        className="absolute w-full h-full bg-[rgb(248,248,248)] rounded-lg backface-hidden"
        style={{
          transform: "rotateY(180deg)",
          color: card.suit ? suitColors[card.suit] : "#fff",
        }}
      >
        {card.rank && card.suit && (
          <CornerLabel
            rank={card.rank}
            suit={card.suit}
            cardH={cardH}
            top={4}
            left={6}
            align="center"
          />
        )}
        {card.rank && card.suit && (
          <CornerLabel
            rank={card.rank}
            suit={card.suit}
            cardH={cardH}
            bottom={6}
            right={6}
            align="center"
          />
        )}

        {/* Center Symbol */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15"
          style={{ fontSize: cardW / 2 }}
        >
          {card.suit && suitSymbols[card.suit]}
        </div>
      </div>
    }
  </div>
);

interface CornerLabelProps {
  rank: string;
  suit: string;
  cardH: number;
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
  align: string;
}

const CornerLabel: React.FC<CornerLabelProps> = ({
  rank,
  suit,
  cardH,
  top,
  left,
  bottom,
  right,
  align,
}) => (
  <div
    className="absolute font-bold"
    style={{
      textAlign: align as any,
      fontSize: cardH / 6,
      top,
      left,
      bottom,
      right,
    }}
  >
    <div className="font-bold">{rank}</div>
    <div style={{ fontSize: cardH / 5, lineHeight: `${cardH / 130}` }}>
      {suitSymbols[suit]}
    </div>
  </div>
);

interface FlipButtonProps {
  faceUp: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const FlipButton: React.FC<FlipButtonProps> = ({ faceUp, onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-0 right-0 z-10 p-1"
    style={{
      color: faceUp ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)",
      transform: faceUp ? "rotate(0deg)" : "rotate(180deg)",
      transition: "1s",
    }}
  >
    <MdLoop size={26} />
  </button>
);

export default DeckCard;
