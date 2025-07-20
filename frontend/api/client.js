import axios from 'axios';

// IMPORTANT: Replace with your computer's local network IP address
// so your mobile device can connect to your local backend server.
// On Windows, find it with `ipconfig`. On macOS, use `ifconfig`.
// If using Android Emulator, you can use 'http://10.0.2.2:8000'
const API_BASE_URL = 'http://172.20.158.153:8000'; // Replace with your IP


const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response, // Directly return successful responses
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and it's not a retry request
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark it as a retry

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) return Promise.reject(error);

        const { data } = await authApi.refreshToken(refreshToken);
        const newAccessToken = data.access_token;

        // Save the new token
        await SecureStore.setItemAsync('access_token', newAccessToken);

        // Update the header for the original request
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        console.log('Refresh token failed, logging out.');
        // You would typically navigate to login here via a root navigation ref
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;