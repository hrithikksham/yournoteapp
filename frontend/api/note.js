import apiClient from './client';
import * as SecureStore from 'expo-secure-store';

// Helper to get the auth token
const getToken = async () => {
  const token = await SecureStore.getItemAsync('access_token');
  if (!token) throw new Error('No access token found');
  return token;
};

// Create a new note
const createNote = async (noteData) => {
  const token = await getToken();
  return apiClient.post('/api/notes', noteData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Get a single note by its ID
const getNoteById = async (noteId) => {
  const token = await getToken();
  return apiClient.get(`/api/notes/${noteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Update an existing note
const updateNote = async (noteId, updateData) => {
  const token = await getToken();
  return apiClient.put(`/api/notes/${noteId}`, updateData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Delete a note
const deleteNote = async (noteId) => {
  const token = await getToken();
  return apiClient.delete(`/api/notes/${noteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Upload an image for a note
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


export default {
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  uploadNoteImage,
};
