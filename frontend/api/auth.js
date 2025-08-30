import apiClient, { getBaseURL } from './client';

const register = (userInfo) => {
  return apiClient.post('/api/auth/register', userInfo);
};

const login = (credentials) => {
  return apiClient.post('/api/auth/login', credentials);
};

const refreshToken = (refresh_token) => {
  return apiClient.post('/api/auth/refresh', { refresh_token });
};

const getMe = () => {
  return apiClient.get('/api/auth/me');
};

const uploadProfileImage = (imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: `profile_${Date.now()}.jpg`,
    type: 'image/jpeg',
  });
  return apiClient.post('/api/auth/upload-profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

const deleteAccount = () => {
    return apiClient.delete('/api/auth/me');
};

export default {
  register,
  login,
  refreshToken, // ✅ FIX: Added the missing refreshToken export
  getMe,
  uploadProfileImage,
  deleteAccount,
  getBaseURL,
};
