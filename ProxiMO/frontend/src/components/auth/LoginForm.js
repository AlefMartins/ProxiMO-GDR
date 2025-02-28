import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton,
  Alert,
  Divider
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon
} from '@mui/icons-material';
import { loginUser, clearAuthError } from '../../redux/slices/authSlice';
import { isAuthenticated } from '../../utils/auth';
import Logo from '../common/Logo';

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    // Se já estiver autenticado, redireciona para o dashboard
    if (isAuthenticated()) {
      navigate('/');
    }
    
    // Limpa erros ao montar o componente
    dispatch(clearAuthError());
  }, [dispatch, navigate]);

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!username.trim()) {
      errors.username = 'Nome de usuário é obrigatório';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Senha é obrigatória';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(loginUser({ username, password })).unwrap();
      navigate('/');
    } catch (err) {
      // Erro já tratado pelo thunk e disponível no state
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleFieldChange = (field, value) => {
    if (field === 'username') {
      setUsername(value);
    } else if (field === 'password') {
      setPassword(value);
    }

    // Limpa o erro do campo quando é alterado
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Limpa erro geral de autenticação 
    if (error) {
      dispatch(clearAuthError());
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 2,
        backgroundColor: (theme) => theme.palette.background.default
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Logo width={150} />
          <Typography variant="h5" component="h1" sx={{ mt: 2, fontWeight: 600 }}>
            Login
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
            Acesse o sistema para gerenciar seus dispositivos de rede
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message || 'Erro ao fazer login. Verifique suas credenciais.'}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Nome de Usuário"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => handleFieldChange('username', e.target.value)}
            error={Boolean(formErrors.username)}
            helperText={formErrors.username}
            disabled={status === 'loading'}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            error={Boolean(formErrors.password)}
            helperText={formErrors.password}
            disabled={status === 'loading'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ textAlign: 'right', mt: 1 }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              Esqueceu a senha?
            </Link>
          </Box>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={status === 'loading'}
            startIcon={status === 'loading' ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
            sx={{ mt: 3, mb: 2 }}
          >
            {status === 'loading' ? 'Autenticando...' : 'Entrar'}
          </Button>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              &copy; {new Date().getFullYear()} ProxiMO - Gerenciamento de Dispositivos de Rede
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Versão 1.0.0
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm;
