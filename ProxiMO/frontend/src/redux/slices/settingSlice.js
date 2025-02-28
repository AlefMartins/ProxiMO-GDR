import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSettings, saveSettings, testConnection } from '../../api/settingApi';

// Thunks assíncronos
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (settingType, { rejectWithValue }) => {
    try {
      const response = await getSettings(settingType);
      return { type: settingType, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const saveSettingsAsync = createAsyncThunk(
  'settings/saveSettings',
  async ({ settingType, data }, { rejectWithValue }) => {
    try {
      const response = await saveSettings(settingType, data);
      return { type: settingType, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const testConnectionAsync = createAsyncThunk(
  'settings/testConnection',
  async (settingType, { rejectWithValue }) => {
    try {
      const response = await testConnection(settingType);
      return { type: settingType, result: response.data };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  general: { data: {}, loading: false, error: null },
  ldap: { data: {}, loading: false, error: null },
  tacacs: { data: {}, loading: false, error: null },
  radius: { data: {}, loading: false, error: null },
  email: { data: {}, loading: false, error: null },
  terminal: { data: {}, loading: false, error: null },
  testResults: { loading: false, data: null, error: null }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearSettingsError: (state, action) => {
      const settingType = action.payload;
      if (settingType && state[settingType]) {
        state[settingType].error = null;
      }
    },
    clearTestResults: (state) => {
      state.testResults = { loading: false, data: null, error: null };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch settings cases
      .addCase(fetchSettings.pending, (state, action) => {
        const type = action.meta.arg;
        if (state[type]) {
          state[type].loading = true;
          state[type].error = null;
        }
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        const { type, data } = action.payload;
        if (state[type]) {
          state[type].data = data;
          state[type].loading = false;
          state[type].error = null;
        }
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        const type = action.meta.arg;
        if (state[type]) {
          state[type].loading = false;
          state[type].error = action.payload || { message: 'Erro ao carregar configurações' };
        }
      })
      
      // Save settings cases
      .addCase(saveSettingsAsync.pending, (state, action) => {
        const type = action.meta.arg.settingType;
        if (state[type]) {
          state[type].loading = true;
          state[type].error = null;
        }
      })
      .addCase(saveSettingsAsync.fulfilled, (state, action) => {
        const { type, data } = action.payload;
        if (state[type]) {
          state[type].data = data;
          state[type].loading = false;
          state[type].error = null;
        }
      })
      .addCase(saveSettingsAsync.rejected, (state, action) => {
        const type = action.meta.arg.settingType;
        if (state[type]) {
          state[type].loading = false;
          state[type].error = action.payload || { message: 'Erro ao salvar configurações' };
        }
      })
      
      // Test connection cases
      .addCase(testConnectionAsync.pending, (state) => {
        state.testResults.loading = true;
        state.testResults.error = null;
      })
      .addCase(testConnectionAsync.fulfilled, (state, action) => {
        state.testResults.loading = false;
        state.testResults.data = action.payload.result;
        state.testResults.error = null;
      })
      .addCase(testConnectionAsync.rejected, (state, action) => {
        state.testResults.loading = false;
        state.testResults.error = action.payload || { message: 'Erro ao testar conexão' };
      });
  }
});

export const { clearSettingsError, clearTestResults } = settingsSlice.actions;

export default settingsSlice.reducer;
