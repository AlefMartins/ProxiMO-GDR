import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { createUser, updateUser } from '../../api/userApi';
import useNotification from '../../hooks/useNotification';

const UserForm = ({ open, user, groups, onClose, onSave }) => {
  const notify = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    groupId: '',
    isActive: true,
    isLdapUser: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        password: '',
        confirmPassword: '',
        fullName: user.fullName || '',
        email: user.email || '',
        groupId: user.groupId || '',
        isActive: user.isActive ?? true,
        isLdapUser: user.isLdapUser ?? false,
      });
    } else {
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        email: '',
        groupId: '',
        isActive: true,
        isLdapUser: false,
      });
    }
    setError('');
  }, [user, open]);

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const validate = () => {
    if (!formData.username) {
      setError('Nome de usuário é obrigatório');
      return false;
    }
    if (!formData.fullName) {
      setError('Nome completo é obrigatório');
      return false;
    }
    if (!user && !formData.password) {
      setError('Senha é obrigatória para novos usuários');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não conferem');
      return false;
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Email inválido');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      const dataToSend = { ...formData };
      // Remover campos desnecessários
      delete dataToSend.confirmPassword;
      if (user && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (user) {
        await updateUser(user.id, dataToSend);
        notify.success('Usuário atualizado com sucesso');
      } else {
        await createUser(dataToSend);
        notify.success('Usuário criado com sucesso');
      }
      
      onSave();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      setError(err.response?.data?.message || `Erro ao ${user ? 'atualizar' : 'criar'} usuário`);
      notify.error(`Erro ao ${user ? 'atualizar' : 'criar'} usuário`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {user ? 'Editar Usuário' : 'Novo Usuário'}
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
              name="username"
              label="Nome de Usuário"
              fullWidth
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={user?.isLdapUser}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="fullName"
              label="Nome Completo"
              fullWidth
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="email"
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="group-label">Grupo</InputLabel>
              <Select
                labelId="group-label"
                name="groupId"
                value={formData.groupId}
                label="Grupo"
                onChange={handleInputChange}
              >
                <MenuItem value="">
                  <em>Nenhum</em>
                </MenuItem>
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Campos de senha, mostrados apenas para usuários locais */}
          {!formData.isLdapUser && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="password"
                  label={user ? "Nova Senha (deixe em branco para não alterar)" : "Senha"}
                  type="password"
                  fullWidth
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!user}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="confirmPassword"
                  label="Confirmar Senha"
                  type="password"
                  fullWidth
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!user || formData.password !== ''}
                />
              </Grid>
            </>
          )}
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                }
                label="Ativo"
              />
              <FormControlLabel
                control={
                  <Switch
                    name="isLdapUser"
                    checked={formData.isLdapUser}
                    onChange={handleInputChange}
                    disabled={user !== null}
                  />
                }
                label="Usuário LDAP"
              />
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

export default UserForm;
