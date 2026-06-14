import { JSX, useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import Card from "../../components/ui/Card";
import Spinner from "../../components/common/Spinner";
import NoData from "../../components/common/NoData";

type RedeemedDeck = {
  deckId: string;
  product: string;
  back: string;
  email: string;
  used: boolean;
};

function RedeemedDecks(): JSX.Element {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<RedeemedDeck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const db = getDatabase();
    const decksRef = ref(db, "decks");

    const unsubscribe = onValue(decksRef, (snapshot) => {
      const data = snapshot.val() as Record<string, RedeemedDeck> | null;

      const allDecks = data ? Object.values(data) : [];

      const userDecks = allDecks.filter(
        (deck) => deck.email === user.email && deck.used === true
      );

      setDecks(userDecks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.email]);

  if (loading) {
    return <Spinner center />;
  }

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {decks.length === 0 ? (
        <NoData title="You dont have any Deck" className="md:col-span-2" />
      ) : (
        decks.map((deck) => (
          <Card
            key={deck.deckId}
            hoverable
            variant="elevated"
            className="flex gap-4"
            onClick={() => navigate(`/deck-view/${deck.deckId}`)}
          >
            <div className="rounded-2 overflow-hidden w-17.5 shrink-0">
              <img src={deck.back} alt="Deck" className="scale-105" />
            </div>

            <div className="text-left">
              <h3 className="text-lg font-bold">{deck.product}</h3>
              <div className="text-lg ">{deck.deckId}</div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

export default RedeemedDecks;
