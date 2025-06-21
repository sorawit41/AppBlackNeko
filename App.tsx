import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values'; // สำหรับ Supabase
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from './src/supabaseClient';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, StackScreenProps } from '@react-navigation/native-stack';

// --- Import Screens ---
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import CastScreen from './src/screens/CastScreen';
import OrderTrackingPage from './src/screens/OrderTrackingPage';
import EventScreen from './src/screens/EventScreen';
import MembershipScreen from './src/screens/MembershipScreen';

// --- Type Definitions (อัปเดตล่าสุด) ---
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Cast: undefined;
  OrderTracking: undefined;
  Event: undefined;
  Membership: undefined;
};

// --- หน้าจอสำรอง ---
const RegisterScreen = () => (<View style={styles.container}><Text style={styles.title}>หน้าลงทะเบียน</Text></View>);
const ForgotPasswordScreen = () => (<View style={styles.container}><Text style={styles.title}>หน้าลืมรหัสผ่าน</Text></View>);

// --- Navigator Setup ---
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#023047" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session && session.user ? (
          // Stack สำหรับผู้ใช้ที่ล็อกอินแล้ว
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} /> 
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'แก้ไขข้อมูลส่วนตัว', headerBackTitle: 'กลับ' }} />
            <Stack.Screen name="Cast" component={CastScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingPage} options={{ headerShown: false }} />
            <Stack.Screen name="Event" component={EventScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Membership" component={MembershipScreen} options={{ headerShown: false }} />
          </>
        ) : (
          // Stack สำหรับ Guest
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'ลงทะเบียน' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'ลืมรหัสผ่าน' }} />
            <Stack.Screen name="Cast" component={CastScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="OrderTracking" component={OrderTrackingPage} options={{ headerShown: false }} />
            <Stack.Screen name="Event" component={EventScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Membership" component={MembershipScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
});