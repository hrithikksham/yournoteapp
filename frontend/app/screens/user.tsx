import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Image } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import authApi from '../../api/auth';
import { useAuth } from '../../app/context/authcontexts';

interface UserProfile {
  account_name: string;
  email: string;
  phone_no: string;
  profile_image_url?: string;
}

export default function UserScreen() {
  const router = useRouter();
  const { logout } = useAuth(); 
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const fetchUserData = async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.data);
      if (response.data.profile_image_url) {
        // ✅ This line will now work correctly
        const fullImageUrl = `${authApi.getBaseURL()}${response.data.profile_image_url}`;
        setImageUri(fullImageUrl);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      Alert.alert("Error", "Could not load your profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchUserData(); }, []));

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photos.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!pickerResult.canceled && pickerResult.assets.length > 0) {
      const localUri = pickerResult.assets[0].uri;
      setIsUploading(true);
      try {
        const response = await authApi.uploadProfileImage(localUri);
        const newImageUrl = `${authApi.getBaseURL()}${response.data.profile_image_url}`;
        setImageUri(newImageUrl); // Update UI with new image
      } catch (error) {
        console.error("Failed to upload image:", error);
        Alert.alert("Upload Failed", "Could not upload your profile picture.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout }
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. All your notes, journals, and reminders will be deleted. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Account", 
          style: "destructive", 
          onPress: async () => {
            try {
              await authApi.deleteAccount();
              logout(); 
            } catch (error) {
              console.error("Failed to delete account:", error);
              Alert.alert("Error", "Could not delete your account. Please try again.");
            }
          }
        }
      ]
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePick}>
          <View style={styles.avatar}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <Text style={styles.avatarText}>add image</Text>
            )}
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Account Info */}
        <Text style={styles.accountName}>{user?.account_name}</Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Feather name="mail" size={24} color="#888" />
            <Text style={styles.detailText}>{user?.email}</Text>
          </View>
          <View style={styles.detailItem}>
            <Feather name="phone" size={24} color="#888" />
            <Text style={styles.detailText}>{user?.phone_no}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>Log out</Text>
          </TouchableOpacity>
        <TouchableOpacity style ={styles.button} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000ff' },
  loadingContainer: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 20, paddingHorizontal: 10, marginTop: 30 },
  backButton: { padding: 10 },
  headerTitle: { color: 'white', fontSize: 18, fontFamily: 'Pixel' },
  spacer: { width: 40 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  avatarContainer: { alignItems: 'center', marginVertical: 20 },
  avatar: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%' },
  avatarText: { color: '#aaa', fontSize: 16 },
  uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  accountName: { color: 'white', fontSize: 24, fontFamily: 'Pixel', textAlign: 'center', marginBottom: 40 },
  detailsContainer: { paddingHorizontal: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, paddingVertical: 18, paddingHorizontal: 15, marginBottom: 16 },
  detailText: { color: 'white', fontSize: 16, marginLeft: 15, flex: 1 },
  footer: { paddingHorizontal: 30, paddingBottom: 40, paddingTop: 10, borderTopWidth: 0, borderTopColor: 'rgba(255,255,255,0.1)', marginBottom: 80 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  button: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 14, alignItems: 'center', width: '48%' },
  buttonText: { color: '#1D1D1D', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { backgroundColor: 'rgba(255,255,255,0.15)' },
  secondaryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  deleteText: { color: '#ff4d4d', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }
});
