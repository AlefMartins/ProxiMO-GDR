import api from '../utils/api';

export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const getCategorySettings = async (category) => {
  const response = await api.get(`/settings/${category}`);
  return response.data;
};

export const saveSettings = async (category, settings) => {
  const response = await api.post(`/settings/${category}`, { settings });
  return response.data;
};

export const testConnection = async (service) => {
  const response = await api.post(`/settings/test/${service}`);
  return response.data;
};

export const restoreDefaults = async (category) => {
  const response = await api.post(`/settings/${category}/restore-defaults`);
  return response.data;
};
