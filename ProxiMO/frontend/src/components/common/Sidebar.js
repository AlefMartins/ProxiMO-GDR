import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Collapse,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Router as RouterIcon,
  Storage as ServerIcon,
  BackupTable as BackupIcon,
  Code as CommandIcon,
  History as LogsIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  ExpandLess,
  ExpandMore,
  DeviceHub,
  Security as SecurityIcon,
  Group as UsersIcon,
  Monitor as MonitorIcon
} from '@mui/icons-material';
import { toggleSidebar, toggleMenuItem } from '../../redux/slices/uiSlice';
import Logo from './Logo';

// Largura do menu lateral
const DRAWER_WIDTH = 240;

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { open, expandedItems } = useSelector((state) => state.ui.sidebar);
  const { user } = useSelector((state) => state.auth);
  
  // Lista de itens do menu
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/',
      icon: <DashboardIcon />,
    },
    {
      id: 'devices',
      label: 'Dispositivos',
      path: '/devices',
      icon: <DeviceHub />,
      children: [
        {
          id: 'all-devices',
          label: 'Todos os Dispositivos',
          path: '/devices',
        },
        {
          id: 'add-device',
          label: 'Adicionar Dispositivo',
          path: '/devices/new',
        },
        {
          id: 'monitor',
          label: 'Monitoramento',
          path: '/devices/monitor',
        },
      ],
    },
    {
      id: 'commands',
      label: 'Comandos',
      path: '/commands',
      icon: <CommandIcon />,
    },
    {
      id: 'backup',
      label: 'Backup',
      path: '/backup',
      icon: <BackupIcon />,
    },
    {
      id: 'logs',
      label: 'Logs',
      path: '/logs',
      icon: <LogsIcon />,
    },
    // Itens de administração (apenas para administradores)
    ...(user?.role === 'admin' ? [
      {
        id: 'admin',
        label: 'Administração',
        icon: <SecurityIcon />,
        children: [
          {
            id: 'users',
            label: 'Usuários',
            path: '/admin/users',
          },
          {
            id: 'settings',
            label: 'Configurações',
            path: '/admin/settings',
          },
        ],
      },
    ] : []),
    // Configurações do usuário
    {
      id: 'settings',
      label: 'Configurações',
      path: '/settings',
      icon: <SettingsIcon />,
    },
    {
      id: 'about',
      label: 'Sobre',
      path: '/about',
      icon: <InfoIcon />,
    },
  ];

  // Fechar o menu em dispositivos móveis quando a rota muda
  useEffect(() => {
    if (isMobile && open) {
      dispatch(toggleSidebar());
    }
  }, [location.pathname, isMobile, dispatch, open]);

  // Verificar se um item está ativo (na rota atual ou tem filho ativo)
  const isItemActive = (item) => {
    if (item.path === location.pathname) {
      return true;
    }
    
    // Verificar filhos
    if (item.children) {
      return item.children.some(child => child.path === location.pathname);
    }
    
    return false;
  };

  // Handler para clicar em um item do menu
  const handleItemClick = (item) => {
    if (item.children) {
      // Se tem filhos, expande/recolhe o submenu
      dispatch(toggleMenuItem(item.id));
    } else {
      // Se não tem filhos, navega para a rota
      navigate(item.path);
      
      // Em dispositivos móveis, fecha o menu após a navegação
      if (isMobile) {
        dispatch(toggleSidebar());
      }
    }
  };

  // Verificar se um submenu deve estar expandido
  const isItemExpanded = (itemId) => {
    return expandedItems.includes(itemId);
  };

  // Conteúdo do menu lateral
  const drawerContent = (
    <>
      <Toolbar 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          px: 1
        }}
      >
        {!isMobile && (
          <Logo variant="horizontal" height={40} light={theme.palette.mode === 'dark'} />
        )}
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.id}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleItemClick(item)}
                selected={isItemActive(item)}
                sx={{
                  pl: 2,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                    borderRight: `3px solid ${theme.palette.primary.main}`,
                  }
                }}
              >
                <ListItemIcon sx={{ color: isItemActive(item) ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  sx={{ 
                    '& .MuiTypography-root': { 
                      fontWeight: isItemActive(item) ? 600 : 400 
                    } 
                  }}
                />
                {item.children && (
                  isItemExpanded(item.id) ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>
            
            {/* Submenu (filhos) */}
            {item.children && (
              <Collapse in={isItemExpanded(item.id)} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItemButton 
                      key={child.id}
                      onClick={() => navigate(child.path)}
                      selected={location.pathname === child.path}
                      sx={{ 
                        pl: 4,
                        '&.Mui-selected': {
                          backgroundColor: theme.palette.action.selected,
                          borderRight: `3px solid ${theme.palette.primary.main}`,
                        }
                      }}
                    >
                      <ListItemText 
                        primary={child.label}
                        sx={{ 
                          '& .MuiTypography-root': { 
                            fontWeight: location.pathname === child.path ? 600 : 400,
                            fontSize: '0.9rem'
                          } 
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          ProxiMO v1.0.0
        </Typography>
      </Box>
    </>
  );

  return (
    <>
      {/* Menu para dispositivos móveis (temporário) */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={open}
          onClose={() => dispatch(toggleSidebar())}
          ModalProps={{
            keepMounted: true, // Melhor desempenho em dispositivos móveis
          }}
          sx={{
            '& .MuiDrawer-paper': { 
              width: DRAWER_WIDTH, 
              boxSizing: 'border-box'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
      
      {/* Menu para desktop (permanente) */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { 
              width: DRAWER_WIDTH, 
              boxSizing: 'border-box',
              borderRight: (theme) => `1px solid ${theme.palette.divider}`
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
