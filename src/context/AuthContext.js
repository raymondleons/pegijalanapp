import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://tiket.crelixdigital.com/api'; 

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const setAuthData = async (token, userData) => {
        try {
            setUserToken(token);
            setUserInfo(userData);
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
        } catch (error) {
            console.error("Gagal menyimpan data otentikasi:", error);
        }
    };

    const refreshUserInfo = async () => {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return { success: false };

        try {
            const response = await axios.get(`${API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newUserData = response.data.user;
            
            setUserInfo(newUserData);
            await AsyncStorage.setItem('userInfo', JSON.stringify(newUserData));
            
            return { success: true };
        } catch (error) {
            console.error("Gagal me-refresh info pengguna:", error);
            if (error.response?.status === 401) {
                logout();
            }
            return { success: false };
        }
    };

    const updateProfile = async (userId, updatedData) => {
        if (!userToken) {
            return { success: false, message: 'Tidak terautentikasi.' };
        }
        try {
            const response = await axios.put(`${API_URL}/users/${userId}`, updatedData, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            const newUserData = response.data.user;
            
            setUserInfo(newUserData);
            await AsyncStorage.setItem('userInfo', JSON.stringify(newUserData));
            
            return { success: true, user: newUserData };
        } catch (error) {
            const message = error.response?.data?.message || "Gagal memperbarui profil.";
            return { success: false, message: message };
        }
    };

    const login = async (usernameOrEmail, password) => {
        try {
            const isEmail = usernameOrEmail.includes('@');
            const payload = {
                password: password,
                [isEmail ? 'email' : 'username']: usernameOrEmail
            };

            const response = await axios.post(`${API_URL}/auth/login`, payload);
            const responseData = response.data;
            
            if (!responseData.token || !responseData.user) {
                throw new Error("Respons dari server tidak lengkap setelah login.");
            }

            await setAuthData(responseData.token, responseData.user);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return { success: false, message: message };
        }
    };
    
    const loginWithGoogle = async (idToken) => {
        try {
            const response = await axios.post(`${API_URL}/auth/google/verify-token`, {
                token: idToken,
            });

            const responseData = response.data;

            if (!responseData.token || !responseData.user) {
                throw new Error("Respons dari server tidak lengkap setelah login Google.");
            }

            await setAuthData(responseData.token, responseData.user);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || "Terjadi kesalahan saat verifikasi dengan server.";
            return { success: false, message: message };
        }
    };

    const loginWithFacebook = async (accessToken) => {
        try {
            const response = await axios.post(`${API_URL}/auth/facebook/verify-token`, {
                token: accessToken,
            });
            const responseData = response.data;
            if (!responseData.token || !responseData.user) {
                throw new Error("Respons dari server tidak lengkap setelah login Facebook.");
            }
            await setAuthData(responseData.token, responseData.user);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || "Terjadi kesalahan saat verifikasi dengan server.";
            console.error("Login Facebook gagal:", message);
            return { success: false, message: message };
        }
    };

    const loginWithMicrosoft = async (accessToken) => {
        try {
            const response = await axios.post(`${API_URL}/auth/microsoft/verify-token`, {
                token: accessToken,
            });
            const responseData = response.data;
            if (!responseData.token || !responseData.user) {
                throw new Error("Respons dari server tidak lengkap setelah login Microsoft.");
            }
            await setAuthData(responseData.token, responseData.user);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || "Terjadi kesalahan saat verifikasi dengan server.";
            console.error("Login Microsoft gagal:", message);
            return { success: false, message: message };
        }
    };

    const register = async (userData) => {
        try {
            const response = await axios.post(`${API_URL}/auth/register`, userData);
            return { success: true, data: response.data };
        } catch (error) {
            const message = error.response?.data?.message || "Terjadi kesalahan saat pendaftaran.";
            return { success: false, message: message };
        }
    };

    const verifyOtp = async (email, otp) => {
        try {
            const response = await axios.post(`${API_URL}/auth/verify-email`, { email, otp });
            const responseData = response.data;

            if (!responseData.token || !responseData.user) {
                throw new Error("Respons dari server tidak lengkap setelah verifikasi.");
            }
            
            await setAuthData(responseData.token, responseData.user);
            
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || "Terjadi kesalahan saat verifikasi OTP.";
            return { success: false, message: message };
        }
    };

    const resendOtp = async (email) => {
        try {
            await axios.post(`${API_URL}/auth/resend-otp`, { email });
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || "Gagal mengirim ulang OTP.";
            return { success: false, message: message };
        }
    };

    const forgotPassword = async (email) => {
        try {
            const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.message || "Gagal mengirim permintaan reset.";
            return { success: false, message: message };
        }
    };

    const resetPassword = async (email, otp, password) => {
        try {
            const response = await axios.post(`${API_URL}/auth/reset-password`, { email, otp, password });
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.message || "Gagal mereset kata sandi.";
            return { success: false, message: message };
        }
    };

    const logout = async () => {
        setUserToken(null);
        setUserInfo(null);
        await AsyncStorage.multiRemove(['userToken', 'userInfo']);
    };

    const isLoggedIn = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const infoString = await AsyncStorage.getItem('userInfo');
            
            if (token && infoString) {
                setUserToken(token);
                setUserInfo(JSON.parse(infoString));
            }
        } catch (e) {
            console.error("Gagal memeriksa status login dari storage:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    const value = {
        userToken,
        userInfo,
        isLoading,
        login,
        loginWithGoogle,
        loginWithFacebook,
        loginWithMicrosoft,
        register,
        verifyOtp,
        resendOtp,
        updateProfile,
        refreshUserInfo,
        logout,
        forgotPassword,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
