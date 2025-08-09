// src/screens/AccountScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    SafeAreaView,
    Dimensions,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalization } from '../context/LocalizationContext';
import { useAuth } from '../context/AuthContext';
import appTheme, { SIZES, FONTS } from '../constants/theme';
import axios from 'axios';

const { COLORS } = appTheme;
const { width } = Dimensions.get('window');

const API_URL = 'https://tiket.crelixdigital.com/api';

// --- Komponen-komponen UI tidak diubah ---
const ProfileSkeleton = () => (
    <View style={styles.card}>
        <View style={styles.profileContent}>
            <View style={styles.avatarSkeleton} />
            <View style={{ flex: 1, marginLeft: SIZES.padding }}>
                <View style={styles.nameSkeleton} />
                <View style={styles.emailSkeleton} />
            </View>
            <View style={styles.chevronSkeleton} />
        </View>
    </View>
);
const MenuItemSkeleton = () => (
    <View style={styles.menuItem}>
        <View style={styles.menuIconSkeleton} />
        <View style={styles.menuTextSkeleton} />
        <View style={styles.chevronSkeleton} />
    </View>
);
const MenuItem = ({ itemKey, iconSource, onPress, t }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <Image source={iconSource} style={styles.menuIcon} />
        <Text style={styles.menuText}>{t(itemKey)}</Text>
        <Image source={require('../assets/icons/chevron_right.png')} style={styles.chevronIcon} />
    </TouchableOpacity>
);
const GeneralMenuItems = ({ t, navigation }) => (
    <View style={styles.menuContainer}>
        <MenuItem itemKey="redeem_easipoint" iconSource={require('../assets/icons/star.png')} t={t} />
        <View style={styles.divider} />
        <MenuItem itemKey="help_center" iconSource={require('../assets/icons/headset.png')} t={t} onPress={() => navigation.navigate('HelpCenter')} />
        <View style={styles.divider} />
        <MenuItem itemKey="about_us" iconSource={require('../assets/icons/info.png')} t={t} onPress={() => navigation.navigate('AboutUs')} />
        <View style={styles.divider} />
        <MenuItem itemKey="privacy_policy" iconSource={require('../assets/icons/shield.png')} t={t} onPress={() => navigation.navigate('PrivacyPolicy')} />
        <View style={styles.divider} />
        <MenuItem itemKey="terms_conditions" iconSource={require('../assets/icons/document.png')} t={t} onPress={() => navigation.navigate('TermsConditions')} />
    </View>
);
const LoggedOutView = ({ navigation, t }) => (
    <>
        <View style={styles.card}>
            <View style={styles.promptContent}>
                <View style={styles.avatar}><Image source={require('../assets/icons/user.png')} style={styles.avatarIcon} /></View>
                <View style={styles.promptTextContainer}>
                    <Text style={styles.promptTitle}>{t('account_prompt_title')}</Text>
                    <Text style={styles.promptDesc}>{t('account_prompt_desc')}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginButtonText}>{t('login')}</Text>
            </TouchableOpacity>
        </View>
        <GeneralMenuItems t={t} navigation={navigation} />
        <Text style={styles.versionText}>Version 1.0.0</Text>
    </>
);

// --- Komponen Tampilan Saat Sudah Login dengan Skeleton (DIPERBAIKI) ---
const LoggedInView = ({ navigation, t }) => {
    // DIPERBAIKI: Ambil 'accessToken' untuk memanggil API
    const { accessToken, user, logout } = useAuth();
    // DIPERBAIKI: Kembalikan state internal untuk profil dan loading
    const [profile, setProfile] = useState(user); // Gunakan data dari context sebagai nilai awal
    const [isLoadingProfile, setIsLoadingProfile] = useState(!user); // Tampilkan loading jika context belum menyediakan user

    useEffect(() => {
        const fetchProfile = async () => {
            if (!accessToken) {
                setIsLoadingProfile(false);
                return;
            }
            try {
                // DIPERBAIKI: Panggil endpoint yang benar '/users/me'
                const response = await axios.get(`${API_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                setProfile(response.data);
            } catch (error) {
                console.error('Gagal mengambil profil:', error.response?.data?.message || error.message);
                if (error.response?.status === 401) {
                    logout();
                }
            } finally {
                setIsLoadingProfile(false);
            }
        };
        // Panggil fetchProfile hanya jika data profile belum ada
        if (!profile) {
          fetchProfile();
        }
    }, [accessToken]); // Dependency adalah accessToken

    // DIPERBAIKI: Kembalikan logika untuk menampilkan skeleton
    if (isLoadingProfile) {
        return (
            <View style={{ flex: 1, justifyContent: 'flex-start', paddingTop: SIZES.padding * 1.5 }}>
                <ProfileSkeleton />
                <View style={styles.menuContainer}>
                    {[1, 2, 3].map((key) => ( // Disederhanakan menjadi 3 item menu skeleton
                        <React.Fragment key={key}>
                            <MenuItemSkeleton />
                            {key < 3 && <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                </View>
            </View>
        );
    }
    
    // DIPERBAIKI: Gabungkan first_name dan last_name
    const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'User';

    return (
        <>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Profile', { profileData: profile })}>
                <View style={styles.profileContent}>
                    <View style={styles.avatar}><Image source={require('../assets/icons/user.png')} style={styles.avatarIcon} /></View>
                    <View style={styles.profileTextContainer}>
                        <Text style={styles.profileName}>{fullName}</Text>
                        <Text style={styles.profileEmail}>{profile?.email || 'No Email'}</Text>
                    </View>
                    <Image source={require('../assets/icons/chevron_right.png')} style={styles.chevronIcon} />
                </View>
            </TouchableOpacity>

            <View style={styles.menuContainer}>
                <MenuItem itemKey="my_vouchers" iconSource={require('../assets/icons/voucher.png')} t={t} />
                <View style={styles.divider} />
                <MenuItem itemKey="recent_searches" iconSource={require('../assets/icons/history.png')} t={t} />
                <View style={styles.divider} />
                <MenuItem itemKey="account_settings" iconSource={require('../assets/icons/settings.png')} t={t} onPress={() => navigation.navigate('AccountSettings')} />
            </View>

            <View style={styles.referContainer}>
                <TouchableOpacity style={styles.referBanner}>
                    <View style={styles.referTextContainer}><Text style={styles.referTitle}>{t('refer_and_earn')}</Text><Text style={styles.referAmount}>&gt; Rp. 26.000.000</Text></View>
                </TouchableOpacity>
                <Image source={require('../assets/icons/refer_banner_image.png')} style={styles.referImage} />
            </View>

            <GeneralMenuItems t={t} navigation={navigation} />
            <Text style={styles.versionText}>Version 1.0.0</Text>
        </>
    );
};

// --- Komponen Utama AccountScreen (DIPERBAIKI) ---
const AccountScreen = ({ navigation }) => {
    const { t } = useLocalization() || {};
    const { authenticated, isLoading } = useAuth();
    const insets = useSafeAreaInsets();
    
    // Tampilkan loading indicator utama dari context saat aplikasi pertama kali memuat sesi
    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor={COLORS.secondary} barStyle="dark-content" />
            <View style={[styles.header, { paddingTop: insets.top + SIZES.base, paddingBottom: SIZES.padding }]}>
                <View style={styles.headerSide} />
                <View style={styles.headerCenter}><Text style={styles.headerTitle}>{t('account')}</Text></View>
                <View style={styles.headerSide} />
            </View>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SIZES.padding2 }}>
                {authenticated ? <LoggedInView navigation={navigation} t={t} /> : <LoggedOutView navigation={navigation} t={t} />}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.secondary },
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, backgroundColor: COLORS.secondary },
    headerSide: { flex: 1 },
    headerCenter: { flex: 2, alignItems: 'center' },
    headerTitle: { ...FONTS.h3, color: COLORS.black, fontWeight: '600' },
    card: { backgroundColor: COLORS.white, marginTop: SIZES.padding2, marginHorizontal: SIZES.padding, marginBottom: SIZES.padding, borderRadius: SIZES.radius, padding: SIZES.padding, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
    promptContent: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.padding },
    avatar: { width: width * 0.15, height: width * 0.15, borderRadius: (width * 0.15) / 2, backgroundColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center' },
    avatarIcon: { width: '60%', height: '60%', tintColor: COLORS.text_light },
    promptTextContainer: { flex: 1, marginLeft: SIZES.padding },
    promptTitle: { ...FONTS.h4, color: COLORS.text_dark, fontWeight: '600' },
    promptDesc: { ...FONTS.body4, color: COLORS.darkGray, lineHeight: 20, marginTop: SIZES.base },
    loginButton: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 50, paddingVertical: SIZES.padding, alignItems: 'center' },
    loginButtonText: { ...FONTS.h4, color: COLORS.primary, fontWeight: '600' },
    profileContent: { flexDirection: 'row', alignItems: 'center' },
    profileTextContainer: { flex: 1, marginLeft: SIZES.padding },
    profileName: { ...FONTS.h3, fontWeight: 'bold', color: COLORS.black },
    profileEmail: { ...FONTS.body5, color: COLORS.text_light, marginTop: SIZES.base / 2 },
    referContainer: { marginHorizontal: SIZES.padding, marginBottom: SIZES.padding },
    referBanner: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: SIZES.padding * 1.5, paddingHorizontal: SIZES.padding, overflow: 'hidden', justifyContent: 'center' },
    referTextContainer: { width: '70%' },
    referTitle: { ...FONTS.h4, color: COLORS.white, fontWeight: 'bold' },
    referAmount: { ...FONTS.body4, color: COLORS.white, marginTop: SIZES.base / 2 },
    referImage: { position: 'absolute', right: SIZES.base, bottom: SIZES.base, width: width * 0.25, height: '100%', resizeMode: 'contain' },
    menuContainer: { backgroundColor: COLORS.white, marginHorizontal: SIZES.padding, borderRadius: SIZES.radius, marginBottom: SIZES.padding, elevation: 2 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: SIZES.padding },
    menuIcon: { width: SIZES.h2, height: SIZES.h2, marginRight: SIZES.padding, tintColor: COLORS.darkGray },
    menuText: { ...FONTS.body4, color: COLORS.darkGray, flex: 1 },
    chevronIcon: { width: SIZES.h3, height: SIZES.h3, tintColor: COLORS.text_light },
    divider: { height: 1, backgroundColor: '#F4F4F8', marginLeft: SIZES.padding * 2 + SIZES.h2 },
    versionText: { ...FONTS.body5, color: COLORS.mediumGray, textAlign: 'center', marginTop: 8, marginBottom: SIZES.padding },
    avatarSkeleton: { width: width * 0.15, height: width * 0.15, borderRadius: (width * 0.15) / 2, backgroundColor: '#E1E9EE' },
    nameSkeleton: { width: '60%', height: 20, backgroundColor: '#E1E9EE', borderRadius: 4, marginBottom: SIZES.base / 2 },
    emailSkeleton: { width: '40%', height: 14, backgroundColor: '#E1E9EE', borderRadius: 4 },
    chevronSkeleton: { width: 24, height: 24, backgroundColor: '#E1E9EE', borderRadius: 12 },
    menuIconSkeleton: { width: SIZES.h2, height: SIZES.h2, backgroundColor: '#E1E9EE', borderRadius: 4, marginRight: SIZES.padding },
    menuTextSkeleton: { flex: 1, height: 16, backgroundColor: '#E1E9EE', borderRadius: 4 },
});

export default AccountScreen;