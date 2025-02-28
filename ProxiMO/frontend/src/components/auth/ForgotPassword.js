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
  Alert,
  Divider,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { forgotPassword, clearAuthError } from '../../redux/slices/authSlice';
import { isAuthenticated } from '../../utils/auth';
import Logo from '../common/Logo';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, message } = useSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    // Se já estiver autenticado, redireciona para o dashboard
    if (isAuthenticated()) {
      navigate('/');
    }
    
    // Limpa erros ao montar o componente
    dispatch(clearAuthError());
  }, [dispatch, navigate]);

  useEffect(() => {
    if (status === 'succeeded' && message) {
      setRequestSent(true);
    }
  }, [status, message]);

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!email.trim()) {
      errors.email = 'E-mail é obrigatório';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'E-mail inválido';
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
      await dispatch(forgotPassword({ email })).unwrap();
      // Se chegar aqui, a solicitação foi bem-sucedida
    } catch (err) {
      // Erro já tratado pelo thunk e disponível no state
    }
  };

  const handleFieldChange = (value) => {
    setEmail(value);

    // Limpa o erro do campo quando é alterado
    if (formErrors.email) {
      setFormErrors(prev => ({ ...prev, email: null }));
    }
    
    // Limpa erro geral 
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
            Recuperação de Senha
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
            {requestSent 
              ? 'Verifique seu e-mail para instruções de redefinição'
              : 'Informe seu e-mail para receber instruções de recuperação'
            }
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message || 'Ocorreu um erro. Tente novamente.'}
          </Alert>
        )}

        {requestSent ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              {message || 'Enviamos um e-mail com instruções para redefinir sua senha.'}
            </Alert>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              component={RouterLink}
              to="/login"
              sx={{ mt: 2 }}
            >
              Voltar para o Login
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-mail"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => handleFieldChange(e.target.value)}
              error={Boolean(formErrors.email)}
              helperText={formErrors.email}
              disabled={status === 'loading'}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={status === 'loading'}
              startIcon={status === 'loading' ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
              sx={{ mt: 3, mb: 2 }}
            >
              {status === 'loading' ? 'Enviando...' : 'Enviar Email de Recuperação'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Link component={RouterLink} to="/login" variant="body2" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
                Voltar para o Login
              </Link>
            </Box>
          </Box>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            &copy; {new Date().getFullYear()} ProxiMO - Gerenciamento de Dispositivos de Rede
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Versão 1.0.0
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;
