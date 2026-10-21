import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/admin/login", {
        email: email.trim(),
        password,
      });

      const data = response.data;

      if (!data.token) {
        Alert.alert(
          "Login response error",
          "The backend did not return an authentication token."
        );
        return;
      }

      await SecureStore.setItemAsync("adminToken", data.token);

      await SecureStore.setItemAsync(
        "adminRole",
        data.admin?.role || "admin"
      );

      router.replace("/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to connect to the server. Check your credentials and network.";

      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>A</Text>
        </View>

        <Text style={styles.heading}>Admin Portal</Text>

        <Text style={styles.subtitle}>
          Employee Management System
        </Text>

        <View style={styles.card}>
          <Text style={styles.welcome}>Welcome Back!</Text>

          <Text style={styles.description}>
            Sign in to manage your organization.
          </Text>

          <Text style={styles.label}>Email Address</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your admin email"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Text style={styles.showPassword}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Authorized administrators only
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },

  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  logoText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  heading: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#64748B",
    marginTop: 8,
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  welcome: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
  },

  description: {
    color: "#64748B",
    marginTop: 7,
    marginBottom: 26,
    fontSize: 14,
  },

  label: {
    color: "#334155",
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 13,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    color: "#0F172A",
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
  },

  passwordContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 24,
  },

  passwordInput: {
    flex: 1,
    color: "#0F172A",
  },

  showPassword: {
    color: "#2563EB",
    fontWeight: "700",
    paddingLeft: 10,
  },

  button: {
    height: 54,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  footer: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 24,
  },
});