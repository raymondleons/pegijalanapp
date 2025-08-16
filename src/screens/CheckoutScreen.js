import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { formatRupiah } from '../utils/formatters'; // ✅ PERBAIKAN: Mengimpor dari file utilitas



const CheckoutScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();

    const { orderDetails } = route.params || {};
    const { tourData, packageData, selectedDate, ticketCounts, totalPrice } = orderDetails || {};
    
    const { user } = useAuth();
    
    if (!orderDetails || !tourData || !packageData) {
        return (
            <SafeAreaView style={styles.safeAreaError}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Data pemesanan tidak ditemukan.</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Kembali</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const formatDate = (date) => {
        if (!date) return 'Tanggal tidak valid';
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const ticketSummary = Object.keys(ticketCounts || {}).map(key => {
        if (ticketCounts[key] > 0) {
            return `${ticketCounts[key]} Tiket • ${key.charAt(0).toUpperCase() + key.slice(1)}`;
        }
        return null;
    }).filter(Boolean).join(' • ');

    const tourImage = tourData.main_image_url
      ? { uri: `${tourData.main_image_url}` }
      : require('../assets/icons/placeholder.png');

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image source={require('../assets/icons/chevron_left.png')} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Selesaikan Pemesananmu</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.packageDetailHeader} onPress={() => {}}>
                        <Image 
                            source={tourImage}
                            style={styles.packageImage} 
                        />
                        <View style={styles.packageTextContainer}>
                            <Text style={styles.packageName}>{tourData.title || 'Nama Paket'}</Text>
                            <Text style={styles.ticketSummaryText}>{ticketSummary}</Text>
                        </View>
                        <Image source={require('../assets/icons/chevron_right.png')} style={styles.chevronIcon} />
                    </TouchableOpacity>
                    
                    <View style={styles.packageInfoRow}>
                        <Text style={styles.packageInfoLabel}>Tanggal Dipilih</Text>
                        <Text style={styles.packageInfoValue}>{formatDate(selectedDate)}</Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.infoRowContainer}>
                        <Text style={styles.infoText}>✓ Tidak bisa refund</Text>
                        <Text style={styles.infoText}>✓ Konfirmasi Instan</Text>
                        <Text style={styles.infoText}>✓ Berlaku di tanggal terpilih</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Detail Pemesanan</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Nama</Text>
                        <Text style={styles.detailValue}>{user?.name || 'Raymond Leon Sembiring'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>No. HP</Text>
                        <Text style={styles.detailValue}>{user?.phone || '+62 81292927703'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Email</Text>
                        <Text style={styles.detailValue}>{user?.email || 'raymondleons1997@gmail.com'}</Text>
                    </View>
                </View>

                <View style={styles.voucherCard}>
                    <Text style={styles.voucherTitle}>🎁 Ambil voucher gratismu</Text>
                    <Text style={styles.voucherDesc}>Klaim vouchernya sekarang dan dapetin setelah pembayaran transaksi ini.</Text>
                </View>
            </ScrollView>
            
            <View style={styles.footer}>
                <View style={styles.footerPriceContainer}>
                    <View style={styles.totalPriceContainer}>
                        <Text style={styles.totalPriceLabel}>Total harga</Text>
                        <TouchableOpacity style={styles.totalPriceDropdown}>
                            <Text style={styles.totalPriceValue}>{formatRupiah(totalPrice)}</Text>
                            <Image source={require('../assets/icons/chevron_up.png')} style={styles.dropdownIcon} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.pointsText}>+ 3.138 poin</Text>
                </View>
                <TouchableOpacity style={styles.continueButton} onPress={() => Alert.alert('Lanjutkan Pembayaran', 'Menuju ke halaman pembayaran...')}>
                    <Text style={styles.continueButtonText}>Lanjutkan pembayaran</Text>
                </TouchableOpacity>
                <View style={styles.promoTextContainer}>
                    <Text style={styles.promoText}>Hore! Total hemat IDR 131.973 untuk pesanan ini.</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F0F2F5' },
    safeAreaError: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5' },
    errorContainer: { padding: SIZES.padding, alignItems: 'center' },
    errorText: { fontSize: 16, color: '#E63946', textAlign: 'center', marginBottom: 20 },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: { color: COLORS.white, fontWeight: 'bold' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.base,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        // ✅ PERBAIKAN: Menambahkan paddingTop kondisional
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    backIcon: { width: 24, height: 24, tintColor: COLORS.text_dark },
    headerTitle: { ...FONTS.h3, fontFamily: 'Inter-SemiBold', color: COLORS.text_dark },
    scrollContainer: { padding: SIZES.padding, paddingBottom: 150 },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        marginBottom: SIZES.radius,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    packageDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SIZES.radius,
        paddingRight: SIZES.base,
    },
    packageImage: {
        width: 60,
        height: 60,
        borderRadius: SIZES.radius,
        marginRight: SIZES.base * 2,
    },
    packageTextContainer: {
        flex: 1,
    },
    packageName: { 
        ...FONTS.h4, 
        fontFamily: 'Inter-Bold', 
        color: COLORS.black, 
        marginBottom: 4 
    },
    ticketSummaryText: {
        ...FONTS.body4,
        color: COLORS.text_light,
    },
    chevronIcon: {
        width: 20,
        height: 20,
        tintColor: COLORS.text_light,
    },
    packageInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SIZES.base,
    },
    packageInfoLabel: {
        ...FONTS.body4,
        color: COLORS.text_light,
    },
    packageInfoValue: {
        ...FONTS.body4,
        fontFamily: 'Inter-SemiBold',
        color: COLORS.text_dark,
    },
    separator: { height: 1, backgroundColor: COLORS.border, marginVertical: SIZES.radius },
    infoRowContainer: { marginTop: SIZES.base },
    infoText: { 
        ...FONTS.caption, 
        color: COLORS.mediumGray, 
        marginBottom: 4,
        paddingLeft: SIZES.base * 2,
    },
    sectionTitle: { ...FONTS.h4, fontFamily: 'Inter-SemiBold', color: COLORS.text_dark, marginBottom: SIZES.radius },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZES.base },
    detailLabel: { ...FONTS.body4, color: COLORS.text_light },
    detailValue: { ...FONTS.body4, fontFamily: 'Inter-SemiBold', color: COLORS.text_dark },
    voucherCard: {
        backgroundColor: '#E6F7FF',
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        borderWidth: 1,
        borderColor: '#91D5FF',
        marginTop: SIZES.radius,
    },
    voucherTitle: { ...FONTS.h4, color: COLORS.primary },
    voucherDesc: { ...FONTS.body5, color: COLORS.primary, marginTop: 4 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.base,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    footerPriceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: SIZES.base,
    },
    totalPriceContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    totalPriceLabel: {
        ...FONTS.body4,
        color: COLORS.text_light,
        marginBottom: 2,
    },
    totalPriceDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    totalPriceValue: {
        ...FONTS.h2,
        color: COLORS.danger,
        fontFamily: 'Inter-Bold',
    },
    dropdownIcon: {
        width: 16,
        height: 16,
        tintColor: COLORS.text_dark,
        marginLeft: 4,
        marginBottom: 2,
    },
    pointsText: {
        ...FONTS.caption,
        color: COLORS.primary,
        fontFamily: 'Inter-Semi-Bold',
    },
    continueButton: {
        backgroundColor: COLORS.secondary,
        paddingVertical: SIZES.radius,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        width: '100%',
        marginTop: SIZES.base,
    },
    continueButtonText: {
        ...FONTS.h3,
        color: COLORS.black,
        fontFamily: 'Inter-Bold',
    },
    promoTextContainer: {
        marginTop: SIZES.base,
        alignItems: 'center',
    },
    promoText: {
        ...FONTS.caption,
        color: COLORS.success,
        fontFamily: 'Inter-Semi-Bold',
    }
});

export default CheckoutScreen;