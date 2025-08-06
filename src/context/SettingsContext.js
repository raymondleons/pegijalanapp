// src/context/SettingsContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Data default dan aturan bisnis
const settingsConfig = {
    'Indonesia': { currency: 'IDR', language: 'ID' },
    'Singapore': { currency: 'IDR', language: 'EN' },
    'Malaysia': { currency: 'IDR', language: 'EN' },
};

const languages = {
    'ID': 'Indonesia',
    'EN': 'English',
};

export const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
    const [country, setCountry] = useState('Indonesia');
    const [currency, setCurrency] = useState('IDR');
    const [lang, setLang] = useState('ID'); // 'lang' adalah nama state bahasa yang konsisten
    const [isLoading, setIsLoading] = useState(true);

    // --- LOGIKA UTAMA: Berjalan sekali saat aplikasi dibuka ---
    useEffect(() => {
        const loadInitialSettings = async () => {
            try {
                // 1. Coba ambil bahasa & negara yang tersimpan
                const savedLang = await AsyncStorage.getItem('user-language');
                const savedCountry = await AsyncStorage.getItem('user-country');

                if (savedLang && savedCountry) {
                    // 2. JIKA ADA, gunakan data yang tersimpan
                    console.log('Pengaturan ditemukan:', { lang: savedLang, country: savedCountry });
                    setLang(savedLang);
                    setCountry(savedCountry);
                    setCurrency(settingsConfig[savedCountry]?.currency || 'IDR');
                } else {
                    // 3. JIKA TIDAK ADA (pertama kali buka), default ke Indonesia
                    console.log('Tidak ada pengaturan tersimpan, default ke Indonesia.');
                    setLang('ID');
                    setCountry('Indonesia');
                    setCurrency('IDR');
                    // Simpan pengaturan default ini untuk penggunaan selanjutnya
                    await AsyncStorage.setItem('user-language', 'ID');
                    await AsyncStorage.setItem('user-country', 'Indonesia');
                }
            } catch (e) {
                console.error("Gagal memuat pengaturan:", e);
                // Jika gagal, default ke Indonesia
                setLang('ID');
                setCountry('Indonesia');
                setCurrency('IDR');
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialSettings();
    }, []);

    // --- FUNGSI UNTUK MENGUBAH PENGATURAN ---

    // Memperbarui negara akan mengubah bahasa sesuai aturan
    const updateCountry = async (newCountry) => {
        const config = settingsConfig[newCountry];
        if (config) {
            setCountry(newCountry);
            setCurrency(config.currency);
            setLang(config.language); // Bahasa ikut berubah
            // Simpan pilihan baru
            await AsyncStorage.setItem('user-country', newCountry);
            await AsyncStorage.setItem('user-language', config.language);
        }
    };

    // Memperbarui bahasa secara manual
    const updateLanguage = async (newLang) => {
        setLang(newLang);
        // Simpan pilihan baru
        await AsyncStorage.setItem('user-language', newLang);
    };

    const getLanguageName = () => languages[lang];

    const value = {
        country,
        currency,
        lang,
        isLoading,
        updateCountry,
        updateLanguage,
        getLanguageName,
    };

    if (isLoading) {
        return null; // Tampilkan splash screen di sini jika ada
    }

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
