import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const JoinRoom: React.FC = () => {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (roomCode.trim()) {
      navigate(`/room/${roomCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-4">
      <Card variant="elevated" className="w-full max-w-md p-6">
        {/* Title */}
        <h1 className="text-center text-2xl font-bold text-cyan-400 mb-2">
          Join a Room
        </h1>
        <p className="text-center text-sm text-gray-400 mb-6">
          Enter a room code to jump into the game
        </p>

        {/* Room Code Input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-1">
            Room Code
          </label>
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="room_ab12cd"
            className="
              w-full rounded-xl border-1 border-white/10 bg-[#0D1117]
              px-4 py-3 text-white placeholder-gray-500
              outline-none transition
              focus:border-cyan-400
              focus:ring-2 focus:ring-cyan-400/20
            "
          />
        </div>

        {/* Join Button */}
        <Button
          onClick={handleJoin}
          disabled={!roomCode.trim()}
        >
          Join Room
        </Button>
      </Card>
    </div>
  );
};

export default JoinRoom;
