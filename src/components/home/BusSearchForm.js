// src/components/home/BusSearchForm.js
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SIZES, COLORS } from '../../constants';
import FormInput from '../common/FormInput';
import AppButton from '../common/AppButton';
import DatePicker from '../common/DatePicker';
import CustomDatePickerModal from '../common/CustomDatePickerModal';
import { useLocalization } from '../../context/LocalizationContext';

const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
};

const BusSearchForm = () => {
    const { t } = useLocalization();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [departureDate, setDepartureDate] = useState(new Date());
    const [returnDate, setReturnDate] = useState(null);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [datePickerTarget, setDatePickerTarget] = useState('departure');

    const handleSwap = () => {
        const temp = from;
        setFrom(to);
        setTo(temp);
    };

    const openDatePicker = (target) => {
        setDatePickerTarget(target);
        setDatePickerVisible(true);
    };

    const handleSelectDate = (date) => {
        if (datePickerTarget === 'departure') {
            setDepartureDate(date);
            if (returnDate && date > returnDate) {
                setReturnDate(null);
            }
        } else {
            setReturnDate(date);
        }
        setDatePickerVisible(false);
    };

    return (
        <View>
            {/* Input 'From' dan 'To' dengan tombol swap di tengah */}
            <View style={styles.inputContainer}>
                <FormInput
                    containerStyle={{ marginBottom: SIZES.padding }}
                    iconSource={require('../../assets/icons/location_pin.png')}
                    placeholder={t('bus_from')}
                    value={from}
                    onChangeText={setFrom}
                />
                <FormInput
                    iconSource={require('../../assets/icons/location_pin.png')}
                    placeholder={t('bus_to')}
                    value={to}
                    onChangeText={setTo}
                />
                <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
                    <Image source={require('../../assets/icons/swap_arrows.png')} style={styles.swapIcon} />
                </TouchableOpacity>
            </View>

            {/* Kontainer untuk DatePicker */}
            <View style={styles.dateContainer}>
                <DatePicker
                    label={t('departure_date')}
                    value={formatDate(departureDate)}
                    onPress={() => openDatePicker('departure')}
                    containerStyle={{ marginRight: SIZES.base }}
                />
                <DatePicker
                    label={t('return_date')}
                    value={returnDate ? formatDate(returnDate) : t('optional')}
                    onPress={() => openDatePicker('return')}
                    containerStyle={{ marginLeft: SIZES.base }}
                />
            </View>

            {/* Tombol Cari */}
            <AppButton
                title={t('search_bus')}
                onPress={() => console.log('Mencari Bus...')}
                style={{ marginTop: SIZES.padding }} // Jarak diperkecil
            />

            {/* Modal DatePicker */}
            <CustomDatePickerModal
                visible={isDatePickerVisible}
                onClose={() => setDatePickerVisible(false)}
                initialDate={datePickerTarget === 'departure' ? departureDate : (returnDate || departureDate)}
                onSelectDate={handleSelectDate}
                minDate={datePickerTarget === 'return' ? departureDate : new Date()}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        justifyContent: 'center',
    },
    swapButton: {
        position: 'absolute',
        right: SIZES.padding,
        top: '55%',
        transform: [{ translateY: -(SIZES.height * 0.07 / 2) }], 
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    swapIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.primary
    },
    dateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SIZES.padding,
    }
});

export default BusSearchForm;
