// src/components/common/FormInput.js
import React from 'react';
import { View, TextInput, Image, StyleSheet } from 'react-native';
import { SIZES, COLORS, FONTS } from '../../constants';

const FormInput = ({
  containerStyle,
  inputStyle,
  iconSource,
  placeholder,
  value,
  onChangeText,
  ...rest // Menerima properti lain seperti keyboardType, autoCapitalize, dll.
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {iconSource && (
        <Image
          source={iconSource}
          style={styles.icon}
        />
      )}
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.text_light}
        value={value}
        onChangeText={onChangeText}
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14, // Dibuat sama dengan style di LoginScreen
    paddingHorizontal: SIZES.padding,
  },
  icon: {
    width: 22,
    height: 22,
    tintColor: COLORS.text_light,
    marginRight: SIZES.base,
  },
  input: {
    flex: 1,
    ...FONTS.body3,
    color: COLORS.text_dark,
    // PERUBAHAN UTAMA: Ukuran vertikal disamakan dengan input di LoginScreen
    paddingVertical: 12, 
    fontSize: 16, // Ukuran font disamakan
  },
});

export default FormInput;