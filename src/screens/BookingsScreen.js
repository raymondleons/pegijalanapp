import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import appTheme, { FONTS, SIZES } from '../constants/theme';

const { COLORS } = appTheme;

const LoginPrompt = () => {
    const navigation = useNavigation();
    const { login } = useAuth();
    const { t } = useLocalization() || {};
    const insets = useSafeAreaInsets();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Email and password are required.");
            return;
        }
        setIsLoading(true);
        const result = await login(email, password);
        setIsLoading(false);

        if (!result.success) {
            Alert.alert("Login Failed", result.message);
        }
    };

    const translate = (key) => t ? t(key) : key;

    return (
        <SafeAreaView style={styles.loginContainer}>
            <View style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 15 }]}>
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
                        placeholderTextColor="#A0A0A0"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.inputPassword}
                            placeholder={translate('password_placeholder')}
                            placeholderTextColor="#A0A0A0"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
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
                        disabled={isLoading}
                    >
                        {isLoading ? <ActivityIndicator color="#333333" /> : <Text style={styles.loginButtonText}>{translate('login_button')}</Text>}
                    </TouchableOpacity>
                </View>

                <Text style={styles.dividerText}>{translate('or_signin_with')}</Text>

                <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.facebookButton}>
                        <Image source={require('../assets/icons/facebook.png')} style={styles.facebookIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <Image source={require('../assets/icons/google.png')} style={styles.socialIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <Image source={require('../assets/icons/microsoft.png')} style={styles.socialIcon} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const BookingsScreen = () => {
    const { userToken } = useAuth();

    if (!userToken) {
        return <LoginPrompt />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.text}>My Bookings</Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    text: {
        ...FONTS.h2,
        color: COLORS.text_dark,
    },
    loginContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        elevation: 5,
    },
    headerTitle: {
        ...FONTS.h3,
        color: COLORS.black,
        fontWeight: '600',
    },
    scrollContainer: {
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    promptContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    promptText: {
        fontSize: 15,
        color: '#555555',
    },
    promptLink: {
        color: '#6d28d9',
        fontWeight: 'bold',
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
    },
    input: {
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingVertical: 12, // DIUBAH dari 16 menjadi 12
        marginBottom: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 14,
    },
    inputPassword: {
        fontSize: 16,
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 12, // DIUBAH dari 16 menjadi 12
    },
    eyeButton: {
        padding: 12, // Disesuaikan agar seimbang dengan padding input
    },
    eyeIcon: {
        width: 24,
        height: 24,
        tintColor: '#333333',
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginTop: 8,
        marginBottom: 20,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#6d28d9',
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: '#FFD100',
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
    },
    loginButtonText: {
        fontSize: 16,
        color: '#333333',
        fontWeight: 'normal',
    },
    dividerText: {
        fontSize: 14,
        color: '#A0A0A0',
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
        backgroundColor: '#FFFFFF',
        marginHorizontal: 12,
        elevation: 4,
        shadowColor: '#555555',
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
    },
    socialIcon: {
        width: 28,
        height: 28,
    },
    facebookIcon: {
        width: 56,
        height: 56,
    },
});

export default BookingsScreen;