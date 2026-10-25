import { Navigate } from "react-router-dom";
import Googlesignin from "./Googlesignin";
import { useAppSelector } from "../../app/hooks";
import { JSX } from "react";

function Login(): JSX.Element {
  const { user } = useAppSelector((state) => state.auth);

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="p-8 rounded-2xl max-w-[420px] w-full backdrop-blur-xl bg-white/5 border border-white/10 text-white text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <img
            src="https://virtual-deck-52.web.app/vc%20logo.png"
            alt="Virtual Deck Logo"
            className="h-[60px] object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold mb-2 tracking-tight">
          Welcome to Virtual Deck
        </h1>

        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Sign in to unlock your cards, decks, and rooms.
        </p>

        <Googlesignin />
      </div>
    </div>
  );
}

export default Login;
