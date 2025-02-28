import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Tooltip, 
  TextField, 
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  TablePagination,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as OnlineIcon,
  Cancel as OfflineIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchDevices, deleteDeviceAsync, setFilters, setPagination } from '../../redux/slices/deviceSlice';
import useNotification from '../../hooks/useNotification';
import Breadcrumb from '../common/Breadcrumb';

const DeviceList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notify = useNotification();
  
  const { devices, status, error, pagination, filters } = useSelector((state) => state.devices);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [filterStatus, setFilterStatus] = useState(filters.status || '');
  const [filterType, setFilterType] = useState(filters.type || '');

  useEffect(() => {
    dispatch(fetchDevices({ ...filters, page: pagination.page, limit: pagination.limit }));
  }, [dispatch, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (error) {
      notify.error(error.message || 'Erro ao carregar dispositivos');
    }
  }, [error, notify]);

  const handleSearch = () => {
    dispatch(setFilters({ search: searchInput }));
  };

  const handleClearSearch = () => {
    setSearchInput('');
    dispatch(setFilters({ search: '' }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStatusFilterChange = (event) => {
    setFilterStatus(event.target.value);
    dispatch(setFilters({ status: event.target.value }));
  };

  const handleTypeFilterChange = (event) => {
    setFilterType(event.target.value);
    dispatch(setFilters({ type: event.target.value }));
  };

  const handleAddDevice = () => {
    navigate('/devices/new');
  };

  const handleEditDevice = (deviceId) => {
    navigate(`/devices/edit/${deviceId}`);
  };

  const handleViewDevice = (deviceId) => {
    navigate(`/devices/${deviceId}`);
  };

  const handleDeleteClick = (device) => {
    setDeviceToDelete(device);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteDeviceAsync(deviceToDelete.id)).unwrap();
      notify.success(`Dispositivo ${deviceToDelete.name} excluído com sucesso`);
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
    } catch (err) {
      notify.error(err.message || 'Erro ao excluir dispositivo');
    }
  };

  const handleChangePage = (event, newPage) => {
    dispatch(setPagination({ page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event) => {
    dispatch(setPagination({
      limit: parseInt(event.target.value, 10),
      page: 1
    }));
  };

  const handleRefresh = () => {
    dispatch(fetchDevices({ ...filters, page: pagination.page, limit: pagination.limit }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <OnlineIcon color="success" />;
      case 'offline':
        return <OfflineIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <OfflineIcon color="disabled" />;
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'online':
        return <Chip icon={<OnlineIcon />} label="Online" color="success" size="small" />;
      case 'offline':
        return <Chip icon={<OfflineIcon />} label="Offline" color="error" size="small" />;
      case 'warning':
        return <Chip icon={<WarningIcon />} label="Alerta" color="warning" size="small" />;
      default:
        return <Chip label="Desconhecido" color="default" size="small" />;
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
    <Box>
      <Breadcrumb 
        items={[
          { label: 'Dashboard', link: '/' },
          { label: 'Dispositivos', active: true }
        ]} 
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Dispositivos de Rede
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddDevice}
        >
          Novo Dispositivo
        </Button>
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Buscar dispositivos..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ flexGrow: 1, minWidth: '200px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: '150px' }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={filterStatus}
            onChange={handleStatusFilterChange}
            label="Status"
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="online">Online</MenuItem>
            <MenuItem value="offline">Offline</MenuItem>
            <MenuItem value="warning">Alerta</MenuItem>
          </Select>
        </FormControl>
        
        <Button variant="outlined" onClick={handleSearch}>
          Buscar
        </Button>
        
        {(searchInput || filterStatus || filterType) && (
          <Button variant="text" onClick={() => {
            setSearchInput('');
            setFilterStatus('');
            setFilterType('');
            dispatch(setFilters({ search: '', status: '', type: '' }));
          }}>
            Limpar Filtros
          </Button>
        )}
        
        <Tooltip title="Atualizar">
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Endereço IP</TableCell>
              <TableCell>Porta</TableCell>
              <TableCell>Fabricante</TableCell>
              <TableCell>Último Acesso</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {status === 'loading' ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : devices && devices.length > 0 ? (
              devices.map((device) => (
                <TableRow key={device.id} hover 
                  onClick={() => handleViewDevice(device.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{getStatusChip(device.status)}</TableCell>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>{device.ipAddress}</TableCell>
                  <TableCell>{device.port}</TableCell>
                  <TableCell>{getVendorDisplay(device.vendor)}</TableCell>
                  <TableCell>
                    {device.lastAccess 
                      ? new Date(device.lastAccess).toLocaleString() 
                      : 'Nunca acessado'}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleEditDevice(device.id)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton 
                        onClick={() => handleDeleteClick(device)} 
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum dispositivo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.limit}
          page={pagination.page - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Itens por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>
      
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o dispositivo{' '}
            <strong>{deviceToDelete?.name}</strong>? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceList;
