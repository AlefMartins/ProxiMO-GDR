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

const LdapSettings = ({ settings, onSettingsChanged }) => {
  const notify = useNotification();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [formData, setFormData] = useState(settings);

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
      await saveSettings('ldap', formData);
      notify.success('Configurações LDAP salvas com sucesso');
      onSettingsChanged();
    } catch (error) {
      console.error('Erro ao salvar configurações LDAP:', error);
      notify.error('Erro ao salvar configurações LDAP');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await testConnection('ldap');
      if (result.success) {
        notify.success(result.message || 'Conexão LDAP bem-sucedida');
      } else {
        notify.error(result.message || 'Falha na conexão LDAP');
      }
    } catch (error) {
      console.error('Erro ao testar conexão LDAP:', error);
      notify.error('Erro ao testar conexão LDAP');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Configurações LDAP / Active Directory
        </Typography>
        <Divider />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="ldapUrl"
            label="URL do Servidor LDAP"
            fullWidth
            value={formData.ldapUrl || ''}
            onChange={handleInputChange}
            helperText="Ex: ldap://ldap.exemplo.com:389"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="bindDN"
            label="DN de Vinculação"
            fullWidth
            value={formData.bindDN || ''}
            onChange={handleInputChange}
            helperText="Ex: cn=admin,dc=exemplo,dc=com"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="bindCredentials"
            label="Senha de Vinculação"
            fullWidth
            type={showPassword ? 'text' : 'password'}
            value={formData.bindCredentials || ''}
            onChange={handleInputChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="searchBase"
            label="Base de Busca"
            fullWidth
            value={formData.searchBase || ''}
            onChange={handleInputChange}
            helperText="Ex: dc=exemplo,dc=com"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="userIdAttribute"
            label="Atributo de ID do Usuário"
            fullWidth
            value={formData.userIdAttribute || ''}
            onChange={handleInputChange}
            helperText="Ex: uid (LDAP) ou sAMAccountName (AD)"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="userSearchFilter"
            label="Filtro de Busca de Usuário"
            fullWidth
            value={formData.userSearchFilter || ''}
            onChange={handleInputChange}
            helperText="Ex: (objectClass=inetOrgPerson)"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="isActiveDirectory"
                checked={formData.isActiveDirectory === true || formData.isActiveDirectory === 'true'}
                onChange={handleInputChange}
              />
            }
            label="É Active Directory"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="useSSL"
                checked={formData.useSSL === true || formData.useSSL === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Usar SSL"
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

export default LdapSettings;
