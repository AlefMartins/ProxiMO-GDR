import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getDevices, 
  getDeviceById, 
  createDevice, 
  updateDevice, 
  deleteDevice,
  testConnection as testDeviceConnection,
  executeCommand
} from '../../api/deviceApi';

export const fetchDevices = createAsyncThunk(
  'devices/fetchDevices',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getDevices(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchDeviceById = createAsyncThunk(
  'devices/fetchDeviceById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await getDeviceById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const createDeviceAsync = createAsyncThunk(
  'devices/createDevice',
  async (deviceData, { rejectWithValue }) => {
    try {
      const response = await createDevice(deviceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const updateDeviceAsync = createAsyncThunk(
  'devices/updateDevice',
  async ({ id, deviceData }, { rejectWithValue }) => {
    try {
      const response = await updateDevice(id, deviceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const deleteDeviceAsync = createAsyncThunk(
  'devices/deleteDevice',
  async (id, { rejectWithValue }) => {
    try {
      await deleteDevice(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const testDeviceConnectionAsync = createAsyncThunk(
  'devices/testConnection',
  async (deviceData, { rejectWithValue }) => {
    try {
      const response = await testDeviceConnection(deviceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const executeCommandAsync = createAsyncThunk(
  'devices/executeCommand',
  async ({ deviceId, command }, { rejectWithValue }) => {
    try {
      const response = await executeCommand(deviceId, command);
      return { deviceId, result: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  devices: [],
  currentDevice: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  testConnectionStatus: 'idle',
  testConnectionResult: null,
  testConnectionError: null,
  commandResult: null,
  commandStatus: 'idle',
  commandError: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10
  },
  filters: {
    search: '',
    type: '',
    status: '',
    ipAddress: ''
  }
};

const deviceSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearDeviceErrors: (state) => {
      state.error = null;
    },
    clearTestResult: (state) => {
      state.testConnectionStatus = 'idle';
      state.testConnectionResult = null;
      state.testConnectionError = null;
    },
    clearCommandResult: (state) => {
      state.commandStatus = 'idle';
      state.commandResult = null;
      state.commandError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch devices
      .addCase(fetchDevices.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.devices = action.payload.devices;
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          limit: action.payload.limit
        };
        state.error = null;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Erro ao buscar dispositivos' };
      })
      
      // Fetch device by ID
      .addCase(fetchDeviceById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDeviceById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentDevice = action.payload;
        state.error = null;
      })
      .addCase(fetchDeviceById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Erro ao buscar dispositivo' };
      })
      
      // Create device
      .addCase(createDeviceAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createDeviceAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.devices.push(action.payload);
        state.error = null;
      })
      .addCase(createDeviceAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Erro ao criar dispositivo' };
      })
      
      // Update device
      .addCase(updateDeviceAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateDeviceAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.devices.findIndex(device => device.id === action.payload.id);
        if (index !== -1) {
          state.devices[index] = action.payload;
        }
        if (state.currentDevice && state.currentDevice.id === action.payload.id) {
          state.currentDevice = action.payload;
        }
        state.error = null;
      })
      .addCase(updateDeviceAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Erro ao atualizar dispositivo' };
      })
      
      // Delete device
      .addCase(deleteDeviceAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteDeviceAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.devices = state.devices.filter(device => device.id !== action.payload);
        if (state.currentDevice && state.currentDevice.id === action.payload) {
          state.currentDevice = null;
        }
        state.error = null;
      })
      .addCase(deleteDeviceAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Erro ao excluir dispositivo' };
      })
      
      // Test connection
      .addCase(testDeviceConnectionAsync.pending, (state) => {
        state.testConnectionStatus = 'loading';
        state.testConnectionError = null;
      })
      .addCase(testDeviceConnectionAsync.fulfilled, (state, action) => {
        state.testConnectionStatus = 'succeeded';
        state.testConnectionResult = action.payload;
        state.testConnectionError = null;
      })
      .addCase(testDeviceConnectionAsync.rejected, (state, action) => {
        state.testConnectionStatus = 'failed';
        state.testConnectionError = action.payload || { message: 'Erro ao testar conexão' };
      })
      
      // Execute command
      .addCase(executeCommandAsync.pending, (state) => {
        state.commandStatus = 'loading';
        state.commandError = null;
      })
      .addCase(executeCommandAsync.fulfilled, (state, action) => {
        state.commandStatus = 'succeeded';
        state.commandResult = action.payload.result;
        state.commandError = null;
      })
      .addCase(executeCommandAsync.rejected, (state, action) => {
        state.commandStatus = 'failed';
        state.commandError = action.payload || { message: 'Erro ao executar comando' };
      });
  }
});

export const { 
  setFilters, 
  setPagination, 
  clearDeviceErrors, 
  clearTestResult,
  clearCommandResult
} = deviceSlice.actions;

export default deviceSlice.reducer;
