import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    Animated,
    SectionList,
    Modal,
    RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import appTheme, { FONTS, SIZES } from '../constants/theme';
import { WebView } from 'react-native-webview';

// Social media login imports
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { authorize } from 'react-native-app-auth';

const { COLORS } = appTheme;
const IMAGE_BASE_URL = "https://tiket.crelixdigital.com/";

// Client IDs
const WEB_CLIENT_ID = '156350074857-cejo6oec6uta70o0ca4isabvshaaek9j.apps.googleusercontent.com';
const MICROSOFT_CLIENT_ID = 'GANTI_DENGAN_MICROSOFT_CLIENT_ID_ANDA';

// --- Komponen untuk Tampilan Login ---
const LoginPrompt = () => {
    const navigation = useNavigation();
    const { login, loginWithGoogle, loginWithFacebook, loginWithMicrosoft } = useAuth();
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
        Animated.timing(toastOpacity, { 
            toValue: 1, 
            duration: 300, 
            useNativeDriver: true 
        }).start();
        setTimeout(() => hideToast(), 2000);
    };

    const hideToast = () => {
        Animated.timing(toastOpacity, { 
            toValue: 0, 
            duration: 300, 
            useNativeDriver: true 
        }).start(() => setToastVisible(false));
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
        const result = await login(email, password);
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
            console.log("Complete Google Response:", result);
            
            if (!result || !result.data) {
                throw new Error("Format respons Google tidak valid");
            }

            const userInfo = { idToken: result.data.idToken };

            if (!userInfo.idToken) {
                throw new Error("Gagal mendapatkan ID Token dari Google. Respons tidak valid.");
            }

            const loginResult = await loginWithGoogle(userInfo.idToken);
            
            if (loginResult && loginResult.success) {
                onLoginSuccess();
            } else if (loginResult && !loginResult.success) {
                Alert.alert("Login Google Gagal", loginResult.message);
            }

        } catch (error) {
            console.error("Google Sign-In Error Details:", { code: error.code, message: error.message });
            if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
                Alert.alert("Error Google Sign-In", error.message || `Terjadi kesalahan.`);
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
            
            const apiResult = await loginWithFacebook(data.accessToken.toString());
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
            
            const apiResult = await loginWithMicrosoft(result.accessToken);
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
            <View style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 15, justifyContent: 'center' }]}>
                <Text style={styles.headerTitle}>{translate('login_title')}</Text>
            </View>
            
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
                        placeholderTextColor="#888888"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.inputPassword}
                            placeholder={translate('password_placeholder')}
                            placeholderTextColor="#888888"
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
                            <ActivityIndicator color="#333333" />
                        ) : (
                            <Text style={styles.loginButtonText}>{translate('login_button')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.dividerText}>{translate('or_signin_with')}</Text>

                <View style={styles.socialContainer}>
                    <TouchableOpacity
                        style={styles.facebookButton}
                        onPress={handleFacebookSignIn}
                        disabled={anyLoading}
                    >
                        {isFacebookLoading ? (
                            <ActivityIndicator color="#1877F2" />
                        ) : (
                            <Image source={require('../assets/icons/facebook.png')} style={styles.facebookIcon} />
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={handleGoogleSignIn}
                        disabled={anyLoading}
                    >
                        {isGoogleLoading ? (
                            <ActivityIndicator color="#4285F4" />
                        ) : (
                            <Image source={require('../assets/icons/google.png')} style={styles.socialIcon} />
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={handleMicrosoftSignIn}
                        disabled={anyLoading}
                    >
                        {isMicrosoftLoading ? (
                            <ActivityIndicator color="#0078D4" />
                        ) : (
                            <Image source={require('../assets/icons/microsoft.png')} style={styles.socialIcon} />
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {toastVisible && (
                <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, top: insets.top + 20 }]}>
                    <View style={styles.toastContent}>
                        <Image source={require('../assets/icons/checkmark-circle.png')} style={styles.toastIcon} />
                        <Text style={styles.toastText}>Login Sukses!</Text>
                    </View>
                </Animated.View>
            )}
        </SafeAreaView>
    );
};

// --- Komponen Kartu Pesanan ---
const PendingBookingCard = ({ item, navigation, onPay, isPaymentLoading }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isOptionsModalVisible, setOptionsModalVisible] = useState(false);

    const handleDeleteOrder = () => {
        setOptionsModalVisible(false);
        Alert.alert(
            "Hapus Pesanan",
            "Apakah Anda yakin ingin menghapus pesanan ini? Aksi ini tidak dapat dibatalkan.",
            [
                { text: "Batal", style: "cancel" },
                { 
                    text: "Ya, Hapus", 
                    onPress: () => console.log("LOGIC HAPUS PESANAN DISINI UNTUK BOOKING:", item.booking_code),
                    style: "destructive" 
                },
            ]
        );
    };

    const handleHelp = () => {
        setOptionsModalVisible(false);
        navigation.navigate('HelpCenter');
    };
    
    useEffect(() => {
        const createdAt = new Date(item.created_at);
        const expirationTime = new Date(createdAt.getTime() + 60 * 60 * 1000);

        const timerInterval = setInterval(() => {
            const now = new Date();
            const difference = expirationTime - now;

            if (difference <= 0) {
                setTimeLeft("Waktu Habis");
                clearInterval(timerInterval);
                return;
            }

            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            setTimeLeft(formattedTime);
        }, 1000);

        return () => clearInterval(timerInterval);

    }, [item.created_at]);

    return (
        <View style={styles.pendingBookingCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.bookingId}>Order ID: {item.booking_code}</Text>
                <TouchableOpacity onPress={() => setOptionsModalVisible(true)}>
                    <Image source={require('../assets/icons/more.png')} style={styles.moreIcon} />
                </TouchableOpacity>
            </View>
            
            <View style={styles.cardBody}>
                <Image 
                    source={item.main_image_url ? 
                        { uri: `${IMAGE_BASE_URL}${item.main_image_url}` } : 
                        require('../assets/icons/placeholder.png')} 
                    style={styles.tourImage} 
                />
                <View style={styles.tourDetails}>
                    <Text style={styles.tourTitle} numberOfLines={2}>{item.tour_title || 'Tour tidak tersedia'}</Text>
                    <Text style={styles.bookingTotal}>IDR {Number(item.total_price).toLocaleString('id-ID')}</Text>
                </View>
            </View>
            
            <View style={[
                styles.paymentTimer, 
                timeLeft === "Waktu Habis" && styles.paymentTimerExpired // Terapkan gaya jika waktu habis
            ]}>
                <Text style={[
                    styles.timerText,
                    timeLeft === "Waktu Habis" && styles.timerTextExpired // Terapkan gaya teks jika waktu habis
                ]}>
                    {timeLeft === "Waktu Habis"
                        ? "Waktu Pembayaran Sudah Habis"
                        : `Selesaikan Pembayaran dalam ${timeLeft}`
                    }
                </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.helpSection}>
                <Image
                    source={require('../assets/icons/help_illustration.png')}
                    style={styles.helpIcon}
                />
                <View style={styles.helpTextContainer}>
                    <Text style={styles.helpTitle}>Ada kendala di pesanan?</Text>
                    <Text style={styles.helpText}>Kendala darurat bisa selesai 1 jam.</Text>
                    <Text style={styles.helpText}>Kamu bisa terhubung dalam 30 detik.</Text>
                    <TouchableOpacity style={styles.helpButton} onPress={() => navigation.navigate('HelpCenter')}>
                        <Text style={styles.helpButtonText}>Butuh Bantuan? Tanya Teman Jalan</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            <TouchableOpacity 
                style={[
                    styles.payButton, 
                    (isPaymentLoading || timeLeft === "Waktu Habis") && styles.payButtonDisabled
                ]} 
                onPress={() => onPay(item.booking_code)} 
                disabled={isPaymentLoading || timeLeft === "Waktu Habis"}
            >
                {isPaymentLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                ) : (
                    <Text style={styles.payButtonText}>Selesaikan Pembayaran</Text>
                )}
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isOptionsModalVisible}
                onRequestClose={() => setOptionsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setOptionsModalVisible(false)} style={styles.closeButton}>
                                <Image source={require('../assets/icons/close.png')} style={styles.modalCloseIcon} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Pilih Salah Satu</Text>
                        </View>

                        <TouchableOpacity 
                            style={styles.modalOption} 
                            onPress={() => {
                                setOptionsModalVisible(false);
                                navigation.navigate('BookingDetails', { bookingCode: item.booking_code });
                            }}
                        >
                            <Text style={styles.modalOptionText}>Lihat Detail</Text>
                            <Image source={require('../assets/icons/chevron_right.png')} style={styles.optionArrow} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalOption} onPress={handleHelp}>
                            <Text style={styles.modalOptionText}>Butuh Bantuan?</Text>
                            <Image source={require('../assets/icons/chevron_right.png')} style={styles.optionArrow} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalOption} onPress={handleDeleteOrder}>
                            <Text style={[styles.modalOptionText, styles.deleteOptionText]}>Hapus pesanan</Text>
                            <Image source={require('../assets/icons/chevron_right.png')} style={styles.optionArrow} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const CompletedBookingCard = ({ item, navigation }) => {
    const getStatusStyle = (status) => {
        switch (status.toLowerCase()) {
            case 'confirmed': 
                return { 
                    badge: styles.statusConfirmed, 
                    text: styles.statusConfirmedText 
                };
            case 'cancelled': 
                return { 
                    badge: styles.statusCancelled, 
                    text: styles.statusCancelledText 
                };
            default: 
                return { 
                    badge: styles.statusDefault, 
                    text: styles.statusDefaultText 
                };
        }
    };
    
    const statusStyle = getStatusStyle(item.status);

    return (
        <TouchableOpacity 
            style={styles.bookingCard}
            onPress={() => navigation.navigate('BookingDetails', { bookingCode: item.booking_code })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.bookingId}>Order ID: {item.booking_code}</Text>
                <View style={[styles.statusBadge, statusStyle.badge]}>
                    <Text style={[styles.statusText, statusStyle.text]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            
            <View style={styles.cardBody}>
                <Image 
                    source={item.main_image_url ? 
                        { uri: `${IMAGE_BASE_URL}${item.main_image_url}` } : 
                        require('../assets/icons/placeholder.png')} 
                    style={styles.tourImage} 
                />
                <View style={styles.tourDetails}>
                    <Text style={styles.tourTitle} numberOfLines={2}>
                        {item.tour_title || 'Tour tidak tersedia'}
                    </Text>
                    <Text style={styles.bookingDate}>
                        {new Date(item.created_at).toLocaleDateString('id-ID', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// --- Komponen Utama ---
const BookingsScreen = () => {
    const { 
        authenticated, 
        getMyBookings, 
        createDokuPayment,
        isLoading: authLoading 
    } = useAuth();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    
    const [sections, setSections] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState(null);
    const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
    const [payingBookingCode, setPayingBookingCode] = useState(null);
    const [isPaymentLoading, setPaymentLoading] = useState(false);

    const prevAuthenticated = useRef(authenticated);

    const fetchBookings = useCallback(async () => {
        if (!authenticated) {
            setSections([]);
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        try {
            const result = await getMyBookings();
            if (result.success) {
                const pending = result.data.filter(b => b.status === 'pending_payment');
                const completed = result.data.filter(b => b.status !== 'pending_payment');
                
                const newSections = [];
                if (pending.length > 0) {
                    newSections.push({ 
                        title: 'Menunggu Pembayaran', 
                        data: pending, 
                        type: 'pending' 
                    });
                }
                if (completed.length > 0) {
                    newSections.push({ 
                        title: 'Riwayat Pesanan', 
                        data: completed, 
                        type: 'completed' 
                    });
                }
                setSections(newSections);
            } else {
                setError(result.message || 'Gagal mengambil data pesanan');
            }
        } catch (e) {
            setError(e.message || 'Terjadi kesalahan saat mengambil data');
            console.error("Fetch bookings error:", e);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [authenticated, getMyBookings]);

    useEffect(() => {
        if (!prevAuthenticated.current && authenticated) {
            fetchBookings();
        }
        prevAuthenticated.current = authenticated;
    }, [authenticated, fetchBookings]);

    useFocusEffect(
        useCallback(() => {
            if (authenticated) {
                fetchBookings();
            } else {
                setSections([]);
            }
        }, [authenticated, fetchBookings])
    );

    const handlePay = async (bookingCode) => {
        setPayingBookingCode(bookingCode);
        setPaymentLoading(true);
        try {
            const result = await createDokuPayment({ bookingCode });
            if (result.success && result.paymentUrl) {
                setPaymentUrl(result.paymentUrl);
                setPaymentModalVisible(true);
            } else {
                Alert.alert(
                    "Gagal Memuat Pembayaran", 
                    result.message || "Telah terjadi kesalahan."
                );
            }
        } catch (e) {
            Alert.alert(
                "Error", 
                "Gagal memproses pembayaran. Silakan coba lagi."
            );
            console.error("Payment error:", e);
        } finally {
            setPaymentLoading(false);
            setPayingBookingCode(null);
        }
    };

    const handleWebViewNavigation = (navState) => {
        const { url } = navState;
        if (url.includes('your-redirect-url.com/finish')) { 
            setPaymentModalVisible(false);
            Alert.alert(
                'Pembayaran Diproses', 
                'Status pesanan Anda akan segera diperbarui.'
            );
            setTimeout(() => fetchBookings(), 3000);
        }
    };

    const renderItem = ({ item, section }) => {
        return section.type === 'pending' ? (
            <PendingBookingCard 
                item={item} 
                navigation={navigation} 
                onPay={handlePay}
                isPaymentLoading={isPaymentLoading && payingBookingCode === item.booking_code}
            />
        ) : (
            <CompletedBookingCard 
                item={item} 
                navigation={navigation} 
            />
        );
    };

    const renderSectionHeader = ({ section: { title } }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
    );

    if (!authenticated) {
        return <LoginPrompt />;
    }

    const renderContent = () => {
        if (authLoading || (isLoading && sections.length === 0)) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Memuat data pesanan...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centered}>
                    <Image 
                        source={require('../assets/icons/no-data.png')} 
                        style={styles.emptyIcon} 
                    />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                        onPress={fetchBookings} 
                        style={styles.retryButton}
                    >
                        <Text style={styles.retryButtonText}>Coba Lagi</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (sections.length === 0) {
            return (
                <ScrollView
                    contentContainerStyle={styles.centered}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={fetchBookings}
                            colors={[COLORS.primary]}
                            tintColor={COLORS.primary}
                        />
                    }
                >
                    <Image 
                        source={require('../assets/icons/no-data.png')} 
                        style={styles.emptyIcon} 
                    />
                    <Text style={styles.emptyText}>Anda belum memiliki pesanan.</Text>
                    <TouchableOpacity 
                        style={styles.exploreButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.exploreButtonText}>Pesan Lagi Yuk!</Text>
                    </TouchableOpacity>
                </ScrollView>
            );
        }

        return (
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.booking_code}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchBookings}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
                stickySectionHeadersEnabled={false}
            />
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 15 }]}>
                <View style={{ width: 28 }} />
                <Text style={styles.headerTitle}>Pesanan Saya</Text>
                <TouchableOpacity>
                    <Image 
                        source={require('../assets/icons/order_history.png')} 
                        style={styles.headerIcon} 
                    />
                </TouchableOpacity>
            </View>
            
            <View style={styles.content}>
                {renderContent()}
            </View>
            
            <Modal 
                visible={isPaymentModalVisible} 
                animationType="slide" 
                onRequestClose={() => setPaymentModalVisible(false)}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.webviewHeader}>
                        <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                            <Image 
                                source={require('../assets/icons/close.png')} 
                                style={styles.closeIcon} 
                            />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Selesaikan Pembayaran</Text>
                        <View style={{ width: 24 }}/>
                    </View>
                    {paymentUrl && (
                        <WebView 
                            source={{ uri: paymentUrl }} 
                            onNavigationStateChange={handleWebViewNavigation}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <ActivityIndicator 
                                    size="large" 
                                    color={COLORS.primary} 
                                    style={{ flex: 1 }} 
                                />
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F0F2F5' 
    },
    content: { 
        flex: 1 
    },
    centered: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20 
    },
    loadingText: { 
        marginTop: 16, 
        color: COLORS.text_gray, 
        ...FONTS.body4 
    },
    errorText: { 
        textAlign: 'center', 
        marginBottom: 20, 
        color: COLORS.error, 
        ...FONTS.body4 
    },
    retryButton: { 
        backgroundColor: COLORS.primary, 
        paddingVertical: 12, 
        paddingHorizontal: 32, 
        borderRadius: 8 
    },
    retryButtonText: { 
        color: '#FFFFFF', 
        ...FONTS.h5 
    },
    emptyText: { 
        textAlign: 'center', 
        color: COLORS.text_gray, 
        ...FONTS.body4, 
        marginTop: 16 
    },
    exploreButton: { 
        marginTop: 20, 
        backgroundColor: COLORS.primary, 
        paddingVertical: 12, 
        paddingHorizontal: 32, 
        borderRadius: 8 
    },
    exploreButtonText: { 
        color: '#FFFFFF', 
        ...FONTS.h5 
    },
    emptyIcon: { 
        width: 120, 
        height: 120, 
        resizeMode: 'contain', 
        marginBottom: 16, 
        tintColor: COLORS.text_gray 
    },
    listContainer: { 
        paddingHorizontal: 16, 
        paddingBottom: 16 
    },
    sectionHeader: { 
        ...FONTS.h3, 
        color: COLORS.text_dark, 
        marginVertical: 16, 
        marginTop: 24 
    },
    bookingCard: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 12, 
        elevation: 3, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4 
    },
    pendingBookingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12 
    },
    bookingId: { 
        ...FONTS.body5, 
        color: '#5F6368'
    },
    moreIcon: { 
        width: 20, 
        height: 20, 
        tintColor: COLORS.text_gray 
    },
    cardBody: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    tourImage: { 
        width: 60, 
        height: 60, 
        borderRadius: 8, 
        marginRight: 12 
    },
    tourDetails: { 
        flex: 1 
    },
    tourTitle: { 
        ...FONTS.h4, 
        color: COLORS.text_dark, 
        marginBottom: 4 
    },
    bookingTotal: { 
        ...FONTS.h4, 
        color: COLORS.primary, 
        fontWeight: 'bold' 
    },
    bookingDate: { 
        ...FONTS.body5, 
        color: COLORS.text_gray, 
        marginTop: 4 
    },
    paymentTimer: {
        backgroundColor: '#FFF8E1',
        padding: 8,
        borderRadius: 4,
        marginVertical: 12,
    },
    timerText: {
        ...FONTS.body4,
        color: '#FFA000',
        fontWeight: '500',
        textAlign: 'center',
    },
    paymentTimerExpired: {
        backgroundColor: '#FCE8E6', // Latar merah muda
    },
    timerTextExpired: {
        color: '#C62828', // Warna merah tua
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#EAEAEA',
        marginVertical: 12,
    },
    helpSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA', 
        borderRadius: 8,            
        padding: 12,                
        borderWidth: 1,             
        borderColor: '#EAEAEA',      
        marginBottom: 12,           
    },
    helpIcon: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
        marginRight: 12,
    },
    helpTextContainer: {
        flex: 1,
    },
    helpTitle: {
        ...FONTS.h5,
        fontWeight: '600',
        marginBottom: 8,
        color: COLORS.black,
    },
    helpText: {
        ...FONTS.body5,
        color: COLORS.text_gray,
        marginBottom: 4,
    },
    helpButton: {
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    helpButtonText: {
        ...FONTS.h5,
        color: COLORS.primary,
        fontWeight: '600',
    },
    payButton: { 
        backgroundColor: COLORS.primary, 
        borderRadius: 8, 
        paddingVertical: 12, 
        marginTop: 16, 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    payButtonDisabled: { 
        backgroundColor: COLORS.gray 
    },
    payButtonText: { 
        ...FONTS.h5, 
        color: COLORS.white, 
        fontWeight: 'bold' 
    },
    statusBadge: { 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: 12 
    },
    statusConfirmed: { 
        backgroundColor: '#E6F4EA' 
    },
    statusCancelled: { 
        backgroundColor: '#FCE8E6' 
    },
    statusDefault: { 
        backgroundColor: '#E8EAED' 
    },
    statusText: { 
        ...FONTS.caption, 
        textTransform: 'capitalize', 
        fontWeight: 'bold' 
    },
    statusConfirmedText: { 
        color: '#34A853' 
    },
    statusCancelledText: { 
        color: '#EA4335' 
    },
    statusDefaultText: { 
        color: '#5F6368' 
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: COLORS.secondary, 
        elevation: 2, 
        paddingHorizontal: 16, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 2 
    },
    headerTitle: { 
        ...FONTS.h3, 
        color: COLORS.black, 
        fontWeight: '600' 
    },
    headerIcon: { 
        width: 28, 
        height: 28, 
        tintColor: COLORS.black 
    },
    webviewHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: SIZES.padding, 
        backgroundColor: COLORS.white, 
        borderBottomWidth: 1, 
        borderBottomColor: COLORS.border 
    },
    closeIcon: { 
        width: 24, 
        height: 24, 
        tintColor: COLORS.text_dark 
    },
    loginContainer: { 
        flex: 1, 
        backgroundColor: '#F8F9FA' 
    },
    scrollContainer: { 
        paddingHorizontal: 24, 
        paddingVertical: 24, 
        flexGrow: 1, 
    },
    promptContainer: { 
        alignItems: 'center', 
        marginBottom: 16 
    },
    promptText: { 
        fontSize: 15, 
        color: '#555555' 
    },
    promptLink: { 
        color: '#6d28d9', 
        fontWeight: 'bold' 
    },
    formCard: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        padding: 24, 
        elevation: 5, 
        shadowColor: '#555555', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 10, 
        width: '100%' 
    },
    input: { 
        fontSize: 16, 
        borderWidth: 1, 
        borderColor: '#E0E0E0', 
        borderRadius: 14, 
        paddingHorizontal: 20, 
        paddingVertical: 12, 
        marginBottom: 16,
        color: '#333333',
    },
    passwordContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#E0E0E0', 
        borderRadius: 14 
    },
    inputPassword: { 
        fontSize: 16, 
        flex: 1, 
        paddingHorizontal: 20, 
        paddingVertical: 12,
        color: '#333333',
    },
    eyeButton: { 
        padding: 12 
    },
    eyeIcon: { 
        width: 24, 
        height: 24, 
        tintColor: '#333333' 
    },
    forgotPasswordButton: { 
        alignSelf: 'flex-end', 
        marginTop: 8, 
        marginBottom: 20 
    },
    forgotPasswordText: { 
        fontSize: 14, 
        color: '#6d28d9', 
        fontWeight: '600' 
    },
    loginButton: { 
        backgroundColor: '#FFD100', 
        borderRadius: 14, 
        paddingVertical: 18, 
        alignItems: 'center' 
    },
    loginButtonText: { 
        fontSize: 16, 
        color: '#333333', 
        fontWeight: 'normal' 
    },
    dividerText: { 
        fontSize: 14, 
        color: '#A0A0A0', 
        textAlign: 'center', 
        marginVertical: 32 
    },
    socialContainer: { 
        flexDirection: 'row', 
        justifyContent: 'center' 
    },
    socialButton: { 
        width: 56, 
        height: 56, 
        borderRadius: 28, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF', 
        marginHorizontal: 12, 
        elevation: 4, 
        shadowColor: '#555555', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 5 
    },
    facebookButton: { 
        width: 56, 
        height: 56, 
        borderRadius: 28, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginHorizontal: 12 
    },
    socialIcon: { 
        width: 28, 
        height: 28 
    },
    facebookIcon: { 
        width: 56, 
        height: 56 
    },
    toastContainer: { 
        position: 'absolute', 
        left: 20, 
        right: 20, 
        alignItems: 'center', 
        zIndex: 9999 
    },
    toastContent: { 
        backgroundColor: '#2E7D32', 
        paddingHorizontal: 20, 
        paddingVertical: 12, 
        borderRadius: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        elevation: 5 
    },
    toastText: { 
        color: 'white', 
        fontSize: 14, 
        fontWeight: '600', 
        marginLeft: 10 
    },
    toastIcon: { 
        width: 20, 
        height: 20, 
        tintColor: 'white' 
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 15,
        paddingHorizontal: SIZES.padding,
        paddingBottom: 30,
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    closeButton: {
        padding: 5,
        marginRight: 10,
    },
    modalCloseIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.text_gray,
    },
    modalTitle: {
        ...FONTS.h4,
        fontWeight: 'bold',
        color: COLORS.text_dark,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalOptionText: {
        ...FONTS.body3,
        color: COLORS.text_dark,
    },
    optionArrow: {
        width: 16,
        height: 16,
        tintColor: COLORS.text_gray,
    },
    deleteOptionText: {
        color: COLORS.error,
    },
});

export default BookingsScreen;