import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants';
import { useNavigation } from '@react-navigation/native';
import { useLocalization } from '../../context/LocalizationContext';
import { useSettings } from '../../context/SettingsContext';

const Header = () => {
  const navigation = useNavigation();
  const { t } = useLocalization();
  const { country } = useSettings();

  const renderFlag = () => {
    switch (country) {
      case 'Indonesia':
        return <Image source={require('../../assets/icons/indonesia.png')} style={styles.flagIcon} />;
      case 'Singapore':
        return <Image source={require('../../assets/icons/singapore.png')} style={styles.flagIcon} />;
      case 'Malaysia':
        return <Image source={require('../../assets/icons/malaysia.png')} style={styles.flagIcon} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.searchContainer}>
        <Image source={require('../../assets/icons/search.png')} style={styles.searchIcon} />
        <Text style={styles.searchText}>{t('search')}</Text>
      </TouchableOpacity>

      <View style={styles.iconsContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.flagContainer}>
          {renderFlag()}
        </TouchableOpacity>
        <TouchableOpacity>
          <Image source={require('../../assets/icons/notification.png')} style={styles.notificationIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding * 4,
    backgroundColor: COLORS.secondary,
    borderBottomLeftRadius: SIZES.radius * 2,
    borderBottomRightRadius: SIZES.radius * 2,
    // paddingTop dihilangkan supaya header benar-benar rapat ke atas
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    marginRight: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    width: 22,
    height: 22,
    marginRight: SIZES.base,
    tintColor: COLORS.text_light,
  },
  searchText: {
    ...FONTS.body3,
    color: COLORS.text_light,
    fontSize: 16,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagContainer: {
    marginRight: SIZES.padding,
    width: SIZES.h2,
    height: SIZES.h2,
  },
  flagIcon: {
    width: SIZES.h2,
    height: SIZES.h2,
    borderRadius: SIZES.h2 / 2,
  },
  notificationIcon: {
    width: SIZES.h2,
    height: SIZES.h2,
    tintColor: COLORS.primary,
  },
});

export default Header;
