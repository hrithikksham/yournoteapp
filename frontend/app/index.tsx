import { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Use push instead of replace to allow back navigation if needed
      router.push('/screens/Welcome');
    }, 2000); // Display splash screen for 2 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/images/splash.png')} 
        style={styles.logo} 
        // Add these props for better performance
        resizeMode="contain"
        fadeDuration={0} // Disable fade animation for faster loading
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1D1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 20,
  },
});