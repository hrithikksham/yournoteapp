import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { BlurView } from 'expo-blur';
// ✅ Import the new API module
import authApi from '../../api/auth';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

// This function should eventually move into an AuthContext
async function saveToken(token: string) {
  await SecureStore.setItemAsync('user_token', token);
}

export default function LoginScreen() {
  const router = useRouter();
  // ✅ Use 'identifier' to match the backend and UI
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please enter your credentials.');
      return;
    }

    setIsLoading(true);

    try {
      // ✅ Call the login function from your API module with the correct payload
      const response = await authApi.login({ identifier, password });
      await SecureStore.setItemAsync('access_token', response.data.access_token);
      await SecureStore.setItemAsync('refresh_token', response.data.refresh_token);

      router.replace('/screens/Home');

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'An unexpected error occurred.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={60} tint="dark" style={styles.card}>
        <Text style={styles.heading}>Login your account</Text>

        <TextInput
          style={styles.input}
          placeholder="email id / phone no"
          placeholderTextColor="#bbb"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#bbb"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* ✅ Disable button and show loading indicator */}
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#1D1D1D" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/screens/SIgnup')}>
          <Text style={styles.linkText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

// Your existing styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: width * 0.9,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heading: {
    fontSize: 28,
    lineHeight: 40,
    fontFamily: 'Pixel',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    color: '#fff',
    fontFamily: 'PoppinsRegular',
  },
  button: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    minHeight: 48, // Ensure button has a consistent height
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontFamily: 'Pixel',
    fontSize: 16,
  },
  linkText: {
    color: '#aaa',
    marginTop: 18,
    textAlign: 'center',
    fontFamily: 'Pixel',
    fontSize: 8,
  },
});
