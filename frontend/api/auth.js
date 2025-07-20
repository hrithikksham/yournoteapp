import apiClient from './client';
import * as SecureStore from 'expo-secure-store';

const register = (userInfo) => {
  return apiClient.post('/api/auth/register', userInfo);
};

const login = (credentials) => {
  return apiClient.post('/api/auth/login', credentials);
};

const refreshToken = (token) => {
  return apiClient.post('/api/auth/refresh', { refresh_token: token });
};

const getMe = async () => {
  const token = await SecureStore.getItemAsync('access_token');
  if (!token) {
    throw new Error('No access token found');
  }
  
  return apiClient.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export default {
  register,
  login,
  refreshToken,
  getMe,
};
