import React from "react";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";

const RoomNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center text-[#E6EDF3] px-4">
      <AlertTriangle className="text-red-500 mb-4" size={80} />

      <h2 className="text-2xl font-bold mb-2">
        Room Not Found
      </h2>

      <p className="text-gray-400 mb-6 max-w-[400px] leading-relaxed">
        The room you’re looking for doesn’t exist or was deleted.
      </p>

      <Button
        variant="primary"
        onClick={() => navigate("/")}
        className="bg-[#00D8FF] text-[#121212] font-semibold px-6 py-2.5 rounded-xl shadow-md hover:bg-cyan-400"
      >
        Back to Home
      </Button>
    </div>
  );
};

export default RoomNotFound;
