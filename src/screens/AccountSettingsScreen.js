// src/screens/AccountSettingsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, StatusBar, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLocalization } from '../context/LocalizationContext';
import { useAuth } from '../context/AuthContext';
import appTheme, { SIZES, FONTS } from '../constants/theme';

const { COLORS } = appTheme;

// --- Komponen-komponen ---

const SettingsItem = ({ iconSource, label, onPress, isDestructive = false }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <Image 
        source={iconSource} 
        style={[styles.itemIcon, isDestructive && styles.destructiveIcon]} 
    />
    <Text style={[styles.itemLabel, isDestructive && styles.destructiveText]}>{label}</Text>
    <Image source={require('../assets/icons/chevron_right.png')} style={styles.chevronIcon} />
  </TouchableOpacity>
);

const LogoutConfirmationModal = ({ visible, onClose, onConfirm, t }) => (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t('logout_confirmation')}</Text>
                <Text style={styles.modalMessage}>{t('are_you_sure_logout')}</Text>
                <TouchableOpacity style={styles.modalButtonDestructive} onPress={onConfirm}>
                    <Text style={styles.modalButtonTextDestructive}>{t('logout')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButtonCancel} onPress={onClose}>
                    <Text style={styles.modalButtonTextCancel}>{t('cancel')}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    </Modal>
);

// Komponen Modal Baru untuk Hapus Akun
const DeleteConfirmationModal = ({ visible, onClose, onConfirm, t }) => (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t('delete_account_confirmation')}</Text>
                <Text style={styles.modalMessage}>{t('are_you_sure_delete')}</Text>
                <TouchableOpacity style={styles.modalButtonDestructive} onPress={onConfirm}>
                    <Text style={styles.modalButtonTextDestructive}>{t('delete')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButtonCancel} onPress={onClose}>
                    <Text style={styles.modalButtonTextCancel}>{t('cancel')}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    </Modal>
);


const AccountSettingsScreen = () => {
    const navigation = useNavigation();
    const { t } = useLocalization() || {};
    const { logout } = useAuth();
    const insets = useSafeAreaInsets();
    const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
    const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);

    const handleLogout = () => setLogoutModalVisible(true);
    const confirmLogout = () => {
        logout();
        setLogoutModalVisible(false);
        navigation.navigate('Main', { screen: 'Account' }); 
    };

    const handleDeleteAccount = () => setDeleteModalVisible(true);
    const confirmDeleteAccount = () => {
        console.log("Menghapus akun...");
        setDeleteModalVisible(false);
        // Implementasi logika hapus akun di sini
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
                    <Text style={styles.headerTitle}>{t('account_settings')}</Text>
                </View>
                <View style={styles.headerSide} />
            </View>

            <View style={styles.container}>
                <View style={styles.menuCard}>
                    {/* --- PERUBAHAN DI SINI --- */}
                    <SettingsItem 
                        iconSource={require('../assets/icons/lock.png')}
                        label={t('change_password')}
                        onPress={() => navigation.navigate('ChangePassword')} // Mengarahkan ke layar ChangePassword
                    />
                    <View style={styles.divider} />
                    <SettingsItem 
                        iconSource={require('../assets/icons/logout.png')}
                        label={t('logout')}
                        onPress={handleLogout}
                    />
                </View>

                <View style={styles.menuCard}>
                    <SettingsItem 
                        iconSource={require('../assets/icons/trash.png')}
                        label={t('delete_account')}
                        onPress={handleDeleteAccount}
                        isDestructive={true}
                    />
                </View>
            </View>
            
            <LogoutConfirmationModal
                visible={isLogoutModalVisible}
                onClose={() => setLogoutModalVisible(false)}
                onConfirm={confirmLogout}
                t={t}
            />

            <DeleteConfirmationModal
                visible={isDeleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={confirmDeleteAccount}
                t={t}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.secondary,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: SIZES.padding,
        paddingHorizontal: SIZES.padding,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        backgroundColor: COLORS.secondary,
    },
    headerSide: {
        flex: 1,
    },
    headerCenter: {
        flex: 3,
        alignItems: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        padding: SIZES.base,
    },
    backIcon: {
        width: SIZES.h3,
        height: SIZES.h3,
        tintColor: COLORS.darkGray,
    },
    headerTitle: {
        ...FONTS.h3,
        color: COLORS.black,
        fontWeight: '600',
    },
    menuCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.padding,
        overflow: 'hidden',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding,
    },
    itemIcon: {
        width: SIZES.h2,
        height: SIZES.h2,
        tintColor: COLORS.darkGray,
        marginRight: SIZES.padding,
    },
    itemLabel: {
        ...FONTS.body3,
        color: COLORS.text_dark,
        flex: 1,
    },
    chevronIcon: {
        width: SIZES.h3,
        height: SIZES.h3,
        tintColor: COLORS.text_light,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.lightGray,
        marginLeft: SIZES.padding * 2 + SIZES.h2,
    },
    destructiveIcon: {
        tintColor: 'red',
    },
    destructiveText: {
        color: 'red',
    },
    // Style untuk Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        padding: SIZES.padding2,
        borderTopLeftRadius: SIZES.radius * 1.5,
        borderTopRightRadius: SIZES.radius * 1.5,
    },
    modalTitle: {
        ...FONTS.h3,
        textAlign: 'center',
        marginBottom: SIZES.base,
        color: COLORS.text_dark,
    },
    modalMessage: {
        ...FONTS.body3,
        textAlign: 'center',
        color: COLORS.text_light,
        marginBottom: SIZES.padding2,
        paddingHorizontal: SIZES.padding,
    },
    modalButtonDestructive: {
        backgroundColor: '#FFEBEE', // Merah muda
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        marginBottom: SIZES.base,
    },
    modalButtonTextDestructive: {
        ...FONTS.h4,
        color: 'red',
        fontWeight: 'bold',
    },
    modalButtonCancel: {
        backgroundColor: COLORS.lightGray,
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        alignItems: 'center',
    },
    modalButtonTextCancel: {
        ...FONTS.h4,
        color: COLORS.text_dark,
        fontWeight: 'bold',
    },
});

export default AccountSettingsScreen;
