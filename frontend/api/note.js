import apiClient, { getBaseURL } from './client';
import * as SecureStore from 'expo-secure-store';

// Helper to get the auth token
const getToken = async () => {
  const token = await SecureStore.getItemAsync('access_token');
  if (!token) throw new Error('No access token found');
  return token;
};

const createNote = async (noteData) => {
  const token = await getToken();
  return apiClient.post('/api/notes', noteData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const getNoteById = async (noteId) => {
  const token = await getToken();
  return apiClient.get(`/api/notes/${noteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const updateNote = async (noteId, updateData) => {
  const token = await getToken();
  return apiClient.put(`/api/notes/${noteId}`, updateData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const deleteNote = async (noteId) => {
  const token = await getToken();
  return apiClient.delete(`/api/notes/${noteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const uploadNoteImage = async (imageUri) => {
    const token = await getToken();
    const formData = new FormData();
    formData.append('file', {
        uri: imageUri,
        name: `note_image_${Date.now()}.jpg`,
        type: 'image/jpeg',
    });

    return apiClient.post('/api/notes/upload-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
        },
    });
};

const getAvailableLabels = async () => {
  const token = await getToken();
  return apiClient.get('/api/labels', {
    headers: { Authorization: `Bearer ${token}` },
  });
};


export default {
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  uploadNoteImage,
  getAvailableLabels,
  getBaseURL,
};
