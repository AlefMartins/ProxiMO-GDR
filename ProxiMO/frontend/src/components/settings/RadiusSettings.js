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
  InputAdornment,
  IconButton,
  MenuItem,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { testConnection, saveSettings } from '../../api/settingApi';
import useNotification from '../../hooks/useNotification';

const RadiusSettings = ({ settings, onSettingsChanged }) => {
  const notify = useNotification();
  const [showSecrets, setShowSecrets] = useState({});
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [formData, setFormData] = useState(settings);

  const handleToggleSecretVisibility = (field) => {
    setShowSecrets({
      ...showSecrets,
      [field]: !showSecrets[field]
    });
  };

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
      await saveSettings('radius', formData);
      notify.success('Configurações RADIUS salvas com sucesso');
      onSettingsChanged();
    } catch (error) {
      console.error('Erro ao salvar configurações RADIUS:', error);
      notify.error('Erro ao salvar configurações RADIUS');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await testConnection('radius');
      if (result.success) {
        notify.success(result.message || 'Conexão RADIUS bem-sucedida');
      } else {
        notify.error(result.message || 'Falha na conexão RADIUS');
      }
    } catch (error) {
      console.error('Erro ao testar conexão RADIUS:', error);
      notify.error('Erro ao testar conexão RADIUS');
    } finally {
      setTestingConnection(false);
    }
  };

  const authTypes = [
    { value: 'pap', label: 'PAP' },
    { value: 'chap', label: 'CHAP' },
    { value: 'mschap', label: 'MS-CHAP' },
    { value: 'mschapv2', label: 'MS-CHAPv2' },
    { value: 'eap-md5', label: 'EAP-MD5' },
    { value: 'eap-tls', label: 'EAP-TLS' },
  ];

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Configurações RADIUS
        </Typography>
        <Divider />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="server"
            label="Servidor RADIUS"
            fullWidth
            value={formData.server || ''}
            onChange={handleInputChange}
            helperText="Endereço IP ou nome do servidor"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="port"
            label="Porta"
            type="number"
            fullWidth
            value={formData.port || '1812'}
            onChange={handleInputChange}
            helperText="Porta padrão: 1812"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="secret"
            label="Chave Secreta (Shared Secret)"
            fullWidth
            type={showSecrets.secret ? 'text' : 'password'}
            value={formData.secret || ''}
            onChange={handleInputChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle secret visibility"
                    onClick={() => handleToggleSecretVisibility('secret')}
                    edge="end"
                  >
                    {showSecrets.secret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="timeout"
            label="Timeout (segundos)"
            type="number"
            fullWidth
            value={formData.timeout || '5'}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="retries"
            label="Tentativas"
            type="number"
            fullWidth
            value={formData.retries || '3'}
            onChange={handleInputChange}
            helperText="Número de tentativas em caso de falha"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            name="authType"
            label="Tipo de Autenticação"
            fullWidth
            value={formData.authType || 'pap'}
            onChange={handleInputChange}
          >
            {authTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="enabled"
                checked={formData.enabled === true || formData.enabled === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Habilitar RADIUS"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="accountingEnabled"
                checked={formData.accountingEnabled === true || formData.accountingEnabled === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Habilitar Accounting"
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={loading || testingConnection}
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={testingConnection ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={handleTestConnection}
              disabled={loading || testingConnection}
            >
              {testingConnection ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default RadiusSettings;
