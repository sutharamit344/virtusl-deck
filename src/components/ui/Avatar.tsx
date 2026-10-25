import React from "react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string | null; // Used for initials if src fails
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away" | "busy";
  className?: string; // For custom styling like borders
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "User Avatar",
  name,
  size = "md",
  status,
  className = "",
}) => {
  // Size Mapping
  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
  };

  // Status Color Mapping
  const statusClasses = {
    online: "bg-green-500",
    offline: "bg-slate-500",
    away: "bg-amber-500",
    busy: "bg-red-500",
  };

  // Generate Initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
        ${sizeClasses[size]} 
        relative flex items-center justify-center 
        rounded-full overflow-hidden 
        bg-gradient-to-br from-slate-800 to-slate-900 
        border-1 border-white/10
      `}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="font-bold text-slate-400 tracking-tighter italic">
            {name ? getInitials(name) : "?"}
          </span>
        )}
      </div>

      {/* Status Indicator */}
      {status && (
        <span
          className={`
          absolute bottom-0 right-0 
          block rounded-full ring-2 ring-[#0B0E14]
          ${statusClasses[status]}
          ${size === "xs" || size === "sm" ? "w-2 h-2" : "w-3 h-3"}
        `}
        />
      )}
    </div>
  );
};

export default Avatar;
