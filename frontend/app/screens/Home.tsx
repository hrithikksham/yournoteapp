import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import homeApi from '../../api/home';
import remindersApi from '../../api/reminder';

const { width } = Dimensions.get('window');

// Mock data structure for initial render
const initialData = {
  reminders: [],
  notes: [],
  labels: [],
};

export default function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [activeLabel, setActiveLabel] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = await SecureStore.getItemAsync('user_token');
      if (!token) {
        router.replace('/screens/Login');
        return;
      }
      const response = await homeApi.getHomeData(token);
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch home data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // useFocusEffect re-fetches data every time the screen comes into view
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchData();
    }, [])
  );

  const handleToggleReminder = async (reminderId : number, currentStatus : boolean) => {
    const originalReminders = [...data.reminders];
    // Optimistically update the UI
    const updatedReminders = data.reminders.map(r => 
      r._id === reminderId ? { ...r, is_completed: !currentStatus } : r
    );
    setData(prev => ({ ...prev, reminders: updatedReminders }));

    try {
      const token = await SecureStore.getItemAsync('user_token');
      await remindersApi.updateReminder(reminderId, !currentStatus, token);
    } catch (error) {
      console.error("Failed to update reminder:", error);
      // Revert UI on failure
      setData(prev => ({ ...prev, reminders: originalReminders }));
    }
  };

  const filteredNotes = activeLabel === 'All' 
    ? data.notes 
    : data.notes.filter(note => note.labels.includes(activeLabel));

  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/screens/Profile')}>
          <Ionicons name="person-circle-outline" size={45} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YOURNOTE</Text>
        <TouchableOpacity onPress={() => router.push('/screens/Settings')}>
          <Feather name="settings" size={40} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Journal Card */}
        <TouchableOpacity onPress={() => router.push('/screens/Journal')}>
          <BlurView intensity={40} tint="dark" style={styles.card}>
            <Text style={styles.cardTitle}>Journal Book</Text>
            <Text style={styles.cardSubtitle}>your complete unaltered voice.</Text>
            <View style={styles.plusIconContainer}>
              <Ionicons name="add" size={28} color="white" />
            </View>
          </BlurView>
        </TouchableOpacity>

        {/* Reminders Card */}
        <BlurView intensity={40} tint="dark" style={styles.card}>
          <View style={styles.remindersHeader}>
            <Text style={styles.cardTitle}>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</Text>
            <Text style={styles.cardSubtitle}>Reminders</Text>
          </View>
          {data.reminders.map(reminder => (
            <TouchableOpacity key={reminder.reminder_id} style={styles.reminderItem} onPress={() => handleToggleReminder(reminder.reminder_id, reminder.is_completed)}>
              <Feather name={reminder.is_completed ? "check-circle" : "circle"} size={20} color={reminder.is_completed ? "#50C878" : "white"} />
              <Text style={[styles.reminderText, reminder.is_completed && styles.reminderTextCompleted]}>{reminder.text}</Text>
            </TouchableOpacity>
          ))}
        </BlurView>

        {/* Labels Filter */}
        <FlatList
          horizontal
          data={['All', ...data.labels]}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.labelsContainer}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setActiveLabel(item)}>
              <BlurView intensity={60} tint="dark" style={[styles.labelChip, activeLabel === item && styles.labelChipActive]}>
                <Text style={styles.labelText}>{item}</Text>
              </BlurView>
            </TouchableOpacity>
          )}
        />

        {/* Notes Grid */}
        <View style={styles.notesGrid}>
          {filteredNotes.map((note, index) => (
            <TouchableOpacity key={note._id} style={[styles.noteCardContainer, { width: '48%' }]}>
              <BlurView intensity={50} tint="dark" style={[styles.noteCard, { backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)' }]}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text style={styles.noteContent} numberOfLines={6}>{note.content}</Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/screens/Addnote')}>
        <Text style={styles.fabText}>ADD NOTE</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  loadingContainer: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 30 },
  headerTitle: { color: 'white', fontSize: 25, fontFamily: 'Pixel' },
  scrollContent: { paddingHorizontal: 15, paddingBottom: 100 },
  card: { backgroundColor: '#999',paddingHorizontal: 10, paddingVertical: 35,padding: 20, borderRadius: 12, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardTitle: { color: 'white', fontSize: 25, fontFamily: 'Pixel'},
  cardSubtitle: { color: '#000', fontSize: 14, marginTop: 4 , fontWeight: '200', letterSpacing: 2 },
  plusIconContainer: { position: 'absolute', right: 10, top: 50, backgroundColor: 'rgba(103, 103, 103, 0.29)', borderRadius: 15, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  remindersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  reminderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  reminderText: { color: 'white', fontSize: 16, marginLeft: 10 },
  reminderTextCompleted: { textDecorationLine: 'line-through', color: '#888' },
  labelsContainer: { paddingVertical: 10 },
  labelChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16, marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  labelChipActive: { backgroundColor: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.5)' },
  labelText: { color: 'white', fontWeight: '600' },
  notesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  noteCardContainer: { marginBottom: 15 },
  noteCard: { paddingVertical: 50,padding: 15, borderRadius: 15, minHeight: 120, overflow: 'hidden' },
  noteTitle: { color: 'white', fontSize: 18, marginBottom: 5, fontFamily: 'Pixel' },
  noteContent: { color: '#ddd', fontSize: 14 },
  fab: { position: 'absolute', bottom: 40, right: 30, backgroundColor: '#FEFDE8', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  fabText: { color: '#1D1D1D', fontWeight: 'bold', fontSize: 16 },
});
