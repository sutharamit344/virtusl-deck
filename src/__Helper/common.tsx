import { toast } from "react-toastify";
import { Card } from "../pages/decks/deckModal";

export const getLocationPath = (roomId: string, uid: string) => {
  return `${roomId}-${uid}-hand-pile`;
};

export const enterFullscreen = (element?: HTMLElement | null) => {
  const el = element || document.documentElement;

  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if ((el as any).webkitRequestFullscreen) {
    (el as any).webkitRequestFullscreen();
  } else if ((el as any).msRequestFullscreen) {
    (el as any).msRequestFullscreen();
  }
};

export const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    (document as any).webkitExitFullscreen();
  } else if ((document as any).msExitFullscreen) {
    (document as any).msExitFullscreen();
  }
};

export const isFullscreen = () =>
  !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).msFullscreenElement
  );

export function getCardsByLocation(
  cards: Record<string, Card>,
  locationPath: string,
): Card[] {
  return Object.values(cards)
    .filter((card) => (card.locationPath || "__default__") === locationPath)
    .sort((a, b) => a.order - b.order);
}

export function getSortedPile(
  cards: Card[],
  options?: {
    bySuit?: string | null;
    byRank?: "ASE" | "DESE" | null;
  },
) {
  const { bySuit, byRank } = options || {};

  return cards
    ?.filter((c) => (bySuit ? c.suit === bySuit : true))
    .sort((a, b) => {
      if (byRank === "ASE") return a.position - b.position;
      if (byRank === "DESE") return b.position - a.position;
      return a.order - b.order;
    });
}

export function getCardsPerPage(containerWidth: number, cardWidth: number) {
  return Math.max(1, Math.floor(containerWidth / (cardWidth / 2)));
}

export function clampStartIndex(
  startIndex: number,
  total: number,
  perPage: number,
) {
  if (total <= perPage) return 0;
  return Math.min(Math.max(startIndex, 0), total - perPage);
}
interface HistoryToastProps {
  title: string;
  message?: string;
  createdBy?: string;
}

export const HistoryToast = ({
  title,
  message,
  createdBy,
}: HistoryToastProps) => {
  return (
    <div className="w-[260px] rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] px-4 py-3 shadow-xl animate-toast-in">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-[#00D8FF]">{title}</div>
        {createdBy && (
          <div className="text-[11px] text-gray-400">
            {createdBy.slice(0, 6)}
          </div>
        )}
      </div>

      {message && (
        <div className="mt-1 text-xs text-gray-300 leading-snug">{message}</div>
      )}
    </div>
  );
};
