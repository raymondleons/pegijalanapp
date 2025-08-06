// src/screens/TermsConditionsScreen.js
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Image, StatusBar, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLocalization } from '../context/LocalizationContext';
import appTheme, { SIZES, FONTS } from '../constants/theme';

const { COLORS } = appTheme;

const TermsConditionsScreen = () => {
    const navigation = useNavigation();
    const { t } = useLocalization() || {};
    const insets = useSafeAreaInsets();

    // Ganti URL ini dengan URL Kebijakan Privasi Anda yang sebenarnya
    const privacyPolicyUrl = 'https://www.google.com/policies/privacy/'; // Contoh URL

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />
            <View style={[styles.header, { paddingTop: insets.top + SIZES.base, paddingBottom: SIZES.padding }]}>
                <View style={styles.headerSide}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Image source={require('../assets/icons/chevron_left.png')} style={styles.backIcon} />
                    </TouchableOpacity>
                </View>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{t('privacy_policy') || 'Kebijakan Privasi'}</Text>
                </View>
                <View style={styles.headerSide} />
            </View>

            <WebView
                source={{ uri: privacyPolicyUrl }}
                style={styles.webview}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Memuat Syarat & Ketentuan...</Text>
                    </View>
                )}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView error: ', nativeEvent.description);
                    Alert.alert("Error", "Gagal memuat halaman Kebijakan Privasi. Silakan coba lagi nanti.");
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.secondary },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        backgroundColor: COLORS.secondary,
    },
    headerSide: { flex: 1 },
    headerCenter: { flex: 2, alignItems: 'center' },
    backButton: { alignSelf: 'flex-start', padding: SIZES.base },
    backIcon: { width: SIZES.h3, height: SIZES.h3, tintColor: COLORS.darkGray },
    headerTitle: { ...FONTS.h3, color: COLORS.black, fontWeight: '600' },
    webview: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: SIZES.padding,
        ...FONTS.body4,
        color: COLORS.text_light,
    },
});

export default TermsConditionsScreen;
