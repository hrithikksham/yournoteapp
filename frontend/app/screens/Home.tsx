import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView,Alert, TouchableOpacity, FlatList, ActivityIndicator, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import noteApi from '../../api/note';
import homeApi from '../../api/home';
import remindersApi from '../../api/reminders';

// TypeScript interfaces for type safety
interface Reminder {
  _id: string;
  text: string;
  is_completed: boolean;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  labels: string[];
}

interface HomeData {
  reminders: Reminder[];
  notes: Note[];
  labels: string[];
}

const initialData: HomeData = {
  reminders: [],
  notes: [],
  labels: [],
};

const HEADER_HEIGHT = 100; // Define header height for animations

export default function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState<HomeData>(initialData);
  const [activeLabel, setActiveLabel] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        router.replace('/screens/Login');
        return;
      }
      
      const response = await homeApi.getHomeData(token);
      setData(response.data);

    } catch (err) {
      console.error("Failed to fetch home data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchData();
    }, [])
  );


  const handleToggleReminder = async (reminderId: string, currentStatus: boolean) => {
    const originalReminders = [...data.reminders];
    const updatedReminders = data.reminders.map(r => 
      r._id === reminderId ? { ...r, is_completed: !currentStatus } : r
    );
    setData(prev => ({ ...prev, reminders: updatedReminders }));

    try {
      await remindersApi.updateReminder(reminderId, { is_completed: !currentStatus });
    } catch (err) {
      console.error("Failed to update reminder:", err);
      setData(prev => ({ ...prev, reminders: originalReminders }));
    }
  };

  const handleDeleteNotePrompt = (noteId: string) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDeleteNote(noteId) }
      ]
    );
  };

  const handleDeleteNote = async (noteId: string) => {
    const originalNotes = [...data.notes];
    const updatedNotes = data.notes.filter(n => n._id !== noteId);
    setData(prev => ({ ...prev, notes: updatedNotes }));

    try {
      await noteApi.deleteNote(noteId); // Assuming noteApi is imported correctly
    }
    catch (err) {
      console.error("Failed to delete note:", err);
      setData(prev => ({ ...prev, notes: originalNotes }));
    }
  };




  const filteredNotes = activeLabel === 'All' 
    ? data.notes 
    : data.notes.filter(note => note.labels?.includes(activeLabel));

  const leftColumnNotes = filteredNotes.filter((_, index) => index % 2 === 0);
  const rightColumnNotes = filteredNotes.filter((_, index) => index % 2 === 1);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity }]}>
        <TouchableOpacity onPress={() => router.push('/screens/user')}>
          <Ionicons name="person-circle-outline" size={45} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YOURNOTE</Text>
        <TouchableOpacity onPress={() => router.push('/screens/Settings')}>
          <Feather name="settings" size={35} color="white" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >

        <BlurView intensity={40} tint="dark" style={styles.card}>
          <View style={styles.remindersHeader}>
            <Text style={styles.cardTitle}>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</Text>
            <TouchableOpacity onPress={() => router.push('/screens/Reminder')}>
              
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.cardSubtitle}>Reminders</Text>
                  <Ionicons name="add" size={24} color="white" style={{ marginLeft: 10,backgroundColor:'rgba(255, 255, 255, 0.06)' ,borderRadius:100}} />
                </View>
            </TouchableOpacity>
          </View>
          {data.reminders.length > 0 ? (
            data.reminders.map(r => (
              <TouchableOpacity key={r._id} style={styles.reminderItem} onPress={() => handleToggleReminder(r._id, r.is_completed)}>
                <Feather name={r.is_completed ? "check-circle" : "circle"} size={20} color={r.is_completed ? "#50C878" : "white"} />
                <Text style={[styles.reminderText, r.is_completed && styles.reminderTextCompleted]}>{r.text}</Text>
              </TouchableOpacity>
            ))
          ) : <Text style={styles.emptyText}>No reminders for today.</Text>}
        </BlurView>

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

        <View style={styles.notesGrid}>
          {filteredNotes.length > 0 ? (
            <>
              <View style={styles.column}>
                {leftColumnNotes.map(note => (
                  <TouchableOpacity key={note._id} style={styles.noteCardContainer} onLongPress={() => handleDeleteNotePrompt(note._id)} onPress={() => router.push(`/screens/Note/${note._id}`)}>
                    <BlurView intensity={50} tint="dark" style={styles.noteCard}>
                      <Text style={styles.noteTitle} numberOfLines={2}>{note.title}</Text>
                      <Text style={styles.noteContent} numberOfLines={6}>{note.content}</Text>
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.column}>
                {rightColumnNotes.map(note => (
                  <TouchableOpacity key={note._id} style={styles.noteCardContainer} onLongPress={() => handleDeleteNotePrompt(note._id)} onPress={() => router.push(`/screens/Note/${note._id}`)}>
                    <BlurView intensity={50} tint="dark" style={styles.noteCard}>
                      <Text style={styles.noteTitle} numberOfLines={2}>{note.title}</Text>
                      <Text style={styles.noteContent} numberOfLines={8}>{note.content}</Text>
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : <View style={styles.emptyNotesContainer}><Text style={styles.emptyText}>No notes found for "{activeLabel}"</Text></View>}
        </View>
      </Animated.ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/screens/Note/Note')}>
        <Text style={styles.fabText}>ADD NOTE</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width:'100%', backgroundColor: '#000000ff' },
  loadingContainer: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: '#ff6b6b', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#FEFDE8', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryButtonText: { color: '#1D1D1D', fontWeight: 'bold' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 30,
    paddingBottom: 10,
    backgroundColor: '#000000ff',
  },
  headerTitle: { color: 'white', fontSize: 28, fontFamily: 'Pixel', marginTop: 20 },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 100,
    paddingTop: HEADER_HEIGHT,
  },
  card: { padding: 25, borderRadius: 25, overflow: 'hidden', marginBottom: 15, borderWidth: 0.8,borderColor: 'rgba(255, 255, 255, 0.6)',backgroundColor: 'rgba(255,255,255,0.05)',}, 
  cardTitle: { color: 'white', fontSize: 20, fontFamily: 'Pixel' },
  cardSubtitle: { color: '#ccc', fontSize: 14, marginTop: 2,fontStyle: 'italic' },
  plusIconContainer: { position: 'absolute', right: 20, top: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  remindersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  reminderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  reminderText: { color: 'white', fontSize: 16, marginLeft: 10 },
  reminderTextCompleted: { textDecorationLine: 'line-through', color: '#888' },
  emptyText: { color: '#888', fontStyle: 'italic', paddingVertical: 10, textAlign: 'center' },
  labelsContainer: { paddingVertical: 10 , marginBottom: 8 },
  labelChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16, marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  labelChipActive: { backgroundColor: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.5)' },
  labelText: { color: 'white', fontWeight: '600' },
  emptyNotesContainer: { width: '100%', alignItems: 'center', paddingVertical: 40 },
  fab: { position: 'absolute', bottom: 40, right: 30, backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  fabText: { color: '#1D1D1D', fontFamily: 'Pixel', fontSize: 12 },
  notesGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  column: {
    width: '49%',
  },
  noteCardContainer: { 
    marginBottom: 8,
  },
  noteCard: { 
    padding: 20, 
    borderRadius: 16, 
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 0.2,
    borderColor: 'rgba(255, 255, 255, 0.93)',
  },
  noteTitle: { 
    color: 'rgb(255, 255, 255)', 
    fontSize: 20, 
    marginBottom: 8, 
    fontWeight: '800',
    letterSpacing: 1.5,
    textDecorationColor: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase'
  },
  noteContent: { 
    color: 'rgba(255, 255, 255, 0.8)', 
    fontSize: 14, 
    lineHeight: 18, 
    letterSpacing: 0.8,
    fontWeight: '200'
  },
});
