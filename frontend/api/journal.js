import apiClient from './client';
import * as SecureStore from 'expo-secure-store';

// Helper to get the auth token
const getToken = async () => {
  const token = await SecureStore.getItemAsync('access_token');
  if (!token) throw new Error('No access token found');
  return token;
};

// ✅ Fetches all journal entries, grouped by date
const getGroupedJournals = async () => {
  const token = await getToken();
  return apiClient.get('/api/journal/all/grouped', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// You can add other journal-specific API calls here later
// (e.g., getJournalById, createJournal, etc.)

export default {
  getGroupedJournals,
};
