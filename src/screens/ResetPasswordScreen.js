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
    Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

// Palet warna dan font (diasumsikan dari file lain)
const COLORS = {
    primary: '#ffde2f',
    secondary: '#ffde2f', // Ditambahkan untuk konsistensi
    white: '#FFFFFF',
    black: '#000000',
    lightGray: '#F8F9FA',
    gray: '#E0E0E0',
    darkGray: '#A0A0A0',
    success: '#2E7D32',
};

const FONTS = {
    h3: { fontSize: 18, fontWeight: '600' },
    body3: { fontSize: 16 },
    body4: { fontSize: 14 },
};

// --- Custom Toast Component ---
const Toast = ({ message, isVisible, onClose }) => {
    const toastOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible) {
            Animated.timing(toastOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            const timer = setTimeout(() => {
                Animated.timing(toastOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    if (onClose) onClose();
                });
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
            <View style={styles.toastContent}>
                <Image source={require('../assets/icons/checkmark-circle.png')} style={styles.toastIcon} />
                <Text style={styles.toastText}>{message}</Text>
            </View>
        </Animated.View>
    );
};

const ResetPasswordScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { resetPassword } = useAuth();

    const email = route.params?.email || '';
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleResetPassword = async () => {
        if (!otp || !password || !confirmPassword) {
            Alert.alert('Error', 'Harap isi semua kolom.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Kata sandi baru tidak cocok.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Kata sandi baru minimal harus 6 karakter.');
            return;
        }

        setIsLoading(true);
        const result = await resetPassword(email, otp, password);
        setIsLoading(false);

        if (result.success) {
            setToastMessage(result.message);
            setToastVisible(true);
            setTimeout(() => {
                navigation.navigate('Login');
            }, 1500);
        } else {
            Alert.alert('Gagal', result.message);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />
            
            {/* Header dengan style yang disesuaikan */}
            <View style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 15 }]}>
                <View style={styles.headerSide}>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
                        <Image source={require('../assets/icons/chevron_left.png')} style={styles.backIcon} />
                    </TouchableOpacity>
                </View>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Atur Ulang Kata Sandi</Text>
                </View>
                <View style={styles.headerSide} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.formContainer}>
                        <Text style={styles.infoSubtitle}>
                            Masukkan OTP yang dikirim ke <Text style={{fontWeight: 'bold'}}>{email}</Text> dan kata sandi baru Anda.
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Kode OTP"
                            placeholderTextColor={COLORS.darkGray}
                            keyboardType="number-pad"
                            maxLength={6}
                            value={otp}
                            onChangeText={setOtp}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Kata Sandi Baru"
                            placeholderTextColor={COLORS.darkGray}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Konfirmasi Kata Sandi Baru"
                            placeholderTextColor={COLORS.darkGray}
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>

                    <View style={styles.bottomContainer}>
                        <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator color={COLORS.black} />
                            ) : (
                                <Text style={styles.buttonText}>Reset Kata Sandi</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Toast 
                message={toastMessage} 
                isVisible={toastVisible} 
                onClose={() => setToastVisible(false)} 
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.lightGray,
    },
    // Header style yang disesuaikan
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: COLORS.secondary,
        elevation: 5,
        shadowColor: '#555555',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    headerSide: {
        flex: 1,
    },
    headerCenter: {
        flex: 2,
        alignItems: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        padding: 8,
    },
    backIcon: {
        width: 18,
        height: 18,
        tintColor: COLORS.black,
    },
    headerTitle: {
        ...FONTS.h3,
        color: COLORS.black,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    formContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        margin: 16,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#555555',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    infoSubtitle: {
        ...FONTS.body4,
        color: COLORS.darkGray,
        textAlign: 'center',
        marginBottom: 30,
    },
    input: {
        width: '100%',
        height: 55,
        borderWidth: 1,
        borderColor: COLORS.gray,
        borderRadius: 12,
        paddingHorizontal: 15,
        ...FONTS.body3,
        color: COLORS.black,
        marginBottom: 15,
    },
    bottomContainer: {
        padding: 20,
        backgroundColor: COLORS.lightGray,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    button: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: COLORS.black,
        ...FONTS.body3,
        fontWeight: 'normal',
    },
    // Styles untuk Toast
    toastContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    toastContent: {
        backgroundColor: COLORS.success,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    toastText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 10,
    },
    toastIcon: {
        width: 20,
        height: 20,
        tintColor: COLORS.white,
    },
});

export default ResetPasswordScreen;