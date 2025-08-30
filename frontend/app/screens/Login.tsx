import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/authcontexts'; // ✅ FIX: Corrected import path and name

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  // ✅ FIX: Destructure the 'login' function from the useAuth hook's return object
  const { login } = useAuth(); 
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please enter your credentials.');
      return;
    }

    setIsLoading(true);
    try {
      // ✅ This now correctly calls the login function from the context
      await login(identifier, password);
      // The root layout will automatically handle navigation after the token is set.
      // No router.replace() needed here.
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Invalid credentials or server error.';
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
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#bbb"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

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
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
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
  },
  button: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 10,
    minHeight: 48, 
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