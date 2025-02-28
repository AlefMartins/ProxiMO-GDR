import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Terminal as TerminalIcon,
  Refresh as RefreshIcon,
  Backup as BackupIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  SettingsBackupRestore as RestoreIcon,
  DynamicFeed as LogsIcon,
  NetworkCheck as CheckIcon,
} from '@mui/icons-material';
import { 
  fetchDeviceById, 
  deleteDeviceAsync, 
  executeCommandAsync, 
  clearCommandResult 
} from '../../redux/slices/deviceSlice';
import Breadcrumb from '../common/Breadcrumb';
import useNotification from '../../hooks/useNotification';
import Terminal from './Terminal';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`device-tabpanel-${index}`}
      aria-labelledby={`device-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DeviceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const notify = useNotification();
  
  const { currentDevice, status, error, commandResult, commandStatus } = useSelector(state => state.devices);

  const [tabValue, setTabValue] = useState(0);
  const [command, setCommand] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchDeviceById(id));
    
    return () => {
      dispatch(clearCommandResult());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (error) {
      notify.error(error.message || 'Erro ao carregar dispositivo');
    }
  }, [error, notify]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    navigate(`/devices/edit/${id}`);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteDeviceAsync(id)).unwrap();
      notify.success('Dispositivo excluído com sucesso');
      navigate('/devices');
    } catch (err) {
      notify.error(err.message || 'Erro ao excluir dispositivo');
    }
    setIsDeleteDialogOpen(false);
  };

  const handleRefresh = () => {
    dispatch(fetchDeviceById(id));
  };

  const handleOpenTerminal = () => {
    setIsTerminalOpen(true);
  };

  const handleCloseTerminal = () => {
    setIsTerminalOpen(false);
  };

  const handleSendCommand = () => {
    if (!command.trim()) {
      notify.warning('Por favor, digite um comando');
      return;
    }
    
    dispatch(executeCommandAsync({ deviceId: id, command }));
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'online':
        return <Chip label="Online" color="success" size="small" />;
      case 'offline':
        return <Chip label="Offline" color="error" size="small" />;
      case 'warning':
        return <Chip label="Alerta" color="warning" size="small" />;
      case 'unknown':
        return <Chip label="Desconhecido" color="default" size="small" />;
      default:
        return <Chip label={status} color="default" size="small" />;
    }
  };

  const getDeviceTypeChip = (type) => {
    switch (type) {
      case 'router':
        return <Chip label="Roteador" color="primary" size="small" />;
      case 'switch':
        return <Chip label="Switch" color="secondary" size="small" />;
      case 'firewall':
        return <Chip label="Firewall" color="error" size="small" />;
      case 'server':
        return <Chip label="Servidor" color="info" size="small" />;
      default:
        return <Chip label={type} color="default" size="small" />;
    }
  };

  if (status === 'loading' && !currentDevice) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentDevice && status !== 'loading') {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Dispositivo não encontrado
        </Typography>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/devices')}
          sx={{ mt: 2 }}
        >
          Voltar para a lista
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumb 
        items={[
          { label: 'Dashboard', link: '/' },
          { label: 'Dispositivos', link: '/devices' },
          { label: currentDevice?.name || id, active: true }
        ]} 
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h1">
            {currentDevice?.name}
          </Typography>
          <Typography color="textSecondary" gutterBottom>
            {currentDevice?.description || 'Sem descrição'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Atualizar">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Terminal">
            <IconButton onClick={handleOpenTerminal} color="primary">
              <TerminalIcon />
            </IconButton>
          </Tooltip>
          <Button 
            startIcon={<EditIcon />} 
            variant="outlined" 
            onClick={handleEdit}
          >
            Editar
          </Button>
          <Button 
            startIcon={<DeleteIcon />} 
            variant="outlined" 
            color="error"
            onClick={handleDelete}
          >
            Excluir
          </Button>
          <Button 
            startIcon={<ArrowBackIcon />} 
            variant="contained" 
            onClick={() => navigate('/devices')}
          >
            Voltar
          </Button>
        </Box>
      </Box>

      <Paper elevation={2}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          indicatorColor="primary" 
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Informações Gerais" />
          <Tab label="Console" />
          <Tab label="Histórico" />
          <Tab label="Backup" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Informações Básicas
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Hostname
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {currentDevice?.hostname || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Endereço IP
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {currentDevice?.ipAddress || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      MAC Address
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {currentDevice?.macAddress || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Tipo
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    {getDeviceTypeChip(currentDevice?.type)}
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Status
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    {getStatusChip(currentDevice?.status)}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Informações de Conexão
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Método de Acesso
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {currentDevice?.accessMethod?.toUpperCase() || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Porta
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {currentDevice?.port || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Autenticação
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {currentDevice?.authMethod || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Última Conexão
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {currentDevice?.lastAccess ? new Date(currentDevice.lastAccess).toLocaleString() : 'Nunca'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        startIcon={<CheckIcon />} 
                        variant="outlined" 
                        color="primary"
                      >
                        Testar Conexão
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Informações Adicionais
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Fabricante
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {currentDevice?.vendor || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Modelo
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {currentDevice?.model || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Versão de Software
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {currentDevice?.softwareVersion || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Número de Série
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {currentDevice?.serialNumber || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Localização
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {currentDevice?.location || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Observações
                    </Typography>
                    <Typography variant="body1">
                      {currentDevice?.notes || 'Nenhuma observação adicional'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Console de Comandos
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Digite um comando"
                variant="outlined"
                fullWidth
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={commandStatus === 'loading'}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
                InputProps={{
                    endAdornment: (
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={handleSendCommand}
                          disabled={commandStatus === 'loading'}
                          endIcon={commandStatus === 'loading' ? <CircularProgress size={20} /> : <SendIcon />}
                          sx={{ ml: 1 }}
                        >
                          Enviar
                        </Button>
                      ),
                    }}
                  />
                </Box>
                
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#000', 
                    color: '#00ff00', 
                    fontFamily: 'monospace',
                    minHeight: '300px',
                    maxHeight: '500px',
                    overflow: 'auto'
                  }}
                >
                  {commandStatus === 'loading' ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress color="inherit" size={24} />
                    </Box>
                  ) : commandResult ? (
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {commandResult}
                    </pre>
                  ) : (
                    <Typography variant="body2" color="inherit">
                      Digite um comando e pressione Enter para executar...
                    </Typography>
                  )}
                </Paper>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    startIcon={<TerminalIcon />} 
                    variant="contained" 
                    color="primary"
                    onClick={handleOpenTerminal}
                  >
                    Abrir Terminal Interativo
                  </Button>
                </Box>
              </Box>
            </TabPanel>
    
            <TabPanel value={tabValue} index={2}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Histórico de Acessos
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <LogsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="textSecondary">
                    O histórico de acessos será implementado em breve.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    sx={{ mt: 2 }}
                    disabled
                  >
                    Ver Logs Completos
                  </Button>
                </Box>
              </Box>
            </TabPanel>
    
            <TabPanel value={tabValue} index={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Backup e Restauração
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} variant="outlined" sx={{ p: 3, height: '100%' }}>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <BackupIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" gutterBottom>
                          Backup de Configuração
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Realize backup da configuração atual do dispositivo. O arquivo será salvo no servidor e disponível para download.
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button 
                          variant="contained" 
                          color="primary"
                          startIcon={<BackupIcon />}
                          disabled
                        >
                          Iniciar Backup
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} variant="outlined" sx={{ p: 3, height: '100%' }}>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <RestoreIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 1 }} />
                        <Typography variant="h6" gutterBottom>
                          Restaurar Configuração
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Restaure uma configuração anterior a partir de um arquivo de backup. Tenha cuidado, esta ação pode afetar o funcionamento do dispositivo.
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button 
                          variant="contained" 
                          color="secondary"
                          startIcon={<RestoreIcon />}
                          disabled
                        >
                          Restaurar
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>
          </Paper>
    
          <Dialog
            open={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
          >
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Tem certeza que deseja excluir o dispositivo <strong>{currentDevice?.name}</strong>? 
                Esta ação não pode ser desfeita e todos os registros relacionados serão removidos.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmDelete} color="error" variant="contained">
                Excluir
              </Button>
            </DialogActions>
          </Dialog>
    
          <Dialog
            open={isTerminalOpen}
            onClose={handleCloseTerminal}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>
              Terminal SSH - {currentDevice?.name} ({currentDevice?.ipAddress})
              <IconButton
                aria-label="close"
                onClick={handleCloseTerminal}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                }}
              >
                <DeleteIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Terminal deviceId={id} />
            </DialogContent>
          </Dialog>
        </Box>
      );
    };
    
    export default DeviceDetail;
    
                    
