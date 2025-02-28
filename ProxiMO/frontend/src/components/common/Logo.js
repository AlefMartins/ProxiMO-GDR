import React from 'react';
import { Box, Typography } from '@mui/material';
import { RouterOutlined } from '@mui/icons-material';

/**
 * Componente de Logo do sistema ProxiMO
 * 
 * @param {Object} props
 * @param {string} props.variant - 'horizontal' ou 'vertical' ou 'icon'
 * @param {number} props.width - Largura (se variant é 'horizontal' ou 'vertical')
 * @param {number} props.height - Altura (se variant é 'horizontal')
 * @param {boolean} props.light - Se true, usa versão light do logo
 */
const Logo = ({ variant = 'horizontal', width, height, light = false }) => {
  const logoColor = light ? '#ffffff' : '#1976d2';
  const textColor = light ? '#ffffff' : 'inherit';
  
  // Logo apenas ícone
  if (variant === 'icon') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RouterOutlined
          sx={{
            color: logoColor,
            fontSize: width || 40
          }}
        />
      </Box>
    );
  }
  
  // Logo horizontal (ícone + texto lado a lado)
  if (variant === 'horizontal') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: height || 'auto' }}>
        <RouterOutlined
          sx={{
            color: logoColor,
            fontSize: height ? height * 0.8 : 30,
            mr: 1
          }}
        />
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 700,
            letterSpacing: '.1rem',
            color: textColor,
            textDecoration: 'none',
            lineHeight: 1,
            fontSize: height ? height * 0.4 : 'inherit'
          }}
        >
          Proxi<Box component="span" sx={{ color: logoColor }}>MO</Box>
        </Typography>
      </Box>
    );
  }
  
  // Logo vertical (ícone acima do texto)
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        width: width || 'auto'
      }}
    >
      <RouterOutlined
        sx={{
          color: logoColor,
          fontSize: width ? width * 0.6 : 60,
          mb: 1
        }}
      />
      <Typography
        variant="h5"
        component="div"
        sx={{
          fontWeight: 700,
          letterSpacing: '.1rem',
          color: textColor,
          textDecoration: 'none',
          fontSize: width ? width * 0.2 : 'inherit'
        }}
      >
        Proxi<Box component="span" sx={{ color: logoColor }}>MO</Box>
      </Typography>
    </Box>
  );
};

export default Logo;
