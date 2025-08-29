// src/screens/LocationSearchScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Image,
  Animated,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

// Diasumsikan ini adalah palet warna dari theme.js Anda
const COLORS = {
    primary: '#0064d2',
    white: '#FFFFFF',
    black: '#333333',
    lightGray: '#F5F5F5',
    gray: '#E0E0E0',
    darkGray: '#666666',
};

const GOOGLE_MAPS_API_KEY = 'AIzaSyCOPdSzFR6e9UEhIuqt-5U7SkgCKJnHIgs';

const BATAM_REGION = {
  latitude: 1.1073,
  longitude: 104.0304,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const SEARCH_BAR_HEIGHT = 50;
const SEARCH_BAR_PADDING = 16;

const LocationSearchScreen = ({ navigation, route }) => {
  const { onSelect } = route.params || {};
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const debounceTimeout = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [region, setRegion] = useState(BATAM_REGION);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false); // Diubah ke false awal
  const slideAnim = useRef(new Animated.Value(300)).current;
  const watchId = useRef(null);

  // Minta izin lokasi dan dapatkan posisi pengguna
  useEffect(() => {
    requestLocationPermission();
    
    // Cleanup watch position ketika komponen unmount
    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  const requestLocationPermission = async () => {
    // Langsung coba dapatkan lokasi tanpa menunggu izin (akan fallback ke cached location)
    getCurrentLocation();
    
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Izin Akses Lokasi',
            message: 'Aplikasi memerlukan akses lokasi untuk menampilkan posisi Anda',
            buttonNeutral: 'Tanya Nanti',
            buttonNegative: 'Batal',
            buttonPositive: 'Izinkan',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // Jika izin diberikan, dapatkan lokasi yang lebih akurat
          getAccurateLocation();
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Fungsi untuk mendapatkan lokasi cepat (menggunakan cache)
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    Geolocation.getCurrentPosition(
      (position) => {
        handleLocationSuccess(position);
      },
      (error) => {
        // Jika gagal dengan cached location, coba dapatkan lokasi yang lebih akurat
        getAccurateLocation();
      },
      { 
        timeout: 5000, // Timeout lebih pendek
        maximumAge: 300000, // Gunakan cached location hingga 5 menit
        enableHighAccuracy: false // Tidak perlu high accuracy untuk cepat
      }
    );
  };

  // Fungsi untuk mendapatkan lokasi yang lebih akurat
  const getAccurateLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        handleLocationSuccess(position);
      },
      (error) => {
        setIsGettingLocation(false);
        // Tetap lanjutkan meskipun gagal dapatkan lokasi
        Alert.alert(
          'Info', 
          'Tidak dapat mendapatkan lokasi saat ini. Anda tetap dapat memilih lokasi secara manual.'
        );
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  };

  // Handler untuk keberhasilan mendapatkan lokasi
  const handleLocationSuccess = (position) => {
    const { latitude, longitude } = position.coords;
    const myLocation = {
      name: 'Lokasi Saya',
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      coordinate: { latitude, longitude },
    };
    
    setSelectedLocation(myLocation);
    const newRegion = { ...myLocation.coordinate, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    setRegion(newRegion);
    
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
    
    // Dapatkan alamat di background tanpa menunggu
    fetchAddressFromCoords(myLocation.coordinate);
    setIsGettingLocation(false);
  };

  useEffect(() => {
    if (selectedLocation) {
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 300, duration: 300, useNativeDriver: true }).start();
    }
  }, [selectedLocation]);
  
  const fetchAutocompletePredictions = async (query) => {
    if (query.length < 3) { setPredictions([]); return; }
    setIsLoading(true);
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&components=country:ID&language=id`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK') { setPredictions(data.predictions); } else { setPredictions([]); }
    } catch (error) { console.error('Error fetching autocomplete:', error); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (debounceTimeout.current) { clearTimeout(debounceTimeout.current); }
    debounceTimeout.current = setTimeout(() => {
      if (searchQuery) { fetchAutocompletePredictions(searchQuery); } else { setPredictions([]); }
    }, 500);
    return () => clearTimeout(debounceTimeout.current);
  }, [searchQuery]);

  const onPredictionPress = async (placeId) => {
    Keyboard.dismiss();
    setIsLoading(true);
    setSearchQuery('');
    setPredictions([]);
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=name,formatted_address,geometry&language=id`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK') {
        const { location } = data.result.geometry;
        const newLocation = {
          name: data.result.name,
          address: data.result.formatted_address,
          coordinate: { latitude: location.lat, longitude: location.lng },
        };
        setSelectedLocation(newLocation);
        const newRegion = { ...newLocation.coordinate, latitudeDelta: 0.02, longitudeDelta: 0.02 };
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
    } catch (error) { console.error('Error fetching place details:', error); } finally { setIsLoading(false); }
  };

  const onMapPress = (event) => {
    const tappedCoordinate = event.nativeEvent.coordinate;
    const placeholderLocation = {
      name: 'Lokasi Pilihan',
      address: `${tappedCoordinate.latitude.toFixed(6)}, ${tappedCoordinate.longitude.toFixed(6)}`,
      coordinate: tappedCoordinate,
    };
    setSelectedLocation(placeholderLocation);
    fetchAddressFromCoords(tappedCoordinate);
  };
  
  const hideDetailsCard = () => {
    setSelectedLocation(null);
  };
  
  const handleGoBack = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const goToMyLocation = () => {
    getCurrentLocation();
  };

  // Fungsi yang diperbaiki untuk mendapatkan alamat dari koordinat
  const fetchAddressFromCoords = async ({ latitude, longitude }) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=id`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results[0]) {
        const address = data.results[0].formatted_address;
        const name = data.results[0].address_components[0]?.long_name || 'Lokasi Dipilih';
        
        setSelectedLocation(prev => ({
          ...prev,
          name: name,
          address: address,
          coordinate: { latitude, longitude }
        }));
      }
    } catch (error) { 
      console.error("Error fetching address from coords:", error);
      // Tetap gunakan koordinat jika gagal mendapatkan alamat
    }
  };

  const handleSelectLocation = () => {
    if (selectedLocation && onSelect) {
      onSelect(selectedLocation.address);
      navigation.goBack();
    } else if (selectedLocation) {
      Alert.alert("Info", `Lokasi dipilih: ${selectedLocation.address}`);
    }
  };

  const predictionListTop = insets.top + SEARCH_BAR_HEIGHT + (SEARCH_BAR_PADDING * 2);

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { paddingTop: insets.top + SEARCH_BAR_PADDING }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Image source={require('../assets/icons/chevron_left.png')} style={styles.iconImage} />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama tempat atau alamat..."
          placeholderTextColor={COLORS.darkGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {isLoading && <ActivityIndicator style={styles.loader} color={COLORS.primary} />}
      </View>
      
      {isGettingLocation && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Mendapatkan lokasi Anda...</Text>
        </View>
      )}
      
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={BATAM_REGION}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onPress={onMapPress}
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation.coordinate}
            title={selectedLocation.name}
            description={selectedLocation.address}
          >
            <View style={styles.markerContainer}>
              <View style={styles.markerCircle}>
                <View style={styles.markerInnerCircle} />
              </View>
            </View>
          </Marker>
        )}
      </MapView>
      
      {predictions.length > 0 && (
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.predictionItem} onPress={() => onPredictionPress(item.place_id)}>
              <Text style={styles.predictionMainText}>{item.structured_formatting.main_text}</Text>
              <Text style={styles.predictionSecondaryText}>{item.structured_formatting.secondary_text}</Text>
            </TouchableOpacity>
          )}
          style={[styles.predictionsContainer, { top: predictionListTop }]}
        />
      )}
      
      <TouchableOpacity style={[styles.currentLocationButton, { bottom: insets.bottom + (selectedLocation ? 180 : 20) }]} onPress={goToMyLocation}>
        <Image source={require('../assets/icons/my_location.png')} style={styles.iconImage} />
      </TouchableOpacity>
      
      <Animated.View style={[
        styles.bottomCard, { paddingBottom: insets.bottom + 16, transform: [{ translateY: slideAnim }] }
      ]}>
        {selectedLocation && (
          <>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>{selectedLocation.name}</Text>
              <TouchableOpacity onPress={hideDetailsCard} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardAddress} numberOfLines={2}>{selectedLocation.address}</Text>
            <TouchableOpacity style={styles.selectButton} onPress={handleSelectLocation}>
              <Text style={styles.selectButtonText}>Pilih Lokasi Ini</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: SEARCH_BAR_PADDING,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: SEARCH_BAR_HEIGHT,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.black,
  },
  backButton: {
    padding: 10,
    marginRight: 8,
  },
  iconImage: {
    width: 24,
    height: 24,
    tintColor: COLORS.darkGray,
  },
  loader: {
    position: 'absolute',
    right: 32,
    top: '50%',
    marginTop: -10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  predictionsContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    elevation: 5,
    zIndex: 10,
    maxHeight: 250,
  },
  predictionItem: { 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.lightGray 
  },
  predictionMainText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: COLORS.black 
  },
  predictionSecondaryText: { 
    fontSize: 14, 
    color: COLORS.darkGray 
  },
  map: { 
    flex: 1 
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  markerInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  cardTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: COLORS.black, 
    flex: 1 
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10
  },
  closeButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: COLORS.darkGray 
  },
  cardAddress: { 
    fontSize: 14, 
    color: COLORS.darkGray, 
    marginBottom: 16 
  },
  selectButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center'
  },
  selectButtonText: { 
    color: COLORS.white, 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  currentLocationButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 10,
  },
});

export default LocationSearchScreen;