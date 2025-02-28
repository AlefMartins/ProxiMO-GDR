import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar se o usuário já está autenticado ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (err) {
          console.error('Erro ao verificar autenticação:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Função de login
  const login = async (username, password, authType = 'local') => {
    try {
      setError(null);
      const response = await api.post('/auth/login', {
        username,
        password,
        authType
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      return user;
    } catch (err) {
      console.error('Erro no login:', err);
      setError(err.response?.data?.message || 'Erro ao fazer login');
      throw err;
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Erro no logout:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  // Verificar se o usuário tem determinada permissão
  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    
    const [resource, action] = permission.split('.');
    return user.permissions[resource]?.[action] === true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
