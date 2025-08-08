// src/app/journal/[id].tsx

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  Modal, 
  Animated, 
  Easing 
} from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// =================================================================
// --- AUTHENTICATED API LAYER ---
// =================================================================

const API_BASE_URL = 'https://yournoteapp-backend.onrender.com';
const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) return Promise.reject(error);

        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refresh_token: refreshToken });
        await SecureStore.setItemAsync('access_token', data.access_token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

const journalApi = {
  createJournal: async (data: any) => {
    const token = await SecureStore.getItemAsync('access_token');
    return apiClient.post('/api/journal/', data, { headers: { Authorization: `Bearer ${token}` } });
  },
  getJournalById: async (id: string) => {
    const token = await SecureStore.getItemAsync('access_token');
    return apiClient.get(`/api/journal/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  },
  updateJournal: async (id: string, data: any) => {
    const token = await SecureStore.getItemAsync('access_token');
    return apiClient.put(`/api/journal/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
  },
  uploadJournalImage: async (imageUri: string) => {
    const token = await SecureStore.getItemAsync('access_token');
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri, name: imageUri.split('/').pop(), type: `image/${imageUri.split('.').pop()}`,
    } as any);
    return apiClient.post('/api/upload/image/journal', formData, {
      headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
    });
  },
  getBaseURL: () => API_BASE_URL,
};


// --- Local ActionSheet Component ---
interface Action { 
  icon: keyof typeof Feather.glyphMap; 
  title: string; 
  onPress: () => void; 
}
interface ActionSheetProps { 
  visible: boolean; 
  onClose: () => void; 
  actions: Action[]; 
}

function ActionSheet({ visible, onClose, actions }: ActionSheetProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  useEffect(() => {
    Animated.timing(slideAnim, { toValue: visible ? 0 : 300, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [visible]);

  return (
    <Modal transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={actionSheetStyles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[actionSheetStyles.container, { transform: [{ translateY: slideAnim }] }]}>
          {actions.map((action, index) => (
            <TouchableOpacity key={index} style={actionSheetStyles.actionButton} onPress={action.onPress}>
              <Feather name={action.icon} size={24} color="#ccc" />
              <Text style={actionSheetStyles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}


// --- Main JournalEditorScreen Component ---
export default function JournalEditorScreen() {
  const router = useRouter();
  const { id, date: entryDateParam } = useLocalSearchParams();
  
  // ✅ This logic now correctly determines if we are editing or creating
  const isEditing = id && id !== 'new';
  const journalId = isEditing ? (Array.isArray(id) ? id[0] : id) : undefined;

  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState(new Date());
  
  const [isLoading, setIsLoading] = useState(!!isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const fetchData = async () => {
    // Only fetch if we are in "edit mode"
    if (!journalId) {
      if (entryDateParam) setEntryDate(new Date(entryDateParam as string));
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await journalApi.getJournalById(journalId);
      const journal = response.data;
      setContent(journal.content || '');
      setEntryDate(new Date(journal.entry_date));
    } catch (error) {
      console.error("Failed to fetch journal entry:", error);
      Alert.alert('Error', 'Could not load the journal entry.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [journalId]));

  const handleSaveJournal = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Entry', 'Please write something in your journal entry.');
      return;
    }
    
    setIsSaving(true);
    try {
      const imageUrlRegex = /!\[.*?\]\((.*?)\)/g;
      const matches = [...content.matchAll(imageUrlRegex)];
      const relativeImages = matches.map(match => match[1].replace(journalApi.getBaseURL(), ''));

      const journalData = { 
        content, 
        entry_date: entryDate.toISOString().split('T')[0],
        image_urls: relativeImages
      };
      
      if (journalId) {
        await journalApi.updateJournal(journalId, journalData);
      } else {
        await journalApi.createJournal(journalData);
      }
      router.back();
    } catch (error: any) {
      console.error("Failed to save journal:", error.response?.data || error);
      Alert.alert('Save Failed', `Could not save the journal entry. Reason: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImagePick = async (useCamera: boolean) => {
    setIsMenuOpen(false);
    const action = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const permission = useCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Please grant permission to access your photos/camera.");
      return;
    }
    const result = await action({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets.length > 0) {
      setIsImageUploading(true);
      try {
        const response = await journalApi.uploadJournalImage(result.assets[0].uri);
        const imageUrl = `${journalApi.getBaseURL()}${response.data.path}`;
        const markdownImage = `\n![Image](${imageUrl})\n`;
        setContent(prev => prev + markdownImage);
      } catch (error) {
        Alert.alert("Upload Failed", "Could not upload the image.");
      } finally {
        setIsImageUploading(false);
      }
    }
  };

  const menuActions = [
    { icon: 'image' as const, title: 'Add Image from Gallery', onPress: () => handleImagePick(false) },
    { icon: 'camera' as const, title: 'Take Photo', onPress: () => handleImagePick(true) },
  ];

  const ParsedContent = useMemo(() => {
    if (!content) return null;
    const lines = content.split('\n');
    const IMAGE_REGEX = /!\[.*?\]\((.*?)\)/g;

    return lines.map((line, index) => {
      const imageMatch = [...line.matchAll(IMAGE_REGEX)];
      if (imageMatch.length > 0) {
        return (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: imageMatch[0][1] }} style={styles.embeddedImage} resizeMode="contain" />
          </View>
        );
      }
      return line.trim() ? <Text key={index} style={styles.contentText}>{line}</Text> : <View key={index} style={styles.emptyLine} />;
    });
  }, [content]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'edit journal' : 'journal'}</Text>
          <TouchableOpacity onPress={handleSaveJournal} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="white" size="small" /> : <Feather name="check" size={28} color="white" />}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.dateText}>{entryDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          
          <View style={styles.contentEditor}>
              <View style={styles.contentRenderer} pointerEvents="none">{ParsedContent}</View>
              <TextInput 
                style={styles.contentInput}
                placeholder="What's on your mind?"
                placeholderTextColor="#666"
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
          </View>

          {isImageUploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.uploadingText}>Uploading image...</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.menuButton} onPress={() => setIsMenuOpen(true)}>
          <Feather name="menu" size={24} color={"white"} />
        </TouchableOpacity>

        <ActionSheet visible={isMenuOpen} onClose={() => setIsMenuOpen(false)} actions={menuActions} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgb(0, 0, 0)' },
  loadingContainer: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 10 : 30, paddingBottom: 20, paddingHorizontal: 20 ,marginTop: 10 },
  backButton: { padding: 5 },
  headerTitle: { color: 'white', fontSize: 16, fontFamily:'Pixel' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100, },
  dateText: { color: '#888', fontSize: 16, marginBottom: 20, fontWeight: '600' },
  contentEditor: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 15, position: 'relative', overflow: 'hidden',minHeight: '100%', padding: 4 },
  contentRenderer: { padding: 15, minHeight: 400 },
  contentInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 15, color: 'transparent', fontSize: 18, lineHeight: 30, textAlignVertical: 'top' },
  contentText: { color: '#ddd', fontSize: 18, lineHeight: 30, marginBottom: 4 },
  emptyLine: { height: 30 },
  imageContainer: { marginVertical: 10, borderRadius: 10, overflow: 'hidden' },
  embeddedImage: { width: '100%', height: 250, borderRadius: 10 },
  uploadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, paddingVertical: 10 },
  uploadingText: { color: '#666', marginLeft: 8, fontSize: 14 },
  menuButton: { position: 'absolute', bottom: 30, left: 40, backgroundColor: 'rgba(70, 70, 70, 0.47)', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
});

const actionSheetStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(7, 7, 7, 0.54)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  actionText: { color: 'white', fontSize: 18, marginLeft: 30 },
});