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
  Email as EmailIcon,
} from '@mui/icons-material';
import { testConnection, saveSettings } from '../../api/settingApi';
import useNotification from '../../hooks/useNotification';

const EmailSettings = ({ settings, onSettingsChanged }) => {
  const notify = useNotification();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testEmail, setTestEmail] = useState('');
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
      await saveSettings('email', formData);
      notify.success('Configurações de email salvas com sucesso');
      onSettingsChanged();
    } catch (error) {
      console.error('Erro ao salvar configurações de email:', error);
      notify.error('Erro ao salvar configurações de email');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testEmail) {
      notify.warning('Por favor, informe um email para teste');
      return;
    }

    setTestingConnection(true);
    try {
      const result = await testConnection('email');
      if (result.success) {
        notify.success(result.message || 'Teste de email enviado com sucesso');
      } else {
        notify.error(result.message || 'Falha ao enviar email de teste');
      }
    } catch (error) {
      console.error('Erro ao testar configurações de email:', error);
      notify.error('Erro ao testar configurações de email');
    } finally {
      setTestingConnection(false);
    }
  };

  const encryptionOptions = [
    { value: 'none', label: 'Nenhuma' },
    { value: 'ssl', label: 'SSL' },
    { value: 'tls', label: 'TLS' },
    { value: 'starttls', label: 'STARTTLS' },
  ];

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Configurações de Email
        </Typography>
        <Divider />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="smtpServer"
            label="Servidor SMTP"
            fullWidth
            value={formData.smtpServer || ''}
            onChange={handleInputChange}
            helperText="Ex: smtp.gmail.com"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="smtpPort"
            label="Porta SMTP"
            type="number"
            fullWidth
            value={formData.smtpPort || '587'}
            onChange={handleInputChange}
            helperText="Portas comuns: 25, 465, 587"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            name="encryption"
            label="Criptografia"
            fullWidth
            value={formData.encryption || 'none'}
            onChange={handleInputChange}
          >
            {encryptionOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="senderName"
            label="Nome do Remetente"
            fullWidth
            value={formData.senderName || ''}
            onChange={handleInputChange}
            helperText="Nome exibido nos emails enviados"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="senderEmail"
            label="Email do Remetente"
            fullWidth
            type="email"
            value={formData.senderEmail || ''}
            onChange={handleInputChange}
            helperText="Endereço de email do remetente"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="username"
            label="Usuário SMTP"
            fullWidth
            value={formData.username || ''}
            onChange={handleInputChange}
            helperText="Usuário para autenticação no servidor SMTP"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="password"
            label="Senha SMTP"
            fullWidth
            type={showPassword ? 'text' : 'password'}
            value={formData.password || ''}
            onChange={handleInputChange}
            helperText="Senha para autenticação no servidor SMTP"
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
          <FormControlLabel
            control={
              <Switch
                name="enabled"
                checked={formData.enabled === true || formData.enabled === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Habilitar Notificações por Email"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="auth"
                checked={formData.auth === true || formData.auth === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Autenticação Requerida"
          />
        </Grid>
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Teste de Configuração
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                name="testEmail"
                label="Email para Teste"
                fullWidth
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                helperText="Informe um email para receber o teste"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={testingConnection ? <CircularProgress size={20} /> : <EmailIcon />}
                onClick={handleTestConnection}
                disabled={loading || testingConnection || !testEmail}
              >
                {testingConnection ? 'Enviando...' : 'Enviar Email de Teste'}
              </Button>
            </Grid>
          </Grid>
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
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default EmailSettings;
