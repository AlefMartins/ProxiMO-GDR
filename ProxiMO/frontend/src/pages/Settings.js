import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../utils/api';

// Componente para exibir diferentes painéis conforme a tab selecionada
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
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

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    general: [],
    ldap: [],
    tacacs: [],
    radius: [],
    email: [],
    terminal: [],
  });
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ show: false, type: 'info', message: '' });
  const [showPassword, setShowPassword] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
      
      // Inicializar formData com valores das configurações
      const initialFormData = {};
      Object.keys(response.data).forEach(category => {
        response.data[category].forEach(setting => {
          initialFormData[`${category}.${setting.key}`] = setting.value;
        });
      });
      setFormData(initialFormData);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      setAlert({
        show: true,
        type: 'error',
        message: 'Erro ao carregar configurações'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked.toString() : value,
    });
  };

  const handleTogglePasswordVisibility = (key) => {
    setShowPassword(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveSettings = async (category) => {
    setSaving(true);
    try {
      // Preparar dados para salvar
      const settingsToSave = [];
      settings[category].forEach(setting => {
        const key = `${category}.${setting.key}`;
        settingsToSave.push({
          key: setting.key,
          value: formData[key] || '',
          category
        });
      });

      // Enviar configurações para a API
      await api.post(`/settings/${category}`, { settings: settingsToSave });
      
      setAlert({
        show: true,
        type: 'success',
        message: 'Configurações salvas com sucesso'
      });
      
      // Esconder a mensagem após 3 segundos
      setTimeout(() => {
        setAlert({ show: false, type: 'info', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setAlert({
        show: true,
        type: 'error',
        message: 'Erro ao salvar configurações'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (service) => {
    try {
      setAlert({
        show: true,
        type: 'info',
        message: `Testando conexão com ${service}...`
      });
      
      const response = await api.post(`/settings/test/${service}`);
      
      setAlert({
        show: true,
        type: response.data.success ? 'success' : 'error',
        message: response.data.message
      });
    } catch (error) {
      console.error(`Erro ao testar conexão com ${service}:`, error);
      setAlert({
        show: true,
        type: 'error',
        message: `Erro ao testar conexão: ${error.response?.data?.message || error.message}`
      });
    }
  };

  // Renderizar campo de configuração com base no nome da chave
  const renderSettingField = (category, setting) => {
    const key = `${category}.${setting.key}`;
    
    // Detectar campos de senha
    const isPasswordField = setting.key.toLowerCase().includes('password') || 
                           setting.key.toLowerCase().includes('secret') ||
                           setting.key.toLowerCase().includes('credentials');
    
    // Detectar campos booleanos
    const isBooleanField = setting.key.toLowerCase().includes('enable') || 
                          setting.key.toLowerCase().includes('is') ||
                          setting.key.toLowerCase().includes('use');
    
    // Detectar campos numéricos
    const isNumberField = setting.key.toLowerCase().includes('port') || 
                          setting.key.toLowerCase().includes('timeout') ||
                          setting.key.toLowerCase().includes('max');
    
    if (isBooleanField) {
      return (
        <FormControlLabel
          control={
            <Switch
              name={key}
              checked={formData[key] === 'true'}
              onChange={handleInputChange}
            />
          }
          label={setting.description}
        />
      );
    } else if (isPasswordField) {
      return (
        <TextField
          name={key}
          label={setting.description}
          fullWidth
          type={showPassword[key] ? 'text' : 'password'}
          value={formData[key] || ''}
          onChange={handleInputChange}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => handleTogglePasswordVisibility(key)}
                  edge="end"
                >
                  {showPassword[key] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      );
    } else if (isNumberField) {
      return (
        <TextField
          name={key}
          label={setting.description}
          fullWidth
          type="number"
          value={formData[key] || ''}
          onChange={handleInputChange}
        />
      );
    } else {
      return (
        <TextField
          name={key}
          label={setting.description}
          fullWidth
          value={formData[key] || ''}
          onChange={handleInputChange}
        />
      );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Configurações
      </Typography>

      {alert.show && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 2 }}
          onClose={() => setAlert({ show: false, type: 'info', message: '' })}
        >
          {alert.message}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Geral" />
          <Tab label="LDAP" />
          <Tab label="TACACS+" />
          <Tab label="RADIUS" />
          <Tab label="Email" />
          <Tab label="Terminal" />
        </Tabs>

        {/* Painel Geral */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {settings.general.map((setting) => (
              <Grid item xs={12} sm={6} key={setting.key}>
                {renderSettingField('general', setting)}
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('general')}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Painel LDAP */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {settings.ldap.map((setting) => (
              <Grid item xs={12} sm={6} key={setting.key}>
                {renderSettingField('ldap', setting)}
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('ldap')}
                disabled={saving}
                sx={{ mr: 2 }}
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<RefreshIcon />}
                onClick={() => handleTestConnection('ldap')}
                disabled={saving}
              >
                Testar Conexão
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Painel TACACS+ */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {settings.tacacs.map((setting) => (
              <Grid item xs={12} sm={6} key={setting.key}>
                {renderSettingField('tacacs', setting)}
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('tacacs')}
                disabled={saving}
                sx={{ mr: 2 }}
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<RefreshIcon />}
                onClick={() => handleTestConnection('tacacs')}
                disabled={saving}
              >
                Testar Conexão
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Painel RADIUS */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            {settings.radius.map((setting) => (
              <Grid item xs={12} sm={6} key={setting.key}>
                {renderSettingField('radius', setting)}
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('radius')}
                disabled={saving}
                sx={{ mr: 2 }}
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<RefreshIcon />}
                onClick={() => handleTestConnection('radius')}
                disabled={saving}
              >
                Testar Conexão
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Painel Email */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            {settings.email.map((setting) => (
              <Grid item xs={12} sm={6} key={setting.key}>
                {renderSettingField('email', setting)}
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('email')}
                disabled={saving}
                sx={{ mr: 2 }}
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<RefreshIcon />}
                onClick={() => handleTestConnection('email')}
                disabled={saving}
              >
                Testar Configuração
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Painel Terminal */}
        <TabPanel value={tabValue} index={5}>
          <Grid container spacing={3}>
            {settings.terminal.map((setting) => (
              <Grid item xs={12} sm={6} key={setting.key}>
                {renderSettingField('terminal', setting)}
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('terminal')}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings;
