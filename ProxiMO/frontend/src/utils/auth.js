import jwtDecode from 'jwt-decode';

// Verificar se o token está armazenado e válido
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Verificar se o token não está expirado
    if (decoded.exp < currentTime) {
      // Token expirado, remover do armazenamento
      localStorage.removeItem('token');
      return false;
    }
    
    return true;
  } catch (error) {
    // Token inválido
    localStorage.removeItem('token');
    return false;
  }
};

// Obter informações do usuário a partir do token
export const getUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.user;
  } catch (error) {
    return null;
  }
};

// Obter o token atual
export const getToken = () => {
  return localStorage.getItem('token');
};

// Armazenar token
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remover token (logout)
export const removeToken = () => {
  localStorage.removeItem('token');
};
