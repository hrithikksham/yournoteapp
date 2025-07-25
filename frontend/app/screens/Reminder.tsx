import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput, 
  Modal,
  Alert,
  SafeAreaView,
  Animated,
  Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import remindersApi from '../../api/reminders';

// TypeScript interfaces
interface Reminder {
  id: string;
  text: string;
  is_completed: boolean;
  note?: string;
  due_time?: string;
  created_at: string; // For sorting
}

const HEADER_HEIGHT = 100;

export default function ReminderScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [newReminderText, setNewReminderText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Sorts reminders by completion status, then by creation date
  const sortReminders = (list: Reminder[]) => {
    return list.sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const fetchReminders = async () => {
    try {
      const response = await remindersApi.getAllReminders();
      setReminders(sortReminders(response.data || []));
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
      Alert.alert("Error", "Failed to load reminders.");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { setIsLoading(true); fetchReminders(); }, []));

  const handleToggleReminder = async (reminder: Reminder) => {
    const updatedStatus = !reminder.is_completed;
    const originalReminders = [...reminders];
    const updatedReminders = reminders.map(r => r.id === reminder.id ? { ...r, is_completed: updatedStatus } : r);
    setReminders(sortReminders(updatedReminders));

    try {
      // ✅ FIX: Sends the update as a JSON object, as expected by the backend
      await remindersApi.updateReminder(reminder.id, { is_completed: updatedStatus });
    } catch (err) {
      setReminders(originalReminders); // Revert on error
    }
  };

  const handleAddReminder = async () => {
    if (!newReminderText.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await remindersApi.createReminder({ 
        text: newReminderText.trim(),
        due_date: new Date().toISOString().split('T')[0] // Send current date
      });
      setReminders(prev => sortReminders([response.data, ...prev]));
      setNewReminderText('');
      setIsAddModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to create reminder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReminder = (reminderId: string) => {
    Alert.alert(
      "Delete Reminder",
      "Are you sure you want to permanently delete this reminder?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const originalReminders = [...reminders];
            setReminders(reminders.filter(r => r.id !== reminderId));
            try {
              await remindersApi.deleteReminder(reminderId);
            } catch (err) {
              setReminders(originalReminders);
              Alert.alert('Error', 'Failed to delete reminder.');
            }
          },
        },
      ]
    );
  };
  
  const handleSaveDetails = async (reminderId: string, details: { text?: string; note?: string; due_time?: string }) => {
    const originalReminders = [...reminders];
    const updatedReminders = reminders.map(r => r.id === reminderId ? { ...r, ...details } : r);
    setReminders(updatedReminders);
    setEditingReminder(null); // Exit editing mode

    try {
      await remindersApi.updateReminder(reminderId, details);
    } catch (err) {
      setReminders(originalReminders);
      Alert.alert('Error', 'Failed to save details.');
    }
  };

  const getCurrentDate = () => {
    const date = new Date();
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const suffix = (day > 3 && day < 21) ? 'th' : ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'][day % 10];
    return `${day}${suffix} ${month}`;
  };

  const headerTranslateY = scrollY.interpolate({ inputRange: [0, HEADER_HEIGHT], outputRange: [0, -HEADER_HEIGHT], extrapolate: 'clamp' });
  const headerOpacity = scrollY.interpolate({ inputRange: [0, HEADER_HEIGHT / 2], outputRange: [1, 0], extrapolate: 'clamp' });

  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity }]}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={28} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <TouchableOpacity onPress={() => setIsAddModalVisible(true)}><Ionicons name="add" size={32} color="white" /></TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <View style={styles.dateSection}>
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
          <Text style={styles.statsText}>Total Reminders : {reminders.length}</Text>
        </View>

        <View>
          {reminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderItemWrapper}>
              <TouchableOpacity onPress={() => handleToggleReminder(reminder)}>
                <Feather name={reminder.is_completed ? "check-circle" : "circle"} size={24} color={reminder.is_completed ? "#50C878" : "white"} />
              </TouchableOpacity>

              <View style={styles.reminderTextContainer}>
                {editingReminder?.id === reminder.id ? (
                  <TextInput
                    style={styles.reminderInput}
                    value={editingReminder.text}
                    onChangeText={(text) => setEditingReminder(prev => prev ? { ...prev, text } : null)}
                    autoFocus={true}
                    onBlur={() => handleSaveDetails(reminder.id, { text: editingReminder.text })}
                    multiline
                  />
                ) : (
                  <TouchableOpacity onLongPress={() => setEditingReminder(reminder)}>
                    <Text style={[styles.reminderText, reminder.is_completed && styles.reminderTextCompleted]}>{reminder.text}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity onPress={() => handleDeleteReminder(reminder.id)}>
                <Feather name="trash-2" size={20} color="#ff4d4d" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </Animated.ScrollView>

      <Modal visible={isAddModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsAddModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Reminder</Text>
            <TextInput style={styles.textInput} placeholder="Enter your reminder..." placeholderTextColor="#888" value={newReminderText} onChangeText={setNewReminderText} autoFocus />
            <TouchableOpacity style={[styles.addButton, (!newReminderText.trim() || isSubmitting) && styles.addButtonDisabled]} onPress={handleAddReminder} disabled={!newReminderText.trim() || isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#1D1D1D" /> : <Text style={styles.addButtonText}>Add</Text>}
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  loadingContainer: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 50, paddingBottom: 10, backgroundColor: '#121212' },
  headerTitle: { color: 'white', fontSize: 22, fontFamily: 'Pixel' },
  scrollContent: { paddingHorizontal: 20, paddingTop: HEADER_HEIGHT + 20, paddingBottom: 100 },
  dateSection: { marginBottom: 30, paddingLeft: 5 },
  dateText: { color: 'white', fontSize: 30, fontFamily: 'Pixel' },
  statsText: { color: '#888', fontSize: 15, fontWeight :'500',  fontStyle : 'italic', marginTop: 8, borderTopWidth: 0.8, borderTopColor: 'rgb(56, 54, 54)', paddingTop: 8 },
  reminderItemWrapper: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  reminderTextContainer: { flex: 1, marginLeft: 15, marginRight: 10 },
  reminderText: { color: 'white', fontSize: 18, lineHeight: 24 },
  reminderInput: { color: 'white', fontSize: 18, lineHeight: 24, paddingVertical: 0, borderBottomWidth: 1, borderBottomColor: '#555', marginBottom: 8 },
  reminderTextCompleted: { textDecorationLine: 'line-through', color: '#888' },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 8 },
  detailText: { color: '#666', fontSize: 14, fontStyle: 'italic' },
  addDetailText: { color: '#4A90E2', fontSize: 14, fontStyle: 'italic' },
  detailInput: { color: '#999', fontSize: 14, fontStyle: 'italic', paddingVertical: 4, marginTop: 4, borderBottomWidth: 1, borderBottomColor: '#444' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { width: '90%', padding: 25, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  modalTitle: { color: 'white', fontSize: 20, fontFamily: 'Pixel', marginBottom: 20, alignContent: 'center' ,justifyContent: 'center', textAlign: 'center' },
  textInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15, color: 'white', fontSize: 16, minHeight: 60, textAlignVertical: 'top', marginBottom: 20 },
  addButton: { backgroundColor: '#FEFDE8', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  addButtonDisabled: { backgroundColor: 'rgba(255, 255, 255, 0.26)' , borderBlockColor: 'rgba(17, 17, 17, 0.75)' },  
  addButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});