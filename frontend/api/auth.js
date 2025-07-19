import apiClient from './client';

const register = (userInfo) => {
  return apiClient.post('/api/auth/register', userInfo);
};

const login = (credentials) => {
  return apiClient.post('/api/auth/login', credentials);
};

// This exports an object containing your functions
export default {
  register,
  login,
}
