import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { login, register, logout, getProfile, forgotPassword, resetPassword } from '../../api/authApi';
import { setToken, removeToken } from '../../utils/auth';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await login(credentials);
      const { token, user } = response.data;
      setToken(token);
      return user;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await register(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logout();
      removeToken();
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await forgotPassword(email);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const submitPasswordReset = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await resetPassword(token, password);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  forgotPasswordStatus: 'idle',
  forgotPasswordMessage: null,
  forgotPasswordError: null,
  resetPasswordStatus: 'idle',
  resetPasswordMessage: null,
  resetPasswordError: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    clearForgotPasswordStatus: (state) => {
      state.forgotPasswordStatus = 'idle';
      state.forgotPasswordMessage = null;
      state.forgotPasswordError = null;
    },
    clearResetPasswordStatus: (state) => {
      state.resetPasswordStatus = 'idle';
      state.resetPasswordMessage = null;
      state.resetPasswordError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload || { message: 'Falha ao fazer login' };
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Falha ao registrar usuário' };
      })
      
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'idle';
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout fails on the server, we still want to clear local state
        state.status = 'idle';
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      })
      
      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload || { message: 'Falha ao carregar perfil' };
      })
      
      // Forgot Password
      .addCase(requestPasswordReset.pending, (state) => {
        state.forgotPasswordStatus = 'loading';
        state.forgotPasswordError = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state, action) => {
        state.forgotPasswordStatus = 'succeeded';
        state.forgotPasswordMessage = action.payload.message;
        state.forgotPasswordError = null;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.forgotPasswordStatus = 'failed';
        state.forgotPasswordError = action.payload || { message: 'Falha ao solicitar redefinição de senha' };
      })
      
      // Reset Password
      .addCase(submitPasswordReset.pending, (state) => {
        state.resetPasswordStatus = 'loading';
        state.resetPasswordError = null;
      })
      .addCase(submitPasswordReset.fulfilled, (state, action) => {
        state.resetPasswordStatus = 'succeeded';
        state.resetPasswordMessage = action.payload.message;
        state.resetPasswordError = null;
      })
      .addCase(submitPasswordReset.rejected, (state, action) => {
        state.resetPasswordStatus = 'failed';
        state.resetPasswordError = action.payload || { message: 'Falha ao redefinir senha' };
      });
  }
});

export const { 
  clearAuthError, 
  clearForgotPasswordStatus, 
  clearResetPasswordStatus 
} = authSlice.actions;

export default authSlice.reducer;
