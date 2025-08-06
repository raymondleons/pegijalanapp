import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme'; // Pastikan path ini benar
import { useAuth } from '../context/AuthContext'; // Untuk mengambil data user

const CheckoutScreen = ({ route, navigation }) => {
    // Ambil data yang dikirim dari layar sebelumnya
    const { packageData, selectedDate, ticketSummary, totalPrice } = route.params;
    const { user } = useAuth(); // Asumsi useAuth() menyediakan objek user {name, email, phone}

    const formatDate = (date) => {
        if (!date) return 'Tanggal tidak valid';
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Selesaikan Pemesananmu</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                {/* Detail Paket */}
                <View style={styles.card}>
                    <Text style={styles.packageName}>{packageData.package_name}</Text>
                    <Text style={styles.packageDesc}>
                        {packageData.short_description || `Paket Wisata ${packageData.package_name} - ${packageData.duration_days} Hari`}
                    </Text>
                    <View style={styles.separator} />
                    <Text style={styles.ticketInfo}>{ticketSummary}</Text>
                    <Text style={styles.dateInfo}>Tanggal Dipilih: {formatDate(selectedDate)}</Text>
                    <View style={styles.infoRowContainer}>
                        <Text style={styles.infoText}>✓ Tidak bisa refund</Text>
                        <Text style={styles.infoText}>✓ Konfirmasi Instan</Text>
                        <Text style={styles.infoText}>✓ Berlaku di tanggal terpilih</Text>
                    </View>
                </View>

                {/* Detail Pemesanan */}
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

                {/* Voucher (Contoh) */}
                <View style={styles.voucherCard}>
                    <Text style={styles.voucherTitle}>🎁 Ambil voucher gratismu</Text>
                    <Text style={styles.voucherDesc}>Klaim vouchernya sekarang dan dapetin setelah pembayaran transaksi ini.</Text>
                </View>

            </ScrollView>
            
             {/* Footer Button (Lanjutkan ke Pembayaran) */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.continueButton} onPress={() => alert('Menuju ke halaman pembayaran...')}>
                    <Text style={styles.continueButtonText}>Lanjutkan</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F0F2F5' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SIZES.padding,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    backButtonText: { fontSize: 24, color: COLORS.primary },
    headerTitle: { ...FONTS.h3, fontFamily: 'Inter-SemiBold', color: COLORS.text_dark },
    container: { padding: SIZES.padding, paddingBottom: 100 },
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
    packageName: { ...FONTS.h3, fontFamily: 'Inter-Bold', color: COLORS.black, marginBottom: 4 },
    packageDesc: { ...FONTS.body4, color: COLORS.text_light, marginBottom: SIZES.base },
    separator: { height: 1, backgroundColor: COLORS.border, marginVertical: SIZES.radius },
    ticketInfo: { ...FONTS.body3, fontFamily: 'Inter-SemiBold', color: COLORS.text_dark, marginBottom: 4 },
    dateInfo: { ...FONTS.body4, color: COLORS.text_light, marginBottom: SIZES.radius },
    infoRowContainer: { marginTop: SIZES.base },
    infoText: { ...FONTS.caption, color: COLORS.mediumGray, marginBottom: 4 },
    sectionTitle: { ...FONTS.h4, fontFamily: 'Inter-SemiBold', color: COLORS.text_dark, marginBottom: SIZES.radius },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZES.base },
    detailLabel: { ...FONTS.body4, color: COLORS.text_light },
    detailValue: { ...FONTS.body4, fontFamily: 'Inter-SemiBold', color: COLORS.text_dark },
    voucherCard: {
        backgroundColor: '#E6F7FF',
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        borderWidth: 1,
        borderColor: '#91D5FF'
    },
    voucherTitle: { ...FONTS.h4, color: COLORS.primary },
    voucherDesc: { ...FONTS.body5, color: COLORS.primary, marginTop: 4 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SIZES.padding,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    continueButton: {
        backgroundColor: COLORS.secondary,
        padding: SIZES.radius,
        borderRadius: SIZES.radius,
        alignItems: 'center',
    },
    continueButtonText: {
        ...FONTS.h3,
        color: COLORS.black,
        fontFamily: 'Inter-Bold'
    }
});

export default CheckoutScreen;