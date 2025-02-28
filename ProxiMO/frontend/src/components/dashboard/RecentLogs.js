import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Button,
  IconButton,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Terminal as TerminalIcon,
  Login as LoginIcon,
  SettingsBackupRestore as BackupIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { fetchLogs } from '../../redux/slices/logSlice';
import { useNavigate } from 'react-router-dom';

const RecentLogs = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { logs, status } = useSelector((state) => state.logs);

  useEffect(() => {
    dispatch(fetchLogs({ limit: 5 }));
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchLogs({ limit: 5 }));
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'auth':
        return <LoginIcon color="primary" />;
      case 'command':
        return <TerminalIcon color="secondary" />;
      case 'backup':
        return <BackupIcon color="info" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'settings':
        return <SettingsIcon color="action" />;
      case 'security':
        return <SecurityIcon color="success" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  const getLogTypeChip = (type) => {
    const typeMap = {
      'auth': { label: 'Autenticação', color: 'primary' },
      'command': { label: 'Comando', color: 'secondary' },
      'backup': { label: 'Backup', color: 'info' },
      'error': { label: 'Erro', color: 'error' },
      'warning': { label: 'Alerta', color: 'warning' },
      'settings': { label: 'Configuração', color: 'default' },
      'security': { label: 'Segurança', color: 'success' }
    };

    const logType = typeMap[type] || { label: type, color: 'default' };
    
    return (
      <Chip 
        label={logType.label} 
        color={logType.color} 
        size="small" 
        variant="outlined"
      />
    );
  };

  const formatLogTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Demonstração - simulação de logs, já que não temos API real
  const demoLogs = [
    {
      id: 1,
      type: 'auth',
      message: 'Usuário admin fez login no sistema',
      deviceId: null,
      createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      user: { username: 'admin' }
    },
    {
      id: 2,
      type: 'command',
      message: 'Comando "show version" executado no dispositivo Router-Core',
      deviceId: '1',
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      user: { username: 'operador' }
    },
    {
      id: 3,
      type: 'error',
      message: 'Falha ao conectar no Switch-Access-2 (192.168.1.20)',
      deviceId: '2',
      createdAt: new Date(Date.now() - 55 * 60000).toISOString(),
      user: { username: 'sistema' }
    },
    {
      id: 4,
      type: 'settings',
      message: 'Configurações TACACS atualizadas',
      deviceId: null,
      createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
      user: { username: 'admin' }
    },
    {
      id: 5,
      type: 'security',
      message: 'Tentativa de acesso não autorizado bloqueada',
      deviceId: '3',
      createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
      user: { username: 'sistema' }
    }
  ];

  const displayLogs = logs && logs.length > 0 ? logs : demoLogs;

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Logs Recentes
          </Typography>
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>

        {status === 'loading' ? (
          <LinearProgress sx={{ my: 2 }} />
        ) : (
          <>
            {displayLogs.length > 0 ? (
              <List disablePadding>
                {displayLogs.map((log, index) => (
                  <React.Fragment key={log.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getLogIcon(log.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" component="span">
                              {log.message}
                            </Typography>
                            {getLogTypeChip(log.type)}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" color="textSecondary">
                              Por: {log.user?.username || 'Sistema'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatLogTime(log.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Paper elevation={0} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  Nenhum log registrado recentemente.
                </Typography>
              </Paper>
            )}

            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => navigate('/logs')}
              >
                Ver Todos os Logs
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentLogs;
