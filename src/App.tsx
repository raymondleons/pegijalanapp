// src/App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SettingsProvider } from './context/SettingsContext';
import { LocalizationProvider } from './context/LocalizationContext';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';

const App = () => {
  return (
    // Urutan Provider yang Benar
    <AuthProvider>
      <SettingsProvider>
        <LocalizationProvider>
          <AppNavigator />
        </LocalizationProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
