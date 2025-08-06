import React, { useState, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  StatusBar,
  RefreshControl,
  Platform,
  Text,
  Dimensions, // --- 1. IMPORT Dimensions ---
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants';

// --- KOMPONEN ANAK ---
import Header from '../components/home/Header';
import TransportSelector from '../components/home/TransportSelector';
import DealsSection from '../components/home/DealsSection';
import RecentSearchesSection from '../components/home/RecentSearchesSection';
import FerrySearchForm from '../components/home/FerrySearchForm';
import BusSearchForm from '../components/home/BusSearchForm';

// --- 2. DAPATKAN TINGGI LAYAR ---
const screenHeight = Dimensions.get('window').height;

const HomeScreen = () => {
  const navigation = useNavigation();
  const [selectedTransport, setSelectedTransport] = useState('Ferry');
  const [refreshing, setRefreshing] = useState(false);

  const dealsRefreshRef = useRef(null);
  const recentRefreshRef = useRef(null);

  const handleSelectTransport = (transport) => {
    if (transport === 'Tour') {
      navigation.navigate('TourList');
    } else {
      setSelectedTransport(transport);
    }
  };

  const renderSearchForm = () => {
    switch (selectedTransport) {
      case 'Tour':
        return null;
      case 'Ferry':
        return <FerrySearchForm />;
      case 'Bus':
        return <BusSearchForm />;
      default:
        return null;
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      dealsRefreshRef.current ? dealsRefreshRef.current() : Promise.resolve(),
      recentRefreshRef.current ? recentRefreshRef.current() : Promise.resolve(),
    ]).finally(() => {
      setRefreshing(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent={false} barStyle="dark-content" backgroundColor={COLORS.secondary} />
      
      {Platform.OS === 'android' && (
        <View style={{ height: StatusBar.currentHeight, backgroundColor: COLORS.secondary }} />
      )}

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer} // Style ini akan kita modifikasi
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* --- Semua komponen sudah diaktifkan kembali --- */}

        <Header />

        <View style={styles.searchContainer}>
          <TransportSelector selected={selectedTransport} onSelect={handleSelectTransport} />
          {renderSearchForm()}
        </View>

        <View style={styles.contentArea}>
          <DealsSection
            onRefreshRegister={(refreshFn) => {
              dealsRefreshRef.current = refreshFn;
            }}
            externalRefreshing={refreshing}
          />
          <RecentSearchesSection
            onRefreshRegister={(refreshFn) => {
              recentRefreshRef.current = refreshFn;
            }}
            externalRefreshing={refreshing}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContentContainer: {
    // --- 3. MODIFIKASI STYLE ---
    paddingBottom: SIZES.padding2 + 20,
    flexGrow: 1, // Tambahkan flexGrow agar kontainer bisa "tumbuh"
  },
  searchContainer: {
    marginTop: -SIZES.padding * 3.5,
    marginHorizontal: SIZES.padding,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius * 1.5,
    padding: SIZES.padding,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  contentArea: {
    marginTop: SIZES.padding,
    paddingHorizontal: SIZES.padding,
  },
});

export default HomeScreen;