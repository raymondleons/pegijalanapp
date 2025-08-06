import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SIZES, FONTS, COLORS } from '../../constants';

const DatePicker = ({ label, value, onPress, containerStyle }) => {
  return (
    // 1. Kontainer pembungkus untuk menampung label dan input
    <View style={[styles.wrapper, containerStyle]}>
      {/* 2. Label yang mengambang */}
      <Text style={styles.floatingLabel}>{label}</Text>
      
      {/* 3. Area input yang dapat diklik */}
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.value}>{value}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Gaya untuk kontainer pembungkus
  wrapper: {
    flex: 1,
    position: 'relative', // Diperlukan untuk positioning absolut pada child
    marginTop: SIZES.base, // Memberi jarak dari elemen di atasnya
  },
  // Gaya untuk label yang mengambang
  floatingLabel: {
    position: 'absolute',
    top: -8, // Posisikan agar setengah berada di atas garis border
    left: 12, // Jarak dari kiri
    zIndex: 10, // Pastikan label berada di atas border
    // --- PERUBAHAN DI SINI ---
    // Warna diubah menjadi putih agar menyatu dengan latar belakang kartu
    backgroundColor: COLORS.white, 
    paddingHorizontal: 4,
    ...FONTS.body5,
    color: COLORS.text_light,
  },
  // Gaya untuk area input yang dapat diklik
  container: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: SIZES.padding,
    justifyContent: 'center',
    height: 55, // Beri tinggi yang pasti agar konsisten
  },
  // Gaya untuk teks nilai di dalam input
  value: {
    ...FONTS.body4,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text_dark,
  },
});

export default DatePicker;
