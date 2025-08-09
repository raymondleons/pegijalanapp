// src/screens/ChangePasswordScreen.js
import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    TouchableOpacity, 
    Image, 
    StatusBar,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import appTheme, { SIZES, FONTS } from '../constants/theme';
import { useLocalization } from '../context/LocalizationContext';
import { useAuth } from '../context/AuthContext';

const { COLORS } = appTheme;

// Komponen Toast Kustom
const Toast = ({ message, type, visible }) => {
    if (!visible) return null;
    const toastStyle = type === 'success' ? styles.toastSuccess : styles.toastError;
    const textStyle = type === 'success' ? styles.toastTextSuccess : styles.toastTextError;
    return (
        <View style={[styles.toastContainer, toastStyle]}>
            <Text style={textStyle}>{message}</Text>
        </View>
    );
};

const PasswordInputItem = ({ placeholder, value, onChangeText, isVisible, onToggleVisibility }) => {
    return (
        <View style={styles.itemContainer}>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.text_light}
                secureTextEntry={!isVisible}
                value={value}
                onChangeText={onChangeText}
            />
            <TouchableOpacity onPress={onToggleVisibility}>
                <Image
                    source={isVisible ? require('../assets/icons/eye.png') : require('../assets/icons/eye-off.png')}
                    style={styles.eyeIcon}
                />
            </TouchableOpacity>
        </View>
    );
};


const ChangePasswordScreen = () => {
    const navigation = useNavigation();
    const { t } = useLocalization() || {};
    const insets = useSafeAreaInsets();
    // Panggil 'changePassword' dari context
    const { changePassword } = useAuth(); 

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });

    const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const showToast = (message, type = 'error') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: '', type: '' }), 3000);
    };

    const handleUpdate = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Semua kolom harus diisi.');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Kata sandi baru dan konfirmasi tidak cocok.');
            return;
        }
        if (newPassword.length < 6) {
            showToast('Kata sandi baru minimal harus 6 karakter.');
            return;
        }

        setIsLoading(true);
        try {
            // Panggil fungsi context dengan parameter yang benar
            const result = await changePassword(currentPassword, newPassword);
            
            setIsLoading(false);
            showToast(result.message, 'success');
            
            setTimeout(() => navigation.goBack(), 2000);

        } catch (error) {
            setIsLoading(false);
            showToast(error.message);
            console.error("Password Update Error:", error);
        }
    };

    if (!t) {
        return <SafeAreaView style={styles.safeArea}><View style={styles.container}><Text>Loading...</Text></View></SafeAreaView>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />
            
            <View style={[styles.header, { paddingTop: insets.top + SIZES.base, paddingBottom: SIZES.padding }]}>
                <View style={styles.headerSide}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Image source={require('../assets/icons/chevron_left.png')} style={styles.backIcon} />
                    </TouchableOpacity>
                </View>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{t('change_password')}</Text>
                </View>
                <View style={styles.headerSide} />
            </View>

            <View style={styles.container}>
                <View style={styles.menuCard}>
                    <PasswordInputItem
                        placeholder={t('current_password')}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        isVisible={isCurrentPasswordVisible}
                        onToggleVisibility={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}
                    />
                    <View style={styles.divider} />
                    <PasswordInputItem
                        placeholder={t('new_password')}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        isVisible={isNewPasswordVisible}
                        onToggleVisibility={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
                    />
                    <View style={styles.divider} />
                    <PasswordInputItem
                        placeholder={t('confirm_password')}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        isVisible={isConfirmPasswordVisible}
                        onToggleVisibility={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    />
                </View>
            </View>

            <View style={styles.bottomActionContainer}>
                <TouchableOpacity 
                    style={[styles.updateButton, isLoading && styles.disabledButton]} 
                    onPress={handleUpdate}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={COLORS.black} />
                    ) : (
                        <Text style={styles.updateButtonText}>{t('update_password')}</Text>
                    )}
                </TouchableOpacity>
            </View>

            <Toast 
                visible={toast.visible} 
                message={toast.message} 
                type={toast.type} 
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.secondary, },
    container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding, },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, backgroundColor: COLORS.secondary, },
    headerSide: { flex: 1, },
    headerCenter: { flex: 3, alignItems: 'center', },
    backButton: { alignSelf: 'flex-start', padding: SIZES.base, },
    backIcon: { width: SIZES.h3, height: SIZES.h3, tintColor: COLORS.darkGray, },
    headerTitle: { ...FONTS.h3, color: COLORS.black, fontWeight: '600', },
    menuCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radius, marginBottom: SIZES.padding, overflow: 'hidden', },
    itemContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, height: 55, },
    input: { flex: 1, height: '100%', ...FONTS.body3, color: COLORS.text_dark, },
    eyeIcon: { width: SIZES.h2, height: SIZES.h2, tintColor: COLORS.gray, },
    divider: { height: 1, backgroundColor: COLORS.lightGray, marginLeft: SIZES.padding, },
    bottomActionContainer: { padding: SIZES.padding, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border, },
    updateButton: { backgroundColor: COLORS.secondary, padding: SIZES.base * 1.5, borderRadius: SIZES.radius * 0.5, alignItems: 'center', justifyContent: 'center', },
    disabledButton: { opacity: 0.7, },
    updateButtonText: { ...FONTS.h4, color: COLORS.black, fontWeight: 'bold', },
    toastContainer: { position: 'absolute', bottom: SIZES.padding * 5, left: SIZES.padding, right: SIZES.padding, padding: SIZES.padding, borderRadius: SIZES.radius, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, },
    toastSuccess: { backgroundColor: '#D4EDDA', borderColor: '#C3E6CB', borderWidth: 1, },
    toastError: { backgroundColor: '#F8D7DA', borderColor: '#F5C6CB', borderWidth: 1, },
    toastTextSuccess: { color: '#155724', ...FONTS.body4, textAlign: 'center', fontWeight: '600', },
    toastTextError: { color: '#721C24', ...FONTS.body4, textAlign: 'center', fontWeight: '600', },
});

export default ChangePasswordScreen;