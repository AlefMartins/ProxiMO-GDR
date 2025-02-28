import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

// Layout para páginas de autenticação (login, recuperação de senha, etc.)
const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Outlet />
    </Box>
  );
};

export default AuthLayout;
