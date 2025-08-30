import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  SafeAreaView, 
  Linking, 
  Share, 
  Alert, 
  ScrollView 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import notesApi from '../../api/note'; // Ensure this path is correct

export default function SettingsScreen() {
  const router = useRouter();
  const [labels, setLabels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const appVersion = Constants.expoConfig?.version ;

  // --- Static Link Handlers ---
  const handleContribute = () => {
    const url = "https://github.com/hrithikksham/yournoteapp.git";
    Linking.openURL(url).catch(err => Alert.alert("Error", "Could not open the link."));
  };

const handleRecommend = async () => {
  try {
    await Share.share({
      message: 
        `✨ Check out **YourNote** ✨\n\n` +
        `A *simple, secure, and efficient* note-taking app designed to help you stay organized.\n\n` +
        `📝 Write Notes\n⏰ Set Reminders\n📖 Journal Your Thoughts\n\n` +
        `Download now: https://hrithikksham.github.io/yournoteappapk/`,
    });
  } catch (error: any) {
    Alert.alert("Oops!", "Something went wrong while sharing. Please try again.");
  }
};


  // --- Label Fetching Logic ---
  const fetchLabels = async () => {
    try {
      setIsLoading(true);
      const response = await notesApi.getAvailableLabels();
      setLabels((response.data || []).sort());
    } catch (error) {
      console.error("Failed to fetch labels:", error);
      Alert.alert("Error", "Could not load your labels.");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLabels();
    }, [])
  );

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
        
        {/* --- Professional Labels Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Labels</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" style={{ alignSelf: 'flex-start' }}/>
          ) : (
            <View style={styles.labelCloudContainer}>
              {labels.length > 0 ? (
                labels.map((label) => (
                  <View key={label} style={styles.labelChip}>
                    <Text style={styles.labelChipText}>{label}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No labels found.</Text>
              )}
            </View>
          )}
        </View>

        {/* --- External Links Section (Unchanged) --- */}
        <TouchableOpacity style={styles.linkItem} onPress={handleContribute}>
          <Text style={styles.linkText}>contribute to github</Text>
          <Feather name="external-link" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkItem} onPress={handleRecommend}>
          <Text style={styles.linkText}>Recommend the App</Text>
          <Text style={styles.versionText}>v {appVersion}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer (Unchanged) */}
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
    backgroundColor: '#000000ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontFamily: 'Pixel',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Pixel',
    marginBottom: 15,
  },
  labelCloudContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    maxWidth: '100%',
    marginBottom: 20,
  },
  labelChip: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 0,
  },
  labelChipText: {
    color: '#5b5b5bff',
    fontSize: 14,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(50, 50, 50, 1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 100,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 10,
    marginTop: 0
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
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    textDecorationColor: 'rgba(255, 255, 255, 0.4)',  
    letterSpacing: 1.2,
  },
});

