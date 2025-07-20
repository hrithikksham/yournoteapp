import axios from 'axios';

const API_BASE_URL = 'http://172.20.158.153:8000'; // Replace with your IP

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// We'll handle token refresh differently to avoid circular imports
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Import SecureStore dynamically to avoid circular imports
        const { default: SecureStore } = await import('expo-secure-store');
        
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) return Promise.reject(error);

        // Make refresh request directly to avoid circular import
        const refreshResponse = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refresh_token: refreshToken
        });

        const newAccessToken = refreshResponse.data.access_token;

        // Save the new token
        await SecureStore.setItemAsync('access_token', newAccessToken);

        // Update headers
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        console.log('Refresh token failed, logging out.');
        // Clear tokens
        const { default: SecureStore } = await import('expo-secure-store');
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
