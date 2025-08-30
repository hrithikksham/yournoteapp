import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { BlurView } from 'expo-blur';
// ✅ Import the new API module
import authApi from '../../api/auth';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const [accountName, setAccountName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add loading state for better UX

  const handleRegister = async () => {
    if (!accountName || !email || !password || !phoneNo) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsLoading(true); // Start loading indicator

    try {
      // ✅ Call the register function from your API module
      const response = await authApi.register({
        account_name: accountName,
        email: email,
        phone_no: phoneNo,
        password: password,
      });

      // The status check is often implicitly handled by axios (it throws on non-2xx)
      // but an explicit check is fine too.
      Alert.alert('Success', 'Account created successfully! Please log in.');
      router.replace('/screens/Welcome');

    } catch (error: any) {
      // Provide more specific error feedback from the backend
      const errorMessage = error.response?.data?.detail || 'An unexpected error occurred.';
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setIsLoading(false); // Stop loading indicator
    }
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={60} tint="dark" style={styles.card}>
        <Text style={styles.heading}>Create Your Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#000"
          value={accountName}
          onChangeText={setAccountName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email ID"
          placeholderTextColor="#000"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Phone no"
          placeholderTextColor="#000"
          value={phoneNo}
          onChangeText={setPhoneNo}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#000"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />

        {/* ✅ Disable button while loading */}
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? '...' : 'Sign up'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/screens/Home')}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
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
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heading: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 24,
    lineHeight: 40,
    textAlign: 'center',
    fontFamily: 'Pixel', // Ensure this font is loaded in your layout
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    color: 'white',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
    fontFamily: 'Pixel',
    fontSize: 16,
  },
  linkText: {
    fontSize: 8,
    color: '#aaa',
    marginTop: 18,
    textAlign: 'center',
    fontFamily: 'Pixel',
  },
});
