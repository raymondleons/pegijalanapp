// src/screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';

const SplashScreen = ({ navigation }) => {
  // Hook ini akan berjalan setelah komponen selesai di-render
  useEffect(() => {
    // Atur timer untuk pindah ke layar utama setelah 3 detik
    const timer = setTimeout(() => {
      // Gunakan 'replace' agar pengguna tidak bisa kembali ke splash screen
      // Ganti 'MainApp' dengan nama rute utama aplikasi Anda (misal: 'Home' atau 'Dashboard')
      navigation.replace('MainApp');
    }, 20000); // 3000 milidetik = 3 detik

    // Membersihkan timer jika komponen di-unmount sebelum timer selesai
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Mengatur warna status bar agar sesuai dengan latar belakang */}
      <StatusBar barStyle="dark-content" backgroundColor="#ffde2f" />
      <Image
        // PENTING: Pastikan Anda memiliki gambar di path ini.
        // Ganti 'logo.png' dengan nama file ikon Anda.
        source={require('../assets/icons/holiday.webp')}
        style={styles.logo}
      />
    </View>
  );
};

// StyleSheet untuk mengatur tampilan komponen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Konten di tengah secara vertikal
    alignItems: 'center',    // Konten di tengah secara horizontal
    backgroundColor: '#ffde2f',
  },
  logo: {
    width: 450, // Sesuaikan lebar logo
    height: 450, // Sesuaikan tinggi logo
    resizeMode: 'contain', // Pastikan gambar tidak terdistorsi
  },
});

export default SplashScreen;
