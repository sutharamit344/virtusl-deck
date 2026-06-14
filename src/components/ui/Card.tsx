import { JSX, ReactNode } from "react";

type CardVariant = "default" | "elevated";

type CardProps = {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  variant?: CardVariant;
  onClick?: () => void;
};

const variants: Record<CardVariant, string> = {
  default: "bg-[#1e1e1e] border-white/10",
  elevated: `
    bg-[#181818] border-1 border-[#2a2a2a]
    transition-all duration-200 ease-in-out
    hover:bg-[#202020]
    hover:border-cyan-400/30
    hover:shadow-[0_0_20px_rgba(0,216,255,0.1)]
    hover:-translate-y-[2px]
  `,
};

function Card({
  children,
  className = "",
  hoverable = false,
  variant = "default",
  onClick,
}: CardProps): JSX.Element {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl px-4 py-4 text-white
        ${variants[variant]}
        ${hoverable ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Card;
