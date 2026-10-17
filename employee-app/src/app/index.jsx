import React, { useState } from "react";

import { router, useLocalSearchParams } from "expo-router";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";

import {
  Camera,
  Clock3,
  CheckCircle2,
  ScanFace,
  ShieldCheck,
} from "lucide-react-native";

export default function HomeScreen() {
  const [attendanceStatus, setAttendanceStatus] = useState("not_checked_in");
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);

  const getCurrentTime = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleCheckIn = () => {
    router.push({
      pathname: "/camera",
      params: { action: "check-in" },
    });
  };

  const handleCheckOut = () => {
    router.push({
      pathname: "/camera",
      params: { action: "check-out" },
    });
  };

  const statusText = {
    not_checked_in: "Not checked in",
    checked_in: "Currently checked in",
    checked_out: "Attendance completed",
  }[attendanceStatus];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#10141D" />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>EMPLOYEE MANAGEMENT</Text>
            <Text style={styles.title}>Attendance</Text>
          </View>

          <View style={styles.shield}>
            <ShieldCheck size={25} color="#76F7B0" />
          </View>
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome!</Text>

          <Text style={styles.welcomeSubtitle}>
            Scan your face to record attendance.
          </Text>

          <View style={styles.cameraPlaceholder}>
            <View style={styles.faceCircle}>
              <ScanFace size={76} color="#76F7B0" strokeWidth={1.3} />
            </View>

            <Text style={styles.cameraTitle}>Face Recognition</Text>

            <Text style={styles.cameraSubtitle}>
              Your camera will open when you choose an action.
            </Text>
          </View>
        </View>

        {/* Attendance Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Record Attendance</Text>
          <Text style={styles.sectionSubtitle}>Choose an action</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.checkInButton,
              attendanceStatus !== "not_checked_in" && styles.disabledButton,
            ]}
            onPress={handleCheckIn}
            disabled={attendanceStatus !== "not_checked_in"}
          >
            <Camera size={22} color="#10141D" />
            <Text style={styles.checkInText}>Check In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.checkOutButton,
              attendanceStatus !== "checked_in" && styles.disabledOutlineButton,
            ]}
            onPress={handleCheckOut}
            disabled={attendanceStatus !== "checked_in"}
          >
            <Clock3
              size={22}
              color={attendanceStatus === "checked_in" ? "#76F7B0" : "#788293"}
            />

            <Text
              style={[
                styles.checkOutText,
                attendanceStatus !== "checked_in" && styles.disabledText,
              ]}
            >
              Check Out
            </Text>
          </TouchableOpacity>
        </View>

        {/* Attendance Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusHeading}>Today's Attendance</Text>
            <CheckCircle2 size={20} color="#76F7B0" />
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={styles.statusValue}>{statusText}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Check-in</Text>
            <Text style={styles.statusValue}>{checkInTime || "--:--"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Check-out</Text>
            <Text style={styles.statusValue}>{checkOutTime || "--:--"}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Attendance actions are currently a UI demonstration.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#10141D",
  },
  container: {
    padding: 22,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
    marginTop: 12,
  },
  eyebrow: {
    color: "#76F7B0",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "800",
  },
  shield: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#202A30",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeCard: {
    backgroundColor: "#1B222E",
    borderRadius: 25,
    padding: 22,
    borderWidth: 1,
    borderColor: "#2D3746",
  },
  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  welcomeSubtitle: {
    color: "#AAB4C3",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  cameraPlaceholder: {
    minHeight: 245,
    backgroundColor: "#131A24",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#35433F",
    borderStyle: "dashed",
    marginTop: 25,
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  faceCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#24372F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  cameraTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  cameraSubtitle: {
    color: "#8F9AAA",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 15,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: "#8995A6",
    fontSize: 12,
    marginTop: 5,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    minHeight: 58,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  checkInButton: {
    backgroundColor: "#76F7B0",
  },
  checkInText: {
    color: "#10141D",
    fontSize: 16,
    fontWeight: "800",
  },
  checkOutButton: {
    borderWidth: 1,
    borderColor: "#76F7B0",
    backgroundColor: "#192820",
  },
  checkOutText: {
    color: "#76F7B0",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    backgroundColor: "#424A53",
  },
  disabledOutlineButton: {
    borderColor: "#39414C",
    backgroundColor: "#1A202A",
  },
  disabledText: {
    color: "#788293",
  },
  statusCard: {
    backgroundColor: "#1B222E",
    borderRadius: 20,
    padding: 20,
    marginTop: 25,
    borderWidth: 1,
    borderColor: "#2D3746",
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statusHeading: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    gap: 10,
  },
  statusLabel: {
    color: "#9BA6B6",
    fontSize: 13,
  },
  statusValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#303947",
  },
  footer: {
    color: "#687486",
    fontSize: 11,
    textAlign: "center",
    marginTop: 22,
  },
});
