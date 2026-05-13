import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from './context/authcontexts';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';

function RootLayoutNav() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    Pixel: require('../assets/fonts/PressStart2P-Regular.ttf'),
  });

  const isLoading = !fontsLoaded || isAuthLoading;

useEffect(() => {
  if (fontError) {
    console.error("Font loading error:", fontError);
  }
  if (isLoading) return;

  const publicScreens = ['Welcome', 'Login', 'SIgnup'];
  const currentScreen = segments.length > 1 ? segments[1] : '';
  const inPublicScreen = publicScreens.includes(currentScreen || '');
  const inProtectedScreen = segments[0] === 'screens' && !inPublicScreen;

  console.log('Navigation Debug:', {
    token: !!token,
    segments,
    currentScreen,
    inPublicScreen,
    inProtectedScreen,
  });

  if (token && inPublicScreen) {
    // logged in but on a public screen -> go to Home
    router.replace('/screens/Home');
  } else if (!token && inProtectedScreen) {
    // not logged in but on a protected screen -> go to Welcome
    router.replace('/screens/Welcome');
  }
}, [token, isLoading, segments, router, fontError]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // This Stack navigator provides the context for all your screens to navigate correctly.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="screens/Welcome" />
      <Stack.Screen name="screens/Login" />
      <Stack.Screen name="screens/SIgnup" />
      <Stack.Screen name="screens/Home" />
      <Stack.Screen name="screens/About" />
      <Stack.Screen name="screens/Reminder" />
      <Stack.Screen name="screens/Settings" />
      <Stack.Screen name="screens/user" />
      <Stack.Screen name="screens/Note/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}