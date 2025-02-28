import React from 'react';
import { 
  Breadcrumbs, 
  Link, 
  Typography, 
  Box 
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

/**
 * Componente de navegação em migalhas de pão (breadcrumb)
 * 
 * @param {Object} props
 * @param {Array} props.items - Array de objetos { label, link, active }
 * @param {string} props.separator - Separador opcional (padrão é NavigateNextIcon)
 */
const Breadcrumb = ({ items, separator }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs 
        separator={separator || <NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return isLast || item.active ? (
            <Typography color="text.primary" key={index}>
              {item.label}
            </Typography>
          ) : (
            <Link 
              component={RouterLink} 
              to={item.link} 
              key={index}
              underline="hover"
              color="inherit"
            >
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default Breadcrumb;
