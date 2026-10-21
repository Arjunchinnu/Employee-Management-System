import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";a

import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // We'll replace this with your actual dashboard endpoint
      // after confirming its response structure.
      const response = await api.get("/admin/dashboard");

      const data = response.data;

      setStats({
        totalEmployees: data.totalEmployees ?? 0,
        presentToday: data.presentToday ?? 0,
        absentToday: data.absentToday ?? 0,
        pendingLeaves: data.pendingLeaves ?? 0,
      });
    } catch (error) {
      Alert.alert(
        "Dashboard",
        "Dashboard data could not be loaded. We'll verify the backend route next."
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("adminToken");
    await SecureStore.deleteItemAsync("adminRole");
    router.replace("/");
  };

  const StatCard = ({ title, value }) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>
            Employee Management System
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563EB"
          style={styles.loader}
        />
      ) : (
        <View style={styles.grid}>
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
          />
          <StatCard
            title="Present Today"
            value={stats.presentToday}
          />
          <StatCard
            title="Absent Today"
            value={stats.absentToday}
          />
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaves}
          />
        </View>
      )}

      <Text style={styles.sectionTitle}>Management</Text>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push("/employees")}
      >
        <Text style={styles.menuTitle}>Employee Management</Text>
        <Text style={styles.menuDescription}>
          View, add, edit and delete employees
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push("/attendance")}
      >
        <Text style={styles.menuTitle}>Attendance</Text>
        <Text style={styles.menuDescription}>
          View check-in and check-out records
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push("/leaves")}
      >
        <Text style={styles.menuTitle}>Leave Requests</Text>
        <Text style={styles.menuDescription}>
          Review pending employee leave requests
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push("/register-face")}
      >
        <Text style={styles.menuTitle}>Face Registration</Text>
        <Text style={styles.menuDescription}>
          Register an employee's face
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={loadDashboard}
      >
        <Text style={styles.refreshText}>Refresh Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
    padding: 20,
  },

  header: {
    marginTop: 45,
    marginBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greeting: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0F172A",
  },

  subtitle: {
    color: "#64748B",
    marginTop: 6,
  },

  logoutButton: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  logoutText: {
    color: "#B91C1C",
    fontWeight: "700",
  },

  loader: {
    marginVertical: 40,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    width: "48%",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statTitle: {
    color: "#64748B",
    fontSize: 13,
  },

  statValue: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 18,
    marginBottom: 14,
  },

  menuItem: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  menuDescription: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 6,
  },

  refreshButton: {
    padding: 16,
    alignItems: "center",
    marginBottom: 30,
  },

  refreshText: {
    color: "#2563EB",
    fontWeight: "700",
  },
});