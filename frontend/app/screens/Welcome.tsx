import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from 'three/src/Three.Core.js';


export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Text style={styles.title}>Welcome to yournote</Text>
      <Text style={styles.subtitle}>your daily productivity, note taking, 
        journal writing & your daily tasks record
      </Text>
      <Image source={require('../../assets/images/welcome.png')} style={styles.image} />

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/screens/SIgnup')}>
        <Text style={styles.buttonText}>Create your account</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/screens/Login')}>
        <Text style={styles.buttonText}>Login your account</Text>

      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 2,
    backgroundColor: '#000000ff',
    flexDirection: 'column',
    padding: 15,
    justifyContent: 'center',
  },
  title: {
    flexDirection: 'column',
    fontSize: 26,
    color: '#ffffffff',
    textAlign: 'left',
    lineHeight: 30,
    fontFamily: 'Pixel', // load with useFonts
    marginBottom: 20,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    textAlign: 'left',
    marginBottom: 20,
    fontWeight: '400',
    fontStyle:'italic', // load with useFonts
    lineHeight: 20,
    letterSpacing: 1.5,
    width: '80%',
    },
  primaryButton: {
    marginTop: 20,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 100,
    marginBottom: 1,
    width: '100%',
    alignItems: 'center',   
    justifyContent: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: 10,
    fontSize: 12,
    fontStyle : 'italic',
    color: '#ffffffc3',
    textAlign: 'center',

    marginBottom: 10,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Pixel',
    fontSize: 13,
    alignContent:'center',
    alignSelf:'center',
    justifyContent:'center',
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
    marginBottom: 0,
  },
});