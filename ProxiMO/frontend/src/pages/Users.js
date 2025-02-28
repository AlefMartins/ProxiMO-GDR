import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../utils/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, groupsRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/groups')
      ]);
      setUsers(usersRes.data);
      setGroups(groupsRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      // toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        username: user.username,
        password: '',
        confirmPassword: '',
        fullName: user.fullName,
        email: user.email,
        groupId: user.groupId,
        isActive: user.isActive,
        isLdapUser: user.isLdapUser,
      });
    } else {
      setCurrentUser(null);
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
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async () => {
    // Validação básica
    if (formData.password !== formData.confirmPassword) {
      // toast.error('As senhas não conferem');
      return;
    }

    try {
      if (currentUser) {
        // Editar usuário existente
        const dataToSend = { ...formData };
        // Só envia senha se tiver sido alterada
        if (!dataToSend.password) {
          delete dataToSend.password;
          delete dataToSend.confirmPassword;
        }
        
        await api.put(`/users/${currentUser.id}`, dataToSend);
        // toast.success('Usuário atualizado com sucesso');
      } else {
        // Criar novo usuário
        await api.post('/users', formData);
        // toast.success('Usuário criado com sucesso');
      }
      
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      // toast.error(`Erro ao ${currentUser ? 'atualizar' : 'criar'} usuário`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await api.delete(`/users/${id}`);
        // toast.success('Usuário excluído com sucesso');
        fetchData();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        // toast.error('Erro ao excluir usuário');
      }
    }
  };

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Usuários
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchData}
            sx={{ mr: 1 }}
          >
            Atualizar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            Novo Usuário
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuário</TableCell>
              <TableCell>Nome Completo</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Grupo</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Último Login</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {groups.find(g => g.id === user.groupId)?.name || 'Não definido'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={user.isActive ? 'Ativo' : 'Inativo'} 
                      color={user.isActive ? 'success' : 'error'} 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={user.isLdapUser ? 'LDAP' : 'Local'} 
                      color={user.isLdapUser ? 'primary' : 'default'} 
                    />
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenDialog(user)}
                      title="Editar"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(user.id)}
                      title="Excluir"
                      disabled={user.username === 'admin'} // Não permite excluir admin
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para adicionar/editar usuário */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="username"
                label="Nome de Usuário"
                fullWidth
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={currentUser?.isLdapUser}
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
                    label={currentUser ? "Nova Senha (deixe em branco para não alterar)" : "Senha"}
                    type="password"
                    fullWidth
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!currentUser}
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
                    required={!currentUser || formData.password !== ''}
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
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
                    disabled={currentUser !== null}
                  />
                }
                label="Usuário LDAP"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
