import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Import semua layar
import BottomTabNavigator from './BottomTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VerificationScreen from '../screens/VerificationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CountrySelectionScreen from '../screens/CountrySelectionScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import AccountScreen from '../screens/AccountScreen';
import ProfileScreen from '../screens/ProfileScreen'; 
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen'; 
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import TourListScreen from '../screens/TourListScreen';
import TourDetailScreen from '../screens/TourDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.black,
  },
};

const AppNavigator = () => {
  const { isLoading } = useAuth();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '156350074857-cejo6oec6uta70o0ca4isabvshaaek9j.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.black }}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
        {/* Tumpukan navigasi tunggal, dimulai dari Main (Homescreen) */}
        <>
          <Stack.Screen name="Main" component={BottomTabNavigator} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Verification" component={VerificationScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="CountrySelection" component={CountrySelectionScreen} />
          <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
          <Stack.Screen name="AccountScreen" component={AccountScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
          <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} /> 
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
          <Stack.Screen name="AboutUs" component={AboutUsScreen} />
          <Stack.Screen name="TourList" component={TourListScreen} />
          <Stack.Screen name="TourDetail" component={TourDetailScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} /> 
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
