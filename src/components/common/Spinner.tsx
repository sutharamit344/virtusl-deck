import { JSX } from "react";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  color?: "cyan" | "white" | "gray";
  center?: boolean;
  className?: string;
};

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-3",
  lg: "h-10 w-10 border-4",
};

const colorMap = {
  cyan: "border-cyan-400 border-t-transparent",
  white: "border-white border-t-transparent",
  gray: "border-gray-400 border-t-transparent",
};

function Spinner({
  size = "lg",
  color = "cyan",
  center = false,
  className = "",
}: SpinnerProps): JSX.Element {
  const spinner = (
    <div className="relative">
      <div className="w-20 h-20 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500 border-b-transparent rounded-full animate-spin animation-delay-500"></div>
    </div>
  );

  if (!center) return spinner;

  return (
    <div className="flex h-[60vh] items-center justify-center">{spinner}</div>
  );
}

export default Spinner;
