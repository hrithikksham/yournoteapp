import axios from 'axios';
// Dynamic import will be used inside the interceptor
// import * as SecureStore from 'expo-secure-store'; 

const API_BASE_URL = 'http://172.20.158.202:8000'; // Your IP

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ Re-export the base URL for use in other parts of the app
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
        // Dynamically import SecureStore only when needed
        const SecureStore = (await import('expo-secure-store')).default;
        
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) {
            // If no refresh token, reject and let the app handle logout
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
        const SecureStore = (await import('expo-secure-store')).default;
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        
        return Promise.reject(refreshError);
      }
    }

    // For all other errors, just reject
    return Promise.reject(error);
  }
);

export default apiClient;
