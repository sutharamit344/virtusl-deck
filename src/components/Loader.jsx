import React from 'react';
import { Box } from '@mui/material';

const Loader = () => {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0D1117',
        color: 'white',
        zIndex: 9999,
      }}
    >
      <img
        src="/vc%20logo.png"
        alt="Virtual Deck Logo"
        style={{
          height: 60,
          animation: 'rotateStep 2s steps(10, end) infinite',
        }}
      />

      <style>
        {`
          @keyframes rotateStep {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default Loader;
