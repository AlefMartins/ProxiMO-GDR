import React from 'react';
import { 
  Box, 
  Typography, 
  Link, 
  Divider,
  Container,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Mail as MailIcon
} from '@mui/icons-material';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        mt: 'auto',
        py: 3,
        px: 2,
        backgroundColor: (theme) => theme.palette.background.paper
      }}
    >
      <Divider />
      <Container maxWidth="lg">
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            &copy; {currentYear} ProxiMO - Gerenciamento de Dispositivos de Rede
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 1,
              mt: { xs: 2, sm: 0 } 
            }}
          >
            <Tooltip title="GitHub">
              <IconButton 
                aria-label="GitHub" 
                color="inherit"
                size="small"
                component={Link}
                href="https://github.com/seu-usuario/ProxiMO"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="LinkedIn">
              <IconButton 
                aria-label="LinkedIn" 
                color="inherit"
                size="small"
                component={Link}
                href="https://linkedin.com/in/seu-perfil"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Contato">
              <IconButton 
                aria-label="Email" 
                color="inherit"
                size="small"
                component={Link}
                href="mailto:contato@exemplo.com"
              >
                <MailIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary" align="center">
            Versão 1.0.0 | 
            <Link 
              href="/terms" 
              color="inherit" 
              sx={{ ml: 0.5, mr: 0.5 }}
            >
              Termos de Uso
            </Link>
            |
            <Link 
              href="/privacy" 
              color="inherit" 
              sx={{ ml: 0.5 }}
            >
              Política de Privacidade
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
