// components/DropZone.jsx
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Box } from "@mui/material";

const DropZone = ({ text, sx, id, children, disabled = false }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Box
      ref={(e) => !disabled ? setNodeRef(e) : null}
      id={id}
      sx={{
        boxSizing: "border-box",
        border: isOver && !disabled ? "2px dashed #4caf50" : "none",
        backgroundColor: isOver && !disabled ? "rgba(76, 175, 80, 0.05)" : "transparent",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease-in-out",
        ...sx,
      }}
    >
      {text}
      {children}
    </Box>
  );
};

export default DropZone;
