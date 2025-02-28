import api from '../utils/api';

export const getDevices = async () => {
  const response = await api.get('/devices');
  return response.data;
};

export const getDevice = async (id) => {
  const response = await api.get(`/devices/${id}`);
  return response.data;
};

export const createDevice = async (deviceData) => {
  const response = await api.post('/devices', deviceData);
  return response.data;
};

export const updateDevice = async (id, deviceData) => {
  const response = await api.put(`/devices/${id}`, deviceData);
  return response.data;
};

export const deleteDevice = async (id) => {
  const response = await api.delete(`/devices/${id}`);
  return response.data;
};

export const pingDevice = async (id) => {
  const response = await api.get(`/devices/${id}/ping`);
  return response.data;
};

export const getDeviceLogs = async (id, limit = 20) => {
  const response = await api.get(`/devices/${id}/logs?limit=${limit}`);
  return response.data;
};

export const getDeviceBackups = async (id) => {
  const response = await api.get(`/devices/${id}/backups`);
  return response.data;
};

export const createDeviceBackup = async (id, backupData) => {
  const response = await api.post(`/devices/${id}/backups`, backupData);
  return response.data;
};
