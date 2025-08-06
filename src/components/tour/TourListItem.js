import React, { useState } from 'react'; // <-- Tambahkan useState
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants';

const API_BASE_URL = "https://tiket.crelixdigital.com/api";
const CARD_HEIGHT = 200;

// ... (Komponen SkeletonLoader tetap sama)
const SkeletonLoader = () => {
  return (
    <View style={[styles.cardContainer, styles.skeleton]}>
      <View style={styles.imageWrapper}>
        <View style={[styles.cardImage, styles.skeletonImage]} />
      </View>
      <View style={styles.contentWrapper}>
        <View style={[styles.skeletonText, styles.skeletonTitle]} />
        <View style={[styles.rowInfo, styles.skeletonText]} />
        <View style={[styles.rowInfo, styles.skeletonText]} />
        <View style={styles.bottomContainer}>
          <View style={styles.promoSection}>
            <View style={styles.skeletonText} />
          </View>
          <View style={styles.priceSection}>
            <View style={styles.skeletonText} />
          </View>
        </View>
      </View>
    </View>
  );
};


const TourListItem = ({ item, onPress, isLoading }) => {
  if (isLoading) return <SkeletonLoader />;
  if (!item) return null;

  // State untuk melacak status 'love'
  const [isLoved, setIsLoved] = useState(false);

  const imageUrl = item.images?.length > 0
    ? (item.images[0].image_url.startsWith('http')
      ? item.images[0].image_url
      : `${API_BASE_URL}${item.images[0].image_url}`)
    : 'https://placehold.co/600x400?text=Gambar+Tidak+Tersedia';

  // ... (Sisa logika format data tetap sama)
  const hargaAwal = parseInt(item.price_per_person, 10) || 0;
  const diskon = parseInt(item.price_discount, 10) || 0;
  const adaDiskon = diskon > 0 && hargaAwal > 0;
  const hargaAkhir = adaDiskon ? hargaAwal - diskon : hargaAwal;
  const persentaseDiskon = adaDiskon ? Math.round((diskon / hargaAwal) * 100) : 0;
  
  const formatRupiah = (amount) => `IDR ${parseInt(amount, 10).toLocaleString('id-ID')}`;
  const formatLargeNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'RB';
    return num.toString();
  };

  const rating = item.rating ? parseFloat(item.rating).toFixed(1) : 'Baru';
  const reviewCount = item.review_count || 0;
  const soldCount = item.sold_count || 0;

  const infoParts = [];
  if (reviewCount > 0) {
    infoParts.push(`★ ${rating}`);
    infoParts.push(`${formatLargeNumber(reviewCount)} Ulasan`);
  }
  if (soldCount > 500) {
    infoParts.push('🔥 Terlaris');
  } else if (soldCount > 0) {
    infoParts.push(`${formatLargeNumber(soldCount)}+ dipesan`);
  }

  return (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={() => onPress(item)} 
      activeOpacity={0.93}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {/* === ICON LOVE BARU === */}
        <TouchableOpacity
          style={styles.loveIconContainer}
          onPress={() => setIsLoved(!isLoved)}
        >
          <Image
            source={
              isLoved
                ? require('../../assets/icons/heart-filled.png') // Ganti dengan path ikon Anda
                : require('../../assets/icons/heart-outline.png') // Ganti dengan path ikon Anda
            }
            style={styles.loveIcon}
          />
        </TouchableOpacity>
        {/* === END ICON LOVE === */}

      </View>

      <View style={styles.contentWrapper}>
        {/* ... (Sisa konten card tetap sama) ... */}
        <Text style={styles.cardTitle} numberOfLines={2}>{item.package_name}</Text>
        
        {reviewCount === 0 && (
          <View style={styles.reviewPromptContainer}>
              <Text style={styles.reviewPromptText}>
                ✨ Jadilah yang pertama mengulas!
              </Text>
          </View>
        )}

        {infoParts.length > 0 && (
          <View style={styles.rowInfo}>
            <Text style={styles.infoText}>
              {infoParts.join('   •   ')}
            </Text>
          </View>
        )}
        
        <Text style={styles.locationText}>{item.main_destination}</Text>
        
        <View style={{ flex: 1 }} />

        <View style={styles.bottomContainer}>
          <View style={styles.promoSection}>
            {adaDiskon && (
              <View style={styles.promoLine}>
                <Image 
                  source={require('../../assets/icons/discount-tag.png')} 
                  style={styles.promoIcon}
                />
                <Text style={styles.promoText} numberOfLines={2}>
                  Diskon <Text style={styles.promoTextBold}>{persentaseDiskon}%</Text> + cashback 4% dengan promo
                </Text>
              </View>
            )}
          </View>
          <View style={styles.priceSection}>
            {adaDiskon && <Text style={styles.hargaAwal}>{formatRupiah(hargaAwal)}</Text>}
            <Text style={styles.hargaAkhir}>{formatRupiah(hargaAkhir)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // ... (style yang sudah ada sebelumnya)
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginHorizontal: SIZES.padding,
    marginBottom: SIZES.padding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    height: CARD_HEIGHT,
    backgroundColor: '#ececec',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  cardImage: { 
    width: '100%',
    height: '100%',
  },
  contentWrapper: {
    padding: 12,
    minHeight: 140, 
    flex: 1,
  },
  // ... (sisa style lainnya tetap sama)
  cardTitle: {
    ...FONTS.h4,
    fontWeight: '600',
    color: COLORS.text_dark,
    lineHeight: 22,
    marginBottom: 6,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    ...FONTS.body5,
    color: COLORS.text_light,
  },
  reviewPromptContainer: {
    marginBottom: 8,
  },
  reviewPromptText: {
    ...FONTS.body5,
    color: '#007B7F',
    fontStyle: 'italic',
  },
  locationText: {
    ...FONTS.body5,
    color: COLORS.gray,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  promoSection: {
    flex: 1, 
    marginRight: 8,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  promoLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoIcon: {
    width: 16,
    height: 16,
    tintColor: '#E5004D',
    marginRight: 6,
  },
  promoText: {
    ...FONTS.body5,
    color: COLORS.text_light,
    flexShrink: 1, 
  },
  promoTextBold: {
    fontWeight: 'bold',
    color: '#E5004D',
  },
  hargaAwal: {
    color: COLORS.gray,
    textDecorationLine: 'line-through',
    fontSize: 13,
  },
  hargaAkhir: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E5004D',
  },

  // === STYLE BARU UNTUK ICON LOVE ===
  loveIconContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1, // Memastikan ikon di atas gambar
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Latar belakang agar ikon terlihat jelas
    padding: 6,
    borderRadius: 20, // Membuat latar belakang menjadi lingkaran
  },
  loveIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.white, // Ikon akan berwarna putih
  },
  // === END STYLE BARU ===

  // Skeleton styles
  skeleton: {
    backgroundColor: COLORS.white,
    shadowOpacity: 0,
    elevation: 0,
  },
  skeletonImage: {
    backgroundColor: '#e0e0e0',
    width: '100%',
    height: CARD_HEIGHT,
  },
  skeletonTitle: {
    backgroundColor: '#e0e0e0',
    height: 22,
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonText: {
    backgroundColor: '#e0e0e0',
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
  },
});

export default React.memo(TourListItem);