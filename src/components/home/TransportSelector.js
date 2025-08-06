// src/components/home/TransportSelector.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants';

const transportOptions = [
  {
    name: 'Ferry',
    iconActive: require('../../assets/icons/ferry.png'),
    iconInactive: require('../../assets/icons/ferry-inactive.png'),
  },
  {
    name: 'Tour',
    iconActive: require('../../assets/icons/tour.png'),
    iconInactive: require('../../assets/icons/tour-inactive.png'),
  },
  {
    name: 'Bus',
    iconActive: require('../../assets/icons/bus.png'),
    iconInactive: require('../../assets/icons/bus-inactive.png'),
  },
];

const TransportSelector = ({ selected, onSelect }) => {
  return (
    <View style={styles.container}>
      {transportOptions.map((item) => {
        const isSelected = selected === item.name;
        return (
          <TouchableOpacity
            key={item.name}
            style={[styles.option, isSelected && styles.selectedOption]}
            onPress={() => onSelect(item.name)}
          >
            <Image
              source={isSelected ? item.iconActive : item.iconInactive}
              style={[styles.icon, isSelected && { tintColor: COLORS.white }]}
              resizeMode="contain"
            />
            <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.padding,
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    width: (SIZES.width - SIZES.padding * 6) / 3,
    height: SIZES.height * 0.1,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedOption: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  icon: {
    width: SIZES.h1,
    height: SIZES.h1,
  },
  optionText: {
    ...FONTS.body4,
    marginTop: SIZES.base,
    color: COLORS.text_dark,
  },
  selectedOptionText: {
    color: COLORS.white,
  },
});

export default TransportSelector;
