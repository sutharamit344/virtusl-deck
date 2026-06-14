import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { createRoom } from "./services/createRoom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { useAppDispatch } from "../../app/hooks";
import { insertRoomHistory } from "./services/rooms.services";

const CreateRoom: React.FC = () => {
  const dispatch = useAppDispatch();
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth.user);

  const handleCreate = async () => {
    if (!user) return;
    const roomId = await createRoom(roomName.trim(), user, password.trim());

    dispatch(
      insertRoomHistory({
        roomId,
        action: "Room created",
        details: `Room: ${roomName}`,
      }),
    );
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-4">
      <Card>
        {/* Title */}
        <h1 className="text-center text-2xl font-bold text-cyan-400 mb-2">
          Create a Room
        </h1>
        <p className="text-center text-sm text-gray-400 mb-6">
          Start a private room and invite your friends
        </p>

        {/* Room Name */}
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-1">
            Room Name (optional)
          </label>
          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="My Card Room"
            className="w-full rounded-xl border-1 border-white/10 bg-[#0D1117] px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-1">
            Password (optional)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border-1 border-white/10 bg-[#0D1117] px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <Button onClick={handleCreate}>Create Room</Button>
      </Card>
    </div>
  );
};

export default CreateRoom;
