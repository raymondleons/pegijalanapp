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
const BOTTOM_CARD_HEIGHT = 200;

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
  // PERBAIKAN: Handle case ketika route.params tidak ada dengan lebih aman
  const params = route?.params || {};
  const onSelect = params.onSelect || (() => {});
  const target = params.target || 'to';
  
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

  // Cleanup effect yang lebih komprehensif
  useEffect(() => {
    return () => {
      // Bersihkan timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      // Bersihkan watch location
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
      }
      
      // Hentikan semua animasi
      slideAnim.stopAnimation();
      loadingRotation.stopAnimation();
    };
  }, []);

  // Setup animasi loading rotation
  useEffect(() => {
    let animation = null;
    
    if (showPickupLoading) {
      animation = Animated.loop(
        Animated.timing(loadingRotation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      loadingRotation.stopAnimation();
      loadingRotation.setValue(0);
    }
    
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [showPickupLoading]);

  const loadingRotate = loadingRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // PERBAIKAN: Handle navigation back dengan lebih aman
  const handleGoBack = () => {
    try {
      // Hentikan semua animasi sebelum navigasi
      slideAnim.stopAnimation();
      loadingRotation.stopAnimation();
      
      // Bersihkan timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      // Navigasi kembali
      if (navigation && typeof navigation.goBack === 'function') {
        navigation.goBack();
      }
    } catch (error) {
      console.log('Error in handleGoBack:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
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
            getAccurateLocation();
          }
        } catch (err) {
          console.warn('Permission error:', err);
        }
      }
    } catch (error) {
      console.log('Request location permission error:', error);
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setShowPickupLoading(true);
    
    try {
      Geolocation.getCurrentPosition(
        (position) => {
          handleLocationSuccess(position);
        },
        (error) => {
          setIsGettingLocation(false);
          setShowPickupLoading(false);
          console.log('Location error:', error);
        },
        { 
          timeout: 2000,
          maximumAge: 300000,
          enableHighAccuracy: false
        }
      );
    } catch (error) {
      setIsGettingLocation(false);
      setShowPickupLoading(false);
      console.log('Geolocation error:', error);
    }
  };

  const getAccurateLocation = () => {
    try {
      Geolocation.getCurrentPosition(
        (position) => {
          handleLocationSuccess(position);
        },
        (error) => {
          setIsGettingLocation(false);
          setShowPickupLoading(false);
          console.log('Accurate location error:', error);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 5000,
          maximumAge: 0 
        }
      );
    } catch (error) {
      setIsGettingLocation(false);
      setShowPickupLoading(false);
      console.log('Accurate location catch error:', error);
    }
  };

  const handleLocationSuccess = (position) => {
    try {
      const { latitude, longitude } = position.coords;
      const myLocation = {
        name: 'Lokasi Saya',
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        coordinate: { latitude, longitude },
      };
      
      setSelectedLocation(myLocation);
      
      const newRegion = { 
        ...myLocation.coordinate, 
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
      };
      
      setRegion(newRegion);
      
      if (mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
        mapRef.current.animateToRegion(newRegion, 800);
      }
      
      fetchAddressFromCoords(myLocation.coordinate);
    } catch (error) {
      console.log('Location success error:', error);
    } finally {
      setIsGettingLocation(false);
      setShowPickupLoading(false);
    }
  };

  const zoomToLocation = (coordinate, zoomLevel = 0.005) => {
    try {
      const newRegion = {
        ...coordinate,
        latitudeDelta: zoomLevel,
        longitudeDelta: zoomLevel
      };
      
      setRegion(newRegion);
      
      if (mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
        mapRef.current.animateToRegion(newRegion, 800);
      }
    } catch (error) {
      console.log('Zoom to location error:', error);
    }
  };

  useEffect(() => {
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
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&components=country:ID&language=id`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK') { 
        setPredictions(data.predictions || []); // PERBAIKAN: Pastikan predictions ada
      } else { 
        setPredictions([]); 
      }
    } catch (error) { 
      console.error('Error fetching autocomplete:', error);
      setPredictions([]);
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    if (debounceTimeout.current) { 
      clearTimeout(debounceTimeout.current); 
    }
    debounceTimeout.current = setTimeout(() => {
      if (searchQuery) { 
        fetchAutocompletePredictions(searchQuery); 
      } else { 
        setPredictions([]); 
      }
    }, 500);
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery]);

  const onPredictionPress = async (placeId) => {
    Keyboard.dismiss();
    setIsLoading(true);
    setSearchQuery('');
    setPredictions([]);
    
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=name,formatted_address,geometry&language=id`;
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
        zoomToLocation(newLocation.coordinate, 0.005);
      }
    } catch (error) { 
      console.error('Error fetching place details:', error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const onMapPress = (event) => {
    try {
      const tappedCoordinate = event.nativeEvent.coordinate;
      const placeholderLocation = {
        name: 'Lokasi Pilihan',
        address: `${tappedCoordinate.latitude.toFixed(6)}, ${tappedCoordinate.longitude.toFixed(6)}`,
        coordinate: tappedCoordinate,
      };
      setSelectedLocation(placeholderLocation);
      zoomToLocation(tappedCoordinate, 0.005);
      fetchAddressFromCoords(tappedCoordinate);
    } catch (error) {
      console.log('Map press error:', error);
    }
  };
  
  const hideDetailsCard = () => {
    setSelectedLocation(null);
  };

  const goToMyLocation = () => {
    getCurrentLocation();
  };

  const fetchAddressFromCoords = async ({ latitude, longitude }) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=id`;
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
    }
  };

  const handleSelectLocation = () => {
    try {
      if (!selectedLocation) {
        Alert.alert("Lokasi belum dipilih", "Silakan pilih lokasi terlebih dahulu.");
        return;
      }

      if (typeof onSelect === 'function') {
        onSelect(selectedLocation);
      }
      
      handleGoBack(); // Gunakan fungsi handleGoBack yang sudah diperbaiki
    } catch (error) {
      console.error('Error in handleSelectLocation:', error);
      Alert.alert("Error", "Terjadi kesalahan: " + error.message);
    }
  };

  const getCardTitle = () => {
    if (target === 'to') {
      return 'Set lokasi tujuan';
    }
    return 'Set lokasi jemput';
  };

  const predictionListTop = insets.top + SEARCH_BAR_HEIGHT + (SEARCH_BAR_PADDING * 2);

  const getCurrentLocationButtonBottom = () => {
    if (selectedLocation) {
      return cardHeight + 20;
    }
    return 20;
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
      
      <TouchableOpacity 
        style={[styles.currentLocationButton, { bottom: getCurrentLocationButtonBottom() }]} 
        onPress={goToMyLocation}
      >
        <Image 
          source={require('../assets/icons/my_location.png')} 
          style={[styles.currentLocationIcon, { tintColor: COLORS.primary }]} 
        />
      </TouchableOpacity>
      
      <View style={[styles.backCard, { bottom: 10 + insets.bottom }]} />

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

// Styles tetap sama seperti sebelumnya
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
    zIndex: 15,
  },
  currentLocationIcon: {
    width: 24,
    height: 24,
  },
});

export default LocationSearchScreen;