// src/screens/WalletScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, FONTS } from '../constants';

const WalletScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Wallet Screen</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    ...FONTS.h2,
    color: COLORS.text_dark,
  },
});

export default WalletScreen;
