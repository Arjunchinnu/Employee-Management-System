import React, { useState, useEffect, useRef } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, router, Stack } from "expo-router";

import { ScanFace, ArrowLeft, Camera, ShieldCheck } from "lucide-react-native";

// Use your laptop's current IPv4 address.
const API_BASE_URL = "http://172.20.10.3:5000";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { action } = useLocalSearchParams();

  const cameraRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const scanAnimation = useRef(new Animated.Value(0)).current;

  const isCheckIn = action === "check-in";

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [scanAnimation]);

  // Upload the captured photo using XMLHttpRequest.
  const uploadFacePhoto = (photoUri, endpoint) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", `${API_BASE_URL}${endpoint}`);
      xhr.timeout = 60000;

      xhr.onload = () => {
        let data;

        try {
          data = JSON.parse(xhr.responseText || "{}");
        } catch {
          reject(
            new Error(
              `The server returned an invalid response (HTTP ${xhr.status}).`,
            ),
          );
          return;
        }

        // if (xhr.status < 200 || xhr.status >= 300) {
        //   reject(
        //     new Error(
        //       data.message || `Request failed with status ${xhr.status}.`,
        //     ),
        //   );
        //   return;
        // }

        if (xhr.status < 200 || xhr.status >= 300) {
          console.log("HTTP STATUS:", xhr.status);
          console.log("BACKEND RESPONSE:", xhr.responseText);

          reject(
            new Error(
              data.message || `Request failed with status ${xhr.status}.`,
            ),
          );
          return;
        }

        resolve(data);
      };

      xhr.onerror = () => {
        reject(
          new Error(
            `Cannot connect to ${API_BASE_URL}. Check your Wi-Fi and backend.`,
          ),
        );
      };

      xhr.ontimeout = () => {
        reject(new Error("The attendance request timed out."));
      };

      xhr.onabort = () => {
        reject(new Error("The attendance request was cancelled."));
      };

      const formData = new FormData();

      // React Native's native file-upload object.
      formData.append("face", {
        uri: photoUri,
        name: "attendance.jpg",
        type: "image/jpeg",
      });

      // Do not manually set Content-Type.
      // XMLHttpRequest must generate the multipart boundary.
      xhr.send(formData);
    });
  };

  const handleScan = async () => {
    if (!cameraReady || scanning || cameraError) {
      return;
    }

    if (!cameraRef.current) {
      Alert.alert("Camera Error", "The camera is not ready.");
      return;
    }

    setScanning(true);

    try {
      // 1. Capture the photo.
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      if (!photo?.uri) {
        throw new Error("Could not capture the face image.");
      }

      // 2. Select the correct backend endpoint.
      const endpoint = isCheckIn
        ? "/api/face-attendance/check-in"
        : "/api/face-attendance/check-out";

      // 3. Upload the photo.
      const data = await uploadFacePhoto(photo.uri, endpoint);

      if (!data.success) {
        throw new Error(data.message || "Face verification failed.");
      }

      // 4. Return to the home screen.
      router.replace({
        pathname: "/",
        params: {
          message: data.message || "Attendance recorded successfully.",
          action: isCheckIn ? "check-in" : "check-out",
          success: "true",
          checkIn: data.attendance?.checkIn || "",
          checkOut: data.attendance?.checkOut || "",
          workingMinutes: String(data.attendance?.workingMinutes ?? 0),
        },
      });
    } catch (error) {
      console.error("Face attendance error:", error);

      Alert.alert(
        "Attendance Failed",
        error.message || "Unable to complete attendance. Please try again.",
      );
    } finally {
      setScanning(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.permissionText}>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar barStyle="dark-content" />

        <Camera size={56} color="#2563eb" />

        <Text style={styles.permissionTitle}>Camera Permission Required</Text>

        <Text style={styles.permissionText}>
          Allow camera access so your face can be verified for attendance.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>Allow Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => router.back()}
          disabled={scanning}
        >
          <ArrowLeft size={23} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            {isCheckIn ? "Check In" : "Check Out"}
          </Text>

          <Text style={styles.headerSubtitle}>Face verification</Text>
        </View>

        <View style={styles.headerIcon}>
          <ShieldCheck size={24} color="#2563eb" />
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionTitle}>Verify your identity</Text>

        <Text style={styles.instructionText}>
          Position your face inside the frame and look directly at the camera.
        </Text>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="front"
          mode="picture"
          onCameraReady={() => {
            setCameraReady(true);
            setCameraError(false);
          }}
          onMountError={(event) => {
            console.error("Camera mount error:", event);
            setCameraError(true);
          }}
        />

        {/* Face frame */}
        <View style={styles.overlay}>
          <View style={styles.faceFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {!cameraError && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-100, 100],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </View>

          <View style={styles.cameraStatus}>
            <ScanFace size={17} color="#ffffff" />

            <Text style={styles.cameraStatusText}>
              {cameraError
                ? "Camera unavailable"
                : scanning
                  ? "Verifying face..."
                  : cameraReady
                    ? "Position your face in the frame"
                    : "Starting camera..."}
            </Text>
          </View>
        </View>

        {(!cameraReady || scanning || cameraError) && (
          <View style={styles.cameraLoadingOverlay}>
            {(!cameraReady || scanning) && (
              <ActivityIndicator size="large" color="#ffffff" />
            )}

            {cameraError && (
              <Text style={styles.cameraErrorText}>
                Unable to start the camera. Please go back and try again.
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Guidance */}
      <View style={styles.guidance}>
        <ShieldCheck size={20} color="#16a34a" />

        <Text style={styles.guidanceText}>
          Your face will be checked against the registered employee record.
        </Text>
      </View>

      {/* Action button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!cameraReady || scanning || cameraError) && styles.disabledButton,
          ]}
          onPress={handleScan}
          disabled={!cameraReady || scanning || cameraError}
        >
          {scanning ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ScanFace size={21} color="#ffffff" />
          )}

          <Text style={styles.primaryButtonText}>
            {scanning
              ? "Verifying Face..."
              : isCheckIn
                ? "Verify & Check In"
                : "Verify & Check Out"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Keep your face visible and ensure good lighting.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 24,
  },

  permissionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111827",
    marginTop: 22,
    marginBottom: 10,
    textAlign: "center",
  },

  permissionText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  backIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 14,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 3,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },

  instructionContainer: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 18,
  },

  instructionTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: "#111827",
  },

  instructionText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 21,
    marginTop: 7,
  },

  cameraContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#111827",
    minHeight: 280,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },

  faceFrame: {
    width: 230,
    height: 290,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  corner: {
    position: "absolute",
    width: 36,
    height: 36,
    borderColor: "#60a5fa",
    borderWidth: 4,
  },

  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 18,
  },

  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 18,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 18,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 18,
  },

  scanLine: {
    position: "absolute",
    width: "85%",
    height: 2,
    backgroundColor: "#60a5fa",
    shadowColor: "#60a5fa",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
  },

  cameraStatus: {
    position: "absolute",
    bottom: 22,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.7)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 8,
  },

  cameraStatusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },

  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17,24,39,0.25)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  cameraErrorText: {
    color: "#ffffff",
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
  },

  guidance: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 20,
    gap: 10,
  },

  guidanceText: {
    flex: 1,
    color: "#4b5563",
    fontSize: 12,
    lineHeight: 18,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },

  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 18,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.55,
  },

  backButton: {
    padding: 12,
  },

  backButtonText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },

  footerNote: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 13,
  },
});
