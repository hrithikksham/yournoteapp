import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  TextInput, ScrollView, Alert, ActivityIndicator, Image, 
  KeyboardAvoidingView, Platform, Modal, Animated, Easing 
} from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import notesApi from '../../../api/note'; 
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
    Animated.timing(slideAnim, { 
      toValue: visible ? 0 : 300, 
      duration: 250, 
      easing: Easing.out(Easing.ease), 
      useNativeDriver: true 
    }).start();
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

// --- Main NoteScreen Component for Editing ---
export default function EditNoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const noteId = params.id as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState({ title: '', content: '', labels: [] as string[], isLocked: false });
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [showLabelInput, setShowLabelInput] = useState(false);

  // Ref for content input
  const contentInputRef = useRef<TextInput>(null);

  // Add new label handler
  const handleAddNewLabel = useCallback(() => {
    const trimmedLabel = newLabel.trim();
    if (!trimmedLabel) return;
    if (
      availableLabels.includes(trimmedLabel) ||
      labels.includes(trimmedLabel)
    ) {
      setNewLabel('');
      setShowLabelInput(false);
      return;
    }
    setAvailableLabels(prev => [...prev, trimmedLabel]);
    setLabels(prev => [...prev, trimmedLabel]);
    setNewLabel('');
    setShowLabelInput(false);
  }, [newLabel, availableLabels, labels]);

  const fetchData = async () => {
    if (!noteId) return;
    try {
      const [labelsResponse, noteResponse] = await Promise.all([
        notesApi.getAvailableLabels(),
        notesApi.getNoteById(noteId),
      ]);
      setAvailableLabels(labelsResponse.data || []);
      if (noteResponse) {
        const note = noteResponse.data;
        const noteState = {
            title: note.title || '',
            content: note.content || '',
            labels: note.labels || [],
            isLocked: note.is_locked || false,
        };
        setTitle(noteState.title);
        setContent(noteState.content);
        setLabels(noteState.labels);
        setIsLocked(noteState.isLocked);
        setOriginalData(noteState);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not load note data.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const hasChanges = title !== originalData.title || content !== originalData.content || JSON.stringify(labels.sort()) !== JSON.stringify(originalData.labels.sort()) || isLocked !== originalData.isLocked;
    setHasUnsavedChanges(hasChanges);
  }, [title, content, labels, isLocked, originalData]);

  useFocusEffect(useCallback(() => { fetchData(); }, [noteId]));
  
  const handleToggleLabel = (label: string) => {
    if (isLocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLabels(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const handleSaveNote = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please give your note a title.');
      return;
    }
    setIsSaving(true);
    try {
      // ✅ FIX: Send is_locked (snake_case) to the backend
      const noteData = { title: title.trim(), content, labels, is_locked: isLocked };
      await notesApi.updateNote(noteId, noteData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Save Failed', 'Could not save the note.');
    } finally {
      setIsSaving(false);
    }
  };  

  const handleImagePick = async (useCamera: boolean) => {
    setIsMenuOpen(false);
    
    const action = useCamera 
      ? ImagePicker.launchCameraAsync 
      : ImagePicker.launchImageLibraryAsync;
    
    const permission = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync() 
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Please grant permission to access your photos/camera.");
      return;
    }

    const result = await action({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true, 
      aspect: [4, 3], 
      quality: 0.8,
      allowsMultipleSelection: false
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setIsImageUploading(true);
      
      try {
        const response = await notesApi.uploadNoteImage(imageUri);
        const imageUrl = `${notesApi.getBaseURL()}${response.data.path}`;
        const markdownImage = `\n![Image](${imageUrl})\n`;
        setContent(prev => prev + markdownImage);
      } catch (error) {
        console.error("Image upload failed:", error);
        Alert.alert("Upload Failed", "Could not upload the image. Please try again.");
      } finally {
        setIsImageUploading(false);
      }
    }
  };


  const handleLockToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLocked(!isLocked);
    setIsMenuOpen(false);
  };
  
  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert("Unsaved Changes", "You have unsaved changes. Are you sure you want to discard them?",
        [{ text: "Cancel", style: "cancel" }, { text: "Discard", style: "destructive", onPress: () => router.back() }]
      );
    } else {
      router.back();
    }
  };

  const menuActions: Action[] = [
    { icon: 'image', title: 'Add Image', onPress: () => handleImagePick(false) },
    { icon: 'camera', title: 'Take Photo', onPress: () => handleImagePick(true) },
    { icon: isLocked ? 'unlock' : 'lock', title: isLocked ? 'Unlock Note' : 'Lock Note', onPress: handleLockToggle},
  ];

  const ParsedContent = useMemo(() => {
    if (!content) return null;

    const lines = content.split('\n');
    const IMAGE_REGEX = /!\[.*?\]\((.*?)\)/g;
    const CHECKBOX_REGEX = /^- \[([ x])\] (.*)/;

    return lines.map((line, index) => {
      // Handle images
      const imageMatch = [...line.matchAll(IMAGE_REGEX)];
      if (imageMatch.length > 0) {
        return (
          <View key={index} style={styles.imageContainer}>
            <Image 
              source={{ uri: imageMatch[0][1] }} 
              style={styles.embeddedImage} 
              resizeMode="contain" 
            />
          </View>
        );
      }

      // Handle regular text
      if (line.trim()) {
        return (
          <Text key={index} style={styles.contentText}>
            {line}
          </Text>
        );
      }

      // Empty line
      return <View key={index} style={styles.emptyLine} />;
    });
  }, [content, isLocked]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading note...</Text>
      </View>
    );
  }
  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {noteId ? 'edit note' : 'add note'}
          </Text>
          <TouchableOpacity onPress={handleSaveNote} disabled={isSaving || isLocked}>
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Feather name="check" size={28} color={isLocked ? "#666" : "white"} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title Input */}
          <TextInput 
            style={[styles.titleInput, isLocked && styles.disabledInput]} 
            placeholder="Title" 
            placeholderTextColor="#888" 
            value={title} 
            onChangeText={setTitle}
            editable={!isLocked}
            multiline={false}
          />
          
          {/* Labels Section */}
          <View style={styles.labelsSection}>
            {/* Selected Labels */}
            {labels.length > 0 && (
              <View style={styles.labelsContainer}>
                {labels.map(label => (
                  <TouchableOpacity 
                    key={label} 
                    onPress={() => !isLocked && handleToggleLabel(label)}
                    disabled={isLocked}
                  >
                    <View style={styles.labelChipSelected}>
                      <Text style={styles.labelTextSelected}>{label}</Text>
                      {!isLocked && (
                        <Feather name="x" size={14} color="white" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Available Labels */}
            {!isLocked && (
              <View style={styles.labelsContainer}>
                {availableLabels
                  .filter(l => !labels.includes(l))
                  .slice(0, 5)
                  .map(label => (
                    <TouchableOpacity 
                      key={label} 
                      onPress={() => handleToggleLabel(label)}
                    >
                      <View style={styles.labelChipAvailable}>
                        <Text style={styles.labelTextAvailable}>{label}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                
                {/* Add Label Button */}
                {!showLabelInput ? (
                  <TouchableOpacity onPress={() => setShowLabelInput(true)}>
                    <View style={styles.addLabelChip}>
                      <Text style={styles.addLabelText}>add label +</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TextInput 
                    style={styles.newLabelInput} 
                    placeholder="add label +" 
                    placeholderTextColor="#666" 
                    value={newLabel} 
                    onChangeText={setNewLabel} 
                    onSubmitEditing={handleAddNewLabel}
                    onBlur={() => {
                      if (!newLabel.trim()) setShowLabelInput(false);
                    }}
                    autoFocus
                  />
                )}
              </View>
            )}
          </View>
          
          {/* Content Editor */}
          <View style={styles.contentEditor}>
            {/* Display parsed content when locked */}
            {isLocked ? (
              <View style={styles.contentRenderer}>
                {ParsedContent}
              </View>
            ) : (
              <>
                {/* Rendered content preview */}
                <View style={styles.contentRenderer}>
                  {ParsedContent}
                </View>
                
                {/* Invisible text input for editing */}
                <TextInput 
                  ref={contentInputRef}
                  style={styles.contentInput}
                  placeholder="type your notes here"
                  placeholderTextColor="#666"
                  value={content}
                  onChangeText={setContent}
                  multiline
                  textAlignVertical="top"
                  scrollEnabled={false}
                />
              </>
            )}
          </View>

          {/* Lock indicator */}
          {isLocked && (
            <View style={styles.lockIndicator}>
              <Feather name="lock" size={16} color="#666" />
              <Text style={styles.lockText}>Note is locked</Text>
            </View>
          )}

          {/* Image upload indicator */}
          {isImageUploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.uploadingText}>Uploading image...</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Menu Button */}
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setIsMenuOpen(true)}
        >
          <Feather name="menu" size={24} color="white" />
        </TouchableOpacity>

        {/* Action Sheet */}
        <ActionSheet 
          visible={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)} 
          actions={menuActions} 
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212' 
  },
  loadingContainer: { 
    flex: 1, 
    backgroundColor: '#121212', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  loadingText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: 30, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    marginTop: 10
  },
  backButton: { 
    padding: 5 
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 16, 
    fontFamily:'Pixel', 
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 'auto' 
  },
  titleInput: { 
    color: 'white', 
    fontSize: 36, 
    fontWeight: 'bold', 
    marginBottom: 20,
    padding: 0
  },
  disabledInput: {
    opacity: 0.6
  },
  labelsSection: {
    marginBottom: 20
  },
  labelsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  labelChipSelected: { 
    backgroundColor: 'rgba(174, 175, 179, 0.21)', 
    backdropFilter: 'blur(10px)',
    borderRadius: 20, 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    marginRight: 8, 
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  labelTextSelected: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  labelChipAvailable: { 
    backgroundColor: 'rgba(0, 0, 0, 0.05)', 
    borderRadius: 20, 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    marginRight: 8, 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: 'rgba(248, 248, 248, 0.27)' 
  },
  labelTextAvailable: { 
    color: '#888', 
    fontSize: 14 
  },
  addLabelChip: {
    backgroundColor: 'transparent', 
    borderRadius: 20, 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    marginRight: 8, 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed'
  },
  addLabelText: {
    color: '#666', 
    fontSize: 14,
    fontStyle: 'italic'
  },
  newLabelInput: { 
    color: 'white', 
    fontSize: 14, 
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
    minWidth: 100
  },
  contentEditor: { 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    borderRadius: 15, 
    minHeight: '100%', 
    position: 'relative',
    overflow: 'hidden'
  },
  contentRenderer: { 
    padding: 15,
    minHeight: 200
  },
  contentInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 15,
    color: 'transparent',
    fontSize: 17,
    lineHeight: 28,
    textAlignVertical: 'top'
  },
  contentText: { 
    color: '#ddd', 
    fontSize: 17, 
    lineHeight: 28,
    marginBottom: 4
  },
  emptyLine: {
    height: 28
  },
  imageContainer: {
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden'
  },
  embeddedImage: { 
    width: '100%', 
    height: 200, 
    borderRadius: 10 
  },
  checkboxContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 6,
    paddingVertical: 4
  },
  checkboxText: { 
    color: '#ddd', 
    fontSize: 17, 
    marginLeft: 12, 
    lineHeight: 28,
    flex: 1
  },
  checkboxTextChecked: { 
    textDecorationLine: 'line-through', 
    color: '#666' 
  },
  lockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 10
  },
  lockText: {
    color: '#666',
    marginLeft: 8,
    fontSize: 14
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 10
  },
  uploadingText: {
    color: '#666',
    marginLeft: 8,
    fontSize: 14
  },
  menuButton: { 
    position: 'absolute', 
    bottom: 30, 
    left: 40, 
    backgroundColor: 'rgba(70, 70, 70, 0.47)', 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  }
});

const actionSheetStyles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(7, 7, 7, 0.54)', 
    justifyContent: 'flex-end' 
  },
  container: { 
    backgroundColor: '#1E1E1E', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20, 
    paddingBottom: 40 
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10 
  },
  actionText: { 
    color: 'white', 
    fontSize: 18, 
    marginLeft: 30 
  },
});