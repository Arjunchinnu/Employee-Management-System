
import React, { useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';

import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';

import api from './services/api';

export default function App() {
  const [screen, setScreen] = useState('login');

  // Admin login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Employee details
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [joiningDate, setJoiningDate] = useState('');

  // Camera
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  const scanAnimation = useRef(new Animated.Value(0)).current;

  // Animated scanning line
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
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [scanAnimation]);

  // ---------------- ADMIN LOGIN ----------------

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing Information',
        'Enter your admin email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/auth/admin/login', {
        email: email.trim(),
        password,
      });

      const token = response.data.token;
      const admin = response.data.admin;

      if (!token) {
        Alert.alert(
          'Login Error',
          'The server did not return an admin token.'
        );
        return;
      }

      await SecureStore.setItemAsync('adminToken', token);

      if (admin?.role) {
        await SecureStore.setItemAsync('adminRole', admin.role);
      }

      setScreen('employeeForm');
    } catch (error) {
      console.log(
        'Admin login error:',
        error.response?.data || error.message
      );

      Alert.alert(
        'Login Failed',
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Unable to log in. Check your credentials and backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RESET EMPLOYEE FORM ----------------

  const resetEmployeeForm = () => {
    setEmployeeId('');
    setName('');
    setEmployeeEmail('');
    setEmployeePassword('');
    setPhone('');
    setDepartment('');
    setDesignation('');
    setJoiningDate('');

    setCurrentEmployee(null);
    setCameraReady(false);
  };

  // ---------------- REGISTER EMPLOYEE ----------------

  const handleRegisterFace = async () => {
    if (
      !employeeId.trim() ||
      !name.trim() ||
      !employeeEmail.trim() ||
      !employeePassword ||
      !department.trim() ||
      !designation.trim()
    ) {
      Alert.alert(
        'Missing Information',
        'Employee ID, name, email, password, department and designation are required.'
      );
      return;
    }

    if (employeePassword.length < 8) {
      Alert.alert(
        'Invalid Password',
        'Employee password must contain at least 8 characters.'
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/admin/employees', {
        employeeId: employeeId.trim(),
        name: name.trim(),
        email: employeeEmail.trim(),
        password: employeePassword,
        phone: phone.trim(),
        department: department.trim(),
        designation: designation.trim(),
        ...(joiningDate.trim()
          ? { joiningDate: joiningDate.trim() }
          : {}),
      });

      if (!response.data?.success || !response.data?.employee?.id) {
        throw new Error(
          response.data?.message ||
            'Employee was not created successfully.'
        );
      }

      setCurrentEmployee(response.data.employee);
      setCameraReady(false);
      setScreen('camera');
    } catch (error) {
      console.log(
        'Employee creation error:',
        error.response?.data || error.message
      );

      Alert.alert(
        'Employee Registration Failed',
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Unable to create employee.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CAPTURE AND REGISTER FACE ----------------

  const captureFace = async () => {
    if (!cameraReady || !cameraRef.current || loading) {
      Alert.alert(
        'Camera Not Ready',
        'Wait until the camera has started.'
      );
      return;
    }

    if (!currentEmployee?.id) {
      Alert.alert(
        'Employee Not Found',
        'Please register the employee details again.'
      );
      return;
    }

    try {
      setLoading(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo?.uri) {
        throw new Error('The camera did not return an image.');
      }

      const formData = new FormData();

      formData.append('face', {
        uri: photo.uri,
        name: 'employee-face.jpg',
        type: 'image/jpeg',
      });

      // Existing backend endpoint:
      // POST /api/admin/employees/:id/register-face
      const response = await api.post(
        `/admin/employees/${currentEmployee.id}/register-face`,
        formData,
        {
          timeout: 60000,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            'Face registration was unsuccessful.'
        );
      }

      setScreen('success');
    } catch (error) {
      console.log(
        'Face registration error:',
        error.response?.data || error.message
      );

      Alert.alert(
        'Face Registration Failed',
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Unable to register this face. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------- REUSABLE INPUT ----------------

  const renderInput = (
    label,
    value,
    onChangeText,
    placeholder,
    options = {}
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        editable={!loading}
        autoCapitalize={options.autoCapitalize || 'words'}
        keyboardType={options.keyboardType || 'default'}
        secureTextEntry={options.secureTextEntry || false}
        autoCorrect={false}
      />
    </View>
  );

  // ==================================================
  // LOGIN SCREEN
  // ==================================================

  if (screen === 'login') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F4F7FB"
        />

        <ScrollView
          contentContainerStyle={styles.loginContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>E</Text>
          </View>

          <Text style={styles.appName}>Employee Management</Text>

          <Text style={styles.subtitle}>ADMIN PORTAL</Text>

          <View style={styles.card}>
            <Text style={styles.heading}>Welcome Back</Text>

            <Text style={styles.description}>
              Sign in to register employees and their faces.
            </Text>

            {renderInput(
              'Admin Email',
              email,
              setEmail,
              'Enter your admin email',
              {
                autoCapitalize: 'none',
                keyboardType: 'email-address',
              }
            )}

            <Text style={styles.label}>Password</Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />

              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showPassword}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Sign In
                </Text>
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

  // ==================================================
  // EMPLOYEE REGISTRATION SCREEN
  // ==================================================

  if (screen === 'employeeForm') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F4F7FB"
        />

        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.stepText}>STEP 1 OF 2</Text>

          <Text style={styles.heading}>Register Employee</Text>

          <Text style={styles.description}>
            Enter employee details before registering their face.
          </Text>

          <View style={styles.card}>
            {renderInput(
              'Employee ID *',
              employeeId,
              setEmployeeId,
              'e.g. EMP001',
              { autoCapitalize: 'characters' }
            )}

            {renderInput(
              'Full Name *',
              name,
              setName,
              'Enter full name'
            )}

            {renderInput(
              'Employee Email *',
              employeeEmail,
              setEmployeeEmail,
              'Enter employee email',
              {
                autoCapitalize: 'none',
                keyboardType: 'email-address',
              }
            )}

            {renderInput(
              'Employee Password *',
              employeePassword,
              setEmployeePassword,
              'Minimum 8 characters',
              {
                autoCapitalize: 'none',
                secureTextEntry: true,
              }
            )}

            {renderInput(
              'Phone',
              phone,
              setPhone,
              'Enter phone number',
              { keyboardType: 'phone-pad' }
            )}

            {renderInput(
              'Department *',
              department,
              setDepartment,
              'e.g. Engineering'
            )}

            {renderInput(
              'Designation *',
              designation,
              setDesignation,
              'e.g. Software Developer'
            )}

            {renderInput(
              'Joining Date',
              joiningDate,
              setJoiningDate,
              'YYYY-MM-DD',
              { autoCapitalize: 'none' }
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleRegisterFace}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Continue to Face Registration
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.helperText}>
              The employee record will be saved first. Next, the
              camera will open to register their face.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ==================================================
  // FACE REGISTRATION CAMERA SCREEN
  // ==================================================

  if (screen === 'camera') {
    if (!permission) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />

          <Text style={styles.description}>
            Checking camera permission...
          </Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionScreen}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#FFFFFF"
          />

          <View style={styles.permissionIcon}>
            <Text style={styles.permissionCameraEmoji}>📷</Text>
          </View>

          <Text style={styles.permissionTitle}>
            Camera Permission Required
          </Text>

          <Text style={styles.permissionDescription}>
            Allow camera access to register the face of{' '}
            {currentEmployee?.name}.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={requestPermission}
          >
            <Text style={styles.primaryButtonText}>
              Allow Camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setScreen('employeeForm')}
          >
            <Text style={styles.secondaryButtonText}>
              Back to Employee Form
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const scanLineTranslate = scanAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-105, 105],
    });

    return (
      <View style={styles.faceScreen}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />

        {/* Header */}
        <View style={styles.faceHeader}>
          <TouchableOpacity
            style={styles.faceBackButton}
            onPress={() => {
              if (!loading) {
                setCameraReady(false);
                setScreen('employeeForm');
              }
            }}
            disabled={loading}
          >
            <Text style={styles.faceBackArrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.faceHeaderText}>
            <Text style={styles.faceHeaderTitle}>
              Face Registration
            </Text>

            <Text style={styles.faceHeaderSubtitle}>
              Employee identity enrollment
            </Text>
          </View>

          <View style={styles.faceSecureBadge}>
            <Text style={styles.faceSecureIcon}>✓</Text>
          </View>
        </View>

        {/* Employee information */}
        <View style={styles.faceEmployeeCard}>
          <View style={styles.faceEmployeeAvatar}>
            <Text style={styles.faceEmployeeInitial}>
              {currentEmployee?.name?.charAt(0)?.toUpperCase() || 'E'}
            </Text>
          </View>

          <View style={styles.faceEmployeeInfo}>
            <Text style={styles.faceEmployeeName}>
              {currentEmployee?.name}
            </Text>

            <Text style={styles.faceEmployeeId}>
              ID: {currentEmployee?.employeeId}
            </Text>
          </View>

          <View style={styles.faceStepBadge}>
            <Text style={styles.faceStepText}>STEP 2/2</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.faceInstructions}>
          <Text style={styles.faceMainTitle}>
            Position the face
          </Text>

          <Text style={styles.faceMainDescription}>
            Ask the employee to look directly at the camera.
            Keep their face centered and ensure good lighting.
          </Text>
        </View>

        {/* Camera preview */}
        <View style={styles.faceCameraOuter}>
          <View style={styles.faceCameraContainer}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="front"
              mode="picture"
              onCameraReady={() => setCameraReady(true)}
              onMountError={(event) => {
                console.log('Camera mount error:', event);
                setCameraReady(false);

                Alert.alert(
                  'Camera Error',
                  'Unable to start the camera. Please try again.'
                );
              }}
            />

            {/* Face frame and animated scanning line */}
            <View
              pointerEvents="none"
              style={styles.faceCameraOverlay}
            >
              <View style={styles.faceOval}>
                <View
                  style={[
                    styles.faceCorner,
                    styles.faceCornerTopLeft,
                  ]}
                />

                <View
                  style={[
                    styles.faceCorner,
                    styles.faceCornerTopRight,
                  ]}
                />

                <View
                  style={[
                    styles.faceCorner,
                    styles.faceCornerBottomLeft,
                  ]}
                />

                <View
                  style={[
                    styles.faceCorner,
                    styles.faceCornerBottomRight,
                  ]}
                />

                {cameraReady && !loading && (
                  <Animated.View
                    style={[
                      styles.faceScanLine,
                      {
                        transform: [
                          { translateY: scanLineTranslate },
                        ],
                      },
                    ]}
                  />
                )}
              </View>

              <View style={styles.faceCameraStatus}>
                <View
                  style={[
                    styles.faceStatusDot,
                    !cameraReady && styles.faceStatusDotInactive,
                  ]}
                />

                <Text style={styles.faceCameraStatusText}>
                  {loading
                    ? 'Registering face...'
                    : cameraReady
                      ? 'Align your face within the frame'
                      : 'Starting camera...'}
                </Text>
              </View>
            </View>

            {/* Loading overlay */}
            {(!cameraReady || loading) && (
              <View style={styles.faceCameraLoading}>
                <ActivityIndicator
                  size="large"
                  color="#FFFFFF"
                />

                <Text style={styles.faceLoadingText}>
                  {loading
                    ? 'Uploading face for registration...'
                    : 'Preparing camera...'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Guidance */}
        <View style={styles.faceGuidance}>
          <View style={styles.faceGuidanceIcon}>
            <Text style={styles.faceGuidanceCheck}>✓</Text>
          </View>

          <View style={styles.faceGuidanceContent}>
            <Text style={styles.faceGuidanceTitle}>
              Before scanning
            </Text>

            <Text style={styles.faceGuidanceDescription}>
              Remove anything covering the face and avoid
              strong backlighting.
            </Text>
          </View>
        </View>

        {/* Scan button */}
        <View style={styles.faceFooter}>
          <TouchableOpacity
            style={[
              styles.faceScanButton,
              (!cameraReady || loading) && styles.disabledButton,
            ]}
            onPress={captureFace}
            disabled={!cameraReady || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.faceScanButtonIcon}>◎</Text>
            )}

            <Text style={styles.primaryButtonText}>
              {loading
                ? 'Registering Face...'
                : 'Scan & Register Face'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.faceFooterNote}>
            The captured image will be sent to the face
            registration service.
          </Text>
        </View>
      </View>
    );
  }

  // ==================================================
  // SUCCESS SCREEN
  // ==================================================

  if (screen === 'success') {
    return (
      <View style={styles.successScreen}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F4F7FB"
        />

        <View style={styles.successIcon}>
          <Text style={styles.successCheck}>✓</Text>
        </View>

        <Text style={styles.successTitle}>
          Registration Successful!
        </Text>

        <Text style={styles.successDescription}>
          The employee and face registration were saved successfully.
        </Text>

        <View style={styles.card}>
          <Text style={styles.detailLabel}>Employee Name</Text>

          <Text style={styles.detailValue}>
            {currentEmployee?.name}
          </Text>

          <Text style={styles.detailLabel}>Employee ID</Text>

          <Text style={styles.detailValue}>
            {currentEmployee?.employeeId}
          </Text>

          <Text style={styles.detailLabel}>Face Registration</Text>

          <Text style={styles.registeredText}>Registered</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            resetEmployeeForm();
            setScreen('employeeForm');
          }}
        >
          <Text style={styles.primaryButtonText}>
            Register Another Employee
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  loginContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 35,
  },

  formContent: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 35,
  },

  logo: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },

  appName: {
    color: '#172554',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  subtitle: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginTop: 7,
    marginBottom: 30,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 20,
    marginTop: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  heading: {
    color: '#111827',
    fontSize: 26,
    fontWeight: 'bold',
  },

  description: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },

  stepText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  field: {
    marginBottom: 17,
  },

  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    height: 51,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 11,
    paddingHorizontal: 13,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },

  passwordContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    color: '#111827',
    fontSize: 15,
  },

  showPassword: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '600',
    paddingLeft: 10,
  },

  primaryButton: {
    minHeight: 53,
    backgroundColor: '#2563EB',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginTop: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  secondaryButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 8,
  },

  secondaryButtonText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },

  helperText: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 15,
  },

  footer: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 28,
  },

  centered: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },

  // Camera permission
  permissionScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  permissionCameraEmoji: {
    fontSize: 34,
  },

  permissionTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 24,
  },

  permissionDescription: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },

  // Face registration screen
  faceScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  faceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 58 : 25,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  faceBackButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  faceBackArrow: {
    fontSize: 34,
    lineHeight: 38,
    color: '#111827',
    marginTop: -4,
  },

  faceHeaderText: {
    flex: 1,
    marginLeft: 13,
  },

  faceHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  faceHeaderSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  faceSecureBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  faceSecureIcon: {
    color: '#2563EB',
    fontSize: 23,
    fontWeight: 'bold',
  },

  faceEmployeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  faceEmployeeAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  faceEmployeeInitial: {
    color: '#2563EB',
    fontSize: 21,
    fontWeight: 'bold',
  },

  faceEmployeeInfo: {
    flex: 1,
    marginLeft: 12,
  },

  faceEmployeeName: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },

  faceEmployeeId: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 5,
  },

  faceStepBadge: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
  },

  faceStepText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '700',
  },

  faceInstructions: {
    paddingHorizontal: 22,
    paddingTop: 19,
    paddingBottom: 14,
  },

  faceMainTitle: {
    color: '#111827',
    fontSize: 23,
    fontWeight: '700',
  },

  faceMainDescription: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  faceCameraOuter: {
    flex: 1,
    minHeight: 220,
    maxHeight: 440,
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  faceCameraContainer: {
    flex: 1,
    borderRadius: 21,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },

  faceCameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  faceOval: {
    width: 218,
    height: 275,
    maxHeight: '78%',
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  faceCorner: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderColor: '#60A5FA',
    borderWidth: 4,
  },

  faceCornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 15,
  },

  faceCornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 15,
  },

  faceCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 15,
  },

  faceCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 15,
  },

  faceScanLine: {
    position: 'absolute',
    width: '85%',
    height: 2,
    backgroundColor: '#60A5FA',
    shadowColor: '#60A5FA',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
  },

  faceCameraStatus: {
    position: 'absolute',
    bottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17,24,39,0.78)',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 22,
  },

  faceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 8,
  },

  faceStatusDotInactive: {
    backgroundColor: '#FBBF24',
  },

  faceCameraStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  faceCameraLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  faceLoadingText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 15,
  },

  faceGuidance: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 22,
    marginTop: 14,
  },

  faceGuidanceIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  faceGuidanceCheck: {
    color: '#15803D',
    fontSize: 18,
    fontWeight: 'bold',
  },

  faceGuidanceContent: {
    flex: 1,
    marginLeft: 10,
  },

  faceGuidanceTitle: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },

  faceGuidanceDescription: {
    color: '#6B7280',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  faceFooter: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 25 : 16,
  },

  faceScanButton: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 10,
  },

  faceScanButtonIcon: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '400',
  },

  faceFooterNote: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 10,
  },

  // Success screen
  successScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F4F7FB',
  },

  successIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 22,
  },

  successCheck: {
    color: '#15803D',
    fontSize: 48,
    fontWeight: 'bold',
  },

  successTitle: {
    color: '#166534',
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  successDescription: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },

  detailLabel: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 10,
  },

  detailValue: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },

  registeredText: {
    color: '#15803D',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

