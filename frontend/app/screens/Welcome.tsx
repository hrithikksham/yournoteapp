import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';


export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Text style={styles.title}>Welcome to yournote!</Text>
      <Text style={styles.subtitle}>your daily productivity, note taking, 
        journal writing & your daily tasks record
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/screens/SIgnup')}>
        <Text style={styles.buttonText}>Create your account</Text>
      </TouchableOpacity>

      <Image source={require('../../assets/images/welcome.png')} style={styles.image} />

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/screens/Login')}>
        <Text style={styles.buttonText}>Login your account</Text>
        
      </TouchableOpacity>
      <Text style={styles.secondaryButton}>already having an account?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 2,
    backgroundColor: '#000',
    flexDirection: 'column',
    padding: 15,
    justifyContent: 'center',
  },
  title: {
    flexDirection: 'column',
    fontSize: 26,
    color: '#fff',
    textAlign: 'left',
    lineHeight: 30,
    fontFamily: 'Pixel', // load with useFonts
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 9,
    color: '#aaa',
    textAlign: 'left',
    marginBottom: 20,
    fontFamily: 'Pixel', // load with useFonts
    lineHeight: 20,
    width: '100%',
    },
  primaryButton: {
    marginTop: 20,
    backgroundColor: '#222',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',   
    justifyContent: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: 10,
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center',
    fontFamily: 'Pixel', // load with useFonts
    marginBottom: 10,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Pixel',
    fontSize: 16,
  },
  caption: {
    fontSize: 10,
    color: '#ccc',
    marginTop: 4,
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginTop: 10,
    alignContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
});