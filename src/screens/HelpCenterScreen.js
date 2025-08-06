// src/screens/HelpCenterScreen.js
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    StatusBar,
    TextInput,
    ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import appTheme, { SIZES, FONTS } from '../constants/theme';
import { useLocalization } from '../context/LocalizationContext';

const { COLORS } = appTheme;

// Komponen untuk setiap item di daftar bantuan
const HelpItem = ({ iconSource, label, onPress, isLast = false }) => (
    <>
        <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
            <Image
                source={iconSource}
                style={styles.itemIcon}
            />
            <Text style={styles.itemLabel}>{label}</Text>
            <Image
                source={require('../assets/icons/chevron_right.png')}
                style={styles.chevronIcon}
            />
        </TouchableOpacity>
        {!isLast && <View style={styles.divider} />}
    </>
);

const HelpCenterScreen = () => {
    const navigation = useNavigation();
    const { t } = useLocalization() || {};
    const insets = useSafeAreaInsets();

    // Data untuk item bantuan
    const productItems = [
        { id: '1', label: 'Tiket Bus/Travel', icon: require('../assets/icons/bus.png'), screen: 'BusHelp' },
        { id: '2', label: 'Tiket Feri', icon: require('../assets/icons/ferry.png'), screen: 'FerryHelp' },
        { id: '3', label: 'Tiket Kereta Api', icon: require('../assets/icons/train.png'), screen: 'TrainHelp' },
        { id: '4', label: 'Sewa Bus', icon: require('../assets/icons/bus.png'), screen: 'BusHelp' },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* PERUBAHAN WARNA STATUS BAR */}
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />

            {/* Header Kustom */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Image source={require('../assets/icons/chevron_left.png')} style={styles.headerIcon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pusat Bantuan</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
                {/* Kartu Bantuan Utama */}
                <View style={styles.mainCard}>
                    <View style={styles.mainCardHeader}>
                        <Text style={styles.mainCardTitle}>Bagaimana kami bisa membantu?</Text>
                        <Image
                            // PERUBAHAN: Menggunakan ikon dari aset lokal
                            source={require('../assets/icons/help_illustration.png')} // Pastikan nama file ini benar
                            style={styles.mainCardImage}
                        />
                    </View>
                    <View style={styles.searchBar}>
                        <Image source={require('../assets/icons/search.png')} style={styles.searchIcon} />
                        <TextInput
                            placeholder="Cari FAQ"
                            placeholderTextColor={COLORS.gray}
                            style={styles.searchInput}
                        />
                    </View>
                </View>

                {/* Bagian Jelajahi Produk */}
                <Text style={styles.sectionTitle}>Jelajahi Berdasarkan Jenis Produk</Text>
                <View style={styles.menuCard}>
                    {productItems.map((item, index) => (
                        <HelpItem
                            key={item.id}
                            iconSource={item.icon}
                            label={item.label}
                            onPress={() => console.log(`Navigasi ke ${item.screen}`)}
                            isLast={index === productItems.length - 1}
                        />
                    ))}
                </View>

                {/* Bagian Hubungi Kami */}
                <View style={styles.menuCard}>
                    <HelpItem
                        iconSource={require('../assets/icons/chat.png')} // Ganti dengan ikon chat Anda
                        label="Hubungi Kami"
                        onPress={() => console.log('Navigasi ke Hubungi Kami')}
                        isLast={true}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.secondary, // PERUBAHAN WARNA
    },
    scrollView: {
        backgroundColor: COLORS.background, 
    },
    scrollContainer: {
        padding: SIZES.padding,
        paddingBottom: SIZES.padding * 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding,
        paddingBottom: SIZES.base,
        backgroundColor: COLORS.secondary, // PERUBAHAN WARNA
    },
    headerButton: {
        padding: SIZES.base,
    },
    headerIcon: {
        width: SIZES.h3,
        height: SIZES.h3,
        tintColor: COLORS.darkGray, // PERUBAHAN WARNA IKON
    },
    headerTitle: {
        ...FONTS.h4, // Diperkecil dari h3
        color: COLORS.black, // PERUBAHAN WARNA TEKS
        fontWeight: 'bold',
    },
    mainCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        marginBottom: SIZES.padding * 1.5,
    },
    mainCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.padding,
    },
    mainCardTitle: {
        ...FONTS.h3, // Diperkecil dari h2
        color: COLORS.text_dark,
        flex: 1,
        marginRight: SIZES.base,
    },
    mainCardImage: {
        width: 100,
        height: 80,
        resizeMode: 'contain',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.padding,
        height: 50,
    },
    searchIcon: {
        width: SIZES.h2,
        height: SIZES.h2,
        tintColor: COLORS.gray,
        marginRight: SIZES.base,
    },
    searchInput: {
        flex: 1,
        ...FONTS.body4, // Diperkecil dari body3
        color: COLORS.text_dark,
    },
    sectionTitle: {
        ...FONTS.body3, // Diperkecil dari h4
        color: COLORS.text_dark,
        marginBottom: SIZES.padding,
        fontWeight: 'bold',
    },
    menuCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.padding,
        overflow: 'hidden',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding,
    },
    itemIcon: {
        width: SIZES.h2,
        height: SIZES.h2,
        tintColor: COLORS.darkGray,
        marginRight: SIZES.padding,
    },
    itemLabel: {
        ...FONTS.body4, // Diperkecil dari body3
        color: COLORS.text_dark,
        flex: 1,
    },
    chevronIcon: {
        width: SIZES.h3,
        height: SIZES.h3,
        tintColor: COLORS.text_light,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.lightGray,
        marginLeft: SIZES.padding * 2 + SIZES.h2,
    },
});

export default HelpCenterScreen;
