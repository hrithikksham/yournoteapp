import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Linking, Share, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import Constants from 'expo-constants'; // ✅ Import Constants

// This is now a simple, static component with no state.
export default function SettingsScreen() {
  const router = useRouter();
  
  // ✅ Get the app version dynamically
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const handleContribute = () => {
    const url = "https://github.com/hrithikksham/yournoteapp.git"; // Replace with your repo URL
    Linking.openURL(url).catch(err => Alert.alert("Error", "Could not open the link."));
  };

  const handleRecommend = async () => {
    try {
      await Share.share({
        message: 'Check out YourNote! A great app for journaling and reminders.', // Replace with your app link
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* External Links */}
        <TouchableOpacity style={styles.linkItem} onPress={handleContribute}>
          <Text style={styles.linkText}>contribute to github</Text>
          <Feather name="external-link" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkItem} onPress={handleRecommend}>
          <Text style={styles.linkText}>Recommend the App</Text>
          {/* ✅ Display the dynamic version number */}
          <Text style={styles.versionText}>v {appVersion}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/screens/About')}>
          <Text style={styles.footerText}>about us</Text>
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
    marginTop: 30,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontFamily: 'Pixel',
    marginTop: 30, // Adjusted for better alignment
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  settingItem: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 15,
    marginBottom: 16,
  },
  settingText: {
    color: 'white',
    fontSize: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 15,
    marginBottom: 16,
  },
  linkText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Pixel',
  },
  versionText: {
    color: '#aaa',
    fontSize: 14,
  },
  footer: {
    padding: 30,
    alignItems: 'center',
    marginBottom: 80,
    
  },
  footerText: {
    color: 'white',
    fontSize: 24,
    fontFamily: 'Pixel',
    textAlign: 'center',
  },
});
