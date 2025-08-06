// src/screens/SettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { useLocalization } from '../context/LocalizationContext';

const SettingsItem = ({ iconSource, label, value, onPress }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress} disabled={!onPress}>
    <Image source={iconSource} style={styles.itemIcon} />
    <Text style={styles.itemLabel}>{label}</Text>
    <Text style={styles.itemValue}>{value}</Text>
    {onPress && (
      <Image source={require('../assets/icons/chevron_right.png')} style={styles.chevronIcon} />
    )}
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { country, currency, getLanguageName } = useSettings();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets(); // Hook untuk mendapatkan area aman

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.secondary} barStyle="dark-content" />
      {/* Header diperbarui dengan padding dinamis dan tata letak yang benar */}
      <View style={[styles.header, { paddingTop: insets.top + SIZES.base, paddingBottom: SIZES.padding }]}>
        <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image source={require('../assets/icons/chevron_left.png')} style={styles.backIcon} />
            </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('settings')}</Text>
        </View>
        <View style={styles.headerSide} />
      </View>
      <View style={styles.container}>
        <SettingsItem 
          iconSource={require('../assets/icons/globe.png')} 
          label={t('country')} 
          value={country}
          onPress={() => navigation.navigate('CountrySelection')}
        />
        <SettingsItem 
          iconSource={require('../assets/icons/cash.png')} 
          label={t('currency')}
          value={currency}
        />
        <SettingsItem 
          iconSource={require('../assets/icons/language.png')} 
          label={t('language')}
          value={getLanguageName()}
          onPress={() => navigation.navigate('LanguageSelection')}
        />
      </View>
    </SafeAreaView>
  );
};

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
  itemIcon: { 
    width: SIZES.h2, 
    height: SIZES.h2, 
    tintColor: COLORS.darkGray,
    marginRight: SIZES.padding2,
  },
  itemLabel: { 
    ...FONTS.body3, 
    color: COLORS.text_dark, 
    flex: 1 
  },
  itemValue: { 
    ...FONTS.body3, 
    color: COLORS.text_light, 
    marginRight: SIZES.base 
  },
  chevronIcon: { 
    width: SIZES.h3, 
    height: SIZES.h3, 
    tintColor: COLORS.text_light 
  }
});

export default SettingsScreen;
