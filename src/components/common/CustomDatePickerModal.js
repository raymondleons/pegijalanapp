// src/components/common/CustomDatePickerModal.js
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, FlatList } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants';
import Icon from 'react-native-vector-icons/Ionicons';

const CustomDatePickerModal = ({ visible, onClose, onSelectDate, initialDate, minDate }) => {
  const [displayDate, setDisplayDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());

  useEffect(() => {
    const newDate = initialDate || new Date();
    setDisplayDate(newDate);
    setSelectedDate(newDate);
  }, [initialDate, visible]);

  const changeMonth = (amount) => {
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() + amount, 1);
    setDisplayDate(newDate);
  };

  const generateCalendarDays = () => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ key: `empty-${i}`, empty: true });
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ key: `day-${i}`, day: i, date: new Date(year, month, i) });
    }
    return days;
  };

  const handleConfirm = () => {
    onSelectDate(selectedDate);
    onClose();
  };

  const renderDay = ({ item }) => {
    if (item.empty) {
      return <View style={styles.dayCell} />;
    }

    const isSelected = selectedDate.toDateString() === item.date.toDateString();
    const isDisabled = minDate && item.date < new Date(minDate.toDateString());

    return (
      <TouchableOpacity
        style={styles.dayCell}
        onPress={() => !isDisabled && setSelectedDate(item.date)}
        disabled={isDisabled}
      >
        <View style={[styles.dayContainer, isSelected && styles.selectedDayContainer]}>
          <Text style={[styles.dayText, isSelected && styles.selectedDayText, isDisabled && styles.disabledDayText]}>
            {item.day}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthYearStr = displayDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const selectedYearStr = selectedDate.getFullYear();
  const selectedDateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalContainer}>
          <View style={styles.header}>
            <View>
                <Text style={styles.yearText}>{selectedYearStr}</Text>
                <Text style={styles.dateText}>{selectedDateStr}</Text>
            </View>
          </View>
          <View style={styles.calendarBody}>
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
                <Icon name="arrow-back" size={24} color={COLORS.text_dark} />
              </TouchableOpacity>
              <Text style={styles.monthText}>{monthYearStr}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
                <Icon name="arrow-forward" size={24} color={COLORS.text_dark} />
              </TouchableOpacity>
            </View>
            <View style={styles.dayNamesContainer}>
              {dayNames.map(day => <Text key={day} style={styles.dayNameText}>{day}</Text>)}
            </View>
            <FlatList
              data={generateCalendarDays()}
              renderItem={renderDay}
              numColumns={7}
              keyExtractor={item => item.key}
            />
          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.okButton} onPress={handleConfirm}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: SIZES.radius * 2,
        borderTopRightRadius: SIZES.radius * 2,
    },
    header: {
        backgroundColor: COLORS.primary,
        padding: SIZES.padding2,
        borderTopLeftRadius: SIZES.radius * 2,
        borderTopRightRadius: SIZES.radius * 2,
    },
    yearText: { ...FONTS.h2, color: COLORS.white, fontFamily: 'Inter-Regular' },
    dateText: { ...FONTS.h1, color: COLORS.white, fontFamily: 'Inter-Regular' },
    calendarBody: { padding: SIZES.padding2 },
    monthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.padding2,
    },
    monthText: { ...FONTS.h3, color: COLORS.text_dark, fontFamily: 'Inter-Regular' },
    arrowButton: { padding: SIZES.base },
    dayNamesContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SIZES.base },
    dayNameText: { ...FONTS.body4, color: COLORS.text_light, width: 32, textAlign: 'center' },
    dayCell: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 40 },
    dayContainer: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
    selectedDayContainer: { backgroundColor: COLORS.primary },
    dayText: { ...FONTS.body3, color: COLORS.text_dark },
    selectedDayText: { color: COLORS.white, fontFamily: 'Inter-Regular' },
    disabledDayText: { color: COLORS.border },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: SIZES.padding2,
        borderTopWidth: 1,
        borderColor: COLORS.border,
    },
    cancelButton: { paddingVertical: SIZES.base, paddingHorizontal: SIZES.padding2 },
    cancelButtonText: { ...FONTS.h3, color: COLORS.primary, fontFamily: 'Inter-Regular' },
    okButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SIZES.base,
        paddingHorizontal: SIZES.padding2,
        borderRadius: SIZES.radius * 2,
        marginLeft: SIZES.padding2,
    },
    okButtonText: { ...FONTS.h3, color: COLORS.white, fontFamily: 'Inter-Regular' },
});

export default CustomDatePickerModal;
