import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Divider,
  Chip,
  LinearProgress,
  Button,
  IconButton
} from '@mui/material';
import {
  Router as RouterIcon,
  Storage as ServerIcon,
  Security as FirewallIcon,
  Refresh as RefreshIcon,
  CheckCircle as OnlineIcon,
  Cancel as OfflineIcon,
  Warning as WarningIcon,
  DeviceHub as SwitchIcon
} from '@mui/icons-material';
import { fetchDevices } from '../../redux/slices/deviceSlice';
import { useNavigate } from 'react-router-dom';

const DeviceStatus = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { devices, status } = useSelector((state) => state.devices);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    warning: 0,
    byType: {}
  });

  // Dispositivos recentes (até 5)
  const recentDevices = [...(devices || [])]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  useEffect(() => {
    if (!devices || devices.length === 0) {
      dispatch(fetchDevices({ limit: 100 }));
    }
  }, [dispatch, devices]);

  useEffect(() => {
    if (devices) {
      const newStats = {
        total: devices.length,
        online: devices.filter(d => d.status === 'online').length,
        offline: devices.filter(d => d.status === 'offline').length,
        warning: devices.filter(d => d.status === 'warning').length,
        byType: {}
      };

      // Agrupar por tipo
      devices.forEach(device => {
        if (!newStats.byType[device.type]) {
          newStats.byType[device.type] = 0;
        }
        newStats.byType[device.type]++;
      });

      setStats(newStats);
    }
  }, [devices]);

  const handleRefresh = () => {
    dispatch(fetchDevices({ limit: 100 }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <OnlineIcon sx={{ fontSize: 16 }} color="success" />;
      case 'offline':
        return <OfflineIcon sx={{ fontSize: 16 }} color="error" />;
      case 'warning':
        return <WarningIcon sx={{ fontSize: 16 }} color="warning" />;
      default:
        return <OfflineIcon sx={{ fontSize: 16 }} color="disabled" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'router':
        return <RouterIcon />;
      case 'switch':
        return <SwitchIcon />;
      case 'firewall':
        return <FirewallIcon />;
      case 'server':
        return <ServerIcon />;
      default:
        return <DeviceHub />;
    }
  };

  const getVendorDisplay = (vendor) => {
    const vendorMap = {
      'cisco': 'Cisco',
      'juniper': 'Juniper',
      'huawei': 'Huawei',
      'fortinet': 'Fortinet',
      'paloalto': 'Palo Alto',
      'hpe': 'HPE',
      'dell': 'Dell',
      'other': 'Outro'
    };
    
    return vendorMap[vendor] || vendor;
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Status dos Dispositivos
          </Typography>
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>

        {status === 'loading' ? (
          <LinearProgress sx={{ my: 2 }} />
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                  <Typography variant="body2" color="textSecondary">Total</Typography>
                  <Typography variant="h4" sx={{ mt: 1 }}>{stats.total}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50', color: 'success.main' }}>
                  <Typography variant="body2" color="inherit">Online</Typography>
                  <Typography variant="h4" sx={{ mt: 1 }}>{stats.online}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'error.50', color: 'error.main' }}>
                  <Typography variant="body2" color="inherit">Offline</Typography>
                  <Typography variant="h4" sx={{ mt: 1 }}>{stats.offline}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50', color: 'warning.main' }}>
                  <Typography variant="body2" color="inherit">Alertas</Typography>
                  <Typography variant="h4" sx={{ mt: 1 }}>{stats.warning}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Dispositivos Recentes
            </Typography>

            {recentDevices.length > 0 ? (
              <Box sx={{ mt: 1 }}>
                {recentDevices.map((device) => (
                  <Paper 
                    key={device.id} 
                    elevation={0} 
                    sx={{ 
                      p: 1, 
                      mb: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => navigate(`/devices/${device.id}`)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        {getTypeIcon(device.type)}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {device.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {device.ipAddress} • {getVendorDisplay(device.vendor)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      {getStatusIcon(device.status)}
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Nenhum dispositivo cadastrado
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => navigate('/devices')}
              >
                Ver Todos
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DeviceStatus;
