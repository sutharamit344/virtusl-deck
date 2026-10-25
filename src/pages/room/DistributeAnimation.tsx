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
  batchSize?: number | undefined;
  cardsPerPlayer?: number | "all" | undefined;
}

export const DistributeAnimation: React.FC<DistributeAnimationProps> = ({
  tableWidth,
  tableHeight,
  playersList,
  cardBack = "/deck_standard_52.jpg",
  cardW = 60,
  cardH = 88,
  batchSize = 1,
  cardsPerPlayer = "all",
}) => {
  const [playStack] = useSound("/sounds/stackCards.mp3", { volume: 0.6 });

  const numPlayers = Math.max(1, playersList.length);
  const a = tableWidth / 2 - 30;
  const b = tableHeight / 2 - 30;
  const angleStep = (2 * Math.PI) / numPlayers;

  const cards = useMemo(() => {
    const list = [];
    const effectiveBatch = Math.max(1, batchSize || 1);
    const targetCardsPerPlayer =
      typeof cardsPerPlayer === "number" && cardsPerPlayer > 0
        ? Math.min(cardsPerPlayer, 12)
        : Math.max(2, Math.min(6, Math.floor(20 / numPlayers)));

    const playerCounts = new Array(numPlayers).fill(0);
    let cardCount = 0;
    let currentTimeMs = 0;

    while (playerCounts.some((c) => c < targetCardsPerPlayer)) {
      for (let p = 0; p < numPlayers; p++) {
        if (playerCounts[p] >= targetCardsPerPlayer) continue;

        const countThisTurn = Math.min(
          effectiveBatch,
          targetCardsPerPlayer - playerCounts[p],
        );
        const angle = angleStep * p - Math.PI / 2;
        const targetBaseX = -a * Math.cos(angle) * 1.15;
        const targetBaseY = -b * Math.sin(angle) * 1.1;

        for (let bIdx = 0; bIdx < countThisTurn; bIdx++) {
          const stackIdx = playerCounts[p];
          const stackOffsetX = (stackIdx % 6) * 2 - 5;
          const stackOffsetY = (stackIdx % 6) * -2 + 3;
          const stackRot =
            ((angle * 180) / Math.PI + 90) + ((stackIdx % 4) * 3 - 4.5);

          list.push({
            id: `deal-anim-card-${cardCount}`,
            targetX: targetBaseX + stackOffsetX,
            targetY: targetBaseY + stackOffsetY,
            targetRot: stackRot,
            delayMs: currentTimeMs,
            zIndex: 50 + cardCount,
          });

          cardCount++;
          playerCounts[p]++;
          currentTimeMs += 40; // 40ms between cards within the same batch
        }
        currentTimeMs += 65; // 65ms gap between players
      }
    }
    return list;
  }, [numPlayers, angleStep, a, b, batchSize, cardsPerPlayer]);

  // Play deal sounds in rhythm with card flights
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    cards.forEach((card, idx) => {
      if (idx % 2 === 0) {
        const timeout = setTimeout(() => {
          try {
            playStack();
          } catch (_) {}
        }, card.delayMs);
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [cards, playStack]);

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
