import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    SafeAreaView,
    FlatList,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    StatusBar,
    TouchableOpacity,
    TextInput,
    Image,
    Platform,
    Modal,
    ScrollView,
    Switch,
    Animated,
} from 'react-native';
import axios from 'axios';
import TourListItem from '../components/tour/TourListItem'; 
import { COLORS, SIZES, FONTS } from '../constants'; 

const API_URL = 'https://tiket.crelixdigital.com/api/tour-packages';

// DATA KONSTAN
const FULL_CATEGORIES_DATA = [ { id: 'group_atraksi', name: 'Atraksi', subCategories: [ { id: 'sub_1', name: 'Attraction Pass', icon: '🎟️' }, { id: 'sub_2', name: 'Kereta Gantung & Skywheel', icon: '🚠' }, { id: 'sub_3', name: 'Kebun & Taman', icon: '🌳' }, { id: 'sub_4', name: 'Situs Bersejarah & Keagamaan', icon: '🏛️' }, { id: 'sub_5', name: 'Museum Theater & Galleries', icon: '🖼️' }, { id: 'sub_6', name: 'Dek Observasi & Menara', icon: '🗼' }, { id: 'sub_7', name: 'Pertunjukan', icon: '🎭' }, { id: 'sub_8', name: 'Taman Hiburan', icon: '🎢' }, { id: 'sub_9', name: 'Water Parks', icon: '🌊' }, { id: 'sub_10', name: 'Kebun Binatang & Akuarium', icon: '🐠' } ] }, { id: 'group_bermain', name: 'Tempat Bermain', subCategories: [ { id: 'sub_11', name: 'Arcades', icon: '🕹️' }, { id: 'sub_12', name: 'Aktivitas Indoor', icon: '🏠' } ] } ];
const DATE_OPTIONS = ['Kapan saja', 'Hari ini', 'Besok', 'Minggu ini'];
const PRICE_RANGE_OPTIONS = [ { id: 'price_1', label: '< Rp 500rb', min: 0, max: 499999 }, { id: 'price_2', label: 'Rp 500rb - 1jt', min: 500000, max: 1000000 }, { id: 'price_3', label: 'Rp 1jt - 3jt', min: 1000000, max: 3000000 }, { id: 'price_4', label: '> Rp 3jt', min: 3000001, max: Infinity } ];

// Komponen Pembantu
const Checkbox = ({ isChecked, onPress }) => ( <TouchableOpacity onPress={onPress} style={[styles.checkboxBase, isChecked && styles.checkboxChecked]}>{isChecked && <Text style={styles.checkboxCheckmark}>✓</Text>}</TouchableOpacity> );
const TourListHeader = ({ onBackPress, searchQuery, onSearchChange }) => ( <View style={styles.headerContainer}><TouchableOpacity onPress={onBackPress} style={styles.backButton}><Image source={require('../assets/icons/chevron_left.png')} style={styles.headerIcon} /></TouchableOpacity><View style={styles.headerCenter}><View style={styles.searchContainer}><Image source={require('../assets/icons/search.png')} style={styles.searchIcon} /><TextInput placeholder="Cari aktivitas" placeholderTextColor={COLORS.gray} style={styles.searchInput} value={searchQuery} onChangeText={onSearchChange} /></View></View></View> );
const MainFilters = ({ onCategoryPress, onFilterPress, filterCount, categoryCount }) => { const hasActiveFilters = filterCount > 0; return ( <View style={styles.mainFilterContainer}><TouchableOpacity style={styles.filterButton} onPress={onCategoryPress}><Text style={styles.filterButtonText}>Kategoris{categoryCount > 0 ? ` (${categoryCount})` : ''}</Text><Image source={require('../assets/icons/chevron_down.png')} style={styles.filterDropdownIcon} /></TouchableOpacity><TouchableOpacity style={styles.filterButton} onPress={onFilterPress}><Text style={styles.filterButtonText}>Filters{hasActiveFilters ? ` (${filterCount})` : ''}</Text>{hasActiveFilters && <View style={styles.filterNotificationDot} />}<Image source={require('../assets/icons/chevron_down.png')} style={styles.filterDropdownIcon} /></TouchableOpacity></View> ); };
const CategoryFilterModal = ({ visible, onClose, onApply, initialSelectedIds }) => { const [selectedIds, setSelectedIds] = useState(initialSelectedIds); useEffect(() => { setSelectedIds(initialSelectedIds); }, [initialSelectedIds]); const getCategoryDetailsFromIds = (ids) => { const details = []; ids.forEach(id => { for (const group of FULL_CATEGORIES_DATA) { const found = group.subCategories.find(sub => sub.id === id); if (found) { details.push(found); break; } } }); return details; }; const handleToggleCategory = (id) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(currId => currId !== id) : [...prev, id]); }; const handleToggleGroup = (group) => { const groupIds = group.subCategories.map(sub => sub.id); const allSelected = groupIds.every(id => selectedIds.includes(id)); if (allSelected) { setSelectedIds(prev => prev.filter(id => !groupIds.includes(id))); } else { setSelectedIds([...new Set([...selectedIds, ...groupIds])]); } }; const handleReset = () => { setSelectedIds([]); }; const handleApply = () => { onApply(selectedIds); onClose(); }; return ( <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}><SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}><View style={styles.modalHeader}><TouchableOpacity onPress={onClose}><Image source={require('../assets/icons/close.png')} style={styles.closeIcon} /></TouchableOpacity><Text style={styles.modalTitle}>Kategori</Text><TouchableOpacity onPress={handleReset}><Text style={styles.resetText}>Reset</Text></TouchableOpacity></View><ScrollView style={styles.categoryModalScrollView}><View style={styles.filterSection}><Text style={styles.filterSectionTitle}>Kategori Dipilih</Text><View style={styles.chipContainer}>{selectedIds.length === 0 ? ( <Text style={styles.emptyText}>Belum ada kategori yang dipilih.</Text> ) : ( getCategoryDetailsFromIds(selectedIds).map(cat => ( <TouchableOpacity key={cat.id} style={styles.selectedChip} onPress={() => handleToggleCategory(cat.id)}><Text style={styles.selectedChipText}>{cat.name}</Text><Text style={styles.selectedChipIcon}>✕</Text></TouchableOpacity> )) )}</View></View>{FULL_CATEGORIES_DATA.map(group => { const isGroupAllSelected = group.subCategories.every(sub => selectedIds.includes(sub.id)); return ( <View key={group.id} style={styles.filterSection}><View style={styles.categoryGroupHeader}><Text style={styles.filterSectionTitle}>{group.name}</Text><Checkbox isChecked={isGroupAllSelected} onPress={() => handleToggleGroup(group)} /></View><View style={styles.chipContainer}>{group.subCategories.map(sub => { const isSelected = selectedIds.includes(sub.id); return ( <TouchableOpacity key={sub.id} style={[styles.chip, isSelected && styles.chipSelected]} onPress={() => handleToggleCategory(sub.id)}><Text style={styles.chipIcon}>{sub.icon}</Text><Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{sub.name}</Text></TouchableOpacity> ); })}</View></View> ) })}</ScrollView><View style={styles.modalFooter}><TouchableOpacity style={styles.applyButton} onPress={handleApply}><Text style={styles.applyButtonText}>Terapkan</Text></TouchableOpacity></View></SafeAreaView></Modal> ); };
const FilterModal = ({ visible, onClose, onApply, initialFilters }) => { const [tempFilters, setTempFilters] = useState(initialFilters); useEffect(() => { setTempFilters(initialFilters); }, [initialFilters]); const handleReset = () => { const resetFilters = { ...tempFilters, priceRange: null, date: 'Kapan saja', instantConfirmation: false, specialOffers: false, }; setTempFilters(resetFilters); }; const handleApply = () => { onApply(tempFilters); onClose(); }; return ( <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}><TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={onClose}><View style={[styles.modalContainer, { height: '65%' }]}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Filters</Text><TouchableOpacity onPress={handleReset}><Text style={styles.resetText}>Reset</Text></TouchableOpacity></View><ScrollView contentContainerStyle={styles.filterScroll}><Text style={styles.filterSectionTitle}>Price Range</Text><View style={styles.chipContainer}>{PRICE_RANGE_OPTIONS.map(opt => ( <TouchableOpacity key={opt.id} style={[styles.chip, tempFilters.priceRange?.id === opt.id && styles.chipSelected]} onPress={() => setTempFilters(prev => ({ ...prev, priceRange: opt }))}><Text style={[styles.chipText, tempFilters.priceRange?.id === opt.id && styles.chipTextSelected]}>{opt.label}</Text></TouchableOpacity> ))}</View><Text style={styles.filterSectionTitle}>Dates</Text><View style={styles.chipContainer}>{DATE_OPTIONS.map(date => ( <TouchableOpacity key={date} style={[styles.chip, tempFilters.date === date && styles.chipSelected]} onPress={() => setTempFilters(prev => ({ ...prev, date }))}><Text style={[styles.chipText, tempFilters.date === date && styles.chipTextSelected]}>{date}</Text></TouchableOpacity> ))}</View><Text style={styles.filterSectionTitle}>Other</Text><View style={styles.switchContainer}><Text style={styles.switchLabel}>Instant Confirmation</Text><Switch trackColor={{ false: COLORS.lightGray, true: COLORS.primary }} thumbColor={COLORS.white} onValueChange={value => setTempFilters(prev => ({ ...prev, instantConfirmation: value }))} value={tempFilters.instantConfirmation} /></View><View style={styles.switchContainer}><Text style={styles.switchLabel}>Special Offers</Text><Switch trackColor={{ false: COLORS.lightGray, true: COLORS.primary }} thumbColor={COLORS.white} onValueChange={value => setTempFilters(prev => ({ ...prev, specialOffers: value }))} value={tempFilters.specialOffers} /></View></ScrollView><View style={styles.modalFooter}><TouchableOpacity style={styles.applyButton} onPress={handleApply}><Text style={styles.applyButtonText}>Apply Filters</Text></TouchableOpacity></View></View></TouchableOpacity></Modal> ); };

// Komponen Skeleton
const TourListItemSkeleton = () => {
    const opacity = useMemo(() => new Animated.Value(0.5), []);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.5, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    }, [opacity]);

    return (
        <Animated.View style={[styles.skeletonContainer, { opacity }]}>
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonTextContainer}>
                <View style={[styles.skeletonLine, { width: '80%', height: 16, marginBottom: 8 }]} />
                <View style={[styles.skeletonLine, { width: '50%', height: 12 }]} />
                <View style={[styles.skeletonLine, { width: '40%', height: 14, marginTop: 12 }]} />
            </View>
        </Animated.View>
    );
};

// --- KOMPONEN UTAMA ---
const TourListScreen = ({ navigation }) => {
    // State
    const [allTours, setAllTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState({ categories: [], priceRange: null, date: 'Kapan saja', instantConfirmation: false, specialOffers: false });

    // Functions
    const fetchTours = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(API_URL);
            const tourData = response.data.data;
            if (Array.isArray(tourData)) {
                setAllTours(tourData);
            } else {
                setError('Format data dari server salah.');
                setAllTours([]);
            }
        } catch (e) {
            setError('Gagal memuat data. Periksa koneksi internet Anda.');
            setAllTours([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTours();
    }, [fetchTours]);

    const filteredTours = useMemo(() => {
        let results = [...allTours];
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            results = results.filter(tour =>
                tour.package_name?.toLowerCase().includes(lowercasedQuery) ||
                tour.main_destination?.toLowerCase().includes(lowercasedQuery)
            );
        }
        if (activeFilters.categories.length > 0) {
            results = results.filter(tour => activeFilters.categories.includes(tour.category_id));
        }
        if (activeFilters.priceRange) {
            const { min, max } = activeFilters.priceRange;
            results = results.filter(tour => {
                const price = parseInt(tour.price_per_person, 10);
                return price >= min && price <= max;
            });
        }
        if (activeFilters.instantConfirmation) {
            results = results.filter(tour => tour.instant_confirmation === true);
        }
        if (activeFilters.specialOffers) {
            results = results.filter(tour => tour.special_offers === true);
        }
        return results;
    }, [allTours, searchQuery, activeFilters]);


    const handleTourPress = (tourItem) => {
        if (!tourItem || !tourItem.id) return;
        navigation.navigate('TourDetail', { tourId: tourItem.id });
    };

    const handleApplyCategories = (categoryIds) => {
        setActiveFilters(prev => ({ ...prev, categories: categoryIds }));
    };

    const handleApplyOtherFilters = (newFilters) => {
        setActiveFilters(prev => ({ ...prev, ...newFilters }));
    };

    const calculateOtherFilterCount = useCallback(() => {
        let count = 0;
        if (activeFilters.priceRange) count++;
        if (activeFilters.date !== 'Kapan saja') count++;
        if (activeFilters.instantConfirmation) count++;
        if (activeFilters.specialOffers) count++;
        return count;
    }, [activeFilters]);

    // Render Logic
    const renderList = () => (
        <FlatList
            data={filteredTours}
            renderItem={({ item }) => (
                <TourListItem item={item} onPress={() => handleTourPress(item)} />
            )}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                    <Text style={styles.infoText}>Tidak ada hasil yang cocok.</Text>
                    <Text style={styles.errorText}>Coba ubah kata kunci atau filter Anda.</Text>
                </View>
            )}
            contentContainerStyle={styles.listContentContainer}
            // --- Fungsionalitas Refresh Sudah Ada Di Sini ---
            onRefresh={fetchTours}
            refreshing={loading}
            // ---------------------------------------------
        />
    );
    
    const renderContent = () => {
        if (loading && allTours.length === 0) {
            return (
                <FlatList
                    data={[1, 2, 3, 4, 5]} 
                    keyExtractor={(item) => `skeleton-${item}`}
                    renderItem={() => <TourListItemSkeleton />}
                    contentContainerStyle={{ paddingTop: SIZES.base }}
                />
            );
        }

        if (error) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchTours}>
                        <Text style={styles.retryButtonText}>Coba Lagi</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        
        return renderList();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} translucent={false} />
            
            <TourListHeader 
                onBackPress={() => navigation.goBack()}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            
            <MainFilters
                onCategoryPress={() => setCategoryModalVisible(true)}
                onFilterPress={() => setFilterModalVisible(true)}
                categoryCount={activeFilters.categories.length}
                filterCount={calculateOtherFilterCount()}
            />
            
            <Text style={styles.resultCountText}>
                Menampilkan {filteredTours.length} hasil
            </Text>

            <View style={styles.contentArea}>
                {renderContent()}
            </View>

            <CategoryFilterModal visible={isCategoryModalVisible} onClose={() => setCategoryModalVisible(false)} onApply={handleApplyCategories} initialSelectedIds={activeFilters.categories} />
            <FilterModal visible={isFilterModalVisible} onClose={() => setFilterModalVisible(false)} onApply={handleApplyOtherFilters} initialFilters={activeFilters} />
        </SafeAreaView>
    );
};

// --- STYLESHEET ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.secondary,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    contentArea: {
        flex: 1,
        backgroundColor: COLORS.background || '#f4f6f8',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.base,
        backgroundColor: COLORS.secondary,
    },
    backButton: {
        padding: SIZES.base,
        marginRight: SIZES.base,
    },
    headerIcon: {
        width: 20,
        height: 20,
        tintColor: COLORS.primary,
    },
    headerCenter: {
        flex: 1,
        justifyContent: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.padding,
        height: 40,
    },
    searchIcon: {
        width: 20,
        height: 20,
        marginRight: SIZES.base,
        tintColor: '#B0B0B0',
    },
    searchInput: {
        flex: 1,
        ...FONTS.body4,
        color: '#333333',
        paddingVertical: 0,
    },
    mainFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SIZES.base,
        paddingHorizontal: SIZES.padding,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginRight: SIZES.base,
    },
    filterButtonText: {
        ...FONTS.body4,
        color: '#333333',
        marginRight: SIZES.base / 2,
    },
    filterDropdownIcon: {
        width: 16,
        height: 16,
        tintColor: COLORS.text_dark,
    },
    filterNotificationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginLeft: 2,
        marginRight: 6,
    },
    resultCountText: {
        ...FONTS.body4,
        color: '#555555',
        paddingHorizontal: SIZES.padding,
        paddingTop: SIZES.padding,
        paddingBottom: SIZES.base,
        backgroundColor: COLORS.background || '#f4f6f8',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: SIZES.padding * 3,
        flex: 1,
    },
    listContentContainer: {
        paddingBottom: SIZES.padding,
        flexGrow: 1,
    },
    infoText: {
        marginTop: 15,
        fontSize: 16,
        color: COLORS.gray,
        fontWeight: 'bold'
    },
    errorText: {
        fontSize: 14,
        color: COLORS.danger || '#D32F2F',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: SIZES.radius,
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: SIZES.radius * 2,
        borderTopRightRadius: SIZES.radius * 2,
        paddingTop: SIZES.base,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingBottom: SIZES.padding,
        paddingTop: SIZES.padding,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    modalTitle: { ...FONTS.h3, color: COLORS.text_dark, fontWeight: 'bold' },
    closeIcon: { width: 24, height: 24, tintColor: COLORS.text_dark },
    resetText: { ...FONTS.body3, color: COLORS.primary, fontWeight: '600' },
    modalFooter: {
        padding: SIZES.padding,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        backgroundColor: COLORS.white,
        paddingBottom: Platform.OS === 'ios' ? SIZES.padding * 1.5 : SIZES.padding,
    },
    applyButton: {
        backgroundColor: COLORS.primary,
        padding: SIZES.padding / 1.5,
        borderRadius: SIZES.radius,
        alignItems: 'center',
    },
    applyButtonText: { ...FONTS.h4, color: COLORS.white, fontWeight: 'bold' },
    categoryModalScrollView: {
        flex: 1,
    },
    filterSection: {
        paddingHorizontal: SIZES.padding,
        paddingTop: SIZES.padding,
        paddingBottom: SIZES.padding,
        borderBottomWidth: 8,
        borderBottomColor: '#f0f2f5',
    },
    filterSectionTitle: {
        ...FONTS.h4,
        fontWeight: 'bold',
        color: COLORS.text_dark,
        marginBottom: SIZES.padding,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SIZES.base,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f0f2f5',
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: COLORS.secondary,
        borderColor: COLORS.primary,
    },
    chipIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    chipText: { ...FONTS.body4, color: COLORS.text_dark },
    chipTextSelected: { color: COLORS.primary, fontWeight: '600' },
    selectedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: COLORS.lightGray,
        borderRadius: SIZES.radius,
    },
    selectedChipText: { ...FONTS.body4, color: COLORS.text_dark, marginRight: 8 },
    selectedChipIcon: { color: COLORS.gray, fontWeight: 'bold' },
    categoryGroupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    checkboxBase: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.gray,
        backgroundColor: 'transparent',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkboxCheckmark: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyText: {
        ...FONTS.body4,
        color: COLORS.gray,
    },
    filterScroll: { 
        paddingHorizontal: SIZES.padding, 
        paddingBottom: SIZES.padding * 2 
    },
    switchContainer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SIZES.padding / 2,
    },
    switchLabel: { ...FONTS.body3, color: COLORS.text_dark, flex: 1 },
    skeletonContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: SIZES.base,
        marginBottom: SIZES.padding,
        marginHorizontal: SIZES.padding,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    skeletonImage: {
        width: 100,
        height: 100,
        borderRadius: SIZES.radius,
        backgroundColor: '#E0E0E0',
    },
    skeletonTextContainer: {
        flex: 1,
        paddingLeft: SIZES.padding,
        justifyContent: 'flex-start',
    },
    skeletonLine: {
        backgroundColor: '#E0E0E0',
        borderRadius: SIZES.base,
    },
});

export default TourListScreen;