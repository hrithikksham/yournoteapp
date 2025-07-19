import apiClient from './client';

// This function updates the completion status of a reminder
const updateReminder = (reminderId, isCompleted, token) => {
  return apiClient.put(`/api/reminders/${reminderId}`, 
    { is_completed: isCompleted },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export default {
  updateReminder,
};
