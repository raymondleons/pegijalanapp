import React, { useState, useCallback, useEffect } from 'react';
// Menambahkan TouchableOpacity dan useNavigation
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SIZES, FONTS, COLORS } from '../../constants';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';

// --- Komponen Kartu ---
const RecentSearchCard = ({ item, onPress }) => {
  const [imageError, setImageError] = useState(false);

  if (!item) return null;

  const imageSource = !item.imageUrl || imageError
    ? require('../../assets/icons/no_image.png')
    : { uri: item.imageUrl };

  return (
    // Kartu sekarang memanggil fungsi onPress saat ditekan
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      <Image
        source={imageSource}
        style={styles.cardImage}
        onError={() => setImageError(true)}
      />
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.category} • {item.location}</Text>
      </View>
      <Image
        source={require('../../assets/icons/chevron_right.png')}
        style={styles.cardArrow}
      />
    </TouchableOpacity>
  );
};

// --- Komponen Utama ---
const RecentSearchesSection = ({ onRefreshRegister, externalRefreshing }) => {
  const { t } = useLocalization();
  const { userToken, getRecentSearches } = useAuth();
  const [searches, setSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleCardPress = (item) => {
    if (item.type === 'tour' && item.originalId) {
      navigation.navigate('TourDetail', { tourId: item.originalId });
    }
    // Tambahkan logika untuk tipe lain jika perlu
  };

  const fetchSearches = useCallback(async () => {
    if (!userToken) {
      setSearches([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await getRecentSearches();

      if (response && Array.isArray(response.data)) {
        const formattedData = response.data.map((item) => {
          const query = item.search_query;
          const imageUrl = item.imageUrl
            ? `https://tiket.crelixdigital.com/api${item.imageUrl}`
            : null;

          return {
            id: item.id.toString(),
            originalId: query.id, 
            type: item.search_type,
            title: query.destination,
            category: (item.category || item.search_type || 'Kategori').toUpperCase().replace('_', ' '),
            location: item.main_destination || item.location_city || 'Indonesia',
            imageUrl: imageUrl,
          };
        });
        setSearches(formattedData);
      } else {
        setSearches([]);
      }
    } catch (error) {
      console.error('FETCH_SEARCHES_ERROR:', error);
      setSearches([]);
    } finally {
      setIsLoading(false);
    }
  }, [userToken, getRecentSearches]);

  useFocusEffect(useCallback(() => { fetchSearches(); }, [fetchSearches]));
  useEffect(() => { if (onRefreshRegister) onRefreshRegister(fetchSearches); }, [onRefreshRegister, fetchSearches]);

  const isLoadingOrRefreshing = isLoading || externalRefreshing;

  const RecentSearchCardSkeleton = () => (
    <View style={styles.card}>
      <View style={styles.imageSkeleton} />
      <View style={styles.textContainerSkeleton}>
        <View style={styles.titleSkeleton} />
        <View style={styles.subtitleSkeleton} />
      </View>
    </View>
  );
  
  if (!userToken) return null;

  return (
      <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{t('recent_searches')}</Text>
          </View>

          {isLoadingOrRefreshing ? (
            <FlatList
              data={[1, 2, 3]}
              keyExtractor={(item) => item.toString()}
              renderItem={() => <RecentSearchCardSkeleton />}
              ItemSeparatorComponent={() => <View style={{ height: SIZES.base }} />}
              scrollEnabled={false}
            />
          ) : searches.length > 0 ? (
              <FlatList
                  data={searches}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <RecentSearchCard item={item} onPress={handleCardPress} />}
                  ItemSeparatorComponent={() => <View style={{ height: SIZES.base }} />}
                  scrollEnabled={false}
              />
          ) : (
            <View style={styles.noSearchContainer}>
              <Image source={require('../../assets/icons/no-data.png')} style={styles.noSearchIcon} />
              <Text style={styles.noSearchText}>{t('no_recent_searches', 'Tidak ada pencarian terbaru')}</Text>
            </View>
          )}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  title: {
    ...FONTS.h3,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.base,
    marginBottom: SIZES.base,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.lightGray,
  },
  cardTextContainer: {
    flex: 1,
    marginLeft: SIZES.base,
    marginRight: SIZES.base,
  },
  cardTitle: {
    ...FONTS.body3,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
  },
  cardSubtitle: {
    ...FONTS.body5,
    color: COLORS.text_light,
    marginTop: 4,
  },
  cardArrow: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    tintColor: COLORS.gray,
  },
  imageSkeleton: {
    width: 60,
    height: 60,
    borderRadius: SIZES.radius,
    backgroundColor: '#E0E0E0',
  },
  textContainerSkeleton: {
    flex: 1,
    marginLeft: SIZES.base,
  },
  titleSkeleton: {
    width: '80%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginBottom: SIZES.base,
  },
  subtitleSkeleton: {
    width: '50%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  noSearchContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSearchIcon: {
    width: 40,
    height: 40,
    tintColor: COLORS.gray,
    marginBottom: SIZES.base,
  },
  noSearchText: {
    ...FONTS.body4,
    color: COLORS.text_light,
  },
});

export default RecentSearchesSection;
