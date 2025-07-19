import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { View, Text } from 'react-native';

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Pixel: require('../assets/fonts/PressStart2P-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1D1D1D', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>Loading...</Text>
      </View>
    );
  }

  return <Slot />;
}