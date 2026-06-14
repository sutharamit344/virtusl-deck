import React, { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";

interface DropZoneProps {
  text?: string;
  style?: React.CSSProperties;
  id: string;
  children?: ReactNode;
  disabled?: boolean;
  locationName?: string;
}

const DropZone: React.FC<DropZoneProps> = ({
  text,
  style,
  id,
  children,
  disabled = false,
  locationName = "",
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { locationName },
  });

  return (
    <div
      ref={(e: HTMLElement | null) => setNodeRef(e)}
      id={id}
      style={{
        boxSizing: "border-box",
        border: isOver && !disabled ? "2px dashed #4caf50" : "none",
        backgroundColor:
          isOver && !disabled ? "rgba(76, 175, 80, 0.05)" : "transparent",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease-in-out",
        ...style,
      }}
    >
      {text}
      {children}
    </div>
  );
};

export default DropZone;
