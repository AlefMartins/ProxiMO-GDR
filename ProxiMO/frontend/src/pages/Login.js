import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Link, 
  Box,
  Alert 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authType, setAuthType] = useState('local');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    setLoading(true);
    
    try {
      await login(username, password, authType);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img src="/images/logo.png" alt="Logo" style={{ height: 80, marginBottom: 20 }} />
        
        <Typography component="h1" variant="h5">
          Login do Sistema
        </Typography>
        
        <Paper 
          elevation={3} 
          sx={{ 
            padding: 4, 
            width: '100%', 
            marginTop: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="auth-type-label">Método de Login</InputLabel>
              <Select
                labelId="auth-type-label"
                value={authType}
                label="Método de Login"
                onChange={(e) => setAuthType(e.target.value)}
              >
                <MenuItem value="local">Local</MenuItem>
                <MenuItem value="ldap">LDAP / Active Directory</MenuItem>
                <MenuItem value="tacacs">TACACS+</MenuItem>
                <MenuItem value="radius">RADIUS</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="username"
              label="Nome de usuário"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Autenticando...' : 'Entrar'}
            </Button>
          </form>
          
          <Box textAlign="center" mt={2}>
            <Link href="#" variant="body2" onClick={() => alert('Funcionalidade em desenvolvimento')}>
              Esqueceu a senha?
            </Link>
          </Box>
        </Paper>
      </Box>
      
      <Box mt={5} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} TACACS+ LDAP Manager. Todos os direitos reservados.
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;
