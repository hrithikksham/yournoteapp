import apiClient from './client';
import * as SecureStore from 'expo-secure-store';

// Helper to get the auth token
const getToken = async () => {
  const token = await SecureStore.getItemAsync('access_token');
  if (!token) throw new Error('No access token found');
  return token;
};

const getAllReminders = async () => {
  const token = await getToken();
  return apiClient.get('/api/reminders', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const createReminder = async (reminderData) => {
    const token = await getToken();
    return apiClient.post('/api/reminders', reminderData, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// ✅ Updated to handle any partial update payload (e.g., text, is_completed, note)
const updateReminder = async (reminderId, updateData) => {
  const token = await getToken();
  return apiClient.put(`/api/reminders/${reminderId}`, updateData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ✅ Function to delete a reminder
const deleteReminder = async (reminderId) => {
    const token = await getToken();
    return apiClient.delete(`/api/reminders/${reminderId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export default {
  getAllReminders,
  createReminder,
  updateReminder,
  deleteReminder,
};
