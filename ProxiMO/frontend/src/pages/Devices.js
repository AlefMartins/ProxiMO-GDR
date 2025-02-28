import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Terminal as TerminalIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../utils/api';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    port: 22,
    manufacturer: '',
    model: '',
    supportsSsh: true,
    supportsTelnet: false,
    supportsWinbox: false,
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/devices');
      setDevices(response.data);
    } catch (error) {
      console.error('Erro ao buscar dispositivos:', error);
      // toast.error('Erro ao carregar dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (device = null) => {
    if (device) {
      setCurrentDevice(device);
      setFormData({
        name: device.name,
        ipAddress: device.ipAddress,
        port: device.port,
        manufacturer: device.manufacturer,
        model: device.model,
        supportsSsh: device.supportsSsh,
        supportsTelnet: device.supportsTelnet,
        supportsWinbox: device.supportsWinbox,
      });
    } else {
      setCurrentDevice(null);
      setFormData({
        name: '',
        ipAddress: '',
        port: 22,
        manufacturer: '',
        model: '',
        supportsSsh: true,
        supportsTelnet: false,
        supportsWinbox: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (currentDevice) {
        // Editar dispositivo existente
        await api.put(`/devices/${currentDevice.id}`, formData);
        // toast.success('Dispositivo atualizado com sucesso');
      } else {
        // Criar novo dispositivo
        await api.post('/devices', formData);
        // toast.success('Dispositivo criado com sucesso');
      }
      
      handleCloseDialog();
      fetchDevices();
    } catch (error) {
      console.error('Erro ao salvar dispositivo:', error);
      // toast.error(`Erro ao ${currentDevice ? 'atualizar' : 'criar'} dispositivo`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este dispositivo?')) {
      try {
        await api.delete(`/devices/${id}`);
        // toast.success('Dispositivo excluído com sucesso');
        fetchDevices();
      } catch (error) {
        console.error('Erro ao excluir dispositivo:', error);
        // toast.error('Erro ao excluir dispositivo');
      }
    }
  };

  const handleConnect = (device) => {
    // Implementar lógica para abrir terminal
    console.log('Conectar ao dispositivo:', device);
    // Esta funcionalidade seria implementada com WebSockets
  };

  const renderStatusChip = (status) => {
    if (status === 'online') {
      return <Chip size="small" label="Online" color="success" />;
    } else if (status === 'offline') {
      return <Chip size="small" label="Offline" color="error" />;
    } else {
      return <Chip size="small" label="Desconhecido" color="warning" />;
    }
  };

  if (loading && devices.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dispositivos
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchDevices}
            sx={{ mr: 1 }}
          >
            Atualizar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            Novo Dispositivo
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>IP</TableCell>
              <TableCell>Fabricante</TableCell>
              <TableCell>Modelo</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Última Resposta</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum dispositivo encontrado
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>{device.ipAddress}</TableCell>
                  <TableCell>{device.manufacturer}</TableCell>
                  <TableCell>{device.model}</TableCell>
                  <TableCell>{renderStatusChip(device.status)}</TableCell>
                  <TableCell>
                    {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleConnect(device)}
                      disabled={device.status !== 'online'}
                      title="Conectar Terminal"
                    >
                      <TerminalIcon />
                    </IconButton>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenDialog(device)}
                      title="Editar"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(device.id)}
                      title="Excluir"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para adicionar/editar dispositivo */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentDevice ? 'Editar Dispositivo' : 'Novo Dispositivo'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Nome"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="ipAddress"
                label="Endereço IP"
                fullWidth
                value={formData.ipAddress}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="port"
                label="Porta"
                type="number"
                fullWidth
                value={formData.port}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="manufacturer"
                label="Fabricante"
                fullWidth
                value={formData.manufacturer}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="model"
                label="Modelo"
                fullWidth
                value={formData.model}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="supportsSsh"
                    checked={formData.supportsSsh}
                    onChange={handleInputChange}
                  />
                }
                label="Suporta SSH"
              />
              <FormControlLabel
                control={
                  <Switch
                    name="supportsTelnet"
                    checked={formData.supportsTelnet}
                    onChange={handleInputChange}
                  />
                }
                label="Suporta Telnet"
              />
              <FormControlLabel
                control={
                  <Switch
                    name="supportsWinbox"
                    checked={formData.supportsWinbox}
                    onChange={handleInputChange}
                  />
                }
                label="Suporta Winbox"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Devices;
