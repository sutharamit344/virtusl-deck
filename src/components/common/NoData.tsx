import { JSX, ReactNode } from "react";

type NoDataProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

function NoData({
  title = "No data found",
  description = "There’s nothing to show here right now.",
  icon,
  action,
  className = "",
}: NoDataProps): JSX.Element {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl-dashed bg-black/20 px-6 py-16 text-center ${className}`}
    >
      {/* Icon */}
      {icon && <div className="mb-4 text-cyan-400 opacity-80">{icon}</div>}

      {/* Title */}
      <h3 className="mb-1 text-lg font-semibold text-white">{title}</h3>

      {/* Description */}
      <p className="mb-4 max-w-md text-sm text-gray-400">{description}</p>

      {/* Action */}
      {action && <div>{action}</div>}
    </div>
  );
}

export default NoData;
