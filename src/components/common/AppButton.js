import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants';

const AppButton = ({ title, onPress, style, textStyle }) => {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    // Warna latar belakang diubah menjadi warna sekunder
    backgroundColor: COLORS.secondary,
    // --- PERUBAHAN DI SINI ---
    // Padding vertikal dikecilkan agar tombol lebih pendek
    paddingVertical: 12, 
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    // --- PERUBAHAN DI SINI ---
    // Ukuran font dikecilkan dari h3 ke h4
    ...FONTS.h4,
    // Warna teks diubah menjadi hitam agar kontras dengan latar kuning
    color: COLORS.black,
  },
});

export default AppButton;
