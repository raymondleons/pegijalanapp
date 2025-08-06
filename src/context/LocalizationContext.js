// src/context/LocalizationContext.js
import React, { createContext, useContext } from 'react';
import { translations } from '../constants/translations';
import { useSettings } from './SettingsContext'; // 1. Import hook dari SettingsContext

// Buat Context
export const LocalizationContext = createContext(null);

// Provider ini sekarang menjadi sangat simpel
export const LocalizationProvider = ({ children }) => {
  // 2. Ambil bahasa (lang) dari satu-satunya sumber kebenaran: SettingsContext
  const settings = useSettings();

  // Pengaman jika SettingsContext masih loading di awal
  const lang = settings ? settings.lang : 'ID'; 

  // 3. Fungsi 't' sekarang menerjemahkan berdasarkan bahasa dari SettingsContext
  const t = (key) => {
    if (translations[lang] && translations[lang][key]) {
      return translations[lang][key];
    }
    console.warn(`Terjemahan untuk kunci "${key}" tidak ditemukan pada bahasa "${lang}".`);
    return key;
  };

  return (
    <LocalizationContext.Provider value={{ t, lang }}>
      {children}
    </LocalizationContext.Provider>
  );
};

// Hook kustom tetap sama
export const useLocalization = () => {
    const context = useContext(LocalizationContext);
    if (!context) {
        throw new Error("useLocalization harus digunakan di dalam LocalizationProvider");
    }
    return context;
};
