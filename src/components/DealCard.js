import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SIZES, FONTS, COLORS } from '../constants';

const { width } = Dimensions.get('window');
// Lebar kartu dikecilkan dari 95% menjadi 80% dari lebar layar
const CARD_WIDTH = width * 0.8; 

const DealCard = ({ promo }) => {
  if (!promo || !promo.id) {
    return null;
  }

  const imageUrl = promo.image_url 
    ? promo.image_url 
    : 'https://placehold.co/600x400/e0e0e0/555555?text=Promo';

  return (
    <TouchableOpacity style={styles.cardContainer} activeOpacity={0.8}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.promoImage}
        resizeMode="cover"
      />
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {promo.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {promo.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radius,
    // Efek bayangan diperhalus
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Mengurangi tinggi bayangan
    shadowOpacity: 0.1,
    shadowRadius: 2, // Mengurangi blur bayangan
    elevation: 3, // Mengurangi efek bayangan di Android
    // Jarak bawah dikembalikan untuk menjaga layout
    marginBottom: SIZES.padding,
    paddingBottom: SIZES.padding,
    
  },
  promoImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: SIZES.radius,
    borderTopRightRadius: SIZES.radius,
  },
  textContainer: {
    padding: SIZES.padding,
    paddingBottom: 0,
  },
  title: {
    // --- PERUBAHAN DI SINI ---
    ...FONTS.h4, // Ukuran font dikecilkan dari h3 ke h4
    fontFamily: 'Inter-SemiBold', // Ketebalan diubah menjadi SemiBold
    color: COLORS.black,
    marginBottom: SIZES.base / 2,
  },
  description: {
    ...FONTS.body4,
    fontFamily: 'Inter-Regular',
    color: COLORS.mediumGray, 
    lineHeight: 20,
  },
});

export default DealCard;
