// src/screens/LocationPickerScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  PermissionsAndroid, // Tetap di-import meskipun tidak dipakai langsung, untuk jaga-jaga
  Alert,
  Image,
  Animated,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation'; // Tetap di-import meskipun tidak dipakai langsung
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// GANTI DENGAN API KEY ANDA
const GOOGLE_MAPS_API_KEY = 'AIzaSyCOPdSzFR6e9UEhIuqt-5U7SkgCKJnHIgs';

// Style peta kustom
const customMapStyle = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

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

const LocationPickerScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const [initialRegion, setInitialRegion] = useState(null);
  const [currentUserPosition, setCurrentUserPosition] = useState(null);
  const [locationInfo, setLocationInfo] = useState({ title: 'Memuat...', address: '...' });
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mapRef = useRef(null);
  const rotationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMoving) {
      Animated.loop(
        Animated.timing(rotationValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotationValue.stopAnimation();
      rotationValue.setValue(0);
    }
  }, [isMoving]);

  const fetchLocationDetails = async (latitude, longitude) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const address = result.formatted_address;

        let areaTitle = '';
        const routeComponent = result.address_components.find(c => c.types.includes('route'));
        const neighborhoodComponent = result.address_components.find(c => c.types.includes('neighborhood'));
        const sublocalityComponent = result.address_components.find(c => c.types.includes('sublocality'));

        if (routeComponent) {
          areaTitle = routeComponent.long_name;
        } else if (neighborhoodComponent) {
          areaTitle = neighborhoodComponent.long_name;
        } else if (sublocalityComponent) {
          areaTitle = sublocalityComponent.long_name;
        } else {
          areaTitle = address.split(',')[0];
        }

        setLocationInfo({
          title: areaTitle,
          address: address,
        });
      } else {
        setLocationInfo({
          title: 'Lokasi Tidak Dikenal',
          address: `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`,
        });
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setLocationInfo({
        title: 'Gagal Memuat',
        address: 'Periksa koneksi internet Anda.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // =================================================================
  // MODIFIKASI UTAMA DIMULAI DI SINI
  // =================================================================
  // GANTI DENGAN BLOK INI
useEffect(() => {
    const requestLocationPermission = async () => {
      let granted = false;
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (result === PermissionsAndroid.RESULTS.GRANTED) granted = true;
      } else {
        granted = true; // Untuk iOS, izin ditangani secara berbeda
      }

      if (granted) {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const region = { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };

            setInitialRegion(region);
            setCurrentUserPosition({ latitude, longitude });
            fetchLocationDetails(latitude, longitude);

            if (mapRef.current) {
              mapRef.current.animateToRegion(region, 1000);
            }
          },
          (error) => {
            Alert.alert('Gagal Mendapatkan Lokasi', 'Pastikan layanan lokasi Anda aktif. Menggunakan lokasi default Batam.');
            const defaultRegion = { latitude: 1.1073, longitude: 104.0304, latitudeDelta: 0.1, longitudeDelta: 0.1 };
            setInitialRegion(defaultRegion);
            fetchLocationDetails(defaultRegion.latitude, defaultRegion.longitude);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );

        const watchId = Geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentUserPosition({ latitude, longitude });
          },
          (error) => console.log('WatchPosition Error:', error),
          { enableHighAccuracy: true, distanceFilter: 10, interval: 5000 }
        );
        return () => Geolocation.clearWatch(watchId);
        
      } else {
        Alert.alert('Izin Ditolak', 'Aplikasi tidak dapat mengakses lokasi. Menggunakan lokasi default Batam.');
        const defaultRegion = { latitude: 1.1073, longitude: 104.0304, latitudeDelta: 0.1, longitudeDelta: 0.1 };
        setInitialRegion(defaultRegion);
        fetchLocationDetails(defaultRegion.latitude, defaultRegion.longitude);
      }
    };

    requestLocationPermission();
}, []); // Array dependensi kosong memastikan ini hanya berjalan sekali saat komponen dimuat
  // =================================================================
  // MODIFIKASI UTAMA SELESAI
  // =================================================================


  const goToMyLocation = () => {
    // Sekarang fungsi ini akan mengembalikan peta ke pusat Batam
    if (currentUserPosition && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentUserPosition,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
      fetchLocationDetails(currentUserPosition.latitude, currentUserPosition.longitude);
    }
  };

  const rotate = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleContinue = () => {
    if (route.params && route.params.onSelect) {
      route.params.onSelect(locationInfo.address);
      navigation.goBack();
    } else {
      Alert.alert("Lanjut", `Lokasi dipilih: ${locationInfo.address}`);
    }
  };

  const getCardTitle = () => {
    if (route.params && route.params.target === 'to') {
      return 'Set lokasi tujuan';
    }
    return 'Set lokasi jemput';
  };

  return (
    <View style={styles.container}>
      {initialRegion && ( // Tambahkan pengecekan ini agar peta tidak render sebelum region siap
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          customMapStyle={customMapStyle}
          onMapReady={() => setIsMapReady(true)}
          onRegionChange={() => {
            if (!isMoving) setIsMoving(true);
            if (!isLoading) setIsLoading(true);
          }}
          onRegionChangeComplete={(region) => {
            if (isMoving) {
              setIsMoving(false);
              fetchLocationDetails(region.latitude, region.longitude);
            }
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {currentUserPosition && (
            <Marker coordinate={currentUserPosition} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.userLocationMarker} />
            </Marker>
          )}
        </MapView>
      )}
      
      <Animated.View style={[styles.pickupMarkerContainer, { transform: [{ translateY: -54 }, { rotate }] }]}>
        <View style={styles.pickupMarker}>
          <Image
            source={isMoving ? require('../assets/icons/refresh.png') : require('../assets/icons/arrow-small-up.png')}
            style={styles.pickupIconImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.pickupMarkerPin} />
        <View style={styles.pickupMarkerBottomCircle} />
      </Animated.View>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Image 
          source={require('../assets/icons/chevron_left.png')} 
          style={styles.backButtonImage} 
          resizeMode="contain" 
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.myLocationButton} onPress={goToMyLocation}>
        <Image 
          source={require('../assets/icons/my_location.png')} 
          style={styles.myLocationButtonImage} 
          resizeMode="contain" 
        />
      </TouchableOpacity>
      
      <View style={[styles.backCard, { bottom: 10 + insets.bottom }]} />

      <View style={[styles.bottomCard, { paddingBottom: 20 + insets.bottom }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{getCardTitle()}</Text>
          <TouchableOpacity>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
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
              <Text style={styles.locationTitle}>{locationInfo.title}</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>{locationInfo.address}</Text>
            </View>
          </View>
        )}
        
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Lanjut</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 1)',
    borderWidth: 3,
    borderColor: '#FFF',
  },

  pickupMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -22 }],
    alignItems: 'center',
  },
  pickupMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0064d2',
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  pickupIconImage: {
    width: 34,
    height: 34,
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
    backgroundColor: '#0064d2',
    marginTop: 1,
  },

  backButton: { 
    position: 'absolute', 
    bottom: 280, 
    left: 20, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 4 
  },
  backButtonImage: { width: 20, height: 20, tintColor: '#353535ff' },
  myLocationButton: { 
    position: 'absolute', 
    bottom: 280,
    right: 20, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 4 
  },
  myLocationButtonImage: { width: 20, height: 20, tintColor: '#353535ff' },
  
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
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20,
    elevation: 10, 
    zIndex: 10 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  editButtonText: { fontSize: 16, fontWeight: '600', color: '#0064d2' },
  locationInfoBox: { backgroundColor: '#F0FFF8', borderRadius: 10, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#D6F5E9' },
  locationIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0064d2', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  locationIconImage: { width: 10, height: 10, tintColor: '#FFF' },
  locationTextContainer: { flex: 1 },
  locationTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  locationAddress: { fontSize: 14, color: '#666' },
  continueButton: { backgroundColor: '#0064d2', borderRadius: 25, paddingVertical: 15, alignItems: 'center' },
  continueButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  skeletonTitle: {
    height: 16,
    width: '70%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonAddress: {
    height: 14,
    width: '90%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
});

export default LocationPickerScreen;