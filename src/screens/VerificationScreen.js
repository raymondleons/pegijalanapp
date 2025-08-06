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
    Platform,
    StatusBar,
    Alert,
    ActivityIndicator,
    ScrollView,
    Animated // Impor Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

// Palet warna dan font (diasumsikan dari file lain)
const COLORS = {
    primary: '#FFD60A',
    white: '#FFFFFF',
    black: '#000000',
    lightGray: '#F8F9FA',
    gray: '#E0E0E0',
    darkGray: '#A0A0A0',
    success: '#4CAF50', // Warna untuk toast sukses
};

const FONTS = {
    h3: { fontSize: 18 },
    body3: { fontSize: 16 },
    body4: { fontSize: 14 },
};

const VerificationScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { verifyOtp, resendOtp } = useAuth();

    const email = route.params?.email || 'emailanda@contoh.com';
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // State untuk custom toast
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const toastOpacity = useRef(new Animated.Value(0)).current;

    const inputs = useRef([]);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Fungsi untuk menampilkan toast
    const showToast = (message) => {
        setToastMessage(message);
        setToastVisible(true);
        Animated.timing(toastOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Sembunyikan toast setelah beberapa detik
        setTimeout(() => {
            hideToast();
        }, 2500);
    };

    // Fungsi untuk menyembunyikan toast
    const hideToast = () => {
        Animated.timing(toastOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setToastVisible(false);
        });
    };

    const handleOtpChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 5) {
            inputs.current[index + 1].focus();
        }

        // Jika digit terakhir (index 5) diisi, panggil verifikasi otomatis
        if (text && index === 5) {
            const finalOtp = newOtp.join('');
            handleVerification(finalOtp);
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1].focus();
        }
    };

    const handleVerification = async (otpCodeFromInput) => {
        const otpCode = otpCodeFromInput || otp.join('');

        if (otpCode.length !== 6) {
            Alert.alert('Error', 'Harap masukkan 6 digit kode OTP.');
            return;
        }

        setIsLoading(true);
        const result = await verifyOtp(email, otpCode);
        setIsLoading(false);

        if (result.success) {
            showToast('Verifikasi Berhasil!');
            // Tunggu sejenak agar pengguna bisa melihat toast, lalu navigasi
            setTimeout(() => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                });
            }, 1500); // Waktu tunda 1.5 detik
        } else {
            Alert.alert('Verifikasi Gagal', result.message);
        }
    };
    
    const handleResend = async () => {
        if (!canResend) return;

        setIsLoading(true);
        const result = await resendOtp(email);
        setIsLoading(false);

        if (result.success) {
            showToast('Kode OTP baru telah dikirim');
            setTimer(60);
            setCanResend(false);
        } else {
            Alert.alert('Gagal', result.message);
        }
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image source={require('../assets/icons/chevron_left.png')} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verifikasi</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.formContainer}>
                        <Text style={styles.infoTitle}>Masukkan 6 digit kode verifikasi</Text>
                        <Text style={styles.infoSubtitle}>
                            Yang dikirimkan ke email Anda <Text style={{fontWeight: 'bold'}}>{email}</Text>
                        </Text>

                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={el => inputs.current[index] = el}
                                    style={styles.otpInput}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    onChangeText={(text) => handleOtpChange(text, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    value={digit}
                                />
                            ))}
                        </View>

                        <View style={styles.resendContainer}>
                            <Text style={styles.resendText}>Tidak menerima kode? </Text>
                            <TouchableOpacity onPress={handleResend} disabled={!canResend}>
                                <Text style={[styles.resendButtonText, { color: canResend ? COLORS.primary : COLORS.darkGray }]}>
                                    Kirim ulang kode {canResend ? '' : `(${timer}s)`}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.bottomContainer}>
                <TouchableOpacity style={styles.verifyButton} onPress={() => handleVerification()} disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator color={COLORS.black} />
                    ) : (
                        <Text style={styles.verifyButtonText}>Verifikasi</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Custom Toast Notification */}
            {toastVisible && (
                <Animated.View style={[styles.toastContainer, { top: insets.top + 10, opacity: toastOpacity }]}>
                    <View style={styles.toastContent}>
                        <Image source={require('../assets/icons/checkmark-circle.png')} style={styles.toastIcon} />
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </View>
                </Animated.View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.lightGray,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: COLORS.primary,
    },
    backButton: {
        padding: 5,
    },
    backIcon: {
        width: 18,
        height: 18,
        tintColor: COLORS.black,
    },
    headerTitle: {
        ...FONTS.h3,
        color: COLORS.black,
        marginLeft: 16,
        fontWeight: '600',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    formContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        margin: 16,
        padding: 20,
        alignItems: 'center',
    },
    infoTitle: {
        ...FONTS.h3,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    infoSubtitle: {
        ...FONTS.body4,
        color: COLORS.darkGray,
        textAlign: 'center',
        marginBottom: 30,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
    },
    otpInput: {
        width: 45,
        height: 55,
        borderWidth: 1,
        borderColor: COLORS.gray,
        borderRadius: 12,
        textAlign: 'center',
        ...FONTS.h3,
        fontWeight: 'bold',
    },
    resendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resendText: {
        ...FONTS.body4,
        color: COLORS.darkGray,
    },
    resendButtonText: {
        ...FONTS.body4,
        fontWeight: 'bold',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: COLORS.lightGray,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    verifyButton: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifyButtonText: {
        color: COLORS.black,
        fontSize: 16,
        fontWeight: 'normal',
    },
    // Styles untuk Toast
    toastContainer: {
        position: 'absolute',
        // 'bottom' diubah menjadi 'top'
        // top: 40, // Anda bisa menggunakan nilai statis
        // atau dinamis agar aman di semua perangkat:
        // top: insets.top + 10, (ini dipindahkan langsung ke style inline)
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    toastContent: {
        backgroundColor: COLORS.success,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    toastIcon: {
        width: 20,
        height: 20,
        tintColor: COLORS.white,
        marginRight: 10,
    },
    toastText: {
        color: COLORS.white,
        fontWeight: '600',
    },
});

export default VerificationScreen;
