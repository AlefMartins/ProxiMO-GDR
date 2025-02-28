import api from '../utils/api';

export const login = async (username, password, authType = 'local') => {
  const response = await api.post('/auth/login', { username, password, authType });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const changePassword = async (oldPassword, newPassword) => {
  const response = await api.post('/auth/change-password', { oldPassword, newPassword });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};
