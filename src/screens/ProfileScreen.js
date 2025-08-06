// src/screens/ProfileScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    Switch,
    StatusBar,
    ActivityIndicator,
    Alert,
    Dimensions,
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLocalization } from '../context/LocalizationContext';
import { useAuth } from '../context/AuthContext';
import appTheme, { SIZES, FONTS } from '../constants/theme';

// Impor CountryPicker dari pustaka
import CountryPicker from 'react-native-country-picker-modal';

const { COLORS } = appTheme;
const { width, height } = Dimensions.get('window');

// --- Komponen Input ---
const ProfileInput = ({ label, value, onChangeText, placeholder, editable = true, keyboardType = 'default' }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
            style={[styles.input, !editable && styles.inputDisabled]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.mediumGray}
            editable={editable}
            keyboardType={keyboardType}
        />
    </View>
);

// --- Komponen Toast ---
const Toast = ({ message, isVisible, onClose }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible) {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(2000),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                if (onClose) onClose();
            });
        }
    }, [isVisible, fadeAnim, onClose]);

    if (!isVisible) return null;

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    opacity: fadeAnim,
                    transform: [
                        {
                            translateY: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [50, 0],
                            }),
                        },
                    ],
                },
            ]}
        >
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { t } = useLocalization() || {};
    const { userInfo, updateProfile, refreshUserInfo } = useAuth();
    const insets = useSafeAreaInsets();

    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [showNationalityPicker, setShowNationalityPicker] = useState(false);
    const [selectedNationalityCode, setSelectedNationalityCode] = useState('ID');
    const [selectedNationalityName, setSelectedNationalityName] = useState('Indonesia');
    const [emailUpdates, setEmailUpdates] = useState(true);
    const [smsUpdates, setSmsUpdates] = useState(true);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [countryCode, setCountryCode] = useState('ID');
    const [callingCode, setCallingCode] = useState('62');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            setIsLoading(true);
            await refreshUserInfo();
            setIsLoading(false);
        };
        loadProfile();
    }, []);

    useEffect(() => {
        if (userInfo) {
            const fullName = userInfo.name || '';
            const nameParts = fullName.split(' ').filter(part => part);

            if (nameParts.length > 1) {
                const lastNamePart = nameParts.pop();
                const firstNamePart = nameParts.join(' ');
                setFirstName(firstNamePart);
                setLastName(lastNamePart);
            } else {
                setFirstName(fullName);
                setLastName('');
            }

            setContactNumber(userInfo.phone_number || '');
            if (userInfo.phone_code) {
                setCallingCode(userInfo.phone_code.replace('+', ''));
            }

            if (userInfo.citizenship) {
                setSelectedNationalityName(userInfo.citizenship);
            }
        }
    }, [userInfo]);

    const handleUpdateProfile = async () => {
        if (!userInfo) return;
        setIsUpdating(true);
        try {
            const fullName = `${firstName} ${lastName}`.trim();
            
            const updatedData = {
                name: fullName,
                phone_code: `+${callingCode}`,
                phone_number: contactNumber,
                citizenship: selectedNationalityName,
            };
            
            const result = await updateProfile(userInfo.id, updatedData);

            if (result.success) {
                setToastMessage("Profil berhasil diperbarui!");
                setShowToast(true);
            } else {
                Alert.alert("Error", result.message);
            }
        } catch (error) {
            console.error("Gagal memperbarui profil:", error.message);
            Alert.alert("Error", "Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsUpdating(false);
        }
    };

    const onSelectCountry = (country) => {
        setCountryCode(country.cca2);
        setCallingCode(country.callingCode[0]);
        setShowCountryPicker(false);
    };

    const onSelectNationalityCountry = (country) => {
        setSelectedNationalityCode(country.cca2);
        setSelectedNationalityName(country.name);
        setShowNationalityPicker(false);
    };

    if (isLoading || !t) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
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
                    <Text style={styles.headerTitle}>{t('edit_profile')}</Text>
                </View>
                <View style={styles.headerSide} />
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer}>
                <View style={styles.formCard}>
                    <ProfileInput
                        label={t('email_label')}
                        value={userInfo?.email || ''}
                        editable={false}
                        keyboardType="email-address"
                    />

                    <ProfileInput
                        label={t('first_name_label')}
                        value={firstName}
                        onChangeText={setFirstName}
                    />
                    <ProfileInput
                        label={t('last_name_label')}
                        value={lastName}
                        onChangeText={setLastName}
                    />

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>{t('contact_number_label')}</Text>
                        <View style={styles.phoneInputContainer}>
                            <TouchableOpacity style={styles.countryCodeContainer} onPress={() => setShowCountryPicker(true)}>
                                <Text style={styles.countryCodeText}>{`+${callingCode}`}</Text>
                            </TouchableOpacity>
                            <TextInput
                                style={styles.phoneInput}
                                value={contactNumber}
                                onChangeText={setContactNumber}
                                keyboardType="phone-pad"
                                placeholderTextColor={COLORS.mediumGray}
                            />
                        </View>
                        <CountryPicker
                            withFlag={false}
                            withCallingCode
                            withEmoji={false}
                            withFilter
                            countryCode={countryCode}
                            onSelect={onSelectCountry}
                            visible={showCountryPicker}
                            onClose={() => setShowCountryPicker(false)}
                            modalProps={{ presentationStyle: 'pageSheet' }}
                            renderFlagButton={() => null}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>{t('nationality_label')}</Text>
                        <TouchableOpacity style={styles.pickerContainer} onPress={() => setShowNationalityPicker(true)}>
                            <Text style={styles.pickerText}>{selectedNationalityName}</Text>
                            <Image source={require('../assets/icons/chevron_down.png')} style={styles.pickerIcon} />
                        </TouchableOpacity>
                        <CountryPicker
                            withFlag={false}
                            withCallingCode={false}
                            withEmoji={false}
                            withFilter
                            countryCode={selectedNationalityCode}
                            onSelect={onSelectNationalityCountry}
                            visible={showNationalityPicker}
                            onClose={() => setShowNationalityPicker(false)}
                            modalProps={{ presentationStyle: 'pageSheet' }}
                            renderFlagButton={() => null}
                        />
                    </View>
                </View>

                <View style={styles.switchCard}>
                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>{t('newsletter_email_prompt')}</Text>
                        <Switch
                            trackColor={{ false: COLORS.border, true: COLORS.primary }}
                            thumbColor={COLORS.white}
                            onValueChange={() => setEmailUpdates(prev => !prev)}
                            value={emailUpdates}
                        />
                    </View>
                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>{t('newsletter_sms_prompt')}</Text>
                        <Switch
                            trackColor={{ false: COLORS.border, true: COLORS.primary }}
                            thumbColor={COLORS.white}
                            onValueChange={() => setSmsUpdates(prev => !prev)}
                            value={smsUpdates}
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile} disabled={isUpdating}>
                    {isUpdating ? <ActivityIndicator color={COLORS.darkGray} /> : <Text style={styles.updateButtonText}>{t('update_button')}</Text>}
                </TouchableOpacity>
            </View>

            <Toast
                message={toastMessage}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.secondary },
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContentContainer: { paddingHorizontal: SIZES.padding, paddingVertical: SIZES.padding2, paddingBottom: SIZES.height * 0.15 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        backgroundColor: COLORS.secondary,
    },
    headerSide: { flex: 1 },
    headerCenter: { flex: 2, alignItems: 'center' },
    backButton: { alignSelf: 'flex-start', padding: SIZES.base },
    backIcon: { width: SIZES.h3, height: SIZES.h3, tintColor: COLORS.darkGray },
    headerTitle: { ...FONTS.h3, color: COLORS.black, fontWeight: '600' },
    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: SIZES.padding
    },
    inputContainer: { marginBottom: SIZES.padding },
    inputLabel: { ...FONTS.body4, color: COLORS.text_light, marginBottom: SIZES.base },
    input: {
        ...FONTS.body3,
        backgroundColor: '#F5F5F5',
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        color: COLORS.black,
    },
    inputDisabled: {
        backgroundColor: '#E0E0E0',
        color: COLORS.darkGray
    },
    phoneInputContainer: { flexDirection: 'row', alignItems: 'center' },
    countryCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        marginRight: SIZES.base,
        justifyContent: 'center',
        minWidth: 90,
    },
    countryCodeText: { ...FONTS.body3, color: COLORS.black, marginLeft: SIZES.base / 2 },
    phoneInput: {
        ...FONTS.body3,
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        color: COLORS.black
    },
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F5F5F5',
        borderRadius: SIZES.radius,
        padding: SIZES.padding
    },
    pickerText: { ...FONTS.body3, color: COLORS.black },
    pickerIcon: { width: 16, height: 16, tintColor: COLORS.darkGray },
    switchCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        marginTop: SIZES.padding
    },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: SIZES.padding / 2 },
    switchLabel: { ...FONTS.body4, flex: 1, marginRight: SIZES.padding, color: COLORS.text_dark },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SIZES.padding2, backgroundColor: COLORS.white, borderTopWidth: 1, borderColor: COLORS.border },
    updateButton: { backgroundColor: COLORS.secondary, borderRadius: SIZES.radius, padding: SIZES.padding, alignItems: 'center' },
    updateButtonText: { ...FONTS.h3, color: COLORS.darkGray, fontWeight: 'bold' },
    // Toast Styles
    toastContainer: {
        position: 'absolute',
        bottom: SIZES.padding * 2,
        left: SIZES.padding,
        right: SIZES.padding,
        backgroundColor: COLORS.black,
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000, // Ensure it's above other elements
    },
    toastText: {
        color: COLORS.white,
        ...FONTS.body4,
        textAlign: 'center',
    },
});

export default ProfileScreen;
