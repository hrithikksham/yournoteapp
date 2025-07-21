import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Animated, Easing, Dimensions } from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import notesApi from '../../api/note';

const { height: screenHeight } = Dimensions.get('window');

// --- Circular Action Menu Component ---
interface Action {
  icon: keyof typeof Feather.glyphMap | keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  iconLibrary?: 'Feather' | 'Ionicons';
}

interface CircularActionMenuProps {
  visible: boolean;
  onClose: () => void;
  actions: Action[];
}

function CircularActionMenu({ visible, onClose, actions }: CircularActionMenuProps) {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(actions.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      // Slide up animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Stagger animation for action buttons
        const staggeredAnimations = scaleAnims.map((anim, index) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 200,
            delay: index * 80,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          })
        );
        Animated.stagger(80, staggeredAnimations).start();
      });
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 300,
          easing: Easing.in(Easing.bezier(0.55, 0.06, 0.68, 0.19)),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        ...scaleAnims.map(anim =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }
  }, [visible]);

  const renderIcon = (action: Action) => {
    const IconComponent = action.iconLibrary === 'Ionicons' ? Ionicons : Feather;
    return <IconComponent name={action.icon as any} size={24} color="white" />;
  };

  return (
    <Modal transparent={true} visible={visible} onRequestClose={onClose}>
      <Animated.View style={[circularMenuStyles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={circularMenuStyles.overlayTouch} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            circularMenuStyles.container,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Handle bar */}
          <View style={circularMenuStyles.handleBar} />
          
          {/* Action buttons in circular layout */}
          <View style={circularMenuStyles.actionsContainer}>
            {actions.map((action, index) => (
              <Animated.View
                key={index}
                style={[
                  circularMenuStyles.actionButtonContainer,
                  { transform: [{ scale: scaleAnims[index] }] }
                ]}
              >
                <TouchableOpacity 
                  style={circularMenuStyles.actionButton} 
                  onPress={() => {
                    action.onPress();
                    onClose();
                  }}
                >
                  {renderIcon(action)}
                </TouchableOpacity>
                <Text style={circularMenuStyles.actionLabel}>{action.title}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const circularMenuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 50,
    paddingTop: 20,
    minHeight: 280,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 30,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  actionButtonContainer: {
    alignItems: 'center',
    marginVertical: 15,
    width: '22%',
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

// --- Main NoteScreen Component ---
export default function NoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const noteId = params.id as string | undefined;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  
  const [isLoading, setIsLoading] = useState(!!noteId);
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const fetchData = async () => {
    try {
      const promises = [notesApi.getAvailableLabels()];
      if (noteId) promises.push(notesApi.getNoteById(noteId));
      
      const [labelsResponse, noteResponse] = await Promise.all(promises);
      
      setAvailableLabels(labelsResponse.data || []);

      if (noteResponse) {
        const note = noteResponse.data;
        setTitle(note.title);
        setContent(note.content);
        setLabels(note.labels || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [noteId]));

  const handleAddLabel = (labelToAdd: string) => {
    const trimmedLabel = labelToAdd.trim();
    if (trimmedLabel && !labels.includes(trimmedLabel)) {
      setLabels([...labels, trimmedLabel]);
      if (!availableLabels.includes(trimmedLabel)) {
        setAvailableLabels([...availableLabels, trimmedLabel]);
      }
    }
    setNewLabel('');
  };
  
  const handleToggleLabel = (label: string) => {
    if (labels.includes(label)) {
      setLabels(labels.filter(l => l !== label));
    } else {
      setLabels([...labels, label]);
    }
  };

  const handleSaveNote = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert("Empty Note", "Please add a title or content before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const noteData = { title, content, labels };
      
      if (noteId) {
        await notesApi.updateNote(noteId, noteData);
        Alert.alert("Success", "Note updated successfully!");
      } else {
        await notesApi.createNote(noteData);
        Alert.alert("Success", "Note created successfully!");
      }
      
      router.back();
    } catch (error) {
      console.error("Failed to save note:", error);
      Alert.alert("Error", "Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImagePick = async (useCamera: boolean) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access photos.');
        return;
      }

      if (useCamera) {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== 'granted') {
          Alert.alert('Permission needed', 'Please grant permission to access camera.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const uploadResult = await notesApi.uploadNoteImage(result.assets[0].uri);
        const imageUrl = uploadResult.data.url;
        
        setContent(prev => prev + (prev.length > 0 ? '\n\n' : '') + `![Image](${imageUrl})`);
        Alert.alert("Success", "Image uploaded successfully!");
      }
    } catch (error) {
      console.error("Failed to pick image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    }
  };

  const insertCheckbox = () => {
    setContent(prev => prev + (prev.length > 0 ? '\n' : '') + '- [ ] ');
  };

  const handleLockNote = async () => {
    try {
      const currentLockStatus = await SecureStore.getItemAsync(`note_locked_${noteId || 'new'}`);
      const newLockStatus = currentLockStatus !== 'true';
      
      await SecureStore.setItemAsync(`note_locked_${noteId || 'new'}`, newLockStatus.toString());
      setIsLocked(newLockStatus);
      
      Alert.alert(
        newLockStatus ? "Note Locked" : "Note Unlocked",
        newLockStatus ? "This note is now protected." : "This note is no longer protected."
      );
    } catch (error) {
      Alert.alert("Error", "Failed to toggle lock status.");
    }
  };

  // Check lock status on mount
  useEffect(() => {
    const checkLockStatus = async () => {
      try {
        const lockStatus = await SecureStore.getItemAsync(`note_locked_${noteId || 'new'}`);
        setIsLocked(lockStatus === 'true');
      } catch (error) {
        console.log("Failed to check lock status:", error);
      }
    };
    checkLockStatus();
  }, [noteId]);

  const menuActions: Action[] = [
    { 
      icon: 'lock', 
      title: isLocked ? 'Unlock' : 'Lock Note', 
      onPress: handleLockNote,
      iconLibrary: 'Feather'
    },
    { 
      icon: 'check-square', 
      title: 'To-do List', 
      onPress: insertCheckbox,
      iconLibrary: 'Feather'
    },
    { 
      icon: 'image', 
      title: 'Gallery', 
      onPress: () => handleImagePick(false),
      iconLibrary: 'Feather'
    },
    { 
      icon: 'camera', 
      title: 'Camera', 
      onPress: () => handleImagePick(true),
      iconLibrary: 'Feather'
    },
  ];

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
          <Text style={styles.headerTitle}>{noteId ? 'edit note' : 'add note'}</Text>
          <TouchableOpacity onPress={handleSaveNote} disabled={isSaving} style={styles.saveButton}>
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Feather name="check" size={28} color="white" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
            multiline
          />
          
          <View style={styles.labelsSection}>
            <View style={styles.labelsContainer}>
              {labels.map(label => (
                <TouchableOpacity key={label} onPress={() => handleToggleLabel(label)}>
                  <View style={styles.labelChipSelected}>
                    <Text style={styles.labelTextSelected}>{label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {availableLabels.filter(l => !labels.includes(l)).slice(0, 3).map(label => (
                <TouchableOpacity key={label} onPress={() => handleToggleLabel(label)}>
                  <View style={styles.labelChipAvailable}>
                    <Text style={styles.labelTextAvailable}>{label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              <TextInput
                style={styles.newLabelInput}
                placeholder="add label +"
                placeholderTextColor="#666"
                value={newLabel}
                onChangeText={setNewLabel}
                onSubmitEditing={() => handleAddLabel(newLabel)}
              />
            </View>
          </View>

          <View style={styles.contentContainer}>
            <TextInput
              style={styles.contentInput}
              placeholder="type your notes here"
              placeholderTextColor="#666"
              multiline
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <CircularActionMenu 
          visible={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)} 
          actions={menuActions} 
        />
        
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setIsMenuOpen(true)}
        >
          <Feather name="menu" size={24} color="white" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0A0A0A' 
  },
  loadingContainer: { 
    flex: 1, 
    backgroundColor: '#0A0A0A', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: 10, 
    paddingBottom: 20, 
    paddingHorizontal: 20 
  },
  backButton: { 
    padding: 8 
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  saveButton: {
    padding: 8
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 120 
  },
  titleInput: { 
    color: 'white', 
    fontSize: 48, 
    fontWeight: 'bold', 
    marginBottom: 30,
    lineHeight: 56,
    textAlignVertical: 'top'
  },
  labelsSection: {
    marginBottom: 20
  },
  labelsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    alignItems: 'center'
  },
  labelChipSelected: { 
    backgroundColor: '#4A4A4A', 
    borderRadius: 16, 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    marginRight: 8, 
    marginBottom: 8 
  },
  labelTextSelected: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '500' 
  },
  labelChipAvailable: { 
    backgroundColor: 'transparent', 
    borderRadius: 16, 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    marginRight: 8, 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: '#4A4A4A' 
  },
  labelTextAvailable: { 
    color: '#888', 
    fontSize: 14 
  },
  newLabelInput: { 
    color: '#888', 
    fontSize: 14, 
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontStyle: 'italic'
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row'
  },
  contentInput: { 
    color: '#ddd', 
    fontSize: 16, 
    lineHeight: 24, 
    flex: 1, 
    minHeight: 400, 
    textAlignVertical: 'top',
    paddingRight: 60
  },
  sideActions: {
    position: 'absolute',
    right: 0,
    top: 20,
    alignItems: 'center'
  },
  sideActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  menuButton: { 
    position: 'absolute', 
    bottom: 30, 
    right: 24, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
});
