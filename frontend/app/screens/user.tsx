import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

// Import the auth API
import authApi from '../../api/auth';

// TypeScript interface for user data
interface UserProfile {
  account_name: string;
  email: string;
  phone_no: string;
  profile_image_url?: string;
}

export default function UserScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserData = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        Alert.alert("Session Expired", "Please log in again.");
        router.replace('/screens/Login');
        return;
      }

      const response = await authApi.getMe();
      setUser(response.data);

    } catch (error) {
      console.error("Failed to fetch user data:", error);
      Alert.alert("Error", "Could not load your profile. Please try again.");
      if (router.canGoBack()) {
        router.back();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive", 
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('access_token');
              await SecureStore.deleteItemAsync('refresh_token');
              router.replace('/screens/Login');
            } catch (error) {
              console.error("Error during logout:", error);
              router.replace('/screens/Login');
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
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load user data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
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
        {/* Profile Image Avatar */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>add image</Text>
          </TouchableOpacity>
        </View>

        {/* Account Name */}
        <Text style={styles.accountName}>
          {user.account_name || 'No name provided'}
        </Text>

        {/* User Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Feather name="mail" size={24} color="#888" />
            <Text style={styles.detailText}>
              {user.email || 'No email provided'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Feather name="phone" size={24} color="#888" />
            <Text style={styles.detailText}>
              {user.phone_no || 'No phone number provided'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Feather name="lock" size={24} color="#888" />
            <Text style={styles.detailText}>••••••••••</Text>
            <TouchableOpacity style={styles.eyeIcon}>
              <Feather name="eye-off" size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>Log out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
            <Text style={styles.secondaryButtonText}>Backup your data</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#B8A082',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#1D1D1D',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  spacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#aaa',
    fontSize: 16,
  },
  accountName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  detailsContainer: {
    paddingHorizontal: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 15,
    marginBottom: 16,
  },
  detailText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  eyeIcon: {
    marginLeft: 'auto',
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    width: '48%',
  },
  buttonText: {
    color: '#1D1D1D',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteText: {
    color: '#ff4d4d',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
