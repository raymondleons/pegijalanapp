import React, { useState, useEffect } from 'react';
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
    Modal,
    Pressable,
    FlatList,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

// Palet warna didefinisikan di sini agar sesuai dengan desain
const COLORS = {
    primary: '#ffde2f', // Kuning utama untuk header dan tombol
    white: '#FFFFFF',
    black: '#000000',
    lightGray: '#F8F9FA', // Warna latar belakang layar
    gray: '#E0E0E0',     // Warna border input
    darkGray: '#A0A0A0', // Warna placeholder dan ikon
};

// Definisi font
const FONTS = {
    h3: { fontSize: 18 },
    body3: { fontSize: 16 },
};

// Data negara diperbarui menjadi array of objects
const ALL_COUNTRIES = [
    { name: 'Singapore', code: 'SG', flag: '🇸🇬', phoneCode: '+65' },
    { name: 'Indonesia', code: 'ID', flag: '🇮🇩', phoneCode: '+62' },
    { name: 'Malaysia', code: 'MY', flag: '🇲🇾', phoneCode: '+60' },
    { name: 'Thailand', code: 'TH', flag: '🇹🇭', phoneCode: '+66' },
    { name: 'Vietnam', code: 'VN', flag: '🇻🇳', phoneCode: '+84' },
    { name: 'Myanmar', code: 'MM', flag: '🇲🇲', phoneCode: '+95' },
    { name: 'Cambodia', code: 'KH', flag: '🇰🇭', phoneCode: '+855' },
    { name: 'Laos', code: 'LA', flag: '🇱🇦', phoneCode: '+856' },
    { name: 'Brunei Darussalam', code: 'BN', flag: '🇧🇳', phoneCode: '+673' },
];


const RegisterScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { register } = useAuth();

    const [lastName, setLastName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [country, setCountry] = useState(ALL_COUNTRIES[1]);
    const [countryCode, setCountryCode] = useState(ALL_COUNTRIES[1]);
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [showCountryCodeModal, setShowCountryCodeModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCountries, setFilteredCountries] = useState(ALL_COUNTRIES);

    useEffect(() => {
        const source = showCountryCodeModal ? ALL_COUNTRIES : ALL_COUNTRIES;
        if (searchQuery === '') {
            setFilteredCountries(source);
        } else {
            const filtered = source.filter(c =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.phoneCode.includes(searchQuery)
            );
            setFilteredCountries(filtered);
        }
    }, [searchQuery, showCountryCodeModal]);


    const handleSignUp = async () => {
        if (!firstName || !email || !password || !confirmPassword || !phoneNumber) {
            Alert.alert('Error', 'Harap isi semua kolom yang wajib diisi.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Kata sandi dan konfirmasi kata sandi tidak cocok.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Kata sandi minimal harus 6 karakter.');
            return;
        }

        setIsLoading(true);

        const fullName = `${firstName} ${lastName}`.trim();
        const userData = {
            name: fullName,
            email,
            password,
            citizenship: country.name,
            phoneCode: countryCode.phoneCode,
            phoneNumber: phoneNumber,
        };

        const result = await register(userData);
        setIsLoading(false);

        if (result.success) {
            Alert.alert(
                'Pendaftaran Berhasil',
                result.data.message,
                [{ text: 'OK', onPress: () => navigation.navigate('Verification', { email: email }) }]
            );
        } else {
            Alert.alert('Pendaftaran Gagal', result.message);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image source={require('../assets/icons/chevron_left.png')} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daftar</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.formContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nama Depan"
                            placeholderTextColor={COLORS.darkGray}
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Nama Belakang"
                            placeholderTextColor={COLORS.darkGray}
                            value={lastName}
                            onChangeText={setLastName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={COLORS.darkGray}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                        <View style={styles.phoneInputContainer}>
                            <TouchableOpacity style={styles.countryCodeButton} onPress={() => setShowCountryCodeModal(true)}>
                                <Text style={styles.countryCodeText}>{countryCode.flag} {countryCode.phoneCode}</Text>
                            </TouchableOpacity>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="Nomor kontak"
                                placeholderTextColor={COLORS.darkGray}
                                keyboardType="phone-pad"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                            />
                        </View>
                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Kata Sandi"
                                placeholderTextColor={COLORS.darkGray}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Image 
                                    source={showPassword ? require('../assets/icons/eye.png') : require('../assets/icons/eye-off.png')} 
                                    style={styles.eyeIcon} 
                                />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Masukkan kata sandi kembali"
                                placeholderTextColor={COLORS.darkGray}
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Image 
                                    source={showConfirmPassword ? require('../assets/icons/eye.png') : require('../assets/icons/eye-off.png')} 
                                    style={styles.eyeIcon} 
                                />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.outlinedInputContainer}>
                            <Text style={styles.outlinedInputLabel}>Kewarganegaraan</Text>
                            <TouchableOpacity 
                                style={styles.outlinedInputContent}
                                onPress={() => setShowCountryModal(true)}
                            >
                                <Text style={styles.countryText}>{country.name}</Text>
                                <Image source={require('../assets/icons/chevron_down.png')} style={styles.dropdownIcon} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tombol dipindahkan ke dalam ScrollView */}
                    <View style={styles.bottomContainer}>
                        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator color={COLORS.black} />
                            ) : (
                                <Text style={styles.signUpButtonText}>Daftar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            
            {/* ... (Kode Modal tidak berubah) ... */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showCountryModal}
                onRequestClose={() => setShowCountryModal(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowCountryModal(false)}>
                    <Pressable style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Kewarganegaraan</Text>
                            <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                                <Image source={require('../assets/icons/close.png')} style={styles.closeIcon} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.searchContainer}>
                            <Image source={require('../assets/icons/search.png')} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Cari"
                                placeholderTextColor={COLORS.darkGray}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setCountry(item);
                                        setShowCountryModal(false);
                                        setSearchQuery('');
                                    }}
                                >
                                    <Text style={styles.flagText}>{item.flag}</Text>
                                    <Text style={styles.modalItemText}>{item.name} ({item.code})</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </Pressable>
                </Pressable>
            </Modal>
            <Modal
                animationType="slide"
                transparent={true}
                visible={showCountryCodeModal}
                onRequestClose={() => setShowCountryCodeModal(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowCountryCodeModal(false)}>
                    <Pressable style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pilih Kode Negara</Text>
                            <TouchableOpacity onPress={() => setShowCountryCodeModal(false)}>
                                <Image source={require('../assets/icons/close.png')} style={styles.closeIcon} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.searchContainer}>
                            <Image source={require('../assets/icons/search.png')} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Cari"
                                placeholderTextColor={COLORS.darkGray}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item.phoneCode}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setCountryCode(item);
                                        setShowCountryCodeModal(false);
                                        setSearchQuery('');
                                    }}
                                >
                                    <Text style={styles.flagText}>{item.flag}</Text>
                                    <Text style={styles.modalItemText}>{item.name} ({item.phoneCode})</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </Pressable>
                </Pressable>
            </Modal>
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
        justifyContent: 'space-between',
    },
    formContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        margin: 16,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    input: {
        height: 55,
        borderWidth: 1,
        borderColor: COLORS.gray,
        borderRadius: 12,
        paddingHorizontal: 15,
        ...FONTS.body3,
        backgroundColor: COLORS.white,
        marginBottom: 15,
        justifyContent: 'center',
        color: COLORS.black, // Tambahkan ini untuk memastikan teks terlihat
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 55,
        borderWidth: 1,
        borderColor: COLORS.gray,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        marginBottom: 15,
    },
    countryCodeButton: {
        paddingHorizontal: 15,
        height: '100%',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: COLORS.gray,
    },
    countryCodeText: {
        ...FONTS.body3,
        color: COLORS.black,
    },
    phoneInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 15,
        ...FONTS.body3,
        color: COLORS.black, // Tambahkan ini
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 55,
        borderWidth: 1,
        borderColor: COLORS.gray,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    passwordInput: {
        flex: 1,
        height: '100%',
        ...FONTS.body3,
        color: COLORS.black, // Tambahkan ini
    },
    eyeIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.darkGray,
    },
    countryText: {
        ...FONTS.body3,
        color: COLORS.black,
    },
    dropdownIcon: {
        width: 18,
        height: 18,
        tintColor: COLORS.darkGray,
    },
    outlinedInputContainer: {
        height: 55,
        position: 'relative',
        borderWidth: 1,
        borderColor: COLORS.gray,
        borderRadius: 12,
        marginBottom: 15,
        justifyContent: 'center',
    },
    outlinedInputLabel: {
        position: 'absolute',
        top: -10,
        left: 12,
        backgroundColor: COLORS.white,
        paddingHorizontal: 5,
        color: COLORS.darkGray,
        fontSize: 14,
    },
    outlinedInputContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    bottomContainer: {
        padding: 20,
        backgroundColor: COLORS.lightGray,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    signUpButton: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signUpButtonText: {
        color: COLORS.black,
        fontSize: 16,
        fontWeight: 'normal',
    },
    // Styles untuk Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        height: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        ...FONTS.h3,
        fontWeight: 'bold',
    },
    closeIcon: {
        width: 24,
        height: 24,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.lightGray,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    searchIcon: {
        width: 20,
        height: 20,
        tintColor: COLORS.darkGray,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 50,
        ...FONTS.body3,
        color: COLORS.black, // Tambahkan ini
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray,
    },
    flagText: {
        fontSize: 24,
        marginRight: 15,
    },
    modalItemText: {
        ...FONTS.body3,
        color: COLORS.black,
    },
});

export default RegisterScreen;
