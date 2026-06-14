import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { auth, db } from "../../firebase";
import { logoutUser, setUser } from "../../pages/login/authSlice";
import { ref, get, update } from "firebase/database";
import {
  Edit,
  Mail,
  Camera,
  Check,
  X,
  Star,
  Trophy,
  Gamepad2,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "../../app/store";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LogoutButton from "../login/LogoutButton";
import Spinner from "../../components/common/Spinner";

// Predefined avatar URLs
const dicebearStyles = [
  { value: "adventurer", label: "Adventurer" },
  { value: "avataaars", label: "Avataaars" },
  { value: "bottts", label: "Robots" },
  { value: "croodles", label: "Croodles" },
  { value: "fun-emoji", label: "Emoji" },
  { value: "lorelei", label: "Lorelei" },
  { value: "notionists", label: "Notionists" },
];

const sampleSeeds = ["Ace", "Queen", "King", "Joker", "Royal", "Magic", "Pro"];

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [editAvatarOpen, setEditAvatarOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState("bottts");

  // Mock user stats
  const userStats = [
    {
      label: "Games Won",
      value: "42",
      icon: <Trophy className="w-4 h-4" />,
      color: "text-yellow-400",
    },
    {
      label: "Hours Played",
      value: "156",
      icon: <Gamepad2 className="w-4 h-4" />,
      color: "text-green-400",
    },
    {
      label: "Win Rate",
      value: "68%",
      icon: <Star className="w-4 h-4" />,
      color: "text-purple-400",
    },
    {
      label: "Friends",
      value: "23",
      icon: <Users className="w-4 h-4" />,
      color: "text-cyan-400",
    },
  ];

  const generateAvatarUrl = (style: string, seed: string) =>
    `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(
      seed
    )}`;

  const googleAvatar = auth.currentUser?.photoURL || "";

  const fetchUserData = async () => {
    if (!user?.uid) return;
    try {
      const snapshot = await get(ref(db, `users/${user.uid}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        setName(data.name || "");
        setAvatar(data.avatar || "");
        dispatch(setUser({ ...user, name: data.name, avatar: data.avatar }));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      dispatch(logoutUser());
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAvatarSave = async () => {
    if (user) {
      try {
        await update(ref(db, `users/${user.uid}`), { avatar });
        dispatch(setUser({ ...user, avatar }));
        setEditAvatarOpen(false);
      } catch (error) {
        console.error("Error saving avatar:", error);
      }
    }
  };

  const handleNameSave = async () => {
    if (user) {
      try {
        await update(ref(db, `users/${user.uid}`), { name });
        dispatch(setUser({ ...user, name }));
        setEditNameOpen(false);
      } catch (error) {
        console.error("Error saving name:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full vh-100 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-purple-950/30 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none ">
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-500/30 rounded-full"
            animate={{
              y: [0, -20, 0],
              x: [0, Math.sin(i) * 10, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto lg:max-w-287.5">
        {/* Header */}
        <div className="pt-20 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8"
          >
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Player Profile
                </span>
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl">
                Manage your avatar, and account.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card
                variant="elevated"
                className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-8">
                  {/* Avatar Section */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8 mb-8">
                    <div className="relative group">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 animate-gradient">
                          <img
                            src={avatar}
                            alt={name}
                            className="w-full h-full rounded-full object-cover border-1 border-black"
                          />
                        </div>
                        <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity -z-10"></div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditAvatarOpen(true)}
                        className="absolute -bottom-2 -right-2 "
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center hover:shadow-[0_0_20px_rgba(0,216,255,0.5)] transition-shadow border-2 border-black">
                          <Camera className="w-6 h-6" />
                        </div>
                      </motion.button>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 flex flex-col sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-3">
                        <h2 className="text-3xl font-bold">{name}</h2>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditNameOpen(true)}
                          className="pb-2 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5 text-cyan-400" />
                        </motion.button>
                      </div>

                      <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-400">
                        <Mail className="w-5 h-5" />
                        <span className="truncate max-w-xs">{user?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-8" />
                  <LogoutButton />
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Avatar Modal */}
      <AnimatePresence>
        {editAvatarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border-1 border-cyan-500/30 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 p-2 mx-auto">
                      <img
                        src={avatar}
                        alt="Selected Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h5 className="text-md font-bold">Your Avatar</h5>
                      <div className="text-sm text-gray-400">
                        Choose from hundreds of unique avatars
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditAvatarOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Style Selector */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    Select Avatar Style:
                  </label>
                  <div className="flex overflow-auto gap-3">
                    {dicebearStyles.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setSelectedStyle(style.value)}
                        className={`p-2 w-[100px] shrink-0 rounded-2 border-2 transition-all ${
                          selectedStyle === style.value
                            ? "border-cyan-500 bg-cyan-500/10"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <img
                            src={generateAvatarUrl(style.value, "Sample")}
                            alt={style.label}
                            className="w-12 h-12 rounded-lg"
                          />
                          <div className="font-medium text-sm">
                            {style.label}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Avatars Grid */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-300">
                      Choose Avatar:
                    </label>
                    <span className="text-sm text-gray-400">
                      {sampleSeeds.length} options
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* Google Avatar */}
                    {googleAvatar && (
                      <div className="text-center">
                        <button
                          onClick={() => setAvatar(googleAvatar)}
                          className={`w-full aspect-square rounded-xl p-1 transition-all mb-2 ${
                            avatar === googleAvatar
                              ? "ring-4 ring-cyan-500 bg-cyan-500/20"
                              : "hover:bg-white/10 hover:scale-105"
                          }`}
                        >
                          <img
                            src={googleAvatar}
                            alt="Google Avatar"
                            className="w-full h-full rounded-full object-cover"
                          />
                        </button>
                        <div className="text-xs text-gray-400">Google</div>
                      </div>
                    )}

                    {/* DiceBear Avatars */}
                    {sampleSeeds.map((seed) => {
                      const url = generateAvatarUrl(selectedStyle, seed);
                      return (
                        <div key={seed} className="text-center">
                          <button
                            onClick={() => setAvatar(url)}
                            className={`w-full aspect-square rounded-xl p-1 transition-all mb-2 ${
                              avatar === url
                                ? "ring-4 ring-cyan-500 bg-cyan-500/20"
                                : "hover:bg-white/10 hover:scale-105"
                            }`}
                          >
                            <img
                              src={url}
                              alt={seed}
                              className="w-full h-full rounded-lg object-cover"
                            />
                          </button>
                          <div className="text-xs text-gray-400">{seed}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 bg-black/30 w-100">
                <div className="flex justify-end w-100 gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditAvatarOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAvatarSave}>
                    <span className="flex items-center">
                      <Check className="w-5 h-5" />
                      Apply Avatar
                    </span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Name Modal */}
      <AnimatePresence>
        {editNameOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border-1 border-cyan-500/30 w-full max-w-md shadow-2xl"
            >
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Edit className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Edit Display Name</h2>
                  <p className="text-gray-400">
                    This name will appear to other players
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-800/50 border-2 border-gray-700 rounded-xl px-5 py-4 text-white text-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
                      placeholder="Enter your name"
                    />
                    <div className="text-sm text-gray-400 mt-2">
                      You can use letters, numbers, and spaces
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditNameOpen(false);
                        fetchUserData();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleNameSave}>Save Changes</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom spacing for mobile */}
      <div className="h-20"></div>
    </div>
  );
};

export default Profile;
