import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Platform,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = '156350074857-cejo6oec6uta70o0ca4isabvshaaek9j.apps.googleusercontent.com';
const API_ENDPOINT = 'https://tiket.crelixdigital.com/api/auth/google/verify-token';

const GoogleSignInScreen = () => {
    const [resultMessage, setResultMessage] = useState('Belum ada percobaan login.');
    const [isLoading, setIsLoading] = useState(false);
    const [authData, setAuthData] = useState(null);
    const [apiResponse, setApiResponse] = useState(null);

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: WEB_CLIENT_ID,
            offlineAccess: true,
            scopes: ['https://www.googleapis.com/auth/userinfo.profile', 
                   'https://www.googleapis.com/auth/userinfo.email'],
        });
    }, []);

    const sendTokenToAPI = async (idToken) => {
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: idToken,
                    platform: Platform.OS
                }),
            });

            const data = await response.json();
            return {
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    };

    const handleSignIn = async () => {
        setIsLoading(true);
        setResultMessage('Memulai proses login dengan Google...');
        setAuthData(null);
        setApiResponse(null);
        
        try {
            // 1. Check Play Services
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            
            // 2. Sign in with Google
            const result = await GoogleSignin.signIn();
            console.log("Complete Google Response:", result);
            
            // 3. Validate response structure
            if (!result || !result.data) {
                throw new Error('Format respons Google tidak valid');
            }

            // 4. Extract necessary data
            const userInfo = {
                name: result.data.user?.name || 'Tidak tersedia',
                email: result.data.user?.email || 'Tidak tersedia',
                id: result.data.user?.id || 'Tidak tersedia',
                idToken: result.data.idToken,
                serverAuthCode: result.data.serverAuthCode
            };

            if (!userInfo.idToken) {
                throw new Error('idToken tidak ditemukan dalam respons');
            }

            setAuthData(userInfo);
            
            // 5. Display success message
            let displayMessage = 'LOGIN SUKSES!\n\nData dari Google:\n';
            displayMessage += `Nama: ${userInfo.name}\n`;
            displayMessage += `Email: ${userInfo.email}\n`;
            displayMessage += `ID: ${userInfo.id}\n\n`;
            displayMessage += `ID Token (potongan): ${userInfo.idToken.substring(0, 30)}...\n\n`;
            
            // 6. Send token to API
            displayMessage += 'Mengirim token ke server...\n';
            setResultMessage(displayMessage);
            
            const apiResult = await sendTokenToAPI(userInfo.idToken);
            setApiResponse(apiResult);
            
            // 7. Update message with API response
            displayMessage += `\nResponse dari Server (${apiResult.status}):\n`;
            displayMessage += JSON.stringify(apiResult.data, null, 2);
            
            setResultMessage(displayMessage);

        } catch (error) {
            console.error("Full Error:", error);
            
            let errorMessage = 'LOGIN GAGAL!\n\n';
            errorMessage += `Pesan: ${error.message}\n`;
            
            if (error.code === '12501') {
                errorMessage = 'Proses login dibatalkan oleh pengguna.';
            } else if (error.code) {
                errorMessage += `Kode Error: ${error.code}\n`;
            }
            
            setResultMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Text style={styles.title}>Uji Coba Login Google</Text>
            
            <TouchableOpacity 
                style={styles.button} 
                onPress={handleSignIn} 
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Mulai Login</Text>
                )}
            </TouchableOpacity>

            <View style={styles.resultBox}>
                <ScrollView>
                    <Text style={styles.resultTitle}>Hasil:</Text>
                    <Text style={styles.resultText}>{resultMessage}</Text>
                    
                    {apiResponse && (
                        <View style={styles.apiContainer}>
                            <Text style={styles.apiTitle}>Response API:</Text>
                            <Text style={styles.apiText}>
                                Status: {apiResponse.status}{'\n'}
                                Data: {JSON.stringify(apiResponse.data, null, 2)}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#4285F4',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        elevation: 3,
        minWidth: 200,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    resultBox: {
        marginTop: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: 'white',
        width: '100%',
        height: '55%',
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    resultText: {
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        lineHeight: 20,
    },
    apiContainer: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#f0f8ff',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#d1e7ff',
    },
    apiTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#1e88e5',
    },
    apiText: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
});

export default GoogleSignInScreen;