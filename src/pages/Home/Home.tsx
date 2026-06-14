import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaPlay,
  FaUsers,
  FaMagic,
  FaStar,
  FaCrown,
  FaFire,
  FaRocket,
  FaGamepad,
  FaChevronRight,
  FaStore,
  FaShieldAlt,
  FaBolt,
  FaRegClock,
  FaTrophy,
  FaChartLine,
} from "react-icons/fa";
import { TbCardsFilled, TbCards } from "react-icons/tb";
import { GiCardRandom, GiCardPick } from "react-icons/gi";
import BottomNav from "../../layout/footer/BottomNav";

function Home() {
  const navigate = useNavigate();
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
  const [animatedText, setAnimatedText] = useState("");
  const fullText = "Anywhere. Anytime.";
  const [countdown, setCountdown] = useState({
    hours: 24,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    // Animated typing effect
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i <= fullText.length) {
        setAnimatedText(fullText.substring(0, i));
        i++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setAnimatedText("");
          i = 0;
        }, 3000);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setGlowPosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    {
      icon: <FaUsers />,
      title: "Real-time Multiplayer",
      desc: "Play with friends instantly",
      color: "from-blue-500 to-cyan-400",
    },
    {
      icon: <TbCardsFilled />,
      title: "100+ Card Decks",
      desc: "Custom & premium collections",
      color: "from-purple-500 to-pink-400",
    },
    {
      icon: <FaMagic />,
      title: "Smart Automation",
      desc: "Auto-shuffle & card tracking",
      color: "from-green-500 to-emerald-400",
    },
    {
      icon: <GiCardRandom />,
      title: "Dynamic Game Modes",
      desc: "Multiple table layouts",
      color: "from-orange-500 to-red-400",
    },
  ];

  const stats = [
    { number: "10K+", label: "Active Players", icon: <FaGamepad /> },
    { number: "500+", label: "Daily Rooms", icon: <FaUsers /> },
    { number: "50+", label: "Card Decks", icon: <TbCardsFilled /> },
    { number: "99.9%", label: "Uptime", icon: <FaRocket /> },
  ];

  const trendingDecks = [
    {
      name: "Premium Poker",
      players: "1.2k",
      icon: <FaTrophy className="text-yellow-500" />,
    },
    {
      name: "Magic Uno",
      players: "890",
      icon: <FaMagic className="text-purple-500" />,
    },
    {
      name: "Classic Cards",
      players: "2.5k",
      icon: <TbCards className="text-blue-500" />,
    },
  ];

  return (
    <div className="relative py-15 min-h-screen overflow-x-hidden bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0A0E14] text-white">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Dynamic glow that follows mouse */}
        <div
          className="absolute h-[500px] w-[500px] rounded-full opacity-20 blur-[120px] transition-all duration-300"
          style={{
            left: `${glowPosition.x}%`,
            top: `${glowPosition.y}%`,
            background: "radial-gradient(circle, #00D8FF 0%, transparent 70%)",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-[#00D8FF] opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>

      {/* Main Content */}
      <div className="relative z-10 mx-auto lg:max-w-287.5">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-4 pt-8 pb-12 text-center md:pt-16 md:pb-20">
          {/* Animated Badge */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00D8FF]/20 to-purple-500/20 px-3 py-1.5 md:px-4 md:py-2 backdrop-blur border-1 border-white/10">
              <FaFire className="text-xs text-orange-400 md:text-sm" />
              <span className="text-xs font-medium md:text-sm bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                🎉 10,000+ Cards Played Today
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            <span className="block">PLAY CARDS.</span>
            <span className="block bg-gradient-to-r from-[#00D8FF] via-purple-400 to-[#00D8FF] bg-clip-text text-transparent animate-gradient">
              {animatedText}
              <span className="inline-block h-6 w-0.5 md:h-8 md:w-1 bg-[#00D8FF] ml-1 align-middle animate-pulse"></span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-8 max-w-xl text-sm text-gray-300 sm:text-base md:text-lg px-4">
            Experience the future of card gaming.{" "}
            <span className="font-semibold text-[#00D8FF]">
              Shuffle, flip, deal
            </span>{" "}
            and manage cards in real-time with friends across the globe.
          </p>

          {/* CTA Buttons */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:gap-4 w-full max-w-md">
            {/* Primary Button */}
            <button
              onClick={() => navigate("/store")}
              className="group relative flex-1 min-w-[200px] rounded-xl bg-gradient-to-r from-[#00D8FF] to-cyan-500 p-0.5 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative rounded-[10px] bg-[#121212] px-4 py-3 sm:px-6 sm:py-3.5">
                <div className="flex items-center justify-center gap-2">
                  <FaCrown className="text-base sm:text-lg" />
                  <span className="text-sm font-bold sm:text-base">
                    EXPLORE DECKS
                  </span>
                  <FaChevronRight className="text-xs transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>

            {/* Secondary Button */}
            <button
              onClick={() => navigate("/rooms")}
              className="group relative flex-1 min-w-[200px] rounded-xl border-2 border-white/20 bg-gradient-to-b from-white/5 to-transparent p-0.5 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-[#00D8FF]/50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00D8FF]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative rounded-[10px] bg-gradient-to-b from-black/40 to-black/20 px-4 py-3 sm:px-6 sm:py-3.5 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2">
                  <FaPlay className="text-base sm:text-lg" />
                  <span className="text-sm font-bold sm:text-base">
                    JOIN ROOM
                  </span>
                  <div className="flex space-x-1">
                    <span className="animate-pulse text-xs">•</span>
                    <span className="animate-pulse delay-75 text-xs">•</span>
                    <span className="animate-pulse delay-150 text-xs">•</span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Promo Banner */}
          <div className="mb-8 w-full max-w-2xl">
            <div className="relative overflow-hidden rounded-2xl border-1 border-white/10 bg-gradient-to-r from-[#00D8FF]/10 via-purple-500/10 to-[#00D8FF]/10 backdrop-blur-xl p-1">
              <div className="rounded-xl bg-gradient-to-br from-[#0D1117] to-[#161B22] p-4 md:p-6">
                <div className="flex flex-col items-center justify-between gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <FaRegClock className="text-[#00D8FF]" />
                      <span className="text-xs font-semibold text-gray-300 md:text-sm">
                        OFFER ENDS IN
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex flex-col items-center">
                        <div className="text-xl font-bold text-[#00D8FF] md:text-2xl">
                          {countdown.hours.toString().padStart(2, "0")}
                        </div>
                        <div className="text-xs text-gray-400">HOURS</div>
                      </div>
                      <div className="text-[#00D8FF]">:</div>
                      <div className="flex flex-col items-center">
                        <div className="text-xl font-bold text-[#00D8FF] md:text-2xl">
                          {countdown.minutes.toString().padStart(2, "0")}
                        </div>
                        <div className="text-xs text-gray-400">MIN</div>
                      </div>
                      <div className="text-[#00D8FF]">:</div>
                      <div className="flex flex-col items-center">
                        <div className="text-xl font-bold text-[#00D8FF] md:text-2xl">
                          {countdown.seconds.toString().padStart(2, "0")}
                        </div>
                        <div className="text-xs text-gray-400">SEC</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold md:text-xl">
                      Use code <span className="text-white">FLAT50</span>
                    </p>
                    <p className="text-sm font-semibold text-[#00D8FF] md:text-base">
                      GET 50% OFF ALL DECKS
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {trendingDecks.map((deck, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 backdrop-blur-sm border-1 border-white/10"
              >
                {deck.icon}
                <div className="text-left">
                  <div className="text-xs font-medium">{deck.name}</div>
                  <div className="text-xs text-gray-400">
                    {deck.players} players
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-8 md:py-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-6 text-center text-2xl font-bold md:text-3xl">
              Why <span className="text-[#00D8FF]">Players Love</span>{" "}
              VirtualDeck
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-xl border-1 border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 md:p-5 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:border-[#00D8FF]/30"
                >
                  <div
                    className={`mb-3 inline-flex rounded-lg bg-gradient-to-br ${feature.color} p-2.5 text-xl`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="mb-1.5 text-base font-bold md:text-lg">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-400 md:text-sm">
                    {feature.desc}
                  </p>
                  <div className="mt-3 h-0.5 w-0 bg-gradient-to-r from-[#00D8FF] to-transparent transition-all duration-300 group-hover:w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-4 py-8 md:py-12">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/10 p-6 md:p-8 backdrop-blur-xl">
              <h3 className="mb-6 text-center text-xl font-bold md:text-2xl">
                Join Our{" "}
                <span className="text-[#00D8FF]">Growing Community</span>
              </h3>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="mb-2 inline-flex rounded-full bg-white/10 p-2.5 text-lg md:text-xl">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold text-[#00D8FF] md:text-3xl">
                      {stat.number}
                    </div>
                    <div className="text-xs text-gray-400 md:text-sm">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trending Decks */}
        <section className="px-4 py-8 md:py-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-6 text-center text-2xl font-bold md:text-3xl">
              <span className="text-[#00D8FF]">Trending</span> Decks This Week
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  name: "Premium Poker Set",
                  players: "1,200",
                  icon: "♠️",
                  color: "from-blue-600 to-cyan-500",
                },
                {
                  name: "Magic Uno Cards",
                  players: "890",
                  icon: "🃏",
                  color: "from-purple-600 to-pink-500",
                },
                {
                  name: "Classic 52 Deck",
                  players: "2,500",
                  icon: "♦️",
                  color: "from-orange-600 to-red-500",
                },
              ].map((deck, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-xl border-1 border-white/10 p-4 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-2 text-2xl">{deck.icon}</div>
                      <h3 className="mb-1 text-lg font-bold">{deck.name}</h3>
                      <p className="text-sm text-gray-400">
                        {deck.players} active players
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/store")}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/20"
                    >
                      View
                    </button>
                  </div>
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${deck.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-8 md:py-12">
          <div className="mx-auto max-w-4xl text-center">
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#00D8FF]/20 to-purple-500/20 p-6 md:p-8 backdrop-blur-lg border-1 border-white/10">
              <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#00D8FF]/10 blur-3xl md:h-64 md:w-64"></div>
              <div className="absolute -right-20 -bottom-20 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl md:h-64 md:w-64"></div>

              <h2 className="relative mb-4 text-2xl font-bold md:text-4xl">
                Ready to <span className="text-[#00D8FF]">Deal</span> Your First
                Hand?
              </h2>
              <p className="relative mb-6 text-sm text-gray-300 md:text-base">
                Join thousands of players already experiencing the future of
                card gaming
              </p>
              <button
                onClick={() => navigate("/create-room")}
                className="group relative rounded-xl bg-gradient-to-r from-[#00D8FF] to-cyan-500 px-6 py-3 md:px-8 md:py-4 text-base font-bold text-[#121212] transition-all hover:scale-105"
              >
                <div className="flex items-center justify-center gap-2 md:gap-3">
                  <FaRocket className="animate-bounce" />
                  <span>CREATE ROOM NOW</span>
                  <FaChevronRight className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}

export default Home;
