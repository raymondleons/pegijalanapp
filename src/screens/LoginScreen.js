import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Image,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    StatusBar,
    Alert,
    ActivityIndicator,
    Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import appTheme, { SIZES, FONTS } from '../constants/theme';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { authorize } from 'react-native-app-auth';

const { COLORS } = appTheme;

const WEB_CLIENT_ID = '156350074857-cejo6oec6uta70o0ca4isabvshaaek9j.apps.googleusercontent.com';
const MICROSOFT_CLIENT_ID = 'ID_KLIEN_MICROSOFT_ANDA';

const LoginScreen = () => {
    const navigation = useNavigation();
    const { login: contextLogin, loginWithGoogle, loginWithFacebook, loginWithMicrosoft } = useAuth();
    const { t } = useLocalization() || {};
    const insets = useSafeAreaInsets();
    
    // DIPERBAIKI: Menambahkan tanda '=' yang hilang
    const [loginInput, setLoginInput] = useState('');
    
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setGoogleLoading] = useState(false);
    const [isFacebookLoading, setFacebookLoading] = useState(false);
    const [isMicrosoftLoading, setMicrosoftLoading] = useState(false);

    // State untuk Success Toast
    const [toastVisible, setToastVisible] = useState(false);
    const toastOpacity = useRef(new Animated.Value(0)).current;

    // State untuk Error Toast
    const [errorToastVisible, setErrorToastVisible] = useState(false);
    const [errorToastMessage, setErrorToastMessage] = useState('');
    const errorToastOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: WEB_CLIENT_ID,
            offlineAccess: true,
            scopes: ['profile', 'email'],
        });
    }, []);

    const showSuccessToast = () => {
        setToastVisible(true);
        Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        setTimeout(() => hideSuccessToast(), 2000);
    };

    const hideSuccessToast = () => {
        Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToastVisible(false));
    };

    const showErrorToast = (message) => {
        setErrorToastMessage(message);
        setErrorToastVisible(true);
        Animated.timing(errorToastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        setTimeout(() => hideErrorToast(), 3000);
    };

    const hideErrorToast = () => {
        Animated.timing(errorToastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setErrorToastVisible(false));
    };

    const handleLogin = async () => {
        if (!loginInput || !password) {
            showErrorToast("Email dan password tidak boleh kosong.");
            return;
        }
        setIsLoading(true);
        const result = await contextLogin(loginInput, password);
        setIsLoading(false);
        if (result && result.success) {
            showSuccessAndNavigate();
        } else if (result && !result.success) {
            showErrorToast(result.message);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const { idToken } = await GoogleSignin.signIn();
            if (!idToken) throw new Error("Gagal mendapatkan ID Token dari Google.");

            const loginResult = await loginWithGoogle(idToken);
            if (loginResult && loginResult.success) {
                showSuccessAndNavigate();
            } else if (loginResult && !loginResult.success) {
                showErrorToast(loginResult.message);
            }
        } catch (error) {
            if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
                console.error("Google Sign-In Error:", error);
                showErrorToast(error.message || `Terjadi kesalahan (Kode: ${error.code})`);
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleFacebookSignIn = async () => {
        setFacebookLoading(true);
        try {
            const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
            if (result.isCancelled) {
                setFacebookLoading(false);
                return;
            }
            const data = await AccessToken.getCurrentAccessToken();
            if (!data) throw new Error('Gagal mendapatkan access token dari Facebook.');

            const apiResult = await contextLoginWithFacebook(data.accessToken.toString());
            if (apiResult && apiResult.success) {
                showSuccessAndNavigate();
            } else if (apiResult && !apiResult.success) {
                showErrorToast(apiResult.message);
            }
        } catch (error) {
            console.error("Facebook Login Error:", error);
            showErrorToast(error.message || "Terjadi kesalahan.");
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
            if (apiResult && apiResult.success) {
                showSuccessAndNavigate();
            } else if (apiResult && !apiResult.success) {
                showErrorToast(apiResult.message);
            }
        } catch (error) {
            console.error("Microsoft Login Error:", error);
            showErrorToast(error.message || "Terjadi kesalahan.");
        } finally {
            setMicrosoftLoading(false);
        }
    };

    const showSuccessAndNavigate = () => {
        showSuccessToast();
        setTimeout(() => {
            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            });
        }, 1500);
    };

    const translate = (key) => t ? t(key) : key;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 15 }]}>
                    <View style={styles.headerSide}><TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Image source={require('../assets/icons/chevron_left.png')} style={styles.backIcon} /></TouchableOpacity></View>
                    <View style={styles.headerCenter}><Text style={styles.headerTitle}>{translate('login_title')}</Text></View>
                    <View style={styles.headerSide} />
                </View>

                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        <View style={styles.promptContainer}><Text style={styles.promptText}>{translate('dont_have_account')}<Text style={styles.promptLink} onPress={() => navigation.navigate('Register')}>{' '}{translate('signup')}</Text></Text></View>
                        <View style={styles.formCard}>
                            <TextInput style={styles.input} placeholder={translate('Email')} placeholderTextColor="#A0A0A0" value={loginInput} onChangeText={setLoginInput} keyboardType="email-address" autoCapitalize="none"/>
                            <View style={styles.passwordContainer}>
                                <TextInput style={styles.inputPassword} placeholder={translate('password_placeholder')} placeholderTextColor="#A0A0A0" value={password} onChangeText={setPassword} secureTextEntry={!showPassword}/>
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}><Image source={showPassword ? require('../assets/icons/eye.png') : require('../assets/icons/eye-off.png')} style={styles.eyeIcon}/></TouchableOpacity>
                            </View>
                            <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => navigation.navigate('ForgotPassword')}><Text style={styles.forgotPasswordText}>{translate('forgot_password')}</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading || isGoogleLoading || isFacebookLoading || isMicrosoftLoading}>
                                {isLoading ? <ActivityIndicator color="#333333" /> : <Text style={styles.loginButtonText}>{translate('login_button')}</Text>}
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.dividerText}>{translate('or_signin_with')}</Text>
                        <View style={styles.socialContainer}>
                            <TouchableOpacity style={styles.facebookButton} onPress={handleFacebookSignIn} disabled={isLoading || isGoogleLoading || isFacebookLoading || isMicrosoftLoading}>{isFacebookLoading ? <ActivityIndicator color="#1877F2" /> : <Image source={require('../assets/icons/facebook.png')} style={styles.facebookIcon} />}</TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn} disabled={isLoading || isGoogleLoading || isFacebookLoading || isMicrosoftLoading}>{isGoogleLoading ? <ActivityIndicator color="#4285F4" /> : <Image source={require('../assets/icons/google.png')} style={styles.socialIcon} />}</TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton} onPress={handleMicrosoftSignIn} disabled={isLoading || isGoogleLoading || isFacebookLoading || isMicrosoftLoading}>{isMicrosoftLoading ? <ActivityIndicator color="#0078D4" /> : <Image source={require('../assets/icons/microsoft.png')} style={styles.socialIcon} />}</TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>

            {/* Success Toast */}
            {toastVisible && (
                <Animated.View style={[styles.toastContainer, { top: insets.top + 10, opacity: toastOpacity }]}>
                    <View style={styles.toastContent}>
                        <Image source={require('../assets/icons/checkmark-circle.png')} style={styles.toastIcon} />
                        <Text style={styles.toastText}>Login Sukses!</Text>
                    </View>
                </Animated.View>
            )}

            {/* Error Toast */}
            {errorToastVisible && (
                <Animated.View style={[styles.toastContainer, { top: insets.top + 10, opacity: errorToastOpacity }]}>
                    <View style={[styles.toastContent, styles.errorToast]}>
                        <Text style={styles.toastText}>{errorToastMessage}</Text>
                    </View>
                </Animated.View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.secondary },
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: COLORS.secondary, elevation: 5, },
    headerSide: { flex: 1 },
    headerCenter: { flex: 2, alignItems: 'center' },
    backButton: { alignSelf: 'flex-start', padding: 8 },
    backIcon: { width: 18, height: 18, tintColor: COLORS.black },
    headerTitle: { ...FONTS.h3, color: COLORS.black, fontWeight: '600' },
    scrollContainer: { paddingHorizontal: 24, paddingBottom: 40 },
    promptContainer: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
    promptText: { fontSize: 15, color: '#333333' },
    promptLink: { color: COLORS.primary, fontWeight: '600' },
    formCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, elevation: 5, shadowColor: '#555555', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
    input: { fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, marginBottom: 16, color: '#333333', },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 14 },
    inputPassword: { fontSize: 16, flex: 1, paddingHorizontal: 20, paddingVertical: 12, color: '#333333', },
    eyeButton: { padding: 12 },
    eyeIcon: { width: 24, height: 24, tintColor: '#333333' },
    forgotPasswordButton: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 20 },
    forgotPasswordText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
    loginButton: { backgroundColor: COLORS.secondary, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
    loginButtonText: { fontSize: 16, color: '#333333', fontWeight: 'normal' },
    dividerText: { fontSize: 14, color: '#A0A0A0', textAlign: 'center', marginVertical: 32 },
    socialContainer: { flexDirection: 'row', justifyContent: 'center' },
    socialButton: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 12, elevation: 4, shadowColor: '#555555', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
    facebookButton: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
    socialIcon: { width: 28, height: 28 },
    facebookIcon: { width: 56, height: 56 },
    toastContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 999
        // DIPERBAIKI: 'bottom' dihapus agar posisi bisa diatur dari inline style
    },
    toastContent: { backgroundColor: '#2E7D32', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, },
    toastText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    toastIcon: {
        width: 20,
        height: 20,
        tintColor: 'white',
        marginRight: 10,
    },
    errorToast: {
        backgroundColor: '#D32F2F',
    },
});

export default LoginScreen;