import { useNavigate, useLocation } from "react-router-dom";
import { navItems } from "../../__Helper/constant";
import { ReactNode } from "react";

interface NavItem {
  label: string;
  value: string;
  icon: ReactNode;
}

interface BottomNavProps {
  select?: number;
}

const BottomNav = ({ select }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentValue =
    select !== undefined
      ? navItems[select]?.value
      : navItems.find(
          (item: NavItem) =>
            location.pathname === item.value ||
            location.pathname.startsWith(item.value + "/")
        )?.value || "/";

  const handleClick = (value: string) => {
    if (value !== location.pathname) {
      navigate(value);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/95 to-transparent pt-8">
      {/* Floating navigation bar */}
      <div className="mx-4 mb-4 bg-[#0D1117]/80 backdrop-blur-xl rounded-2xl border-1 border-white/10 shadow-xl">
        <div className="flex items-center justify-around p-1">
          {navItems.map((item: NavItem) => {
            const isActive = currentValue === item.value;

            return (
              <button
                key={item.value}
                onClick={() => handleClick(item.value)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-200 ${
                  isActive ? "text-[#00D8FF]" : "text-gray-400 hover:text-white"
                }`}
              >
                {/* Icon */}
                <div className="relative">
                  <div>{item.icon}</div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-[#00D8FF]"></div>
                  )}
                </div>

                {/* Label - always visible but subtle */}
                <span
                  className={`text-[9px] font-medium mt-1 ${
                    isActive ? "opacity-100" : "opacity-60"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
