import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SIZES, FONTS, COLORS } from '../../constants';
import DealCard from '../DealCard';
import { useLocalization } from '../../context/LocalizationContext';

// Skeleton card untuk placeholder loading
const DealCardSkeleton = () => (
  <View style={styles.cardContainer}>
    <View style={styles.imageSkeleton} />
    <View style={styles.textContainer}>
      <View style={styles.titleSkeleton} />
      <View style={styles.descSkeleton} />
      <View style={styles.descSkeletonShort} />
    </View>
  </View>
);

// Komponen kecil untuk memberi jarak antar item di FlatList
const Separator = () => <View style={{ width: SIZES.padding }} />;

const DealsSection = ({ onRefreshRegister, externalRefreshing }) => {
  const { t } = useLocalization();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://tiket.crelixdigital.com/api/promo-codes?status=active');
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const json = await response.json();
      setPromos(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError(`Gagal memuat: ${err.message}`);
      console.error('FETCH_PROMOS_ERROR:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPromos();
    }, [fetchPromos])
  );

  useEffect(() => {
    if (onRefreshRegister) onRefreshRegister(fetchPromos);
  }, [onRefreshRegister, fetchPromos]);

  const isLoading = loading || externalRefreshing;

  const renderContent = () => {
    if (isLoading) {
      return (
        <FlatList
          data={[1, 2, 3]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <DealCardSkeleton />}
          ItemSeparatorComponent={Separator}
        />
      );
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    if (promos.length === 0) {
      return (
        <View style={styles.noDealsContainer}>
          <Image source={require('../../assets/icons/no-data.png')} style={styles.noDealsIcon} />
          <Text style={styles.noDealsText}>{t('info.noActiveDeals', 'Saat ini tidak ada promo aktif.')}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={promos}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <DealCard promo={item} />}
        ItemSeparatorComponent={Separator}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('deals')}</Text>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: SIZES.padding,
    minHeight: 250,
  },
  title: {
    ...FONTS.h3,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginBottom: SIZES.padding,
  },
  errorText: {
    ...FONTS.body3,
    color: '#D9534F',
    textAlign: 'center',
    height: 100,
    paddingTop: 20,
  },
  noDealsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 2,
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  noDealsIcon: {
    width: 40,
    height: 40,
    tintColor: COLORS.gray,
    marginBottom: SIZES.base,
  },
  noDealsText: {
    ...FONTS.body4,
    color: COLORS.text_light,
    textAlign: 'center',
  },
  cardContainer: {
    width: SIZES.width * 0.8,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base / 2, // Margin bawah kecil agar rapat antar card
    paddingBottom: SIZES.padding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  imageSkeleton: {
    width: '100%',
    height: 150,
    backgroundColor: '#E1E9EE',
    borderTopLeftRadius: SIZES.radius,
    borderTopRightRadius: SIZES.radius,
  },
  textContainer: {
    padding: SIZES.padding,
    paddingBottom: 0,
  },
  titleSkeleton: {
    width: '60%',
    height: 20,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    marginBottom: SIZES.base / 2,
  },
  descSkeleton: {
    width: '90%',
    height: 15,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    marginBottom: SIZES.base / 3,
  },
  descSkeletonShort: {
    width: '50%',
    height: 15,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
  },
});

export default DealsSection;
