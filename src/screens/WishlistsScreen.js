import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    Alert,
    TextInput,
    ScrollView,
    Animated,
    Modal,
    Dimensions
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { authorize } from 'react-native-app-auth';

const IMAGE_BASE_URL = "https://tiket.crelixdigital.com/";
const { width } = Dimensions.get('window');

// Client IDs
const WEB_CLIENT_ID = '156350074857-cejo6oec6uta70o0ca4isabvshaaek9j.apps.googleusercontent.com';
const MICROSOFT_CLIENT_ID = 'GANTI_DENGAN_MICROSOFT_CLIENT_ID_ANDA';

// --- Komponen Header Khusus ---
const CustomHeader = ({ title, showBackButton = false, onBackPress, rightIcon, titleColor, backgroundColor }) => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const iconColor = titleColor === COLORS.white ? COLORS.white : COLORS.textDark;

    return (
        <View style={[headerStyles.headerContainer, { paddingTop: insets.top + SIZES.base, backgroundColor: backgroundColor || COLORS.white }]}>
            {showBackButton ? (
                <TouchableOpacity onPress={onBackPress || navigation.goBack} style={headerStyles.headerIconContainer}>
                    <Image source={require('../assets/icons/chevron_left.png')} style={[headerStyles.headerIcon, { tintColor: iconColor }]} />
                </TouchableOpacity>
            ) : (
                <View style={headerStyles.headerIconContainer} />
            )}
            <Text style={[headerStyles.headerTitle, { color: titleColor || COLORS.textDark }]}>{title}</Text>
            {rightIcon ? (
                <TouchableOpacity style={headerStyles.headerIconContainer}>
                    <Image source={rightIcon} style={[headerStyles.headerIcon, { tintColor: iconColor }]} />
                </TouchableOpacity>
            ) : (
                <View style={headerStyles.headerIconContainer} />
            )}
        </View>
    );
};

// --- Komponen untuk Tampilan Login ---
const LoginPrompt = () => {
    const navigation = useNavigation();
    const { login: contextLogin, loginWithGoogle: contextLoginWithGoogle, loginWithFacebook: contextLoginWithFacebook, loginWithMicrosoft: contextLoginWithMicrosoft } = useAuth();
    const { t } = useLocalization() || {};
    const insets = useSafeAreaInsets();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setGoogleLoading] = useState(false);
    const [isFacebookLoading, setFacebookLoading] = useState(false);
    const [isMicrosoftLoading, setMicrosoftLoading] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const toastOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: WEB_CLIENT_ID,
            offlineAccess: true,
            scopes: ['profile', 'email'],
        });
    }, []);

    const showToast = () => {
        setToastVisible(true);
        Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        setTimeout(() => hideToast(), 2000);
    };

    const hideToast = () => {
        Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToastVisible(false));
    };

    const onLoginSuccess = () => {
        showToast();
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Email dan password tidak boleh kosong.");
            return;
        }
        setIsLoading(true);
        const result = await contextLogin(email, password);
        setIsLoading(false);
        if (result?.success) {
            onLoginSuccess();
        } else {
            Alert.alert("Login Gagal", result?.message || "Terjadi kesalahan");
        }
    };
    
    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            
            const result = await GoogleSignin.signIn();
            
            if (!result || !result.idToken) {
                throw new Error("Gagal mendapatkan ID Token dari Google.");
            }
            
            const loginResult = await contextLoginWithGoogle(result.idToken);
            
            if (loginResult && loginResult.success) {
                onLoginSuccess();
            } else if (loginResult && !loginResult.success) {
                Alert.alert("Login Google Gagal", loginResult.message);
            }

        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log('User cancelled the login flow');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                Alert.alert("Info", "Operasi sign-in sudah dalam proses");
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert("Error", "Google Play Services tidak tersedia atau kedaluwarsa");
            } else {
                Alert.alert(
                    "Error Google Sign-In", 
                    error.message || `Terjadi kesalahan.\nKode: ${error.code || 'N/A'}`
                );
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleFacebookSignIn = async () => {
        setFacebookLoading(true);
        try {
            const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
            if (result.isCancelled) return;
            const data = await AccessToken.getCurrentAccessToken();
            if (!data) throw new Error('Gagal mendapatkan access token dari Facebook.');
            const apiResult = await contextLoginWithFacebook(data.accessToken.toString());
            if (apiResult?.success) {
                onLoginSuccess();
            } else {
                Alert.alert("Login Facebook Gagal", apiResult?.message || "Terjadi kesalahan");
            }
        } catch (error) {
            Alert.alert("Error Login Facebook", error.message || "Terjadi kesalahan");
        } finally {
            setFacebookLoading(false);
        }
    };

    const handleMicrosoftSignIn = async () => {
        setMicrosoftLoading(true);
        try {
            const config = {
                issuer: 'https://login.microsoftonline.com/common/v2.0',
                clientId: MICROSOFT_CLIENT_ID,
                redirectUrl: 'com.pegijalanapp://oauth/redirect',
                scopes: ['openid', 'profile', 'email', 'offline_access'],
            };
            const result = await authorize(config);
            if (!result.accessToken) throw new Error('Gagal mendapatkan access token dari Microsoft.');
            const apiResult = await contextLoginWithMicrosoft(result.accessToken);
            if (apiResult?.success) {
                onLoginSuccess();
            } else {
                Alert.alert("Login Microsoft Gagal", apiResult?.message || "Terjadi kesalahan");
            }
        } catch (error) {
            Alert.alert("Error Login Microsoft", error.message || "Terjadi kesalahan");
        } finally {
            setMicrosoftLoading(false);
        }
    };

    const translate = (key) => t ? t(key) : key;
    const anyLoading = isLoading || isGoogleLoading || isFacebookLoading || isMicrosoftLoading;

    return (
        <SafeAreaView style={styles.loginContainer}>
            <CustomHeader title={translate('login_title')} backgroundColor={COLORS.primary} titleColor={COLORS.white} />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.promptContainer}>
                    <Text style={styles.promptText}>
                        {translate('dont_have_account')}
                        <Text style={styles.promptLink} onPress={() => navigation.navigate('SignUp')}>
                            {' '}{translate('signup')}
                        </Text>
                    </Text>
                </View>

                <View style={styles.formCard}>
                    <TextInput
                        style={styles.input}
                        placeholder={translate('email_placeholder')}
                        placeholderTextColor={COLORS.textLight}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.inputPassword}
                            placeholder={translate('password_placeholder')}
                            placeholderTextColor={COLORS.textLight}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity 
                            onPress={() => setShowPassword(!showPassword)} 
                            style={styles.eyeButton}
                        >
                            <Image
                                source={showPassword ? require('../assets/icons/eye.png') : require('../assets/icons/eye-off.png')}
                                style={styles.eyeIcon}
                            />
                        </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity style={styles.forgotPasswordButton}>
                        <Text style={styles.forgotPasswordText}>{translate('forgot_password')}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={anyLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.black} />
                        ) : (
                            <Text style={styles.loginButtonText}>{translate('login_button')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.dividerText}>{translate('or_signin_with')}</Text>

                <View style={styles.socialContainer}>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={handleGoogleSignIn}
                        disabled={anyLoading}
                    >
                        {isGoogleLoading ? <ActivityIndicator color="#4285F4" /> : <Image source={require('../assets/icons/google.png')} style={styles.socialIcon} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={handleFacebookSignIn}
                        disabled={anyLoading}
                    >
                        {isFacebookLoading ? <ActivityIndicator color="#1877F2" /> : <Image source={require('../assets/icons/facebook.png')} style={styles.socialIcon} />}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={handleMicrosoftSignIn}
                        disabled={anyLoading}
                    >
                        {isMicrosoftLoading ? <ActivityIndicator color="#0078D4" /> : <Image source={require('../assets/icons/microsoft.png')} style={styles.socialIcon} />}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {toastVisible && (
                <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, top: insets.top + 60 }]}>
                    <View style={styles.toastContent}>
                        <Image source={require('../assets/icons/checkmark-circle.png')} style={styles.toastIcon} />
                        <Text style={styles.toastText}>Login Sukses!</Text>
                    </View>
                </Animated.View>
            )}
        </SafeAreaView>
    );
};

// --- Komponen Kartu Item Tur ---
const TourItemCard = ({ item, onPress, onRemove }) => {
    const [isOptionsModalVisible, setOptionsModalVisible] = useState(false);

    const handleRemove = () => {
        setOptionsModalVisible(false);
        Alert.alert(
            "Hapus dari Wishlist",
            "Apakah Anda yakin ingin menghapus tur ini dari wishlist?",
            [
                { text: "Batal", style: "cancel" },
                { text: "Ya, Hapus", onPress: () => onRemove(item.id), style: "destructive" }
            ]
        );
    };

    return (
        <TouchableOpacity
            style={styles.cardContainer}
            onPress={() => onPress(item)}
        >
            <Image
                source={{ uri: `${IMAGE_BASE_URL}${item.main_image_url}` }}
                style={styles.cardImage}
            />
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <View style={styles.locationContainer}>
                    <Image
                        source={require('../assets/icons/map_placeholder.png')}
                        style={styles.locationIcon}
                    />
                    <Text style={styles.locationText}>
                        {item.location_city}, {item.location_country}
                    </Text>
                </View>
                <View style={styles.cardInfoRow}>
                    <View style={styles.infoPill}>
                        <Image
                            source={require('../assets/icons/clock.png')}
                            style={styles.infoIcon}
                        />
                        <Text style={styles.infoText}>{item.duration} hari</Text>
                    </View>
                    <Text style={styles.priceText}>
                        Rp.{Number(item.starting_price).toLocaleString('id-ID')}
                    </Text>
                </View>
            </View>
            
            {/* Tombol More untuk memunculkan modal */}
            <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setOptionsModalVisible(true)}
            >
                <Image
                    source={require('../assets/icons/menu_dots.png')}
                    style={styles.moreIcon}
                />
            </TouchableOpacity>

            {/* Modal Opsi */}
            <Modal animationType="slide" transparent={true} visible={isOptionsModalVisible} onRequestClose={() => setOptionsModalVisible(false)}>
                {/* [PERBAIKAN] Bungkus ModalContent dengan TouchableOpacity */}
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setOptionsModalVisible(false)} // Tutup modal saat klik di luar
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pilih Opsi</Text>
                            <TouchableOpacity onPress={() => setOptionsModalVisible(false)} style={styles.closeButton}>
                                <Image source={require('../assets/icons/close.png')} style={styles.modalCloseIcon} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.modalOption} onPress={() => { setOptionsModalVisible(false); onPress(item); }}>
                            <Text style={styles.modalOptionText}>Lihat Detail</Text>
                            <Image source={require('../assets/icons/chevron_right.png')} style={styles.optionArrow} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalOption} onPress={handleRemove}>
                            <Text style={[styles.modalOptionText, { color: COLORS.danger }]}>Hapus dari Wishlist</Text>
                            <Image source={require('../assets/icons/chevron_right.png')} style={styles.optionArrow} />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </TouchableOpacity>
    );
};

// --- Komponen Utama Halaman Wishlist ---
const WishlistScreen = () => {
    const { user, axiosInstance, authenticated } = useAuth();
    const navigation = useNavigation();
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const insets = useSafeAreaInsets();
    const prevAuthenticated = useRef(authenticated);

    const fetchFavorites = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        try {
            const response = await axiosInstance.get('/users/me/favorites');
            setFavorites(response.data);
        } catch (error) {
            console.error("Gagal mengambil wishlist:", error);
            Alert.alert("Error", "Gagal memuat daftar favorit Anda.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user, axiosInstance]);

    useFocusEffect(
        useCallback(() => {
            if (authenticated) {
                fetchFavorites();
            } else {
                setFavorites([]);
                setIsLoading(false);
            }
            return () => {};
        }, [authenticated, fetchFavorites])
    );

    const handleRemoveFavorite = async (tourId) => {
        setFavorites(prevFavorites => prevFavorites.filter(item => item.id !== tourId));
        try {
            await axiosInstance.delete(`/users/me/favorites/${tourId}`);
        } catch (error) {
            console.error("Gagal menghapus favorit:", error);
            fetchFavorites();
            Alert.alert("Error", "Gagal menghapus tur dari wishlist. Silakan coba lagi.");
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchFavorites();
    };

    if (!authenticated) {
        return <LoginPrompt />;
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Memuat data wishlist...</Text>
                </View>
            );
        }
        
        if (favorites.length === 0) {
            return (
                <ScrollView
                    contentContainerStyle={styles.emptyScrollView}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                >
                    <Image source={require('../assets/icons/no-data.png')} style={styles.emptyIcon} />
                    <Text style={styles.emptyText}>Wishlist Anda kosong.</Text>
                    <Text style={styles.emptyText}>Temukan tur favorit Anda dan tambahkan di sini!</Text>
                </ScrollView>
            );
        }

        return (
            <FlatList
                data={favorites}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <TourItemCard
                        item={item}
                        onPress={() => { /* Navigasi ke halaman detail tur */ }}
                        onRemove={handleRemoveFavorite}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                    />
                }
            />
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <CustomHeader title="My Wishlist" backgroundColor={COLORS.primary} titleColor={COLORS.white} />
            <View style={styles.content}>
                {renderContent()}
            </View>
        </SafeAreaView>
    );
};

// --- Styles untuk Header ---
const headerStyles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingBottom: SIZES.padding,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        elevation: 2,
        shadowColor: COLORS.N900,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    headerTitle: {
        ...FONTS.h3,
        textAlign: 'center',
        flex: 1,
    },
    headerIconContainer: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerIcon: {
        width: 24,
        height: 24,
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundAlt,
    },
    content: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.padding,
    },
    loadingText: {
        marginTop: SIZES.padding,
        color: COLORS.textLight,
        ...FONTS.b2,
    },
    emptyScrollView: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
    },
    emptyText: {
        ...FONTS.b2,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: SIZES.base,
    },
    emptyIcon: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
        marginBottom: SIZES.padding,
    },
    listContent: {
        paddingVertical: SIZES.padding,
        paddingHorizontal: SIZES.padding,
    },
    // Card Styles
    cardContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.space,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
        shadowColor: COLORS.N900,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardImage: {
        width: 100,
        height: 100,
        borderRadius: SIZES.radius / 2,
    },
    cardContent: {
        flex: 1,
        padding: SIZES.space,
        justifyContent: 'space-between',
    },
    cardTitle: {
        ...FONTS.b2_semibold,
        color: COLORS.textDark,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SIZES.base / 2,
    },
    locationIcon: {
        width: 14,
        height: 14,
        tintColor: COLORS.textLight,
    },
    locationText: {
        ...FONTS.b3,
        color: COLORS.textLight,
        marginLeft: SIZES.base / 2,
    },
    cardInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: SIZES.space,
    },
    infoPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundAlt,
        paddingHorizontal: SIZES.base,
        paddingVertical: SIZES.base / 2,
        borderRadius: SIZES.radius,
    },
    infoIcon: {
        width: 12,
        height: 12,
        tintColor: COLORS.textLight,
    },
    infoText: {
        ...FONTS.b3,
        color: COLORS.textLight,
        marginLeft: SIZES.base / 2,
    },
    // [PERBAIKAN] Style harga untuk warna merah dan simbol Rp
    priceText: {
        ...FONTS.b1_bold,
        color: COLORS.danger, 
    },
    moreButton: {
        position: 'absolute',
        top: SIZES.base,
        right: SIZES.base,
        padding: SIZES.base,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
    },
    moreIcon: {
        width: 18,
        height: 18,
        tintColor: COLORS.N700,
    },
    
    // [PERBAIKAN] Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: SIZES.radius * 2,
        borderTopRightRadius: SIZES.radius * 2,
        paddingTop: SIZES.padding * 1.5,
        paddingHorizontal: SIZES.padding,
        paddingBottom: SIZES.padding * 2,
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.padding,
    },
    modalTitle: {
        ...FONTS.h3,
        color: COLORS.textDark,
    },
    modalCloseIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.textLight,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SIZES.padding,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalOptionText: {
        ...FONTS.b2,
        color: COLORS.textDark,
    },
    optionArrow: {
        width: 16,
        height: 16,
        tintColor: COLORS.textLight,
    },

    // --- Login Styles ---
    loginContainer: {
        flex: 1,
        backgroundColor: COLORS.backgroundAlt,
    },
    scrollContainer: {
        paddingHorizontal: 24,
        paddingVertical: 24,
        flexGrow: 1,
    },
    promptContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    promptText: {
        ...FONTS.b2,
        color: COLORS.textLight,
    },
    promptLink: {
        color: COLORS.link,
        fontFamily: 'Inter-Bold',
    },
    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 24,
        elevation: 5,
        shadowColor: COLORS.N700,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        width: '100%',
    },
    input: {
        ...FONTS.b1,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingVertical: SIZES.space,
        marginBottom: 16,
        color: COLORS.textDark,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
    },
    inputPassword: {
        ...FONTS.b1,
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: SIZES.space,
        color: COLORS.textDark,
    },
    eyeButton: {
        padding: 12,
    },
    eyeIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.textDark,
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginTop: 8,
        marginBottom: 20,
    },
    forgotPasswordText: {
        ...FONTS.b3,
        color: COLORS.link,
        fontFamily: 'Inter-SemiBold',
    },
    loginButton: {
        backgroundColor: COLORS.secondary,
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
    },
    loginButtonText: {
        ...FONTS.b1_semibold,
        color: COLORS.black,
    },
    dividerText: {
        ...FONTS.b3,
        color: COLORS.N400,
        textAlign: 'center',
        marginVertical: 32,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        marginHorizontal: 12,
        elevation: 4,
        shadowColor: COLORS.N700,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    facebookButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 12,
        elevation: 4,
        shadowColor: COLORS.N700,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        backgroundColor: COLORS.white,
    },
    socialIcon: {
        width: 28,
        height: 28,
    },
    facebookIcon: {
        width: 28,
        height: 28,
    },
    
    // Toast
    toastContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 9999,
    },
    toastContent: {
        backgroundColor: COLORS.G600,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
    },
    toastText: {
        ...FONTS.b2_semibold,
        color: 'white',
        marginLeft: 10,
    },
    toastIcon: {
        width: 20,
        height: 20,
        tintColor: 'white',
    },
});

export default WishlistScreen;