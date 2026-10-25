import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen text-[#E6EDF3] flex flex-col justify-center items-center text-center px-6">
      <h1 className="text-8xl font-black text-[#00D8FF] mb-2">
        404
      </h1>
      <h2 className="text-2xl font-bold mb-2">
        Page Not Found
      </h2>
      <p className="text-gray-400 mb-6 max-w-[400px] leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button
        variant="primary"
        className="bg-[#00D8FF] text-[#121212] font-bold px-6 py-2.5 rounded-xl shadow-md hover:bg-cyan-400"
        onClick={() => navigate("/")}
      >
        Go Home
      </Button>
    </div>
  );
};

export default NotFound;
