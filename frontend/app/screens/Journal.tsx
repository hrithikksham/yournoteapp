import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import journalApi from '../../api/journal';
import { getDaysInMonth, format, getDay, startOfMonth, addMonths, subMonths } from 'date-fns';

// TypeScript interfaces
interface JournalEntry {
  id: string;
  title: string;
}

interface DayData {
  date: Date;
  dayOfMonth: number;
  dayOfWeek: string;
  isToday: boolean;
  hasEntry: boolean;
}

interface GroupedJournals {
  [month: string]: {
    [day: string]: JournalEntry[];
  };
}

export default function JournalScreen() {
  const router = useRouter();
  const [journalData, setJournalData] = useState<GroupedJournals>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await journalApi.getGroupedJournals();
      setJournalData(response.data || {});
    } catch (error) {
      console.error("Failed to fetch journal data:", error);
      Alert.alert("Error", "Could not load journal entries.");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { setIsLoading(true); fetchData(); }, []));

  const calendarDays = useMemo((): DayData[] => {
    const monthStart = startOfMonth(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);
    const today = new Date();
    
    const monthKey = format(currentDate, 'yyyy-MM');
    const daysWithEntries = journalData[monthKey] ? Object.keys(journalData[monthKey]) : [];

    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1);
      const dayKey = format(date, 'yyyy-MM-dd');
      return {
        date,
        dayOfMonth: i + 1,
        dayOfWeek: format(date, 'E'),
        isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
        hasEntry: daysWithEntries.includes(dayKey),
      };
    });
  }, [currentDate, journalData]);

  const entriesForSelectedDate = useMemo(() => {
    const monthKey = format(selectedDate, 'yyyy-MM');
    const dayKey = format(selectedDate, 'yyyy-MM-dd');
    return journalData[monthKey]?.[dayKey] || [];
  }, [selectedDate, journalData]);

  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#000" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journal</Text>
        <TouchableOpacity onPress={() => router.push('/screens/Note/')} style={styles.addButton}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={() => setCurrentDate(new Date())}>
          <Text style={[styles.controlText, styles.activeControl]}>Today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => setCurrentDate(prev => subMonths(prev, 1))}>
          <Ionicons name="chevron-back" size={24} color="#8E8E93" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{format(currentDate, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => setCurrentDate(prev => addMonths(prev, 1))}>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <FlatList
          horizontal
          data={calendarDays}
          keyExtractor={(item) => item.date.toISOString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = format(item.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            return (
              <TouchableOpacity 
                style={[
                  styles.dayCell, 
                  isSelected && styles.dayCellSelected,
                  item.isToday && styles.dayCellToday
                ]}
                onPress={() => setSelectedDate(item.date)}
              >
                <Text style={[styles.dayOfWeekText, isSelected && styles.dayTextSelected]}>{item.dayOfWeek}</Text>
                <Text style={[styles.dayOfMonthText, isSelected && styles.dayTextSelected]}>{item.dayOfMonth}</Text>
                {item.hasEntry && <View style={styles.entryIndicator} />}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {entriesForSelectedDate.length > 0 ? (
          entriesForSelectedDate.map(entry => (
            <TouchableOpacity 
              key={entry.id} 
              style={styles.entryCard}
              onPress={() => router.push(`/screens/Note/${entry.id}`)}
            >
              <Text style={styles.entryTitle}>{entry.title}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No entry for this day.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row',marginTop: 30,marginBottom:10, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: 10 },
  headerButton: { padding: 10 , borderRadius: 20, color: '#fff' },
  headerTitle: { fontSize: 28, fontFamily: 'Pixel' , color:'#fff'},
  addButton: { backgroundColor: '#333', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', gap: 20, paddingHorizontal: 25, marginTop: 10 },
  controlText: { fontSize: 17, color: '#8E8E93' },
  activeControl: { color: '#007AFF', fontWeight: '600' },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 20, marginBottom: 10 },
  monthText: { fontSize: 22, fontWeight: '600', color: '#fff' },
  calendarContainer: { marginTop: 15, height: 90 },
  dayCell: { width: 60, height: 80, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: '#F2F2F7' },
  dayCellToday: { backgroundColor: '#333' },
  dayCellSelected: { backgroundColor: '#007AFF' },
  dayOfWeekText: { fontSize: 14, color: '#8E8E93' },
  dayOfMonthText: { fontSize: 22, fontWeight: 'bold', marginTop: 4 },
  dayTextSelected: { color: '#FFFFFF' },
  entryIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF9500', position: 'absolute', bottom: 8 },
  scrollContent: { padding: 20 },
  entryCard: { backgroundColor: '#111', borderRadius: 8, padding: 20, marginBottom: 15, height: 100,justifyContent: 'center' }, 
  entryTitle: { fontSize: 18, fontWeight: '500',color: '#fff' },
  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 16, color: '#8E8E93' },
});
