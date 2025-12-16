import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const isProfilePage = location.pathname === '/profile';
  const shouldHideHeader = location.pathname.startsWith("/room/");

  return (
    !shouldHideHeader &&
    <AppBar
      position="fixed"
      elevation={4}
      sx={{
        backgroundColor: "#121212",
        borderBottom: "1px solid #222",
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Logo & Brand Title */}
        <Box
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
          }}
        >
          <img
            src="/vc logo.png"
            alt="Virtual Deck Logo"
            style={{ height: 34 }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#E6EDF3", // light text
            }}
          >
            Virtual Deck
          </Typography>
        </Box>

        {/* User Avatar */}
        {user && !isProfilePage && (
          <Box
            onClick={() => navigate('/profile')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              '&:hover': { opacity: 0.85 },
            }}
          >
            <Typography sx={{ color: "#E6EDF3" }}>
              {user.name?.split(' ')[0]}
            </Typography>
            <Avatar alt={user.name} src={user.avatar} />
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;