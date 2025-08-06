// components/home/RecentSearchCard.js

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SIZES, FONTS, COLORS } from '../../constants'; // Pastikan path ini benar

const RecentSearchCard = ({ item }) => {
  return (
    <TouchableOpacity style={styles.card}>
      <Image source={item.icon} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.routeText} numberOfLines={1}>{item.route}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: SIZES.radius,
    padding: SIZES.base * 1.5,
    // --- PERUBAHAN DI SINI ---
    // HAPUS: 'width' dan 'marginRight' agar kartu mengisi kontainer secara vertikal
    // width: SIZES.width * 0.6,
    // marginRight: SIZES.padding,
    elevation: 2, // Efek bayangan di Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, // Opasitas bayangan diperkecil
    shadowRadius: 2,
  },
  icon: {
    width: 28,
    height: 28,
    tintColor: COLORS.mediumGray,
    marginRight: SIZES.base * 1.5,
  },
  textContainer: {
    flex: 1,
  },
  routeText: {
    ...FONTS.body4,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text_dark,
  },
  dateText: {
    ...FONTS.body4,
    fontSize: 12,
    color: COLORS.text_light,
    marginTop: 2,
  },
});

export default RecentSearchCard;