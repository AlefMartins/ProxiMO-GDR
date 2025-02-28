import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Tooltip, 
  TextField, 
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  TablePagination,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchUsers, deleteUserAsync, setUserFilters, setPagination } from '../../redux/slices/userSlice';
import useNotification from '../../hooks/useNotification';
import Breadcrumb from '../common/Breadcrumb';

const UserList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notify = useNotification();
  
  const { users, status, error, pagination, filters } = useSelector((state) => state.users);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    dispatch(fetchUsers({ ...filters, page: pagination.page, limit: pagination.limit }));
  }, [dispatch, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (error) {
      notify.error(error.message || 'Erro ao carregar usuários');
    }
  }, [error, notify]);

  const handleSearch = () => {
    dispatch(setUserFilters({ search: searchInput }));
  };

  const handleClearSearch = () => {
    setSearchInput('');
    dispatch(setUserFilters({ search: '' }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddUser = () => {
    navigate('/users/new');
  };

  const handleEditUser = (userId) => {
    navigate(`/users/edit/${userId}`);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteUserAsync(userToDelete.id)).unwrap();
      notify.success(`Usuário ${userToDelete.username} excluído com sucesso`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      notify.error(err.message || 'Erro ao excluir usuário');
    }
  };

  const handleChangePage = (event, newPage) => {
    dispatch(setPagination({ page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event) => {
    dispatch(setPagination({
      limit: parseInt(event.target.value, 10),
      page: 1
    }));
  };

  const handleRefresh = () => {
    dispatch(fetchUsers({ ...filters, page: pagination.page, limit: pagination.limit }));
  };

  const getRoleChip = (role) => {
    switch (role) {
      case 'admin':
        return <Chip label="Administrador" color="primary" size="small" />;
      case 'operator':
        return <Chip label="Operador" color="secondary" size="small" />;
      case 'viewer':
        return <Chip label="Visualizador" color="info" size="small" />;
      default:
        return <Chip label={role} color="default" size="small" />;
    }
  };

  const getStatusChip = (active) => {
    return active ? 
      <Chip 
        icon={<CheckIcon />} 
        label="Ativo" 
        color="success" 
        size="small" 
        variant="outlined" 
      /> : 
      <Chip 
        icon={<BlockIcon />} 
        label="Inativo" 
        color="error" 
        size="small" 
        variant="outlined" 
      />;
  };

  return (
    <Box>
      <Breadcrumb 
        items={[
          { label: 'Dashboard', link: '/' },
          { label: 'Usuários', active: true }
        ]} 
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Usuários do Sistema
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Novo Usuário
        </Button>
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Buscar usuários..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ mr: 1, flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="outlined" onClick={handleSearch}>
          Buscar
        </Button>
        {searchInput && (
          <Button variant="text" onClick={handleClearSearch} sx={{ ml: 1 }}>
            Limpar
          </Button>
        )}
        <Tooltip title="Atualizar">
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Nome de Usuário</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Perfil</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Último Login</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {status === 'loading' ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleChip(user.role)}</TableCell>
                  <TableCell>{getStatusChip(user.active)}</TableCell>
                  <TableCell>
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleString() 
                      : 'Nunca acessou'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleEditUser(user.id)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton 
                        onClick={() => handleDeleteClick(user)} 
                        size="small"
                        disabled={user.username === 'admin'} // Impede exclusão do admin principal
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.limit}
          page={pagination.page - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Itens por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>
      
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o usuário{' '}
            <strong>{userToDelete?.username}</strong>? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserList;
