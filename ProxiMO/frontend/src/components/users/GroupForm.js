import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { createGroup, updateGroup } from '../../api/userApi';
import useNotification from '../../hooks/useNotification';

const GroupForm = ({ open, group, onClose, onSave }) => {
  const notify = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      users: {
        view: false,
        create: false,
        edit: false,
        delete: false
      },
      devices: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        connect: false
      },
      settings: {
        view: false,
        edit: false
      },
      logs: {
        view: false,
        delete: false
      }
    }
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        permissions: group.permissions || {
          users: { view: false, create: false, edit: false, delete: false },
          devices: { view: false, create: false, edit: false, delete: false, connect: false },
          settings: { view: false, edit: false },
          logs: { view: false, delete: false }
        }
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: {
          users: { view: false, create: false, edit: false, delete: false },
          devices: { view: false, create: false, edit: false, delete: false, connect: false },
          settings: { view: false, edit: false },
          logs: { view: false, delete: false }
        }
      });
    }
    setError('');
  }, [group, open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePermissionChange = (resource, action) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [resource]: {
          ...formData.permissions[resource],
          [action]: !formData.permissions[resource][action]
        }
      }
    });
  };

  const handleSelectAll = (resource) => {
    const allSelected = Object.values(formData.permissions[resource]).every(v => v);
    
    const updatedPermissions = { ...formData.permissions };
    Object.keys(updatedPermissions[resource]).forEach(action => {
      updatedPermissions[resource][action] = !allSelected;
    });
    
    setFormData({
      ...formData,
      permissions: updatedPermissions
    });
  };

  const validate = () => {
    if (!formData.name) {
      setError('Nome do grupo é obrigatório');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      if (group) {
        await updateGroup(group.id, formData);
        notify.success('Grupo atualizado com sucesso');
      } else {
        await createGroup(formData);
        notify.success('Grupo criado com sucesso');
      }
      
      onSave();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar grupo:', err);
      setError(err.response?.data?.message || `Erro ao ${group ? 'atualizar' : 'criar'} grupo`);
      notify.error(`Erro ao ${group ? 'atualizar' : 'criar'} grupo`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {group ? 'Editar Grupo' : 'Novo Grupo'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              name="name"
              label="Nome do Grupo"
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="description"
              label="Descrição"
              fullWidth
              value={formData.description}
              onChange={handleInputChange}
            />
          </Grid>

          {/* Seção de permissões */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Permissões
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Permissões de Usuários */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">Usuários</Typography>
                <Button 
                  size="small" 
                  onClick={() => handleSelectAll('users')}
                >
                  {Object.values(formData.permissions.users).every(v => v) 
                    ? 'Desmarcar Todos' 
                    : 'Marcar Todos'}
                </Button>
              </Box>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.users.view}
                      onChange={() => handlePermissionChange('users', 'view')}
                    />
                  }
                  label="Visualizar"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.users.create}
                      onChange={() => handlePermissionChange('users', 'create')}
                    />
                  }
                  label="Criar"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.users.edit}
                      onChange={() => handlePermissionChange('users', 'edit')}
                    />
                  }
                  label="Editar"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.users.delete}
                      onChange={() => handlePermissionChange('users', 'delete')}
                    />
                  }
                  label="Excluir"
                />
              </FormGroup>
            </Box>

            {/* Permissões de Dispositivos */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">Dispositivos</Typography>
                <Button 
                  size="small" 
                  onClick={() => handleSelectAll('devices')}
                >
                  {Object.values(formData.permissions.devices).every(v => v) 
                    ? 'Desmarcar Todos' 
                    : 'Marcar Todos'}
                </Button>
              </Box>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.devices.view}
                      onChange={() => handlePermissionChange('devices', 'view')}
                    />
                  }
                  label="Visualizar"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.devices.create}
                      onChange={() => handlePermissionChange('devices', 'create')}
                    />
                  }
                  label="Criar"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.devices.edit}
                      onChange={() => handlePermissionChange('devices', 'edit')}
                    />
                  }
                  label="Editar"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.devices.delete}
                      onChange={() => handlePermissionChange('devices', 'delete')}
                    />
                  }
                  label="Excluir"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.devices.connect}
                      onChange={() => handlePermissionChange('devices', 'connect')}
                    />
                  }
                  label="Conectar"
                />
              </FormGroup>
            </Box>

            {/* Permissões de Configurações */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">Configurações</Typography>
                <Button 
                  size="small" 
                  onClick={() => handleSelectAll('settings')}
                >
                  {Object.values(formData.permissions.settings).every(v => v) 
                    ? 'Desmarcar Todos' 
                    : 'Marcar Todos'}
                </Button>
              </Box>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.settings.view}
                      onChange={() => handlePermissionChange('settings', 'view')}
                    />
                  }
                  label="Visualizar"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.settings.edit}
                      onChange={() => handlePermissionChange('settings', 'edit')}
                    />
                  }
                  label="Editar"
                />
              </FormGroup>
            </Box>

            {/* Permissões de Logs */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">Logs</Typography>
                <Button 
                  size="small" 
                  onClick={() => handleSelectAll('logs')}
                >
                  {Object.values(formData.permissions.logs).every(v => v) 
                    ? 'Desmarcar Todos' 
                    : 'Marcar Todos'}
                </Button>
              </Box>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.logs.view}
                      onChange={() => handlePermissionChange('logs', 'view')}
                    />
                  }
                  label="Visualizar"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.logs.delete}
                      onChange={() => handlePermissionChange('logs', 'delete')}
                    />
                  }
                  label="Excluir"
                />
              </FormGroup>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupForm;
