import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    FlatList,
    Share,
    Linking,
    Alert,
    Modal,
    Platform,
} from 'react-native';
import axios from 'axios';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import CheckoutScreen from './CheckoutScreen';

// --- KONSTANTA ---
const STATUS_COLORS = {
    danger: '#dc3545',
    success: '#28a745',
    primary: '#007BFF',
};

const API_BASE_URL = "https://tiket.crelixdigital.com/api";
const IMAGE_BASE_URL = "https://tiket.crelixdigital.com/api";
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const HEADER_CHANGE_THRESHOLD = 50;

// --- FUNGSI BANTUAN ---
const formatRupiah = (amount) => {
    const number = parseInt(amount, 10);
    if (isNaN(number)) {
        return 'IDR 0';
    }
    return `IDR ${number.toLocaleString('id-ID')}`;
};

// --- KOMPONEN KUSTOM UNTUK HARGA CORET ---
const SlantedStrikethroughPrice = ({ textStyle, children }) => {
    const [textWidth, setTextWidth] = useState(0);

    return (
        <View style={styles.strikethroughContainer}>
            <Text
                style={textStyle}
                onLayout={(event) => setTextWidth(event.nativeEvent.layout.width)}
            >
                {children}
            </Text>
            {textWidth > 0 && (
                <View
                    style={[
                        styles.strikeLine,
                        {
                            width: textWidth * 1.05,
                        },
                    ]}
                />
            )}
        </View>
    );
};


// --- KOMPONEN BOOKING MODAL (DIPERBARUI) ---
const BookingModal = ({ visible, onClose, packageData, navigation }) => {
    if (!packageData) return null;

    const [ticketCounts, setTicketCounts] = useState({});
    const [ticketCategories, setTicketCategories] = useState([]);
    const [dates, setDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        if (!packageData) return;
        const categories = [];
        if (packageData.price_per_person > 0) {
            categories.push({
                key: 'adult',
                title: 'Dewasa',
                price: packageData.price_per_person,
                originalPrice: packageData.original_price_per_person || packageData.price_per_person,
            });
        }
        if (typeof packageData.child_price === 'number' && packageData.child_price > 0) {
            categories.push({
                key: 'child',
                title: 'Anak',
                price: packageData.child_price,
                originalPrice: packageData.original_child_price || packageData.child_price,
            });
        }
        setTicketCategories(categories);

        const initialCounts = {};
        categories.forEach(cat => {
            initialCounts[cat.key] = 0;
        });
        setTicketCounts(initialCounts);
    }, [packageData]);
    
    useEffect(() => {
        const futureDates = [];
        const startDate = new Date(); 
        for (let i = 0; i < 30; i++) {
            const newDate = new Date(startDate);
            newDate.setDate(startDate.getDate() + i);
            futureDates.push(newDate);
        }
        setDates(futureDates);
        if (futureDates.length > 0) {
            setSelectedDate(futureDates[0]);
        }
    }, []);
    
    const handleSetTicketCount = (key, newCount) => {
        setTicketCounts(prevCounts => ({
            ...prevCounts,
            [key]: Math.max(0, newCount),
        }));
    };

    const totalPax = Object.values(ticketCounts).reduce((sum, count) => sum + count, 0);

    const totalPrice = ticketCategories.reduce((total, category) => {
        const count = ticketCounts[category.key] || 0;
        return total + (count * category.price);
    }, 0);
    
    // Fungsi ini diubah untuk navigasi ke CheckoutScreen
    const handleBooking = () => {
        if (totalPrice === 0) {
            Alert.alert("Perhatian", "Silakan pilih jumlah tiket terlebih dahulu.");
            return;
        }
        
        const orderDetails = {
            packageData: packageData,
            selectedDate: selectedDate.toISOString(),
            ticketCounts: ticketCounts,
            totalPrice: totalPrice,
            totalPax: totalPax,
        };

        navigation.navigate('CheckoutScreen', { orderDetails });

        onClose();
    };

    const TicketCounter = ({ title, price, originalPrice, count, setCount }) => (
        <View style={styles.ticketCounterContainer}>
            <View style={styles.ticketInfoWrapper}>
                <Text style={styles.ticketTitle}>{title}</Text>
                {originalPrice > price && (
                    <SlantedStrikethroughPrice textStyle={styles.originalPriceText}>
                        {formatRupiah(originalPrice)}
                    </SlantedStrikethroughPrice>
                )}
                <Text style={styles.finalPrice}>{formatRupiah(price)}/pax</Text>
            </View>
            <View style={styles.counterControls}>
                <TouchableOpacity onPress={() => setCount(count - 1)} style={styles.counterButton}>
                    <Text style={styles.counterButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{count}</Text>
                <TouchableOpacity onPress={() => setCount(count + 1)} style={styles.counterButton}>
                    <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={{flex: 1}} onPress={onClose} activeOpacity={1}/>
                <View style={styles.modalContentContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                            <Text style={styles.modalCloseIcon}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Detail Pesanan</Text>
                        <View style={{width: 24}}/>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.bookingModalInnerContent}>
                            <View style={styles.selectedPackageCard}>
                                <Text style={styles.packageDetailTitle}>Paket Terpilih</Text>
                                <Text style={styles.packageDetailName}>{packageData.package_name}</Text>
                                <View style={styles.packageInfoRow}>
                                    <Image source={require('../assets/icons/calendar.png')} style={styles.modalInfoIcon} />
                                    <Text style={styles.packageDetailInfo}>
                                        Masa berlaku: {selectedDate ? selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '...'}
                                    </Text>
                                </View>
                                <View style={styles.packageInfoRow}>
                                    <Image source={require('../assets/icons/no_refund.png')} style={styles.modalInfoIcon} />
                                    <Text style={styles.packageDetailInfo}>Tidak bisa refund</Text>
                                </View>
                                <View style={styles.packageInfoRow}>
                                    <Image source={require('../assets/icons/info.png')} style={styles.modalInfoIcon} />
                                    <Text style={styles.packageDetailInfo}>Pesanan ini hanya berlaku untuk tanggal yang telah dipilih.</Text>
                                </View>
                                <View style={styles.guaranteeLine}>
                                    <Image source={require('../assets/icons/shield_check.png')} style={styles.guaranteeIcon} />
                                    <Text style={styles.guaranteeText}>Dilindungi Jaminan Harga Termurah</Text>
                                </View>
                            </View>
                            
                            <View style={styles.sectionHeaderContainer}>
                                <Text style={styles.sectionHeader}>Tanggal Kunjungan</Text>
                                <TouchableOpacity onPress={() => Alert.alert("Info", "Membuka kalender...")}>
                                    <Text style={styles.linkText}>Cek tanggal tersedia</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: SIZES.padding }}>
                                {dates.map((date, index) => {
                                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                                            onPress={() => setSelectedDate(date)}
                                        >
                                            <Text style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}>
                                                {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                                            </Text>
                                            <Text style={[styles.dateChipText, isSelected && styles.dateChipTextSelected, { fontFamily: 'Inter-Bold' }]}>
                                                {date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </ScrollView>

                            <Text style={styles.sectionHeader}>Jumlah Tiket</Text>
                            <View style={{paddingVertical: SIZES.base}}>
                                {ticketCategories.length > 0 ? (
                                    ticketCategories.map(category => (
                                        <TicketCounter
                                            key={category.key}
                                            title={category.title}
                                            price={category.price}
                                            originalPrice={category.originalPrice}
                                            count={ticketCounts[category.key] || 0}
                                            setCount={(newCount) => handleSetTicketCount(category.key, newCount)}
                                        />
                                    ))
                                ) : (
                                    <Text style={styles.bodyText}>Kategori tiket tidak tersedia untuk paket ini.</Text>
                                )}
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <View style={styles.totalWrapper}>
                            <Text style={styles.totalLabel}>
                                Total {totalPax > 0 ? `(${totalPax} pax)` : ''}: 
                            </Text>
                            <Text style={styles.totalValue}>{formatRupiah(totalPrice)}</Text>
                        </View>
                        <TouchableOpacity style={[styles.bookButton, totalPrice === 0 && styles.bookButtonDisabled]} onPress={CheckoutScreen} disabled={totalPrice === 0}>
                            <Text style={styles.bookButtonText}>Pesan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};


// --- KOMPONEN SEKSIONAL ---
const HighlightRoute = ({ tour }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const allHighlights = tour.highlights || [];
    const VISIBLE_ITEMS_LIMIT = 2;
    const needsTruncation = allHighlights.length > VISIBLE_ITEMS_LIMIT;
    const visibleHighlights = needsTruncation ? allHighlights.slice(0, VISIBLE_ITEMS_LIMIT) : allHighlights;

    return (
        <View style={styles.scene}>
            <Text style={styles.sectionTitle}>Highlight</Text>
            {!allHighlights || allHighlights.length === 0 ? (
                <Text style={styles.bodyText}>Highlight untuk tur ini belum tersedia.</Text>
            ) : (
                <View style={styles.highlightCard}>
                    {visibleHighlights.map((highlight, index) => (
                        <Text key={index} style={styles.bodyText}>• {highlight}</Text>
                    ))}
                    {needsTruncation && (
                        <TouchableOpacity onPress={() => setModalVisible(true)}>
                            <Text style={styles.readMoreText}>Baca Selengkapnya</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(!modalVisible)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalCloseIcon}>✕</Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Highlight</Text>
                            <View style={{ width: 24 }} />
                        </View>
                        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                            {allHighlights.map((highlight, index) => (
                                <Text key={index} style={styles.bodyText}>• {highlight}</Text>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const PackagesRoute = React.memo(({ tour, onPackageSelect }) => {
    let displayPackages = tour.packages || [];

    if (displayPackages.length === 0 && tour.price_per_person > 0) {
        displayPackages = [{
            id: tour.id,
            package_name: tour.package_name,
            price_per_person: tour.price_per_person,
            original_price_per_person: tour.original_price_per_person,
            status: tour.status || 'active',
            refund_policy: tour.refund_policy || 'No Refund',
            child_price: tour.child_price,
            original_child_price: tour.original_child_price,
        }];
    }

    if (displayPackages.length === 0) {
        return (
            <View style={styles.scene}>
                <Text style={styles.sectionTitle}>Paket</Text>
                <Text style={styles.bodyText}>Tidak ada paket yang tersedia untuk tur ini.</Text>
            </View>
        );
    }

    return (
        <View style={styles.scene}>
            <Text style={styles.sectionTitle}>Paket</Text>
            {displayPackages.map((pkg) => {
                const isAvailable = pkg.status === 'active';
                const isRefundable = pkg.refund_policy !== "No Refund";
                
                const finalPrice = pkg.price_per_person;
                const originalPrice = pkg.original_price_per_person;
                const hasDiscount = originalPrice && originalPrice > finalPrice;

                return (
                    <View key={pkg.id} style={[styles.packageItemCard, !isAvailable && styles.packageItemCardDisabled]}>
                        <View style={styles.packageItemContent}>
                            <View style={styles.packageItemHeader}>
                                <Text style={styles.packageItemTitle} numberOfLines={2}>{pkg.package_name}</Text>
                                <TouchableOpacity onPress={() => Alert.alert("Itinerary", `Menampilkan itinerary untuk ${pkg.package_name}`)}>
                                    <Text style={styles.itineraryLink}>Lihat itinerary</Text>
                                </TouchableOpacity>
                            </View>

                            {isRefundable && (
                                <View style={styles.packageInfoLine}>
                                    <Image source={require('../assets/icons/refund_check.png')} style={styles.packageInfoIcon} />
                                    <Text style={styles.packageInfoText}>Bisa 100% Refund</Text>
                                </View>
                            )}
                            <View style={styles.packageInfoLine}>
                                <Image source={require('../assets/icons/calendar.png')} style={styles.packageInfoIcon} />
                                <Text style={styles.packageInfoText}>Pesan tiket untuk besok</Text>
                            </View>
                            <View style={styles.packageInfoLine}>
                                <Image source={require('../assets/icons/no_refund.png')} style={styles.packageInfoIcon} />
                                <Text style={styles.packageInfoText}>Tidak ada refund</Text>
                            </View>
                        </View>
                        
                        <View style={styles.packageItemFooter}>
                            <View style={{alignItems: 'flex-start'}}>
                                {hasDiscount && (
                                    <SlantedStrikethroughPrice textStyle={styles.packageItemOriginalPriceText}>
                                        {formatRupiah(originalPrice)}
                                    </SlantedStrikethroughPrice>
                                )}
                                <Text style={styles.packageItemFinalPrice}>
                                    {`${formatRupiah(finalPrice || 0)}/pax`}
                                </Text>
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.chooseButton, !isAvailable && styles.chooseButtonDisabled]}
                                disabled={!isAvailable}
                                onPress={() => onPackageSelect(pkg)}
                            >
                                <Text style={styles.chooseButtonText}>{isAvailable ? 'Pilih' : 'Tidak Tersedia'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}
        </View>
    );
});

const LocationRoute = React.memo(({ tour }) => {
    const hasCoords = tour.latitude && tour.longitude;
    const locationQuery = hasCoords
        ? `${tour.latitude},${tour.longitude}`
        : tour.main_destination || tour.location_city;

    const handleViewMap = () => {
        if (!locationQuery) {
            Alert.alert("Info", "Lokasi tidak tersedia untuk ditampilkan di peta.");
            return;
        }
        const mapUrl = Platform.select({
            ios: `maps:0,0?q=${locationQuery}`,
            android: `geo:0,0?q=${locationQuery}`,
        });
        const webMapUrl = `https://maps.google.com/?q=${encodeURIComponent(locationQuery)}`;
        Linking.openURL(mapUrl).catch(() => {
            Linking.openURL(webMapUrl);
        });
    };

    return (
        <View style={styles.scene}>
            <Text style={styles.sectionTitle}>Lokasi</Text>
            <Image
                source={require('../assets/icons/map_vector.jpg')}
                style={styles.mapImage}
                resizeMode="cover"
            />
            <View style={styles.locationContainer}>
                <Image
                    source={require('../assets/icons/map_placeholder.png')}
                    style={styles.locationIcon}
                />
                <View>
                    <Text style={styles.locationText}>
                        {tour.location_city || 'Kota tidak tersedia'}
                    </Text>
                    <Text style={styles.locationSubText}>
                        {tour.main_destination || 'Destinasi utama tidak tersedia'}
                    </Text>
                </View>
            </View>
            <TouchableOpacity style={styles.viewMapButton} onPress={handleViewMap}>
                <Text style={styles.viewMapButtonText}>Lihat di Peta</Text>
            </TouchableOpacity>
        </View>
    );
});

const DescriptionRoute = React.memo(({ tour }) => (
    <View style={styles.scene}>
        <Text style={styles.sectionTitle}>Deskripsi Tur</Text>
        <Text style={styles.bodyText}>{tour.description || tour.short_description || 'Deskripsi detail belum tersedia.'}</Text>
    </View>
));

const GalleryRoute = React.memo(({ tour }) => {
    const images = tour.images || [];

    return (
        <View style={styles.scene}>
            <Text style={styles.sectionTitle}>Galeri</Text>
            {images.length > 0 ? (
                images.map((image, index) => (
                    <Image
                        key={index}
                        source={{ uri: image.image_url }}
                        style={styles.galleryImage}
                        resizeMode="cover"
                    />
                ))
            ) : (
                <Text style={styles.bodyText}>Galeri untuk tur ini belum tersedia.</Text>
            )}
        </View>
    );
});


// --- KOMPONEN UTAMA ---
const TourDetailScreen = ({ route, navigation }) => {
    const { tourId } = route.params;
    const { addRecentSearch } = useAuth();
    const [tourData, setTourData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showHeader, setShowHeader] = useState(false);
    const [sectionLayouts, setSectionLayouts] = useState({});
    const [activeTabKey, setActiveTabKey] = useState('summary');
    const [headerHeight, setHeaderHeight] = useState(0);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showBottomBar, setShowBottomBar] = useState(false);
    const [isBookingModalVisible, setBookingModalVisible] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const scrollViewRef = useRef(null);
    const tabScrollViewRef = useRef(null);
    const [tabLayouts, setTabLayouts] = useState({});

    const tabRoutes = [
        { key: 'summary', title: 'Ringkasan' },
        { key: 'highlight', title: 'Highlight' },
        { key: 'packages', title: 'Paket' },
        { key: 'description', title: 'Deskripsi' },
        { key: 'gallery', title: 'Galeri' },
        { key: 'location', title: 'Lokasi' },
    ];

    const handleOpenBookingModal = (pkg) => {
        setSelectedPackage(pkg);
        setBookingModalVisible(true);
    };

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setActiveImageIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
    
    const handleTabLayout = (key, event) => {
        const layout = event.nativeEvent.layout;
        setTabLayouts(prev => ({ ...prev, [key]: layout }));
    };

    const handleSectionLayout = (key, event) => {
        const layout = event.nativeEvent.layout;
        setSectionLayouts(prev => ({ ...prev, [key]: layout.y }));
    };

    const handleTabPress = (key) => {
        if (!scrollViewRef.current) return;
        const y = (key === 'summary') ? 0 : sectionLayouts[key];

        if (y !== undefined) {
            const scrollToY = (key === 'summary') ? 0 : y - headerHeight;
            scrollViewRef.current.scrollTo({ y: scrollToY, animated: true });
        }
    };
    
    // --- KODE HANDLESCROLL YANG SUDAH DIPERBAIKI ---
    const handleScroll = useCallback((event) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        
        if (scrollY > HEADER_CHANGE_THRESHOLD && !showHeader) { 
            setShowHeader(true); 
        } else if (scrollY <= HEADER_CHANGE_THRESHOLD && showHeader) { 
            setShowHeader(false); 
        }

        let currentSectionKey = '';
        const layouts = { ...sectionLayouts, summary: sectionLayouts.summary ?? 0 };
        const sortedRoutes = [...tabRoutes].sort((a, b) => (layouts[a.key] || 0) - (layouts[b.key] || 0));

        for (const route of sortedRoutes) {
            const layoutY = layouts[route.key] ?? 0;
            if (scrollY >= layoutY - headerHeight - 20) { 
                currentSectionKey = route.key; 
            }
        }
        if (currentSectionKey && activeTabKey !== currentSectionKey) { 
            setActiveTabKey(currentSectionKey); 
        }

        // Logika untuk menampilkan bottomBar tanpa menghilangkannya di bawah
        const packageSectionY = sectionLayouts['packages'];
        if (packageSectionY !== undefined) {
            const shouldShow = scrollY >= packageSectionY - headerHeight;
            if (shouldShow !== showBottomBar) {
                setShowBottomBar(shouldShow);
            }
        }
    }, [showHeader, sectionLayouts, headerHeight, activeTabKey, showBottomBar]);
    
    useEffect(() => {
        if (tabScrollViewRef.current && tabLayouts[activeTabKey]) {
            const layout = tabLayouts[activeTabKey];
            const x = layout.x + layout.width / 2 - screenWidth / 2;
            tabScrollViewRef.current.scrollTo({ x, animated: true });
        }
    }, [activeTabKey, tabLayouts]);

    useEffect(() => {
        const fetchTourDetail = async () => {
            if (!tourId) {
                setError("ID Tur tidak valid.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`${API_BASE_URL}/tour-packages/${tourId}`);
                if (response.data && response.data.data) {
                    let data = response.data.data;

                    const transformPriceData = (pkg) => {
                        const originalPrice = parseFloat(pkg.price_per_person) || 0;
                        const discount = parseFloat(pkg.price_discount) || 0;
                        const finalPrice = originalPrice - discount;
                        const childPrice = pkg.child_price ? parseFloat(pkg.child_price) : null;
                        const originalChildPrice = pkg.original_child_price ? parseFloat(pkg.original_child_price) : null;
                        return { 
                            ...pkg, 
                            original_price_per_person: originalPrice, 
                            price_per_person: finalPrice,
                            child_price: childPrice,
                            original_child_price: originalChildPrice || childPrice
                        };
                    };

                    data = transformPriceData(data);
                    if (data.related_packages) {
                        data.packages = data.related_packages;
                    }
                    if (data.packages && Array.isArray(data.packages)) {
                        data.packages = data.packages.map(transformPriceData);
                    }
                    if (data.images && Array.isArray(data.images)) {
                        data.images = data.images.map(img => ({ ...img, image_url: img.image_url.startsWith('http') ? img.image_url : `${IMAGE_BASE_URL}${img.image_url}` }));
                    }
                    setTourData(data);
                    if (data) {
                        addRecentSearch('tour', {
                            id: data.id,
                            destination: data.package_name,
                            main_destination: data.main_destination,
                            location_city: data.location_city,
                            imageUrl: data.images && data.images.length > 0 ? data.images[0].image_url.replace(IMAGE_BASE_URL, '') : null,
                        });
                    }
                } else {
                    setError("Format data dari server tidak sesuai.");
                }
            } catch (err) {
                console.error("API Fetch Error:", err);
                setError("Gagal memuat data tur. Periksa koneksi Anda.");
            } finally {
                setLoading(false);
            }
        };
        fetchTourDetail();
    }, [tourId, addRecentSearch]);

    const onShare = async () => {
        if (!tourData) return;
        try {
            await Share.share({
                message: `Kunjungi tur menarik: ${tourData.package_name}! Cek di aplikasi kami.`,
                url: 'https://crelix.com'
            });
        } catch (error) {
            Alert.alert("Error", "Gagal membagikan tur.");
        }
    };
    
    const handleSelectTicket = () => {
        handleTabPress('packages');
    };

    const renderImagePagination = () => (
        <View style={styles.paginationContainer}>
            {tourData.images.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.paginationDot,
                        activeImageIndex === index ? styles.paginationDotActive : null
                    ]}
                />
            ))}
        </View>
    );

    const renderPageHeader = () => (
        <View onLayout={(e) => handleSectionLayout('summary', e)}>
            <View>
                <FlatList
                    data={tourData.images && tourData.images.length > 0 ? tourData.images : [{ id: 'placeholder', image_url: 'https://placehold.co/600x400?text=Gambar+Tidak+Tersedia' }]}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    renderItem={({ item }) => (<Image source={{ uri: item.image_url }} style={styles.headerImage} />)}
                />
                {tourData.images && tourData.images.length > 1 && renderImagePagination()}
            </View>
            <View style={styles.mainInfoContainer}>
                <Text style={styles.tourTitle}>{tourData.package_name}</Text>
                <View style={styles.infoRow}>
                    <Image
                        source={require('../assets/icons/map_placeholder.png')}
                        style={styles.infoIcon}
                    />
                    <View>
                        <Text style={styles.infoText}>
                            {tourData.location_city || 'Kota tidak tersedia'}
                        </Text>
                        <Text style={styles.infoSubText}>
                            {tourData.main_destination || 'Destinasi utama tidak tersedia'}
                        </Text>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Image
                        source={require('../assets/icons/clock.png')}
                        style={styles.infoIcon}
                    />
                    <Text style={styles.infoText}> {tourData.duration_days} Hari</Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return <View style={styles.centerContainer}><ActivityIndicator size="large" color={COLORS.secondary} /></View>;
    }

    if (error || !tourData) {
        return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>;
    }

    const packagesWithPrice = tourData.packages?.filter(p => p.price_per_person > 0) || [];
    let priceFromPackage = null;
    if (packagesWithPrice.length > 0) {
        priceFromPackage = packagesWithPrice.reduce((minPkg, currentPkg) => {
            return currentPkg.price_per_person < minPkg.price_per_person ? currentPkg : minPkg;
        });
    } else if (tourData.price_per_person > 0) {
        priceFromPackage = tourData;
    }
    const priceFrom = priceFromPackage ? priceFromPackage.price_per_person : 0;
    const originalPriceFrom = priceFromPackage ? priceFromPackage.original_price_per_person : 0;
    const hasDiscountFrom = originalPriceFrom && originalPriceFrom > priceFrom;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={showHeader ? "dark-content" : "light-content"} backgroundColor="transparent" translucent={true} />
            {showHeader && (
                <View style={styles.headerSolid} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}><Image source={require('../assets/icons/left_arrow.png')} style={styles.iconImage} /></TouchableOpacity>
                        <Text style={styles.headerTitle} numberOfLines={1}>{tourData.package_name}</Text>
                        <TouchableOpacity onPress={onShare} style={styles.iconButton}><Image source={require('../assets/icons/share.png')} style={styles.iconImage} /></TouchableOpacity>
                    </View>
                    <View style={styles.tabBarContainer}>
                        <ScrollView ref={tabScrollViewRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
                            {tabRoutes.map((route) => (
                                <TouchableOpacity key={route.key} style={styles.tabItem} onPress={() => handleTabPress(route.key)} onLayout={(event) => handleTabLayout(route.key, event)}>
                                    <Text style={[styles.tabLabel, activeTabKey === route.key && styles.tabLabelActive]}>{route.title}</Text>
                                    {activeTabKey === route.key && <View style={styles.tabIndicator} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            )}
            <View style={styles.floatingHeaderContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.floatingIconButton}><Image source={require('../assets/icons/left_arrow.png')} style={styles.floatingIconImage} /></TouchableOpacity>
                <TouchableOpacity onPress={onShare} style={styles.floatingIconButton}><Image source={require('../assets/icons/share.png')} style={styles.floatingIconImage} /></TouchableOpacity>
            </View>
            <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16} contentInsetAdjustmentBehavior="never">
                {renderPageHeader()}
                <View style={styles.separator} />
                <View onLayout={(e) => handleSectionLayout('highlight', e)}><HighlightRoute tour={tourData} /></View>
                <View style={styles.separator} />
                <View onLayout={(e) => handleSectionLayout('packages', e)}><PackagesRoute tour={tourData} onPackageSelect={handleOpenBookingModal} /></View>
                <View style={styles.separator} />
                <View onLayout={(e) => handleSectionLayout('description', e)}><DescriptionRoute tour={tourData} /></View>
                <View style={styles.separator} />
                <View onLayout={(e) => handleSectionLayout('gallery', e)}><GalleryRoute tour={tourData} /></View>
                <View style={styles.separator} />
                <View onLayout={(e) => handleSectionLayout('location', e)}><LocationRoute tour={tourData} /></View>
                <View style={{ height: 100 }} />
            </ScrollView>
            {showBottomBar && (
                <View style={styles.bottomBar}>
                    <View>
                        {hasDiscountFrom ? (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.bottomPriceLabel}>Mulai dari </Text>
                                    <SlantedStrikethroughPrice textStyle={styles.bottomOriginalPriceText}>
                                        {formatRupiah(originalPriceFrom)}
                                    </SlantedStrikethroughPrice>
                                </View>
                                <Text style={styles.bottomPriceValue}>
                                    {formatRupiah(priceFrom)}
                                </Text>
                            </>
                        ) : (
                            <>
                                {priceFrom > 0 && <Text style={styles.bottomPriceLabel}>Mulai dari</Text>}
                                <Text style={styles.bottomPriceValue}>
                                    {formatRupiah(priceFrom)}
                                </Text>
                            </>
                        )}
                    </View>
                    <TouchableOpacity style={styles.selectTicketButton} onPress={handleSelectTicket}>
                        <Text style={styles.selectTicketButtonText}>Pilih Tiket</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            <BookingModal 
              visible={isBookingModalVisible} 
              onClose={() => setBookingModalVisible(false)} 
              packageData={selectedPackage}
              navigation={navigation} 
            />
        </SafeAreaView>
    );
};


// --- STYLESHEET ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.padding * 2 },
    errorText: { ...FONTS.body3, color: STATUS_COLORS.danger, textAlign: 'center' },
    headerImage: { width: screenWidth, height: 280, backgroundColor: COLORS.lightGray },
    floatingHeaderContainer: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
        flexDirection: 'row', justifyContent: 'space-between',
        paddingTop: StatusBar.currentHeight + SIZES.base, paddingHorizontal: SIZES.padding,
    },
    floatingIconButton: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center', alignItems: 'center', elevation: 5,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2,
    },
    floatingIconImage: { width: 20, height: 20, resizeMode: 'contain', tintColor: COLORS.black },
    headerSolid: {
        position: 'absolute', top: 0, left: 0, right: 0,
        backgroundColor: COLORS.white, paddingTop: StatusBar.currentHeight,
        zIndex: 10, elevation: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2,
    },
    headerTopRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding, paddingVertical: 10,
    },
    headerTitle: {
        flex: 1, textAlign: 'center', ...FONTS.h4, fontFamily: 'Inter-SemiBold',
        color: COLORS.text_dark, marginHorizontal: SIZES.base,
    },
    iconButton: { padding: 5, },
    iconImage: { width: 20, height: 20, resizeMode: 'contain', tintColor: COLORS.black, },
    mainInfoContainer: { padding: SIZES.padding, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, marginTop: -SIZES.radius, borderTopLeftRadius: SIZES.radius, borderTopRightRadius: SIZES.radius },
    tourTitle: { ...FONTS.h3, color: COLORS.text_dark, marginBottom: SIZES.radius },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.base },
    infoIcon: {
        width: 16, height: 16, marginRight: SIZES.base, resizeMode: 'contain', tintColor: COLORS.mediumGray
    },
    infoText: { ...FONTS.body4, color: COLORS.text_light, display: 'flex', alignItems: 'center', },
    infoSubText: { ...FONTS.caption, color: COLORS.mediumGray, },
    tabBarContainer: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.border, },
    tabBarScroll: { paddingHorizontal: SIZES.padding / 2 },
    tabItem: { paddingVertical: SIZES.radius, paddingHorizontal: SIZES.padding, alignItems: 'center' },
    tabLabel: { ...FONTS.body4, color: COLORS.mediumGray, fontFamily: 'Inter-SemiBold' },
    tabLabelActive: { color: COLORS.secondary },
    tabIndicator: { position: 'absolute', bottom: 0, height: 3, width: '60%', backgroundColor: COLORS.secondary, borderRadius: 2 },
    scene: { padding: SIZES.padding, backgroundColor: COLORS.white },
    sectionTitle: { ...FONTS.h3, color: COLORS.text_dark, marginBottom: SIZES.radius },
    bodyText: { ...FONTS.body4, color: COLORS.text_light, marginBottom: SIZES.base, lineHeight: 22 },
    separator: { height: 8, width: '100%', backgroundColor: '#F0F2F5', },
    highlightCard: {
        marginTop: SIZES.base, padding: SIZES.padding, borderRadius: SIZES.radius,
        backgroundColor: COLORS.primary + '15',
    },
    readMoreText: { ...FONTS.body4, color: COLORS.primary, fontFamily: 'Inter-Bold', marginTop: SIZES.base, },
    packageItemCard: {
        borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius, marginBottom: SIZES.radius,
        backgroundColor: COLORS.white, overflow: 'hidden', shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
    },
    packageItemCardDisabled: { backgroundColor: '#f5f5f5' },
    packageItemContent: { padding: SIZES.padding, },
    packageItemHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SIZES.base,
    },
    packageItemTitle: { ...FONTS.h4, flex: 1, marginRight: SIZES.base, color: COLORS.text_dark, },
    itineraryLink: { ...FONTS.body4, color: COLORS.secondary, fontFamily: 'Inter-SemiBold' },
    packageInfoLine: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.base, },
    packageInfoIcon: { width: 16, height: 16, marginRight: SIZES.base, tintColor: COLORS.secondary, },
    packageInfoText: { ...FONTS.body4, color: COLORS.text_light, },
    packageItemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SIZES.padding,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: '#FAFAFA'
    },
    packageItemOriginalPriceText: {
        ...FONTS.caption,
        color: COLORS.text_light,
    },
    packageItemFinalPrice: {
        ...FONTS.h3,
        color: STATUS_COLORS.danger,
        fontFamily: 'Inter-Bold',
    },
    chooseButton: { paddingVertical: 10, paddingHorizontal: 24, backgroundColor: COLORS.secondary, borderRadius: SIZES.radius },
    chooseButtonDisabled: { backgroundColor: COLORS.mediumGray },
    chooseButtonText: { ...FONTS.h4, color: COLORS.black, fontFamily: 'Inter-Bold' },
    mapImage: { width: '100%', height: 180, borderRadius: SIZES.radius, backgroundColor: COLORS.lightGray, marginBottom: SIZES.padding },
    locationContainer: { flexDirection: 'row', alignItems: 'flex-start', },
    locationIcon: { width: 20, height: 20, marginRight: SIZES.base, marginTop: 2, resizeMode: 'contain', tintColor: COLORS.mediumGray },
    locationText: { ...FONTS.body3, color: COLORS.text_dark },
    locationSubText: { ...FONTS.body5, color: COLORS.text_light, marginTop: 4, },
    viewMapButton: { marginTop: SIZES.padding, padding: SIZES.radius, borderWidth: 1, borderColor: COLORS.secondary, borderRadius: SIZES.radius, alignItems: 'center' },
    viewMapButtonText: { ...FONTS.body3, color: COLORS.secondary, fontFamily: 'Inter-Bold' },
    bottomBar: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: SIZES.padding, 
        paddingVertical: SIZES.base, 
        backgroundColor: COLORS.white, 
        borderTopWidth: 1, 
        borderTopColor: COLORS.border, 
        paddingBottom: SIZES.padding 
    },
    bottomPriceLabel: { 
        ...FONTS.body5, 
        color: COLORS.mediumGray 
    },
    bottomOriginalPriceText: {
        ...FONTS.body6,
        color: COLORS.mediumGray,
    },
    bottomPriceValue: { 
        ...FONTS.h3, 
        color: STATUS_COLORS.danger, 
        fontFamily: 'Inter-Bold',
        marginTop: 2,
    },
    selectTicketButton: { 
        paddingVertical: SIZES.radius, 
        paddingHorizontal: SIZES.padding * 1.5, 
        backgroundColor: COLORS.secondary,
        borderRadius: SIZES.radius 
    },
    selectTicketButtonText: { 
        ...FONTS.h4, 
        color: COLORS.black,
        fontFamily: 'Inter-Bold' 
    },
    paginationContainer: {
        position: 'absolute', bottom: SIZES.radius + SIZES.base, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'center',
    },
    paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.5)', marginHorizontal: 4, },
    paginationDotActive: { backgroundColor: COLORS.white, width: 12, },
    galleryImage: {
        width: '100%', height: undefined, aspectRatio: 16 / 9, borderRadius: SIZES.radius, marginBottom: SIZES.padding,
    },
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', },
    modalContent: {
        width: '100%', maxHeight: '60%', backgroundColor: COLORS.white,
        borderTopLeftRadius: SIZES.radius * 2, borderTopRightRadius: SIZES.radius * 2,
        paddingHorizontal: SIZES.padding, paddingBottom: SIZES.padding,
    },
    modalScrollView: { paddingTop: SIZES.radius, },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', },
    modalContentContainer: {
        backgroundColor: COLORS.white, height: screenHeight * 0.8,
        borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SIZES.padding,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    modalTitle: { ...FONTS.h3, fontWeight: '600', color: COLORS.text_dark, },
    modalCloseButton: { padding: 5, },
    modalCloseIcon: { fontSize: 24, color: COLORS.text_dark, },
    modalFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.padding,
        backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#EAEAEA', paddingBottom: SIZES.padding * 1.5,
        elevation: 10, shadowColor: '#000', shadowOffset: {height: -2}, shadowOpacity: 0.1
    },
    totalWrapper: {
        flex: 1,
        marginRight: SIZES.padding,
    },
    totalLabel: { ...FONTS.body4, color: COLORS.text_light, },
    totalValue: { ...FONTS.h3, fontFamily: 'Inter-Bold', color: COLORS.text_dark, },
    bookButton: { 
        backgroundColor: COLORS.secondary,
        paddingVertical: SIZES.radius, 
        paddingHorizontal: SIZES.padding * 2.5, 
        borderRadius: SIZES.radius, 
    },
    bookButtonDisabled: { backgroundColor: COLORS.mediumGray, },
    bookButtonText: { ...FONTS.h4, color: COLORS.black, fontFamily: 'Inter-Bold', },
    bookingModalInnerContent: {
        paddingHorizontal: SIZES.padding,
        paddingTop: SIZES.radius
    },
    selectedPackageCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        marginBottom: SIZES.padding,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    packageDetailTitle: { ...FONTS.body4, color: COLORS.text_light, marginBottom: 4 },
    packageDetailName: {
        ...FONTS.h4,
        fontFamily: 'Inter-SemiBold',
        marginBottom: SIZES.base,
        color: COLORS.black,
    },
    packageDetailInfo: { ...FONTS.body4, color: COLORS.text_light, lineHeight: 20, flexShrink: 1 },
    packageInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.base },
    modalInfoIcon: { width: 16, height: 16, marginRight: SIZES.base, tintColor: COLORS.text_light },
    guaranteeLine: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.base, },
    guaranteeIcon: { width: 16, height: 16, marginRight: SIZES.base, tintColor: '#34A853' },
    guaranteeText: { ...FONTS.body5, color: '#34A853', fontFamily: 'Inter-SemiBold' },
    sectionHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SIZES.radius
    },
    sectionHeader: { 
        ...FONTS.h4, 
        fontFamily: 'Inter-SemiBold', 
        color: COLORS.black,
        marginBottom: SIZES.base,
    },
    linkText: { ...FONTS.body4, color: COLORS.secondary, fontFamily: 'Inter-SemiBold' },
    dateChip: {
        minWidth: 55,
        paddingVertical: 10, 
        paddingHorizontal: SIZES.padding, 
        borderRadius: 8,
        backgroundColor: COLORS.white, 
        marginRight: SIZES.base, 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dateChipSelected: { 
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    dateChipText: { 
        ...FONTS.body5, 
        color: COLORS.text_light, 
    },
    dateChipTextSelected: { 
        color: COLORS.white, 
    },
    ticketCounterContainer: {
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: SIZES.padding,
        borderWidth: 1, 
        borderColor: '#F0F2F5',
        borderRadius: SIZES.radius,
        marginBottom: SIZES.radius,
    },
    ticketInfoWrapper: {
        flex: 1,
        marginRight: SIZES.padding,
    },
    ticketTitle: { ...FONTS.h4, fontFamily: 'Inter-SemiBold', color: COLORS.black },
    originalPriceText: {
        ...FONTS.caption,
        color: COLORS.text_light,
    },
    finalPrice: { 
        ...FONTS.body3, 
        color: STATUS_COLORS.danger,
        fontFamily: 'Inter-SemiBold', 
    },
    counterControls: { flexDirection: 'row', alignItems: 'center', },
    counterButton: {
        width: 28, 
        height: 28, 
        borderRadius: 14,
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    counterButtonText: { 
        fontSize: 20, 
        color: COLORS.secondary,
        fontWeight: '600', 
        lineHeight: 22 
    },
    counterValue: { 
        ...FONTS.h3, 
        fontFamily: 'Inter-SemiBold', 
        marginHorizontal: SIZES.padding, 
        color: COLORS.black
    },
    strikethroughContainer: {
        alignSelf: 'flex-start',
        justifyContent: 'center',
    },
    strikeLine: {
        position: 'absolute',
        height: 1.5,
        backgroundColor: STATUS_COLORS.danger,
        transform: [{ rotate: '-6deg' }],
        alignSelf: 'center',
    },
});

export default TourDetailScreen;