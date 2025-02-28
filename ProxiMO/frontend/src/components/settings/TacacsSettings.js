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
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { testConnection, saveSettings } from '../../api/settingApi';
import useNotification from '../../hooks/useNotification';

const TacacsSettings = ({ settings, onSettingsChanged }) => {
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
      await saveSettings('tacacs', formData);
      notify.success('Configurações TACACS+ salvas com sucesso');
      onSettingsChanged();
    } catch (error) {
      console.error('Erro ao salvar configurações TACACS+:', error);
      notify.error('Erro ao salvar configurações TACACS+');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await testConnection('tacacs');
      if (result.success) {
        notify.success(result.message || 'Conexão TACACS+ bem-sucedida');
      } else {
        notify.error(result.message || 'Falha na conexão TACACS+');
      }
    } catch (error) {
      console.error('Erro ao testar conexão TACACS+:', error);
      notify.error('Erro ao testar conexão TACACS+');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Configurações TACACS+
        </Typography>
        <Divider />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="server"
            label="Servidor TACACS+"
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
            value={formData.port || '49'}
            onChange={handleInputChange}
            helperText="Porta padrão: 49"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="secret"
            label="Chave Secreta"
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
          <FormControlLabel
            control={
              <Switch
                name="enabled"
                checked={formData.enabled === true || formData.enabled === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Habilitar TACACS+"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="singleConnection"
                checked={formData.singleConnection === true || formData.singleConnection === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Usar Conexão Única"
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

export default TacacsSettings;
