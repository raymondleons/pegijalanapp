// src/screens/LanguageSelectionScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants';
import { useSettings } from '../context/SettingsContext';
import { useLocalization } from '../context/LocalizationContext';

const languages = [
    { code: 'ID', name: 'Indonesia' },
    { code: 'EN', name: 'English' },
];

const LanguageSelectionScreen = () => {
  const navigation = useNavigation();
  const { lang, updateLanguage } = useSettings();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();

  const handleSelect = (selectedLanguageCode) => {
    updateLanguage(selectedLanguageCode);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.secondary} barStyle="dark-content" />
      {/* Header disamakan dengan SettingsScreen */}
      <View style={[styles.header, { paddingTop: insets.top + SIZES.base, paddingBottom: SIZES.padding }]}>
        <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image source={require('../assets/icons/chevron_left.png')} style={styles.backIcon} />
            </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('select_language')}</Text>
        </View>
        <View style={styles.headerSide} />
      </View>
      <View style={styles.container}>
        {/* Semua item dibungkus dalam satu kartu */}
        <View style={styles.menuCard}>
            {languages.map((item, index) => (
              <React.Fragment key={item.code}>
                <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelect(item.code)}>
                  <Text style={styles.itemLabel}>{item.name}</Text>
                  {lang === item.code && (
                    <Image source={require('../assets/icons/checkmark.png')} style={styles.checkmarkIcon} />
                  )}
                </TouchableOpacity>
                {index < languages.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

// StyleSheet disesuaikan agar sama persis dengan halaman lainnya
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
    paddingHorizontal: SIZES.padding,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: SIZES.padding2,
    paddingVertical: SIZES.padding,
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SIZES.padding2,
  },
});

export default LanguageSelectionScreen;
