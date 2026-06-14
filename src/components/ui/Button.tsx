import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "warning"
  | "ghost";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all" +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan-400 text-[#121212] hover:bg-cyan-500 shadow-md hover:shadow-lg",
  secondary:
    "border-1 border-white/50 text-gray-200 hover:border-cyan-400 hover:text-[#121212] hover:bg-cyan-400",
  danger: "bg-red-500 text-white hover:bg-red-600 border-1 border-red-700",
  success: "bg-green-500 text-white hover:bg-green-600 border-1 border-green-700",
  warning: "bg-orange-500 text-white hover:bg-orange-600 border-1 border-orange-700",
  ghost: "bg-transparent text-gray-300 hover:bg-white/10",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    asChild = false,
    className = "",
    disabled,
    children,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      disabled={!asChild ? disabled || loading : undefined}
      className={`rounded text-nowrap ${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {/* Left */}
      {loading ? <Spinner /> : leftIcon}

      {/* Content (keeps width stable) */}
      <span className={loading ? "opacity-70" : undefined}>{children}</span>

      {/* Right */}
      {!loading && rightIcon}
    </Comp>
  );
});

export default Button;
