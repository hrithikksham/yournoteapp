import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  Pressable,
  Image,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDaysInMonth,
  format,
  startOfMonth,
  addMonths,
  subMonths,
} from "date-fns";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// =================================================================
// --- AUTHENTICATED API LAYER ---
// =================================================================

const API_BASE_URL = 'https://yournoteapp-backend.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) {
          console.log("No refresh token, navigating to login.");
          // Here you would ideally navigate to the login screen
          return Promise.reject(error);
        }
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refresh_token: refreshToken });
        await SecureStore.setItemAsync('access_token', data.access_token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed, logging out.', refreshError);
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// ✅ Re-integrated the missing journalApi object
const journalApi = {
  getGroupedJournals: async () => {
    const token = await SecureStore.getItemAsync('access_token');
    return apiClient.get('/api/journal/all/grouped', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// =================================================================
// --- CONSTANTS & TYPES ---
// =================================================================

const JOURNAL_CACHE_KEY = "journal_cache_v1";

type JournalEntry = {
  id: string;
  title: string;
  content?: string;
  entry_date: string;
  image_urls?: string[];
  created_at?: string;
};

type DayData = {
  date: Date;
  dayOfMonth: number;
  dayOfWeek: string;
  isToday: boolean;
  hasEntry: boolean;
};

type GroupedJournals = {
  [month: string]: {
    [day: string]: JournalEntry[];
  };
};

// =================================================================
// --- SUB-COMPONENT: DayCell ---
// =================================================================

type DayCellProps = DayData & {
  isSelected: boolean;
  onPress: () => void;
};

function DayCell({ dayOfMonth, dayOfWeek, isToday, hasEntry, isSelected, onPress }: DayCellProps) {
  const scale = useSharedValue(1);
  const selectedAnim = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    selectedAnim.value = isSelected ? withSpring(1) : withTiming(0, { duration: 200 });
  }, [isSelected, selectedAnim]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(selectedAnim.value, [0, 1], ["#2C2C2E", "#007AFF"]),
    transform: [{ scale: scale.value }],
  }));

  const animatedDayOfWeekStyle = useAnimatedStyle(() => ({
    color: interpolateColor(selectedAnim.value, [0, 1], ["#8E8E93", "#FFFFFF"]),
  }));
  
  const animatedDayOfMonthStyle = useAnimatedStyle(() => ({
    color: interpolateColor(selectedAnim.value, [0, 1], ["#FFFFFF", "#FFFFFF"]),
  }));

  const onPressIn = () => { scale.value = withSpring(0.96); };
  const onPressOut = () => { scale.value = withSpring(1); };

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={{ marginRight: 10 }}>
      <Animated.View style={[styles.dayCell, animatedContainerStyle]}>
        <Animated.Text style={[styles.dayOfWeekText, animatedDayOfWeekStyle]}>{dayOfWeek}</Animated.Text>
        <Animated.Text style={[styles.dayOfMonthText, animatedDayOfMonthStyle]}>{dayOfMonth}</Animated.Text>
        {isToday && !isSelected && <View style={styles.todayRing} />}
        {hasEntry && <View style={[styles.entryIndicator, { backgroundColor: isSelected ? '#FFFFFF' : '#FF9500' }]} />}
      </Animated.View>
    </Pressable>
  );
}

// =================================================================
// --- SUB-COMPONENT: EntryCard ---
// =================================================================

type EntryCardProps = {
  entry: JournalEntry;
  onPress: () => void;
};

function EntryCard({ entry, onPress }: EntryCardProps) {
  const scale = useSharedValue(1);

  const onPressIn = () => (scale.value = withSpring(0.98));
  const onPressOut = () => (scale.value = withSpring(1));

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const thumbnail = entry.image_urls?.[0];
  // Using the `title` field as the main text for the card
  const mainText = entry.content || "Whats on your mind?";

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={{ marginBottom: 14 }}>
      <Animated.View style={[styles.entryCard, rStyle]}>
        <View style={styles.entryLeft}>
          <Text style={styles.entryContent} numberOfLines={2}>{mainText}</Text>
          <Text style={styles.entryDate}>{entry.entry_date ? format(new Date(entry.entry_date), "dd MMM yyyy") : ""}</Text>
        </View>

        {thumbnail ? (
          <Image source={{ uri: `${API_BASE_URL}${thumbnail}` }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="book" size={20} color="#9A9A9F" />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// =================================================================
// --- MAIN SCREEN COMPONENT: JournalScreen ---
// =================================================================

export default function JournalScreen() {
  const router = useRouter();
  const [journalData, setJournalData] = useState<GroupedJournals>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ 1. Create a ref for the calendar FlatList
  const calendarListRef = useRef<FlatList<DayData>>(null);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad && !isRefreshing) {
      const cached = await AsyncStorage.getItem(JOURNAL_CACHE_KEY);
      if (cached) {
        setJournalData(JSON.parse(cached).data || {});
        setIsLoading(false);
      }
    }
    try {
      const response = await journalApi.getGroupedJournals();
      const data = response.data || {};
      setJournalData(data);
      await AsyncStorage.setItem(JOURNAL_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (err: any) {
      console.error("Journal fetch failed:", err.message);
      if (err.response?.status !== 401) {
          Alert.alert("Sync Failed", "Could not fetch latest entries. Please check your connection.");
      }
    } finally {
      if (isLoading) setIsLoading(false);
      if (isRefreshing) setIsRefreshing(false);
    }
  }, [isLoading, isRefreshing]);

  useFocusEffect(
    useCallback(() => {
      fetchData(Object.keys(journalData).length === 0);
    }, [])
  );

  const calendarDays = useMemo((): DayData[] => {
    const monthStart = startOfMonth(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);
    const today = new Date();
    const monthKey = format(currentDate, "yyyy-MM");
    const daysWithEntries = journalData[monthKey] ? Object.keys(journalData[monthKey]) : [];

    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1);
      return {
        date,
        dayOfMonth: i + 1,
        dayOfWeek: format(date, "E"),
        isToday: format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"),
        hasEntry: daysWithEntries.includes(format(date, "yyyy-MM-dd")),
      };
    });
  }, [currentDate, journalData]);

  // ✅ 2. Effect to scroll the calendar to today's date
  useEffect(() => {
    const isCurrentMonth = format(currentDate, 'yyyy-MM') === format(new Date(), 'yyyy-MM');
    if (calendarDays.length > 0 && isCurrentMonth) {
      const todayIndex = calendarDays.findIndex(day => day.isToday);

      if (calendarListRef.current && todayIndex > -1) {
        setTimeout(() => {
          calendarListRef.current?.scrollToIndex({
            index: todayIndex,
            animated: true,
            viewPosition: 0.5, // This centers the item
          });
        }, 250);
      }
    }
  }, [calendarDays, currentDate]);

  const entriesForSelectedDate = useMemo((): JournalEntry[] => {
    const monthKey = format(selectedDate, "yyyy-MM");
    const dayKey = format(selectedDate, "yyyy-MM-dd");
    return journalData[monthKey]?.[dayKey] || [];
  }, [selectedDate, journalData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const handleAddPress = () => router.push({
    pathname: '/screens/Journal/[id]',
    params: { id: 'new', date: new Date().toISOString() } // Pass 'new' as id for new entry
  });
  
  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Journal</Text>
        <TouchableOpacity onPress={handleAddPress} style={styles.addButton} accessibilityLabel="Add new journal entry">
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => handleMonthChange('prev')}><Ionicons name="chevron-back" size={26} color="#8E8E93" /></TouchableOpacity>
        <Text style={styles.monthText}>{format(currentDate, "MMMM yyyy")}</Text>
        <TouchableOpacity onPress={() => handleMonthChange('next')}><Ionicons name="chevron-forward" size={26} color="#8E8E93" /></TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <FlatList
          // ✅ 3. Attach the ref and add getItemLayout for performance
          ref={calendarListRef}
          horizontal
          data={calendarDays}
          keyExtractor={(item) => item.date.toISOString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          getItemLayout={(data, index) => ({
            length: 78, // Item width (68) + margin (10)
            offset: 78 * index,
            index,
          })}
          renderItem={({ item }) => (
            <DayCell
              {...item}
              isSelected={format(item.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")}
              onPress={() => setSelectedDate(item.date)}
            />
          )}
        />
      </View>

      <FlatList
        data={entriesForSelectedDate}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onPress={() => router.push(`/screens/Journal/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#fff" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#6B6B70" />
            <Text style={styles.emptyTitle}>No Entry</Text>
            <Text style={styles.emptySubtitle}>Tap '+' to create a new entry for {format(selectedDate, "dd MMM yyyy")}.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// =================================================================
// --- STYLESHEET ---
// =================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: '#000' },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 46,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 28, color: "#fff", fontFamily:'Pixel', left:10,paddingTop: 15 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  monthText: { fontSize: 22, color: "#fff", fontWeight: "600" },
  calendarContainer: { height:100, marginTop: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 },
  emptyContainer: { alignItems: "center", paddingTop: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 20, color: "#fff", fontWeight: "600", marginTop: 16 },
  emptySubtitle: { fontSize: 8, color: "#9A9A9F", textAlign: "center", marginTop: 8 },

  dayCell: {
    width: 68,
    height: 88,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayOfWeekText: { fontSize: 13, fontWeight: '500' },
  dayOfMonthText: { fontSize: 20, fontWeight: "700", marginTop: 6 },
  todayRing: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgb(255, 255, 255)',
    top: 8,
    right: 8,
  },
  entryIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: "absolute",
    bottom: 8,
  },

  entryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 92,
    borderColor: "rgba(255, 255, 255, 0.15)"
  },
  entryLeft: { flex: 1, paddingRight: 10 },
  entryContent: { fontSize: 16, color: "rgb(255, 255, 255)", fontWeight: "800", marginBottom: 8, lineHeight: 22 },
  entryDate: { fontSize: 13, color: "#8E8E93" },
  thumbnail: { width: 72, height: 72, borderRadius: 8, marginLeft: 6, backgroundColor: "#252525" },
  thumbnailPlaceholder: { width: 72, height: 72, borderRadius: 8, marginLeft: 6, backgroundColor: "rgb(43, 38, 31)", alignItems: "center", justifyContent: "center" },
});