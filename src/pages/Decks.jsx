import React from 'react';
import RedeemDeck from '../components/RedeemDeck';
import RedeemedDecks from '../components/RedeemedDecks';
import BottomNav from '../components/BottomNav';
import { Box, Typography, Divider } from '@mui/material';

const Decks = () => {
  return (
    <Box
      sx={{
        bgcolor: 'linear-gradient(to right, #232526, #414345)',
        minHeight: '100vh',
        color: '#fff',
        mt:6,
        pt:6,
        px: { xs: 2, sm: 4 },
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Your Decks
        </Typography>
        <Typography variant="subtitle2" sx={{ color: '#aaa' }}>
          Redeem and manage your virtual card decks
        </Typography>
        <Divider sx={{ mt: 2, borderColor: '#444' }} />
      </Box>

      <Box sx={{ maxWidth: '600px', mx: 'auto', mb: 4 }}>
        <RedeemDeck />
      </Box>

      <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
        <RedeemedDecks />
      </Box>

      <BottomNav select={1} />
    </Box>
  );
};

export default Decks;
