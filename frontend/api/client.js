import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Ensure this is your computer's local network IP address
const API_BASE_URL = "https://yournoteapp-backend.onrender.com"; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Export the base URL for use in other parts of the app (e.g., displaying images)
export const getBaseURL = () => API_BASE_URL;

// This interceptor automatically handles expired tokens
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) {
          return Promise.reject(error);
        }

        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refresh_token: refreshToken
        });

        const { access_token: newAccessToken } = data;
        await SecureStore.setItemAsync('access_token', newAccessToken);

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        console.log('Refresh token failed, logging out.', refreshError);
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        // The AuthContext will handle navigation to the login screen
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
