import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
  Divider,
  ListItemIcon,
  useMediaQuery,
  Badge,
  Button,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { logout } from '../../redux/slices/authSlice';
import { toggleThemeMode } from '../../redux/slices/themeSlice';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import Logo from './Logo';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const { notifications } = useSelector((state) => state.notifications || { notifications: [] });
  
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    dispatch(logout());
    navigate('/login');
  };

  const handleProfileClick = () => {
    handleUserMenuClose();
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    handleUserMenuClose();
    navigate('/settings');
  };

  const handleToggleTheme = () => {
    dispatch(toggleThemeMode());
    handleUserMenuClose();
  };

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  // Simular notificações não lidas
  const unreadNotifications = notifications ? notifications.filter(n => !n.read).length : 0;

  // Obter o título da página baseado no path
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Dashboard';
    if (path === '/devices') return 'Dispositivos';
    if (path.startsWith('/devices/new')) return 'Novo Dispositivo';
    if (path.startsWith('/devices/edit')) return 'Editar Dispositivo';
    if (path.startsWith('/devices/')) return 'Detalhes do Dispositivo';
    if (path === '/backup') return 'Backup e Restauração';
    if (path === '/commands') return 'Gerenciamento de Comandos';
    if (path === '/logs') return 'Logs do Sistema';
    if (path === '/profile') return 'Perfil do Usuário';
    if (path === '/settings') return 'Configurações';
    if (path === '/about') return 'Sobre o Sistema';
    
    return 'ProxiMO';
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: (theme) => theme.palette.mode === 'light' 
          ? theme.palette.primary.main 
          : theme.palette.background.paper,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`
      }}
    >
      <Toolbar>
        {isMobile ? (
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleToggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <Logo 
            variant="horizontal" 
            height={40} 
            light={theme.palette.mode === 'dark'} 
          />
        )}

        {isMobile && (
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {getPageTitle()}
          </Typography>
        )}
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Alternar tema">
            <IconButton color="inherit" onClick={handleToggleTheme}>
              {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Notificações">
            <IconButton color="inherit" onClick={handleNotificationsOpen}>
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Minha conta">
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleUserMenuOpen}
              sx={{ ml: 1 }}
            >
              {user && user.avatar ? (
                <Avatar 
                  src={user.avatar} 
                  alt={user.name || user.username}
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <AccountCircle />
              )}
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Menu do usuário */}
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleUserMenuClose}
          PaperProps={{
            elevation: 3,
            sx: { minWidth: 200 }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1" noWrap>
              {user?.name || user?.username || 'Usuário'}
            </Typography>
            <Typography variant="body2" color="textSecondary" noWrap>
              {user?.email || ''}
            </Typography>
          </Box>
          
          <Divider />
          
          <MenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Meu Perfil
          </MenuItem>
          
          <MenuItem onClick={handleSettingsClick}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Configurações
          </MenuItem>
          
          <MenuItem onClick={handleToggleTheme}>
            <ListItemIcon>
              {theme.palette.mode === 'dark' ? (
                <LightModeIcon fontSize="small" />
              ) : (
                <DarkModeIcon fontSize="small" />
              )}
            </ListItemIcon>
            {theme.palette.mode === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sair
          </MenuItem>
        </Menu>
        
        {/* Menu de notificações */}
        <Menu
          anchorEl={notificationsAnchor}
          open={Boolean(notificationsAnchor)}
          onClose={handleNotificationsClose}
          PaperProps={{
            elevation: 3,
            sx: { minWidth: 300, maxWidth: 320 }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1">
              Notificações
            </Typography>
          </Box>
          
          <Divider />
          
          {notifications && notifications.length > 0 ? (
            <>
              {notifications.slice(0, 5).map((notification) => (
                <MenuItem key={notification.id} onClick={handleNotificationsClose}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" noWrap>
                      {notification.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(notification.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
              
              <Divider />
              
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button 
                  size="small" 
                  onClick={() => {
                    handleNotificationsClose();
                    navigate('/notifications');
                  }}
                >
                  Ver Todas
                </Button>
              </Box>
            </>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Nenhuma notificação
              </Typography>
            </Box>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
