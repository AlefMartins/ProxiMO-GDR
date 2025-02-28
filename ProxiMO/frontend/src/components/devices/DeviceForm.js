import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { 
  fetchDeviceById, 
  createDeviceAsync, 
  updateDeviceAsync
} from '../../redux/slices/deviceSlice';
import Breadcrumb from '../common/Breadcrumb';
import useNotification from '../../hooks/useNotification';

const DeviceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const notify = useNotification();
  const isEditMode = Boolean(id);
  
  const { currentDevice, status, error } = useSelector(state => state.devices);

  const initialFormData = {
    name: '',
    ipAddress: '',
    port: '22',
    vendor: 'cisco',
    active: true
  };

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchDeviceById(id));
    }
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (currentDevice && isEditMode) {
      setFormData({
        ...initialFormData,
        ...currentDevice
      });
    }
  }, [currentDevice, isEditMode]);

  useEffect(() => {
    if (error) {
      notify.error(error.message || 'Erro ao processar formulário');
    }
  }, [error, notify]);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpar erros quando o campo é alterado
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (!formData.ipAddress.trim()) {
      errors.ipAddress = 'Endereço IP é obrigatório';
    } else if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(formData.ipAddress)) {
      errors.ipAddress = 'Endereço IP inválido';
    }
    
    if (!formData.port.trim()) {
      errors.port = 'Porta é obrigatória';
    } else if (!/^\d+$/.test(formData.port)) {
      errors.port = 'Porta deve ser um número';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      notify.warning('Por favor, corrija os erros no formulário');
      return;
    }
    
    try {
      if (isEditMode) {
        await dispatch(updateDeviceAsync({ id, deviceData: formData })).unwrap();
        notify.success('Dispositivo atualizado com sucesso');
      } else {
        const result = await dispatch(createDeviceAsync(formData)).unwrap();
        notify.success('Dispositivo criado com sucesso');
        navigate(`/devices/${result.id}`);
      }
    } catch (err) {
      notify.error(err.message || `Erro ao ${isEditMode ? 'atualizar' : 'criar'} dispositivo`);
    }
  };

  const vendors = [
    { value: 'cisco', label: 'Cisco' },
    { value: 'juniper', label: 'Juniper' },
    { value: 'huawei', label: 'Huawei' },
    { value: 'fortinet', label: 'Fortinet' },
    { value: 'paloalto', label: 'Palo Alto' },
    { value: 'hpe', label: 'HPE' },
    { value: 'dell', label: 'Dell' },
    { value: 'other', label: 'Outro' }
  ];

  return (
    <Box>
      <Breadcrumb 
        items={[
          { label: 'Dashboard', link: '/' },
          { label: 'Dispositivos', link: '/devices' },
          { label: isEditMode ? 'Editar Dispositivo' : 'Novo Dispositivo', active: true }
        ]} 
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          {isEditMode ? 'Editar Dispositivo' : 'Adicionar Novo Dispositivo'}
        </Typography>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="outlined"
          onClick={() => navigate(isEditMode ? `/devices/${id}` : '/devices')}
        >
          {isEditMode ? 'Voltar para Detalhes' : 'Voltar para Lista'}
        </Button>
      </Box>

      <Paper component="form" onSubmit={handleSubmit} elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nome do Dispositivo"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              required
              error={Boolean(formErrors.name)}
              helperText={formErrors.name}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Fabricante"
              name="vendor"
              value={formData.vendor}
              onChange={handleChange}
              fullWidth
              variant="outlined"
            >
              {vendors.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Endereço IP"
              name="ipAddress"
              value={formData.ipAddress}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              required
              error={Boolean(formErrors.ipAddress)}
              helperText={formErrors.ipAddress}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Porta"
              name="port"
              value={formData.port}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              required
              error={Boolean(formErrors.port)}
              helperText={formErrors.port}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={handleChange}
                  name="active"
                  color="primary"
                />
              }
              label="Dispositivo Ativo"
            />
          </Grid>
          <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(isEditMode ? `/devices/${id}` : '/devices')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={status === 'loading' ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={status === 'loading'}
            >
              {isEditMode ? 'Atualizar' : 'Salvar'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DeviceForm;
