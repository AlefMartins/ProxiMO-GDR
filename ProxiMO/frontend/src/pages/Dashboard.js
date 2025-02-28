import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Chip,
} from '@mui/material';
import {
  DeviceHub as DeviceIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import api from '../utils/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    devices: { total: 0, online: 0, offline: 0 },
    users: { total: 0, active: 0 },
    logs: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Em um cenário real, você teria endpoints específicos para estatísticas
        // Aqui estamos simulando com chamadas separadas
        const [devicesRes, usersRes, logsRes] = await Promise.all([
          api.get('/devices'),
          api.get('/users'),
          api.get('/logs?limit=5')
        ]);

        // Processar resultados
        const devices = devicesRes.data;
        const users = usersRes.data;
        const logs = logsRes.data || [];

        setStats({
          devices: {
            total: devices.length,
            online: devices.filter(d => d.status === 'online').length,
            offline: devices.filter(d => d.status === 'offline').length
          },
          users: {
            total: users.length,
            active: users.filter(u => u.isActive).length
          },
          logs: logs
        });
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        // Em um ambiente de produção, você usaria um sistema de notificação
        // toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Para demonstração, vamos simular alguns logs caso a API não retorne
  const mockLogs = [
    { id: 1, type: 'login', user: 'admin', status: 'success', timestamp: new Date() },
    { id: 2, type: 'device', user: 'operator', device: 'Router-01', status: 'success', timestamp: new Date(Date.now() - 3600000) },
    { id: 3, type: 'config', user: 'john', status: 'failure', timestamp: new Date(Date.now() - 7200000) },
    { id: 4, type: 'device', user: 'mary', device: 'Switch-03', status: 'success', timestamp: new Date(Date.now() - 86400000) },
    { id: 5, type: 'login', user: 'guest', status: 'failure', timestamp: new Date(Date.now() - 172800000) },
  ];

  // Função para renderizar chip de status
  const renderStatusChip = (status) => {
    if (status === 'success') {
      return <Chip size="small" icon={<CheckIcon />} label="Sucesso" color="success" />;
    } else if (status === 'failure') {
      return <Chip size="small" icon={<ErrorIcon />} label="Falha" color="error" />;
    } else {
      return <Chip size="small" icon={<WarningIcon />} label="Aviso" color="warning" />;
    }
  };

  // Função para formatar logs
  const formatLogMessage = (log) => {
    if (log.type === 'login') {
      return `Login ${log.status === 'success' ? 'bem-sucedido' : 'falhou'} para usuário ${log.user}`;
    } else if (log.type === 'device') {
      return `Acesso ao dispositivo ${log.device} por ${log.user}`;
    } else if (log.type === 'config') {
      return `Alteração de configuração por ${log.user}`;
    }
    return `Atividade: ${log.type}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {/* Cards de estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Total de Dispositivos
              </Typography>
              <Typography variant="h3">{stats.devices.total}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Dispositivos Online
              </Typography>
              <Typography variant="h3" color="success.main">{stats.devices.online}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Dispositivos Offline
              </Typography>
              <Typography variant="h3" color="error.main">{stats.devices.offline}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Usuários Ativos
              </Typography>
              <Typography variant="h3">{stats.users.active} / {stats.users.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Atividades recentes */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Atividades Recentes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {(stats.logs.length > 0 ? stats.logs : mockLogs).map((log) => (
                <ListItem key={log.id} divider>
                  <ListItemIcon>
                    <HistoryIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={formatLogMessage(log)}
                    secondary={format(new Date(log.timestamp), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  />
                  {renderStatusChip(log.status)}
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Estado do Sistema
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem divider>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Autenticação Local"
                  secondary="Funcionando normalmente"
                />
                <Chip size="small" label="Online" color="success" />
              </ListItem>
              
              <ListItem divider>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="LDAP / Active Directory"
                  secondary="Conectado ao servidor"
                />
                <Chip size="small" label="Online" color="success" />
              </ListItem>
              
              <ListItem divider>
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="TACACS+"
                  secondary="Conectado com latência elevada"
                />
                <Chip size="small" label="Degradado" color="warning" />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <ErrorIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="RADIUS"
                  secondary="Não configurado"
                />
                <Chip size="small" label="Offline" color="error" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
