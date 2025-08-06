import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalization } from '../context/LocalizationContext';
import { COLORS, FONTS, SIZES } from '../constants';

// --- LANGKAH 1: Impor kembali semua layar asli Anda ---
import HomeScreen from '../screens/HomeScreen';
import BookingsScreen from '../screens/BookingsScreen';
import WishlistsScreen from '../screens/WishlistsScreen';
import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: SIZES.height * 0.08 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom / 2 : SIZES.base,
          paddingTop: SIZES.base,
          borderTopWidth: 0,
          elevation: 8,
          backgroundColor: COLORS.white,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text_light,
      }}
    >
      {/* --- LANGKAH 2: Kembalikan komponen asli --- */}
      <Tab.Screen 
        name="Home"
        component={HomeScreen} // <-- SUDAH DIKEMBALIKAN
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color, ...FONTS.body5 }}>{t('home')}</Text>
          ),
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? require('../assets/icons/home_active.png') : require('../assets/icons/home_inactive.png')}
              style={[styles.icon, { tintColor: focused ? COLORS.primary : COLORS.text_light }]}/>
          ),
        }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={BookingsScreen} // <-- KEMBALIKAN JUGA
        options={{ 
          tabBarLabel: ({ color }) => (
            <Text style={{ color, ...FONTS.body5 }}>{t('bookings')}</Text>
          ),
          tabBarIcon: ({focused}) => <Image source={focused ? require('../assets/icons/bookings_active.png') : require('../assets/icons/bookings_inactive.png')} style={[styles.icon, {tintColor: focused ? COLORS.primary : COLORS.text_light}]} /> 
        }} 
      />
      <Tab.Screen 
        name="Wishlists" 
        component={WishlistsScreen} // <-- KEMBALIKAN JUGA
        options={{ 
          tabBarLabel: ({ color }) => (
            <Text style={{ color, ...FONTS.body5 }}>{t('wishlists')}</Text>
          ),
          tabBarIcon: ({focused}) => <Image source={focused ? require('../assets/icons/wishlists_active.png') : require('../assets/icons/wishlists_inactive.png')} style={[styles.icon, {tintColor: focused ? COLORS.primary : COLORS.text_light}]} /> 
        }} 
      />
      <Tab.Screen 
        name="Account" 
        component={AccountScreen} // <-- KEMBALIKAN JUGA
        options={{ 
          tabBarLabel: ({ color }) => (
            <Text style={{ color, ...FONTS.body5 }}>{t('account')}</Text>
          ),
          tabBarIcon: ({focused}) => <Image source={focused ? require('../assets/icons/account_active.png') : require('../assets/icons/account_inactive.png')} style={[styles.icon, {tintColor: focused ? COLORS.primary : COLORS.text_light}]} /> 
        }} 
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  icon: {
    width: SIZES.h2,
    height: SIZES.h2,
    resizeMode: 'contain',
  },
});

export default BottomTabNavigator;