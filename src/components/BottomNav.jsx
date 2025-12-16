import React from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import DeckIcon from "@mui/icons-material/Style";
import GroupIcon from "@mui/icons-material/Group";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = ({ select }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Home", value: "/", icon: <HomeIcon /> },
    { label: "Decks", value: "/decks", icon: <DeckIcon /> },
    { label: "Rooms", value: "/rooms", icon: <GroupIcon /> },
    { label: "Store", value: "/store", icon: <StorefrontIcon /> },
  ];

  const currentValue =
    select !== undefined
      ? navItems[select]?.value
      : navItems.find((item) =>
          location.pathname === item.value ||
          location.pathname.startsWith(item.value + "/")
        )?.value || "/";

  const handleChange = (_, newValue) => {
    if (newValue !== location.pathname) {
      navigate(newValue);
    }
  };

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: "#121212",
        borderTop: "1px solid #222",
        zIndex: 1000,
        boxShadow: "0 -2px 10px rgba(0, 216, 255, 0.1)",
      }}
      elevation={3}
    >
     <BottomNavigation
      value={currentValue}
      onChange={handleChange}
      showLabels={false}
      sx={{
        backgroundColor: "#121212",
        "& .MuiBottomNavigationAction-root": {
          color: "#AAA",
          "&:hover": {
            color: "#00D8FF",
          },
        },
        "& .Mui-selected": {
          color: "#00D8FF",
        },
      }}
    >
      {navItems.map(({ label, value, icon }) => (
        <BottomNavigationAction
          key={value}
          value={value}
          icon={icon}
          label={currentValue === value ? label : null}
        />
      ))}
    </BottomNavigation>

    </Paper>
  );
};

export default BottomNav;
