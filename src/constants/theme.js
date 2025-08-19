import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

// Definisikan warna Anda di sini atau impor dari colors.js
export const COLORS = {
    primary: '#583f99', // Ungu
    secondary: '#ffde2f', // Kuning
    
    white: '#FFFFFF',
    black: '#222121ff',
    darkGray: '#333333',
    mediumGray: '#6e6e6e',      // Ubah jadi abu-abu gelap
    lightGray: '#F4F4F8',
    border: '#E0E0E0',
    error: '#FF3B30', // Merah untuk error
    success: '#4CAF50', // Hijau untuk sukses
    gray : '#6e6e6e', // Abu-abu untuk teks placeholder

    text_dark: '#333333',
    text_light: '#4a4a4a',      // Ubah jadi abu-abu gelap agar teks lebih jelas
    background: '#F8F9FA',
    primary_light: 'rgba(88, 63, 153, 0.1)',
    text_gray: '#333333', // Abu-abu untuk teks yang tidak terlalu penting
};

// Definisikan semua ukuran dinamis di sini
export const SIZES = {
    // Ukuran dasar
    base: height * 0.01, // 1% dari tinggi layar
    font: height * 0.018, // 1.8% dari tinggi layar
    radius: 12,

    // Padding & Margin dinamis
    padding: height * 0.02, // 2%
    padding2: height * 0.03, // 3%

    // Ukuran font dinamis
    h1: height * 0.04,
    h2: height * 0.028,
    h3: height * 0.022,
    h4: height * 0.018,
    body1: height * 0.04,
    body2: height * 0.028,
    body3: height * 0.02,
    body4: height * 0.018,
    body5: height * 0.015, 
    body6: height * 0.010,// Untuk teks kecil seperti label tab

    // Dimensi layar
    width,
    height,
};

// Definisikan style font lengkap
export const FONTS = {
    h1: { fontFamily: 'Inter-Bold', fontSize: SIZES.h1, lineHeight: SIZES.h1 * 1.2 },
    h2: { fontFamily: 'Inter-Bold', fontSize: SIZES.h2, lineHeight: SIZES.h2 * 1.2 },
    h3: { fontFamily: 'Inter-SemiBold', fontSize: SIZES.h3, lineHeight: SIZES.h3 * 1.2 },
    h4: { fontFamily: 'Inter-SemiBold', fontSize: SIZES.h4, lineHeight: SIZES.h4 * 1.2 },
    body1: { fontFamily: 'Inter-Regular', fontSize: SIZES.body1, lineHeight: SIZES.body1 * 1.2 },
    body2: { fontFamily: 'Inter-Regular', fontSize: SIZES.body2, lineHeight: SIZES.body2 * 1.2 },
    body3: { fontFamily: 'Inter-Regular', fontSize: SIZES.body3, lineHeight: SIZES.body3 * 1.2 },
    body4: { fontFamily: 'Inter-Regular', fontSize: SIZES.body4, lineHeight: SIZES.body4 * 1.2 },
    body5: { fontFamily: 'Inter-Regular', fontSize: SIZES.body5, lineHeight: SIZES.body5 * 1.2 },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;
