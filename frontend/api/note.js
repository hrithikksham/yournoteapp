import apiClient, { getBaseURL } from './client';
import * as SecureStore from 'expo-secure-store';

// Helper to get the auth token
const getToken = async () => {
  const token = await SecureStore.getItemAsync('access_token');
  // The interceptor will handle token issues, so we can simplify this.
  // If no token exists, the request will fail with a 401, which the interceptor handles.
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

const uploadNoteImage = async (imageUri) => {
    const token = await getToken();
    const formData = new FormData();
    
    // ✅ Dynamically determine file name and type
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`; // e.g., "image/jpeg" or "image/png"

    formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
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

// You can add the deleteNote function here as well
const deleteNote = async (noteId) => {
  const token = await getToken();
  return apiClient.delete(`/api/notes/${noteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};


export default {
  createNote,
  getNoteById,
  updateNote,
  uploadNoteImage,
  getAvailableLabels,
  deleteNote, // ✅ Export the new function
  getBaseURL,
};