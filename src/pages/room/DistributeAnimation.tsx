import React, { useEffect, useMemo } from "react";
import useSound from "use-sound";
import { Player } from "./roomSlice";

interface DistributeAnimationProps {
  tableWidth: number;
  tableHeight: number;
  playersList: Player[];
  cardBack?: string | undefined;
  cardW?: number | undefined;
  cardH?: number | undefined;
}

export const DistributeAnimation: React.FC<DistributeAnimationProps> = ({
  tableWidth,
  tableHeight,
  playersList,
  cardBack = "/deck_standard_52.jpg",
  cardW = 60,
  cardH = 88,
}) => {
  const [playStack] = useSound("/sounds/stackCards.mp3", { volume: 0.6 });

  const numPlayers = Math.max(1, playersList.length);
  const a = tableWidth / 2 - 30;
  const b = tableHeight / 2 - 30;
  const angleStep = (2 * Math.PI) / numPlayers;

  // Determine rounds of cards to deal in the animation (between 16 and 24 cards total)
  const rounds = Math.max(3, Math.min(8, Math.floor(24 / numPlayers)));
  const totalCards = rounds * numPlayers;
  const intervalMs = 70; // 70ms between each card deal

  // Play deal sounds in rhythm
  useEffect(() => {
    let cardIdx = 0;
    const soundInterval = setInterval(() => {
      if (cardIdx >= totalCards) {
        clearInterval(soundInterval);
        return;
      }
      if (cardIdx % 2 === 0) {
        try {
          playStack();
        } catch (_) {}
      }
      cardIdx++;
    }, intervalMs);

    return () => clearInterval(soundInterval);
  }, [totalCards, intervalMs, playStack]);

  const cards = useMemo(() => {
    const list = [];
    for (let i = 0; i < totalCards; i++) {
      const playerIdx = i % numPlayers;
      const stackIdx = Math.floor(i / numPlayers);
      const angle = angleStep * playerIdx - Math.PI / 2;
      const targetBaseX = -a * Math.cos(angle) * 1.15;
      const targetBaseY = -b * Math.sin(angle) * 1.1;

      // Stacking offset so cards neatly layer on the player's avatar
      const stackOffsetX = (stackIdx % 6) * 2 - 5;
      const stackOffsetY = (stackIdx % 6) * -2 + 3;
      const stackRot =
        ((angle * 180) / Math.PI + 90) + ((stackIdx % 4) * 3 - 4.5);

      const delayMs = i * intervalMs;

      list.push({
        id: `deal-anim-card-${i}`,
        targetX: targetBaseX + stackOffsetX,
        targetY: targetBaseY + stackOffsetY,
        targetRot: stackRot,
        delayMs,
        zIndex: 50 + i,
      });
    }
    return list;
  }, [numPlayers, totalCards, angleStep, a, b, intervalMs]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-[9999]">
      {/* Center Deck Stack */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ width: cardW, height: cardH }}
      >
        {/* Layer 1 (bottom shadow) */}
        <div className="absolute inset-0 rounded-lg bg-black/60 shadow-[0_0_20px_rgba(0,216,255,0.35)] translate-y-1" />
        {/* Layer 2 */}
        <div className="absolute inset-0 rounded-lg border border-[#00D8FF]/40 overflow-hidden shadow-lg -translate-y-0.5 translate-x-0.5">
          <img
            src={cardBack}
            alt="deck"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Layer 3 (top) */}
        <div className="absolute inset-0 rounded-lg border border-[#00D8FF] overflow-hidden shadow-xl -translate-y-1">
          <img
            src={cardBack}
            alt="deck"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#00D8FF]/15 animate-pulse" />
        </div>
      </div>

      {/* Flying & Stacking Cards */}
      {cards.map((card) => (
        <div
          key={card.id}
          className="deal-card-anim rounded-lg border border-[#00D8FF]/40 overflow-hidden"
          style={
            {
              width: cardW,
              height: cardH,
              zIndex: card.zIndex,
              animationDelay: `${card.delayMs}ms`,
              "--target-x": `${card.targetX}px`,
              "--target-y": `${card.targetY}px`,
              "--target-rot": `${card.targetRot}deg`,
            } as React.CSSProperties
          }
        >
          <img
            src={cardBack}
            alt="card"
            className="w-full h-full object-cover rounded-lg shadow-md"
          />
        </div>
      ))}
    </div>
  );
};

export default DistributeAnimation;
