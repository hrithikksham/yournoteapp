import apiClient from './client';

const register = (userInfo) => {
  return apiClient.post('/api/auth/register', userInfo);
};

const login = (credentials) => {
  return apiClient.post('/api/auth/login', credentials);
};
const refreshToken = (token) => {
  return apiClient.post('/api/auth/refresh', { refresh_token: token });
};

export default {
  register,
  login,
  refreshToken, // ✅ Export the new function
};