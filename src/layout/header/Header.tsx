import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { navItems } from "../../__Helper/constant";
import { useState, useEffect, useRef } from "react";

interface User {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
}

interface NavItem {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user) as User | null;

  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] =
    useState<boolean>(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const shouldHideHeader = location.pathname.startsWith("/room/");

  const currentValue: string =
    navItems.find(
      (item: NavItem) =>
        location.pathname === item.value ||
        location.pathname.startsWith(item.value + "/")
    )?.value || "/";

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (shouldHideHeader) return null;

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-gradient-to-b from-[#0D1117]/95 via-[#0D1117]/90 to-transparent backdrop-blur-xl border-b border-white/10 shadow-lg"
            : "bg-gradient-to-b from-[#0D1117]/95 to-transparent backdrop-blur-lg"
        }`}
      >
        <div className="mx-auto lg:max-w-287.5 px-4 lg:px-6 flex h-16 items-center justify-between">
          <div
            onClick={() => navigate("/")}
            className="group flex cursor-pointer items-center gap-2 transition-transform hover:scale-105"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/")}
          >
            <div className="relative">
              <img
                src="/vc%20logo.png"
                alt="Virtual Deck Logo"
                className="h-10 w-10"
              />
              <div className="absolute inset-0 rounded-full bg-[#00D8FF] opacity-20 blur-md group-hover:opacity-30 transition-opacity"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-white">
                Digi <span className="text-[#00D8FF]"> Card</span>
              </span>
              <div className="h-0.5 w-0 bg-gradient-to-r from-[#00D8FF] to-transparent transition-all group-hover:w-full"></div>
            </div>
          </div>

          {/* Right Side - Responsive layout */}
          <div className="flex items-center gap-4">
            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item: NavItem) => {
                const active =
                  currentValue === item.value ||
                  location.pathname.startsWith(item.value + "/");

                return (
                  <button
                    key={item.value}
                    onClick={() => navigate(item.value)}
                    className={`group flex flex-col items-center gap-1 px-2 py-1.5 transition-all duration-200 ${
                      active
                        ? "text-[#00D8FF]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="flex items-center justify-center w-5 h-5">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </span>
                    <div
                      className={`h-0.5 transition-all duration-300 ${
                        active
                          ? "w-full bg-gradient-to-r from-[#00D8FF] to-cyan-500"
                          : "w-0 group-hover:w-full bg-white/50"
                      }`}
                    />
                  </button>
                );
              })}
            </nav>
            {/* Profile Section */}
            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => navigate("profile")}
                  className="flex items-center gap-3 rounded-xl transition-all duration-200 hover:bg-white/5 active:scale-95"
                  aria-label="User profile menu"
                  aria-expanded={isProfileDropdownOpen}
                >
                  {/* User name - hidden on mobile, shown on desktop */}
                  <div className="text-right">
                    <div className="text-xs">Hi,</div>
                    <div className="text-sm font-semibold text-white">
                      {user.name?.split(" ")[0] || "User"}
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src={user.avatar || "/default-avatar.png"}
                      alt={user.name || "User"}
                      className="h-10 w-10 rounded-full border-2 border-white/20 object-cover transition-all hover:border-[#00D8FF]"
                    />
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#121212] bg-green-500 shadow-md"></div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors border-1 border-white/10"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="rounded-xl bg-gradient-to-r from-[#00D8FF] to-cyan-500 px-5 py-2.5 text-sm font-bold text-[#121212] transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#00D8FF]/20"
                >
                  Sign Up Free
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
