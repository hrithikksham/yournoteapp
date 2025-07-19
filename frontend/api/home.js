import apiClient from './client';

// This function requires an Authorization header with the Bearer token
const getHomeData = (token) => {
  return apiClient.get('/api/home', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export default {
  getHomeData,
};