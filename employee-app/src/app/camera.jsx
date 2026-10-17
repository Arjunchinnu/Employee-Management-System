import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, router, Stack } from "expo-router";
import {
  ScanFace,
  ArrowLeft,
  Camera,
  ShieldCheck,
  RotateCcw,
} from "lucide-react-native";

// Fixed frame size that fits comfortably inside the camera box
const FRAME_WIDTH = 190;
const FRAME_HEIGHT = 230;
const SCAN_TRAVEL = FRAME_HEIGHT - 30;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { action } = useLocalSearchParams();

  const [cameraReady, setCameraReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const scanLinePosition = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const isCheckIn = action === "check-in";

  const startScanAnimation = () => {
    scanLinePosition.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLinePosition, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLinePosition, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    if (cameraReady) startScanAnimation();
    return () => scanLinePosition.stopAnimation();
  }, [cameraReady]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.04,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handleScan = () => {
    if (!cameraReady || scanning || cameraError) return;

    setScanning(true);

    // UI demonstration only.
    // Real AI face recognition and attendance APIs will be connected separately.
    setTimeout(() => {
      setScanning(false);
      router.replace({
        pathname: "/",
        params: {
          message:
            "Camera test completed. AI face recognition is not connected yet.",
          action: isCheckIn ? "check-in" : "check-out",
        },
      });
    }, 2500);
  };

  const handleCameraReady = () => {
    setCameraReady(true);
    setCameraError(false);
  };

  // Hide the native stack header ("index / camera") for this screen
  const hideHeader = <Stack.Screen options={{ headerShown: false }} />;

  if (!permission) {
    return (
      <>
        {hideHeader}
        <View style={styles.permissionLoading}>
          <ActivityIndicator size="large" color="#70F5B2" />
          <Text style={styles.loadingText}>Preparing your camera...</Text>
        </View>
      </>
    );
  }

  if (!permission.granted) {
    return (
      <>
        {hideHeader}
        <SafeAreaView style={styles.safe}>
          <View style={styles.permissionContainer}>
            <View style={styles.permissionIcon}>
              <Camera size={42} color="#70F5B2" />
            </View>

            <Text style={styles.permissionTitle}>Camera Access Required</Text>

            <Text style={styles.permissionDescription}>
              Allow camera access to continue to the employee face-scanning
              screen.
            </Text>

            <TouchableOpacity
              style={styles.allowButton}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.allowButtonText}>Allow Camera Access</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      {hideHeader}
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#080D14" />

        <View style={styles.content}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButtonIcon}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={23} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Face Verification</Text>
              <Text style={styles.headerSubtitle}>EMPLOYEE ATTENDANCE</Text>
            </View>

            <View style={styles.secureBadge}>
              <ShieldCheck size={19} color="#70F5B2" />
            </View>
          </View>

          {/* INSTRUCTIONS */}
          <View style={styles.introSection}>
            <View style={styles.actionBadge}>
              <View style={styles.actionDot} />
              <Text style={styles.actionBadgeText}>
                {isCheckIn ? "CHECK-IN MODE" : "CHECK-OUT MODE"}
              </Text>
            </View>

            <Text style={styles.mainTitle}>Look into the camera</Text>

            <Text style={styles.description}>
              Position your face inside the frame and look straight ahead.
            </Text>
          </View>

          {/* CAMERA PREVIEW — flex: 1 so it fills the remaining space */}
          <View style={styles.cameraContainer}>
            {!cameraError ? (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="front"
                onCameraReady={handleCameraReady}
                onMountError={() => {
                  setCameraError(true);
                  setCameraReady(false);
                }}
              />
            ) : (
              <View style={styles.cameraErrorContainer}>
                <Camera size={45} color="#70F5B2" />
                <Text style={styles.cameraErrorTitle}>Camera unavailable</Text>
                <Text style={styles.cameraErrorText}>
                  Check camera permissions and try again.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setCameraError(false);
                    setCameraReady(false);
                  }}
                >
                  <RotateCcw size={17} color="#08110D" />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* CAMERA OVERLAY */}
            {!cameraError && (
              <View pointerEvents="none" style={styles.cameraOverlay}>
                {/* Top status label — absolutely positioned so it never overlaps the frame */}
                <View style={styles.cameraTopLabel}>
                  <View style={styles.liveDot} />
                  <Text style={styles.cameraTopLabelText}>
                    {cameraReady ? "CAMERA ACTIVE" : "STARTING CAMERA"}
                  </Text>
                </View>

                {/* Face frame — centered in the remaining space */}
                <Animated.View
                  style={[
                    styles.faceFrame,
                    { transform: [{ scale: pulseAnimation }] },
                  ]}
                >
                  <View style={[styles.frameCorner, styles.topLeft]} />
                  <View style={[styles.frameCorner, styles.topRight]} />
                  <View style={[styles.frameCorner, styles.bottomLeft]} />
                  <View style={[styles.frameCorner, styles.bottomRight]} />

                  <View style={styles.faceGuide}>
                    <ScanFace size={90} color="#70F5B2" strokeWidth={1.1} />
                  </View>

                  {cameraReady && (
                    <Animated.View
                      style={[
                        styles.scanLine,
                        {
                          opacity: scanning ? 1 : 0.8,
                          transform: [
                            {
                              translateY: scanLinePosition.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, SCAN_TRAVEL],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  )}
                </Animated.View>

                {/* Bottom label — absolutely positioned at the bottom */}
                <View style={styles.cameraBottomLabel}>
                  <Text style={styles.cameraBottomText}>
                    {scanning ? "PROCESSING TEST SCAN..." : "ALIGN YOUR FACE"}
                  </Text>
                </View>
              </View>
            )}

            {/* Loading overlay */}
            {!cameraReady && !cameraError && (
              <View pointerEvents="none" style={styles.cameraLoadingOverlay}>
                <ActivityIndicator size="large" color="#70F5B2" />
                <Text style={styles.cameraLoadingText}>
                  Initializing camera...
                </Text>
              </View>
            )}
          </View>

          {/* STATUS */}
          <View style={styles.statusCard}>
            <View style={styles.statusIconContainer}>
              <ScanFace size={24} color="#70F5B2" />
            </View>

            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                {cameraError
                  ? "Camera needs attention"
                  : scanning
                  ? "Processing scan"
                  : cameraReady
                  ? "Ready to scan"
                  : "Connecting to camera"}
              </Text>

              <Text style={styles.statusDescription}>
                {cameraError
                  ? "Please retry or check your device settings."
                  : scanning
                  ? "This is a camera test, not AI recognition."
                  : cameraReady
                  ? "Keep your face centered in the frame."
                  : "Please wait while the camera starts."}
              </Text>
            </View>

            <View
              style={[
                styles.statusIndicator,
                cameraError && styles.errorIndicator,
              ]}
            />
          </View>

          {/* SCAN BUTTON */}
          <TouchableOpacity
            style={[
              styles.scanButton,
              (!cameraReady || scanning || cameraError) &&
                styles.disabledButton,
            ]}
            onPress={handleScan}
            disabled={!cameraReady || scanning || cameraError}
            activeOpacity={0.85}
          >
            {scanning ? (
              <ActivityIndicator size="small" color="#08110D" />
            ) : (
              <Camera size={22} color="#08110D" strokeWidth={2.5} />
            )}
            <Text style={styles.scanButtonText}>
              {scanning ? "Processing..." : "Scan My Face"}
            </Text>
          </TouchableOpacity>

          {/* FOOTER */}
          <View style={styles.footer}>
            <ShieldCheck size={15} color="#82909F" />
            <Text style={styles.footerText}>
              Secure employee attendance interface
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#080D14",
  },

  // Padding lives on an inner View, which is more reliable than on SafeAreaView
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  permissionLoading: {
    flex: 1,
    backgroundColor: "#080D14",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#FFFFFF",
    marginTop: 16,
    fontSize: 14,
  },

  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  permissionIcon: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: "#14251F",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },

  permissionTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
    textAlign: "center",
  },

  permissionDescription: {
    color: "#99A6B5",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 15,
    marginBottom: 30,
  },

  allowButton: {
    width: "100%",
    backgroundColor: "#70F5B2",
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
  },

  allowButtonText: {
    color: "#08110D",
    fontSize: 16,
    fontWeight: "800",
  },

  backButton: {
    padding: 18,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 22,
  },

  backButtonIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#151D28",
    borderWidth: 1,
    borderColor: "#26313E",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 14,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#718094",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 5,
  },

  secureBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#14251F",
    justifyContent: "center",
    alignItems: "center",
  },

  introSection: {
    alignItems: "center",
    marginBottom: 22,
  },

  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#14251F",
    marginBottom: 13,
  },

  actionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#70F5B2",
    marginRight: 8,
  },

  actionBadgeText: {
    color: "#70F5B2",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
  },

  mainTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  description: {
    color: "#98A4B4",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
    maxWidth: 300,
  },

  // flex: 1 lets the camera fill whatever space remains above the status card
  cameraContainer: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#151D28",
    borderWidth: 1,
    borderColor: "#26313E",
    marginBottom: 18,
  },

  // Overlay uses absolute fill and centers the frame; labels are pinned top/bottom
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(4, 9, 15, 0.12)",
  },

  cameraTopLabel: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(8, 13, 20, 0.78)",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
    zIndex: 4,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#70F5B2",
    marginRight: 8,
  },

  cameraTopLabelText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  faceFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },

  faceGuide: {
    width: FRAME_WIDTH - 40,
    height: FRAME_HEIGHT - 30,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: "rgba(112, 245, 178, 0.45)",
    backgroundColor: "rgba(8, 13, 20, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  frameCorner: {
    position: "absolute",
    width: 36,
    height: 36,
    borderColor: "#70F5B2",
    zIndex: 2,
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 17,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 17,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 17,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 17,
  },

  scanLine: {
    position: "absolute",
    top: 15,
    left: 13,
    right: 13,
    height: 2,
    backgroundColor: "#70F5B2",
    shadowColor: "#70F5B2",
    shadowOpacity: 0.9,
    shadowRadius: 9,
    elevation: 5,
    zIndex: 3,
  },

  cameraBottomLabel: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    backgroundColor: "rgba(8, 13, 20, 0.78)",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 9,
    zIndex: 4,
  },

  cameraBottomText: {
    color: "#70F5B2",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 13, 20, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },

  cameraLoadingText: {
    color: "#FFFFFF",
    fontSize: 13,
    marginTop: 15,
  },

  cameraErrorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  cameraErrorTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 18,
  },

  cameraErrorText: {
    color: "#99A6B5",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 10,
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#70F5B2",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
    marginTop: 20,
  },

  retryButtonText: {
    color: "#08110D",
    fontWeight: "800",
  },

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111923",
    borderWidth: 1,
    borderColor: "#222D3B",
    borderRadius: 19,
    padding: 14,
    marginBottom: 16,
  },

  statusIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#14251F",
    justifyContent: "center",
    alignItems: "center",
  },

  statusTextContainer: {
    flex: 1,
    marginLeft: 13,
  },

  statusTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  statusDescription: {
    color: "#8491A2",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  statusIndicator: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#70F5B2",
    marginLeft: 8,
  },

  errorIndicator: {
    backgroundColor: "#FF7777",
  },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 58,
    borderRadius: 17,
    backgroundColor: "#70F5B2",
    marginBottom: 14,
  },

  scanButtonText: {
    color: "#08110D",
    fontSize: 16,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.5,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginBottom: 12,
  },

  footerText: {
    color: "#82909F",
    fontSize: 11,
  },
});
