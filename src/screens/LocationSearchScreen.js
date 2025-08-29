// src/screens/LocationSearchScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  Image,
  Animated,
  Alert,
  PermissionsAndroid,
  Platform,
  Dimensions,
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
const { width, height } = Dimensions.get('window');
const BOTTOM_CARD_HEIGHT = 200; // Perkiraan tinggi card bawah

const SkeletonLoader = () => (
  <View style={styles.locationInfoBox}>
    <View style={styles.locationIcon}>
      <Image
        source={require('../assets/icons/black-circle.png')}
        style={styles.locationIconImage}
        resizeMode="contain"
      />
    </View>
    <View style={styles.locationTextContainer}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonAddress} />
    </View>
  </View>
);

const LocationSearchScreen = ({ navigation, route }) => {
  const { onSelect, target } = route.params || {};
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const debounceTimeout = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [region, setRegion] = useState(BATAM_REGION);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const slideAnim = useRef(new Animated.Value(BOTTOM_CARD_HEIGHT)).current;
  const watchId = useRef(null);
  const [cardHeight, setCardHeight] = useState(0);

  // State untuk animasi loading di icon refresh
  const [showPickupLoading, setShowPickupLoading] = useState(false);
  const loadingRotation = useRef(new Animated.Value(0)).current;

  // Setup animasi loading rotation untuk icon refresh
  useEffect(() => {
    if (showPickupLoading) {
      Animated.loop(
        Animated.timing(loadingRotation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      loadingRotation.stopAnimation();
      loadingRotation.setValue(0);
    }

    // Cleanup watch position ketika komponen unmount
    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
      }
    };
  }, [showPickupLoading]);

  // Interpolasi untuk animasi loading icon refresh
  const loadingRotate = loadingRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
    setShowPickupLoading(true); // Tampilkan loading di icon refresh
    
    Geolocation.getCurrentPosition(
      (position) => {
        handleLocationSuccess(position);
      },
      (error) => {
        // Jika gagal dengan cached location, coba dapatkan lokasi yang lebih akurat
        getAccurateLocation();
      },
      { 
        timeout: 2000, // Timeout lebih pendek (2 detik)
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
        setShowPickupLoading(false); // Sembunyikan loading di icon refresh
        // Tetap lanjutkan meskipun gagal dapatkan lokasi
        Alert.alert(
          'Info', 
          'Tidak dapat mendapatkan lokasi saat ini. Anda tetap dapat memilih lokasi secara manual.'
        );
      },
      { 
        enableHighAccuracy: true, 
        timeout: 5000, // Timeout lebih pendek (5 detik)
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
    
    // Zoom in ke lokasi dengan level zoom yang lebih dekat
    const newRegion = { 
      ...myLocation.coordinate, 
      latitudeDelta: 0.005, // Lebih kecil untuk zoom in
      longitudeDelta: 0.005 // Lebih kecil untuk zoom in
    };
    
    setRegion(newRegion);
    
    if (mapRef.current) {
      // Animate to region dengan durasi lebih cepat untuk respons yang lebih baik
      mapRef.current.animateToRegion(newRegion, 800);
    }
    
    // Dapatkan alamat di background tanpa menunggu
    fetchAddressFromCoords(myLocation.coordinate);
    setIsGettingLocation(false);
    setShowPickupLoading(false); // Sembunyikan loading di icon refresh setelah berhasil
  };

  // Fungsi untuk zoom in ke lokasi tertentu
  const zoomToLocation = (coordinate, zoomLevel = 0.005) => {
    const newRegion = {
      ...coordinate,
      latitudeDelta: zoomLevel,
      longitudeDelta: zoomLevel
    };
    
    setRegion(newRegion);
    
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 800);
    }
  };

  useEffect(() => {
    // Request permission lokasi saat komponen dimount
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: BOTTOM_CARD_HEIGHT, duration: 300, useNativeDriver: true }).start();
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
        
        // Zoom in ke lokasi yang dipilih dari prediksi
        zoomToLocation(newLocation.coordinate, 0.005);
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
    
    // Zoom in ke lokasi yang di-tap
    zoomToLocation(tappedCoordinate, 0.005);
    
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

  const getCardTitle = () => {
    if (target === 'to') {
      return 'Set lokasi tujuan';
    }
    return 'Set lokasi jemput';
  };

  const predictionListTop = insets.top + SEARCH_BAR_HEIGHT + (SEARCH_BAR_PADDING * 2);

  // Hitung posisi tombol current location agar tidak tertutup card
  const getCurrentLocationButtonBottom = () => {
    if (selectedLocation) {
      return cardHeight + 20; // 20px di atas card
    }
    return 20; // 20px dari bawah layar
  };

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
      </View>
      
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={BATAM_REGION}
        region={region}
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
      
      {/* Pickup Marker dengan animasi HANYA pada icon */}
      <View style={styles.pickupMarkerContainer}>
        <View style={styles.pickupMarker}>
          {showPickupLoading ? (
            <Animated.Image
              source={require('../assets/icons/refresh.png')}
              style={[
                styles.refreshIconImage,
                { transform: [{ rotate: loadingRotate }] }
              ]}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require('../assets/icons/arrow-small-up.png')}
              style={styles.pickupIconImage}
              resizeMode="contain"
            />
          )}
        </View>
        <View style={styles.pickupMarkerPin} />
        <View style={styles.pickupMarkerBottomCircle} />
      </View>
      
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
      
      {/* Tombol Current Location dengan posisi yang diperbaiki */}
      <TouchableOpacity 
        style={[styles.currentLocationButton, { bottom: getCurrentLocationButtonBottom() }]} 
        onPress={goToMyLocation}
      >
        <Image 
          source={require('../assets/icons/my_location.png')} 
          style={[styles.currentLocationIcon, { tintColor: COLORS.primary }]} 
        />
      </TouchableOpacity>
      
      {/* Back Card */}
      <View style={[styles.backCard, { bottom: 10 + insets.bottom }]} />

      {/* Bottom Card */}
      <Animated.View 
        style={[
          styles.bottomCard, 
          { 
            paddingBottom: 20 + insets.bottom, 
            transform: [{ translateY: slideAnim }] 
          }
        ]}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setCardHeight(height);
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{getCardTitle()}</Text>
          <TouchableOpacity onPress={hideDetailsCard}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        {(isLoading || showPickupLoading) ? (
          <SkeletonLoader />
        ) : (
          <View style={styles.locationInfoBox}>
            <View style={styles.locationIcon}>
              <Image 
                source={require('../assets/icons/black-circle.png')} 
                style={styles.locationIconImage} 
                resizeMode="contain" 
              />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationTitle}>{selectedLocation?.name || 'Pilih lokasi'}</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {selectedLocation?.address || 'Geser peta untuk memilih lokasi'}
              </Text>
            </View>
          </View>
        )}
        
        <TouchableOpacity style={styles.continueButton} onPress={handleSelectLocation}>
          <Text style={styles.continueButtonText}>Pilih Lokasi Ini</Text>
        </TouchableOpacity>
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
  
  // Pickup Marker Styles - DIUBAH: Hanya icon yang beranimasi
  pickupMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -22 }, { translateY: -54 }],
    alignItems: 'center',
    zIndex: 100,
  },
  pickupMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  pickupIconImage: {
    width: 34,
    height: 34,
    tintColor: '#FFF',
  },
  refreshIconImage: {
    width: 24,
    height: 24,
    tintColor: '#FFF',
  },
  pickupMarkerPin: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFF',
    marginTop: -2,
  },
  pickupMarkerBottomCircle: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginTop: 1,
  },
  
  // Back Card
  backCard: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 60,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 5,
  },
  
  // Bottom Card
  bottomCard: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20,
    elevation: 10, 
    zIndex: 10 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.black 
  },
  editButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.primary 
  },
  locationInfoBox: { 
    backgroundColor: '#F0FFF8', 
    borderRadius: 10, 
    padding: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#D6F5E9' 
  },
  locationIcon: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: COLORS.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  locationIconImage: { 
    width: 10, 
    height: 10, 
    tintColor: COLORS.white 
  },
  locationTextContainer: { 
    flex: 1 
  },
  locationTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: COLORS.black 
  },
  locationAddress: { 
    fontSize: 14, 
    color: COLORS.darkGray 
  },
  continueButton: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 25, 
    paddingVertical: 15, 
    alignItems: 'center' 
  },
  continueButtonText: { 
    color: COLORS.white, 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  
  // Skeleton Loader
  skeletonTitle: {
    height: 16,
    width: '70%',
    backgroundColor: COLORS.gray,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonAddress: {
    height: 14,
    width: '90%',
    backgroundColor: COLORS.gray,
    borderRadius: 4,
  },
  
  // Current Location Button - Diperbaiki
  currentLocationButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: COLORS.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 15, // Z-index lebih tinggi dari card
  },
  currentLocationIcon: {
    width: 24,
    height: 24,
  },
});

export default LocationSearchScreen;