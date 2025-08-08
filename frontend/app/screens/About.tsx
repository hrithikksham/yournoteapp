// Portfolio.tsx
import React from "react";
import { View, Text, Linking, Pressable, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function Portfolio() {
  return (
    <LinearGradient colors={["#000000", "#0a0a0f"]} style={styles.container}>
      
      {/* Star Field */}
      {Array.from({ length: 20 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.star,
            { top: Math.random() * height, left: Math.random() * width },
          ]}
        />
      ))}
      {/* Name */}
      <Text style={styles.name}>Hi, I'm Hrithik</Text>
      <Text style={styles.role}>FULL STACK DEVELOPER</Text>

      {/* Interests */}
      <Text style={styles.interests}>
        this is my first mobile full stack app, built with React Native and FASTapi. 
        I am so glad to share it with you. 
        Give your feedback and suggestions to improve it through my instagram or linkedin.
      </Text>

      {/* Social Links */}
      <View style={styles.links}>
        <Pressable
          style={styles.linkButton}
          onPress={() => Linking.openURL("https://www.linkedin.com/in/hrithik-sham-a01293245")}
        >
          <Ionicons name="logo-linkedin" size={20} color="#0ff" />
          <Text style={styles.linkText}>LinkedIn</Text>
        </Pressable>
        <Pressable
          style={styles.linkButton}
          onPress={() => Linking.openURL("https://www.instagram.com/hrithiikk_?igsh=MWVjczB3MnVlbGUybw==")}
        >
          <Ionicons name="logo-instagram" size={20} color="#f0f" />
          <Text style={styles.linkText}>Instagram</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  star: {
    position: "absolute",
    width: 2,
    height: 2,
    backgroundColor: "white",
    borderRadius: 1,
    opacity: 0.8,
  },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    backgroundColor: "#111",
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0ff",
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 64,
  },
  name: {
    fontSize: 18,
    fontFamily: "Pixel",
    color: "#fff",
  },
  role: {
    fontSize: 14,
    color: "#0ff",
    letterSpacing: 2,
    marginBottom: 12,
  },
  interests: {
    fontSize: 13,
    color: "#ccc",
    textAlign: "center",
    paddingHorizontal: 30,
    lineHeight: 18,
    marginBottom: 20,
  },
  links: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgb(255, 255, 255)",
  },
  linkText: {
    color: "#fff",
    fontSize: 14,
  },
});