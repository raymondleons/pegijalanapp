// src/screens/CountrySelectionScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants';
import { useSettings } from '../context/SettingsContext';
import { useLocalization } from '../context/LocalizationContext';

const countries = [
    { name: 'Indonesia', flag: require('../assets/icons/flag_indonesia.png') },
    { name: 'Singapore', flag: require('../assets/icons/flag_singapore.png') },
    { name: 'Malaysia', flag: require('../assets/icons/flag_malaysia.png') },
];

const CountrySelectionScreen = () => {
  const navigation = useNavigation();
  // Ambil 'country' dari context untuk mengetahui negara mana yang sedang aktif
  const { country, updateCountry } = useSettings();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();

  const handleSelect = (selectedCountry) => {
    updateCountry(selectedCountry);
    
    // Reset navigasi dan arahkan ke "Main" (yang berisi BottomTabNavigator)
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }], // Arahkan ke nama rute yang berisi tab Anda
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.secondary} barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + SIZES.base, paddingBottom: SIZES.padding }]}>
        <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image source={require('../assets/icons/chevron_left.png')} style={styles.backIcon} />
            </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('select_country')}</Text>
        </View>
        <View style={styles.headerSide} />
      </View>
      <View style={styles.container}>
        {countries.map((item) => (
          <TouchableOpacity key={item.name} style={styles.itemContainer} onPress={() => handleSelect(item.name)}>
            <Image source={item.flag} style={styles.flagIcon} />
            <Text style={styles.itemLabel}>{item.name}</Text>
            {/* --- KODE CEKLIS DIKEMBALIKAN --- */}
            {/* Tampilkan ikon ceklis jika nama item sama dengan negara yang dipilih */}
            {country === item.name && (
              <Image source={require('../assets/icons/checkmark.png')} style={styles.checkmarkIcon} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

// StyleSheet tidak berubah...
const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    backgroundColor: COLORS.secondary,
  },
  headerSide: {
      flex: 1,
  },
  headerCenter: {
      flex: 2,
      alignItems: 'center',
  },
  backButton: {
      alignSelf: 'flex-start',
      padding: SIZES.base,
  },
  backIcon: { 
    width: SIZES.h3, 
    height: SIZES.h3, 
    tintColor: '#333333' 
  },
  headerTitle: {
    ...FONTS.h3,
    color: '#333333',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SIZES.padding,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: SIZES.padding2,
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  flagIcon: {
    width: SIZES.h1,
    height: SIZES.h1,
    marginRight: SIZES.padding2,
  },
  itemLabel: {
    ...FONTS.body3,
    color: COLORS.text_dark,
    flex: 1,
  },
  checkmarkIcon: {
    width: SIZES.h2,
    height: SIZES.h2,
    tintColor: COLORS.primary,
  },
});


export default CountrySelectionScreen;
