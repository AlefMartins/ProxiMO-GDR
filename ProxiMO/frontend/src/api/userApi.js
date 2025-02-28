import api from '../utils/api';

export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const getUser = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const getUserGroups = async () => {
  const response = await api.get('/users/groups');
  return response.data;
};

export const getGroup = async (id) => {
  const response = await api.get(`/users/groups/${id}`);
  return response.data;
};

export const createGroup = async (groupData) => {
  const response = await api.post('/users/groups', groupData);
  return response.data;
};

export const updateGroup = async (id, groupData) => {
  const response = await api.put(`/users/groups/${id}`, groupData);
  return response.data;
};

export const deleteGroup = async (id) => {
  const response = await api.delete(`/users/groups/${id}`);
  return response.data;
};

export const getUserActivity = async (id, limit = 20) => {
  const response = await api.get(`/users/${id}/activity?limit=${limit}`);
  return response.data;
};
