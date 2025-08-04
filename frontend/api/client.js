import axios from 'axios';
// ✅ Import SecureStore statically at the top of the file
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://172.20.156.237:8000'; // Your IP

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const getBaseURL = () => API_BASE_URL;

// Response interceptor to handle token refreshes
apiClient.interceptors.response.use(
  (response) => response, // Directly return successful responses
  async (error) => {
    const originalRequest = error.config;

    // Check for 401 error and ensure it's not a retry request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as a retry to prevent infinite loops

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) {
            // If no refresh token, the user needs to log in again
            return Promise.reject(error);
        }

        // Make the refresh request directly using axios to avoid circular dependency
        const refreshResponse = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refresh_token: refreshToken
        });

        const { access_token: newAccessToken } = refreshResponse.data;

        // Save the new token
        await SecureStore.setItemAsync('access_token', newAccessToken);

        // Update the default header for subsequent requests
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        // Update the header for the original, failed request
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // Retry the original request with the new token
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.log('Refresh token failed, logging out.', refreshError);
        // If refresh fails, clear tokens and reject
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        
        // You would typically navigate to the login screen from your root navigator here
        return Promise.reject(refreshError);
      }
    }

    // For all other errors, just reject
    return Promise.reject(error);
  }
);

export default apiClient;
