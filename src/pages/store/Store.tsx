import { JSX, useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";

import { db } from "../../firebase";
import BottomNav from "../../layout/footer/BottomNav";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

type StoreDeck = {
  id: string;
  name: string;
  description: string;
  banner: string;
  price?: number;
  url: string;
};

/* ---------------- Component ---------------- */

function Store(): JSX.Element {
  const [decks, setDecks] = useState<StoreDeck[]>([]);

  useEffect(() => {
    const decksRef = ref(db, "deckstore");

    const unsubscribe = onValue(decksRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setDecks([]);
        return;
      }

      const decksArray: StoreDeck[] = Object.entries(data).map(
        ([id, value]: [string, any]) => ({
          id,
          ...value,
        })
      );

      setDecks(decksArray);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen text-[#E6EDF3] py-20">
      <div className="mx-auto lg:max-w-287.5 px-4 lg:px-6s">

        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <h1 className="text-xl font-bold">Deck Store</h1>
        </div>

        {/* Deck Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {decks.map((deck) => (
            <Card
              key={deck.id}
              variant="elevated"
              className="flex h-full flex-col overflow-hidden gap-3"
            >
              {/* Banner */}
              <div className="bg-[#0d1017] overflow-hidden">
                <img
                  src={deck.banner}
                  alt={deck.name}
                  className="h-45 w-full object-contain scale-101"
                />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col">
                <h4 className="mb-1 text-lg font-bold text-cyan-400">
                  {deck.name}
                </h4>
                <p className="mb-4 flex-1 text-sm text-gray-300">
                  {deck.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-lg px-3 py-1 text-sm font-bold ${
                      deck.price
                        ? "bg-[#2a2a2a] text-gray-300"
                        : "bg-cyan-400 text-[#121212]"
                    }`}
                  >
                    {deck.price ? `₹${deck.price.toFixed(2)}` : "Free"}
                  </span>

                  <Button onClick={() => window.open(deck.url)}>Buy</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <BottomNav select={3} />
    </div>
  );
}

export default Store;
