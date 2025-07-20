import apiClient, { getBaseURL } from './client'; // Import getBaseURL
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
    // It's better to let the interceptor handle this, but throwing an error is fine too.
    throw new Error('No access token found');
  }
  
  return apiClient.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
}; // ✅ Missing closing brace was added here.

// ✅ This function was moved outside of getMe.
const uploadProfileImage = async (imageUri, token) => {
  const formData = new FormData();
  // The filename and type are important for the backend to process the file
  formData.append('file', {
    uri: imageUri,
    name: `profile_${Date.now()}.jpg`,
    type: 'image/jpeg',
  });

  return apiClient.post('/api/auth/upload-profile-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });
};

export default {
  register,
  login,
  refreshToken,
  getMe,
  uploadProfileImage,
  getBaseURL, // ✅ Re-export getBaseURL for clean component code
};
