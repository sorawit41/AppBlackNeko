import React from 'react';
import { View, Text, Button, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>หน้าลืมรหัสผ่าน</Text>
      <Button title="กลับไปหน้า Login" onPress={() => navigation.goBack()} />
    </SafeAreaView>
  );
};
export default ForgotPasswordScreen;