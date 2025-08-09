import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://tiket.crelixdigital.com/api';

// Membuat instance axios terpusat yang akan digunakan di seluruh aplikasi
const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        accessToken: null,
        refreshToken: null,
        authenticated: false,
        user: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    // --- Efek untuk memuat dan memvalidasi sesi saat aplikasi dimulai ---
    useEffect(() => {
        const loadAuthState = async () => {
            try {
                const accessToken = await AsyncStorage.getItem('accessToken');
                const refreshToken = await AsyncStorage.getItem('refreshToken');

                if (!accessToken || !refreshToken) {
                    setIsLoading(false);
                    return;
                }

                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                // Langsung validasi ke server dengan memanggil /users/me
                const response = await axiosInstance.get('/users/me');
                const user = response.data;
                
                // Jika berhasil, user valid. Simpan datanya.
                setAuthState({
                    accessToken,
                    refreshToken,
                    authenticated: true,
                    user: user
                });
                await AsyncStorage.setItem('userInfo', JSON.stringify(user));

            } catch (error) {
                // JIKA GAGAL (misal, 401 karena user dihapus), bersihkan token lama.
                console.log("Validasi sesi saat startup gagal. Pengguna akan di-logout.", error.message);
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userInfo']);
                setAuthState({ accessToken: null, refreshToken: null, authenticated: false, user: null });
            } finally {
                setIsLoading(false);
            }
        };

        loadAuthState();
    }, []);

    // --- Interceptor untuk refresh token otomatis saat aplikasi berjalan ---
    useEffect(() => {
        const responseInterceptor = axiosInstance.interceptors.response.use(
            response => response,
            async (error) => {
                const originalRequest = error.config;
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
                        if (!storedRefreshToken) return Promise.reject(error);

                        const rs = await axios.post(`${API_URL}/auth/refresh-token`, { token: storedRefreshToken });
                        const { accessToken } = rs.data;
                        
                        await AsyncStorage.setItem('accessToken', accessToken);
                        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                        setAuthState(prev => ({ ...prev, accessToken }));

                        return axiosInstance(originalRequest);
                    } catch (_error) {
                        await logout();
                        return Promise.reject(_error);
                    }
                }
                return Promise.reject(error);
            }
        );
        return () => axiosInstance.interceptors.response.eject(responseInterceptor);
    }, []);

    // --- Helper function untuk mengatur sesi setelah login/verifikasi ---
    const setAuthSession = async (data) => {
        const { accessToken, refreshToken } = data;
        
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        const profileResponse = await axiosInstance.get('/users/me');
        const user = profileResponse.data;

        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
        
        setAuthState({ accessToken, refreshToken, authenticated: true, user });
    };

    // --- Fungsi-fungsi otentikasi ---

    const register = async (userData) => {
        try {
            const response = await axiosInstance.post('/auth/register', userData);
            return { success: true, data: response.data };
        } catch (error) {
            const message = error.response?.data?.message || "Pendaftaran gagal.";
            return { success: false, message };
        }
    };

    const verifyOtp = async (email, otp) => {
        try {
            const response = await axiosInstance.post('/auth/verify', { email, otp });
            await setAuthSession(response.data);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || "Verifikasi OTP gagal.";
            return { success: false, message };
        }
    };

    const resendOtp = async (email) => {
        try {
            const response = await axiosInstance.post('/auth/resend-otp', { email });
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.message || "Gagal mengirim ulang OTP.";
            return { success: false, message };
        }
    };
    
    const login = async (email, password) => {
        try {
            const response = await axiosInstance.post('/auth/login', { email, password });
            await setAuthSession(response.data);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || "Login gagal.";
            return { success: false, message };
        }
    };
    
    const socialLogin = async (provider, providerToken) => {
        try {
            const response = await axiosInstance.post(`/auth/${provider}/signin`, { token: providerToken });
            await setAuthSession(response.data);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || `Login dengan ${provider} gagal.`;
            return { success: false, message };
        }
    };

    const loginWithGoogle = (idToken) => socialLogin('google', idToken);
    const loginWithFacebook = (fbToken) => socialLogin('facebook', fbToken);
    const loginWithMicrosoft = (msToken) => socialLogin('microsoft', msToken);
    
    const forgotPassword = async (email) => {
        try {
            const response = await axiosInstance.post('/auth/forgot-password', { email });
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.message || "Permintaan reset gagal.";
            return { success: false, message };
        }
    };
    
    const resetPassword = async (token, password) => {
        try {
            const response = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.message || "Gagal mereset kata sandi.";
            return { success: false, message };
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            const response = await axiosInstance.put('/users/change-password', { currentPassword, newPassword });
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.message || "Gagal mengubah kata sandi.";
            return { success: false, message };
        }
    };

    const updateProfile = async (updatedData) => {
        try {
            const response = await axiosInstance.put('/users/me', updatedData);
            const updatedUser = response.data;
            
            setAuthState(prev => ({ ...prev, user: updatedUser }));
            await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
            
            return { success: true, message: "Profil berhasil diperbarui." };
        } catch (error) {
            const message = error.response?.data?.message || "Gagal memperbarui profil.";
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
            if (storedRefreshToken) {
                await axiosInstance.post('/auth/logout', { token: storedRefreshToken });
            }
        } catch (error) {
            console.error("API Logout gagal, melanjutkan logout di sisi klien.", error);
        } finally {
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userInfo']);
            delete axiosInstance.defaults.headers.common['Authorization'];
            setAuthState({ accessToken: null, refreshToken: null, authenticated: false, user: null });
        }
    };

    const value = {
        ...authState,
        isLoading,
        register,
        verifyOtp,
        resendOtp,
        login,
        loginWithGoogle,
        loginWithFacebook,
        loginWithMicrosoft,
        forgotPassword,
        resetPassword,
        changePassword,
        updateProfile,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);