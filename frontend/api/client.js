
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL =
  'https://yournoteapp-backend.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const getBaseURL = () => API_BASE_URL;

// ------------------------------------
// REQUEST INTERCEPTOR
// Automatically attach access token
// ------------------------------------

apiClient.interceptors.request.use(
  async (config) => {
    const accessToken =
      await SecureStore.getItemAsync(
        'access_token'
      );

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ------------------------------------
// RESPONSE INTERCEPTOR
// Handle expired access tokens
// ------------------------------------

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite retry loop
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken =
          await SecureStore.getItemAsync(
            'refresh_token'
          );

        if (!refreshToken) {
          throw new Error(
            'No refresh token found'
          );
        }

        // Request new tokens
        const { data } = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {
            refresh_token: refreshToken,
          }
        );

        const {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        } = data;

        // Save new access token
        await SecureStore.setItemAsync(
          'access_token',
          newAccessToken
        );

        // Save rotated refresh token if backend sends one
        if (newRefreshToken) {
          await SecureStore.setItemAsync(
            'refresh_token',
            newRefreshToken
          );
        }

        // Update headers
        apiClient.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${newAccessToken}`;

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        // Retry original request
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.log(
          'Refresh token expired. Logging out...',
          refreshError
        );

        // Clear invalid session
        await SecureStore.deleteItemAsync(
          'access_token'
        );

        await SecureStore.deleteItemAsync(
          'refresh_token'
        );

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

