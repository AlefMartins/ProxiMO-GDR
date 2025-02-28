import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider,
  Paper,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { saveSettings } from '../../api/settingApi';
import useNotification from '../../hooks/useNotification';

const GeneralSettings = ({ settings, onSettingsChanged }) => {
  const notify = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(settings);

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveSettings('general', formData);
      notify.success('Configurações gerais salvas com sucesso');
      onSettingsChanged();
    } catch (error) {
      console.error('Erro ao salvar configurações gerais:', error);
      notify.error('Erro ao salvar configurações gerais');
    } finally {
      setLoading(false);
    }
  };

  const sessionTimeoutOptions = [
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 60, label: '1 hora' },
    { value: 120, label: '2 horas' },
    { value: 240, label: '4 horas' },
    { value: 480, label: '8 horas' },
    { value: 720, label: '12 horas' },
    { value: 1440, label: '24 horas' },
  ];

  const logRetentionOptions = [
    { value: 7, label: '7 dias' },
    { value: 14, label: '14 dias' },
    { value: 30, label: '30 dias' },
    { value: 60, label: '60 dias' },
    { value: 90, label: '90 dias' },
    { value: 180, label: '6 meses' },
    { value: 365, label: '1 ano' },
    { value: 730, label: '2 anos' },
  ];

  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  ];

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Configurações Gerais
        </Typography>
        <Divider />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="systemName"
            label="Nome do Sistema"
            fullWidth
            value={formData.systemName || ''}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="orgName"
            label="Nome da Organização"
            fullWidth
            value={formData.orgName || ''}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            name="sessionTimeout"
            label="Timeout de Sessão"
            fullWidth
            value={parseInt(formData.sessionTimeout) || 30}
            onChange={handleInputChange}
            helperText="Tempo de inatividade antes do logout automático"
          >
            {sessionTimeoutOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            name="logRetentionDays"
            label="Retenção de Logs"
            fullWidth
            value={parseInt(formData.logRetentionDays) || 30}
            onChange={handleInputChange}
            helperText="Tempo de retenção de logs no sistema"
          >
            {logRetentionOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            name="dateFormat"
            label="Formato de Data"
            fullWidth
            value={formData.dateFormat || 'DD/MM/YYYY'}
            onChange={handleInputChange}
          >
            {dateFormatOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="maxLoginAttempts"
            label="Tentativas Máximas de Login"
            type="number"
            fullWidth
            value={formData.maxLoginAttempts || '5'}
            onChange={handleInputChange}
            InputProps={{
              inputProps: { min: 1, max: 10 }
            }}
            helperText="Número de tentativas antes do bloqueio temporário"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="backupPath"
            label="Caminho para Backups"
            fullWidth
            value={formData.backupPath || ''}
            onChange={handleInputChange}
            helperText="Diretório onde os backups serão armazenados"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="logPath"
            label="Caminho para Logs"
            fullWidth
            value={formData.logPath || ''}
            onChange={handleInputChange}
            helperText="Diretório onde os logs serão armazenados"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="enableAuditLogging"
                checked={formData.enableAuditLogging === true || formData.enableAuditLogging === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Habilitar Log de Auditoria"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="allowConcurrentSessions"
                checked={formData.allowConcurrentSessions === true || formData.allowConcurrentSessions === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Permitir Sessões Simultâneas"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="forcePasswordChange"
                checked={formData.forcePasswordChange === true || formData.forcePasswordChange === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Forçar Troca de Senha no Primeiro Login"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="enableDeviceAutoDiscovery"
                checked={formData.enableDeviceAutoDiscovery === true || formData.enableDeviceAutoDiscovery === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Habilitar Auto-Descoberta de Dispositivos"
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default GeneralSettings;
