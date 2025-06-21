import React, { useState } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, Alert, useColorScheme, KeyboardAvoidingView, ScrollView, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient'; // ตรวจสอบว่า path ถูกต้อง
import Icon from 'react-native-vector-icons/FontAwesome';

// ตรวจสอบว่าคุณมีไฟล์ logo.png ใน path ที่ถูกต้อง
const logo = require('../assets/img.png'); // ตรวจสอบว่า path ถูกต้อง

const LoginScreen = () => {
  const navigation = useNavigation();
  const isDarkMode = useColorScheme() === 'dark';
  const styles = getStyles(isDarkMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (signInError) {
      setError(signInError.message);
    }
    setLoading(false);
  };

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    setError('');
    
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        // [สำคัญ] แก้ไข redirectTo ให้ตรงกับ URL Scheme ที่ตั้งค่าไว้
        redirectTo: 'com.projectsecret://login-callback', 
      },
    });

    if (oauthError) {
      Alert.alert('OAuth Error', oauthError.message);
      setError(oauthError.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          <View style={styles.card}>
            <Image source={logo} style={styles.logo} />
            <Text style={styles.title}>เข้าสู่ระบบ</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputWrapper}>
              <Icon name="user" size={20} color={isDarkMode ? "#999" : "#666"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="อีเมล"
                placeholderTextColor={isDarkMode ? '#999' : '#888'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Icon name="lock" size={20} color={isDarkMode ? "#999" : "#666"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="รหัสผ่าน"
                placeholderTextColor={isDarkMode ? '#999' : '#888'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Icon name={showPassword ? 'eye-slash' : 'eye'} size={20} color={isDarkMode ? "#999" : "#666"} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleLogin} disabled={loading}>
              <Text style={styles.submitButtonText}>{loading ? 'กำลังโหลด...' : 'เข้าสู่ระบบ'}</Text>
            </TouchableOpacity>

            <View style={styles.linksContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.linkText}>ลืมรหัสผ่าน?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.linkText}>ลงทะเบียน</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>หรือ</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.oauthContainer}>
                <TouchableOpacity 
                    style={[styles.oauthButton, styles.googleButton]} 
                    onPress={() => handleOAuthLogin('google')}
                    disabled={loading}
                >
                    <Icon name="google" size={20} color="#FFF" style={styles.oauthIcon} />
                    <Text style={styles.oauthButtonText}>เข้าสู่ระบบด้วย Google</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.oauthButton, styles.facebookButton]} 
                    onPress={() => handleOAuthLogin('facebook')}
                    disabled={loading}
                >
                    <Icon name="facebook" size={20} color="#FFF" style={styles.oauthIcon} />
                    <Text style={styles.oauthButtonText}>เข้าสู่ระบบด้วย Facebook</Text>
                </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#000000' : '#F0F2F5',
  },
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.3 : 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: isDarkMode ? '#FFFFFF' : '#222222',
    marginBottom: 25,
  },
  errorText: {
    color: '#D9534F',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 15,
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 15, 
    zIndex: 1,
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: isDarkMode ? '#2C2C2E' : '#F7F7F7',
    borderRadius: 10,
    paddingLeft: 50, 
    paddingRight: 50,
    fontSize: 16,
    color: isDarkMode ? '#FFFFFF' : '#333333',
    borderColor: isDarkMode ? '#444444' : '#E0E0E0',
    borderWidth: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    height: '100%',
    justifyContent: 'center',
  },
  submitButton: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  linksContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: isDarkMode ? '#444' : '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: isDarkMode ? '#888' : '#666',
    fontSize: 12,
  },
  oauthContainer: {
    width: '100%',
    alignItems: 'center',
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  googleButton: {
      backgroundColor: '#4285F4',
  },
  facebookButton: {
      backgroundColor: '#1877F2',
  },
  oauthButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '500',
  },
  oauthIcon: {
    position: 'absolute',
    left: 20,
  }
});

export default LoginScreen;