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
  Slider,
} from '@mui/material';
import {
  Save as SaveIcon,
} from '@mui/icons-material';
import { saveSettings } from '../../api/settingApi';
import useNotification from '../../hooks/useNotification';

const TerminalSettings = ({ settings, onSettingsChanged }) => {
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

  const handleSliderChange = (name) => (e, newValue) => {
    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveSettings('terminal', formData);
      notify.success('Configurações do terminal salvas com sucesso');
      onSettingsChanged();
    } catch (error) {
      console.error('Erro ao salvar configurações do terminal:', error);
      notify.error('Erro ao salvar configurações do terminal');
    } finally {
      setLoading(false);
    }
  };

  const fontSizeMarks = [
    { value: 10, label: '10' },
    { value: 12, label: '12' },
    { value: 14, label: '14' },
    { value: 16, label: '16' },
    { value: 18, label: '18' },
    { value: 20, label: '20' },
  ];

  const timeoutMarks = [
    { value: 60, label: '1m' },
    { value: 300, label: '5m' },
    { value: 600, label: '10m' },
    { value: 1800, label: '30m' },
    { value: 3600, label: '1h' },
  ];

  const themeOptions = [
    { value: 'dark', label: 'Escuro' },
    { value: 'light', label: 'Claro' },
    { value: 'solarized-dark', label: 'Solarized (Escuro)' },
    { value: 'solarized-light', label: 'Solarized (Claro)' },
    { value: 'monokai', label: 'Monokai' },
    { value: 'github', label: 'GitHub' },
    { value: 'tomorrow-night', label: 'Tomorrow Night' },
  ];

  const fontFamilyOptions = [
    { value: 'monospace', label: 'Monospace' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'DejaVu Sans Mono', label: 'DejaVu Sans Mono' },
    { value: 'Consolas', label: 'Consolas' },
    { value: 'Fira Code', label: 'Fira Code' },
    { value: 'Roboto Mono', label: 'Roboto Mono' },
    { value: 'Ubuntu Mono', label: 'Ubuntu Mono' },
  ];

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Configurações do Terminal
        </Typography>
        <Divider />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            name="terminalTheme"
            label="Tema do Terminal"
            fullWidth
            value={formData.terminalTheme || 'dark'}
            onChange={handleInputChange}
          >
            {themeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            name="fontFamily"
            label="Família de Fonte"
            fullWidth
            value={formData.fontFamily || 'monospace'}
            onChange={handleInputChange}
          >
            {fontFamilyOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography gutterBottom>Tamanho da Fonte</Typography>
          <Slider
            value={parseInt(formData.fontSize) || 14}
            onChange={handleSliderChange('fontSize')}
            aria-labelledby="font-size-slider"
            step={1}
            marks={fontSizeMarks}
            min={10}
            max={20}
            valueLabelDisplay="auto"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography gutterBottom>Timeout de Inatividade (segundos)</Typography>
          <Slider
            value={parseInt(formData.idleTimeout) || 300}
            onChange={handleSliderChange('idleTimeout')}
            aria-labelledby="idle-timeout-slider"
            step={null}
            marks={timeoutMarks}
            min={60}
            max={3600}
            valueLabelDisplay="auto"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="scrollbackBuffer"
            label="Buffer de Rolagem (linhas)"
            type="number"
            fullWidth
            value={formData.scrollbackBuffer || '1000'}
            onChange={handleInputChange}
            InputProps={{
              inputProps: { min: 100, max: 10000 }
            }}
            helperText="Número de linhas armazenadas no histórico"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="maxLogSize"
            label="Tamanho Máximo do Log (KB)"
            type="number"
            fullWidth
            value={formData.maxLogSize || '1024'}
            onChange={handleInputChange}
            helperText="Tamanho máximo para cada arquivo de log de sessão"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="cursorBlink"
                checked={formData.cursorBlink === true || formData.cursorBlink === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Cursor Piscante"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="enableBell"
                checked={formData.enableBell === true || formData.enableBell === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Ativar Sino (Bell)"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="autoWrap"
                checked={formData.autoWrap === true || formData.autoWrap === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Quebra Automática de Linha"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="enableLogging"
                checked={formData.enableLogging === true || formData.enableLogging === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Registrar Sessões do Terminal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="showConnectTimestamp"
                checked={formData.showConnectTimestamp === true || formData.showConnectTimestamp === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Mostrar Timestamp de Conexão"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="saveSessionHistory"
                checked={formData.saveSessionHistory === true || formData.saveSessionHistory === 'true'}
                onChange={handleInputChange}
              />
            }
            label="Salvar Histórico de Sessão"
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

export default TerminalSettings;
