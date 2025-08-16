import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    FlatList,
    Modal,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Button,
    ActivityIndicator,
    Card,
    Chip,
    Divider,
} from 'react-native-paper';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';

const ReportsScreen = ({ navigation }) => {
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [slideAnim] = useState(new Animated.Value(0));

    // Dropdown visibility states
    const [productMenuVisible, setProductMenuVisible] = useState(false);
    const [weatherMenuVisible, setWeatherMenuVisible] = useState(false);
    const [dateMenuVisible, setDateMenuVisible] = useState(false);

    const screenHeight = Dimensions.get('window').height;

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedWeather, setSelectedWeather] = useState(null);
    const [dateRange, setDateRange] = useState('all');
    const [products, setProducts] = useState([]);
    const [weatherOptions, setWeatherOptions] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true)

    // const weatherOptions = [
    //     { label: 'Tümü', value: 'all' },
    //     { label: 'Güneşli', value: 'Güneşli' },
    //     { label: 'Yağmurlu', value: 'Yağmurlu' },
    //     { label: 'Bulutlu', value: 'Bulutlu' },
    //     { label: 'Karlı', value: 'Karlı' }
    // ];

    const dateRanges = [
        { label: 'Tümü', value: 'all' },
        { label: 'Bugün', value: 'today' },
        { label: 'Bu Hafta', value: 'week' },
        { label: 'Bu Ay', value: 'month' }
    ];

    useEffect(() => {
        getParam();
        getReportData();
    }, []);

    const getParam = async () => {
        const { data } = await api.post(Endpoint.StockParams);
        if (data && data.status) {
            setProducts(data.obj.products)
            setWeatherOptions(data.obj.weather)
        }
    };

    const getReportData = async () => {
        setLoading(true);
        const { data } = await api.post(Endpoint.ReportData, {
            product: (selectedProduct == null ? null : selectedProduct.id),
            weather: (selectedWeather == null ? null : selectedWeather.id),
            date: dateRange,
        });
        setLoading(false)
        if (data && data.status) {
            setReportData(data.obj)
        }
    };

    const clearFilters = () => {
        // setSelectedProduct(null);
        // setSelectedWeather('all');
        // setDateRange('all');
    };

    const openModal = () => {
        setFilterModalVisible(true);
        Animated.timing(slideAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeModal = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setFilterModalVisible(false);
            getReportData();
        });
    };

    const getActiveFiltersCount = () => {
        
        let count = 0;
        if(selectedProduct != null){
            count++;
        }
        if(selectedWeather != null){
            count++;
        }
        if(dateRange != null && dateRange != 'all'){
            count++;
        }
        return count;
    };

    const getSelectedProductLabel = () => {
        if (!selectedProduct) return 'Ürün Seçin';
        return selectedProduct.name;
    };

    const getSelectedWeatherLabel = () => {
        if (selectedWeather == null) {
            return "Hava Durumu Seçin"
        }

        const weather = weatherOptions.find(w => w.id === selectedWeather.id);
        return weather ? weather.description : 'Hava Durumu Seçin';
    };

    const getSelectedDateLabel = () => {
        const date = dateRanges.find(d => d.value === dateRange);
        return date ? date.label : 'Tarih Aralığı Seçin';
    };

    const renderTableHeader = () => (
        <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Ürün</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Satılan</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Atık</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Hava</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Tarih</Text>
        </View>
    );

    const renderTableRow = ({ item }) => (
        <Card style={styles.tableRow}>
            <View style={styles.tableRowContent}>
                <Text style={[styles.tableRowText, { flex: 2 }]}>{item.product.name}</Text>
                <Text style={[styles.tableRowText, { flex: 1.5 }]}>{item.amount}</Text>
                <Text style={[styles.tableRowText, { flex: 1.5 }]}>
                    {item.current}
                </Text>
                <Text style={[styles.tableRowText, { flex: 2 }]}>{item.weather.description}</Text>
                <Text style={[styles.tableRowText, { flex: 2 }]}>{formatDate(item.created_at)}</Text>
            </View>
        </Card>
    );

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
            <LinearGradient
                colors={['#4B6CB7', '#182848']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <View style={styles.headerTop}>
                            <Text style={styles.headerTitle}>Raporlar</Text>
                        </View>
                        <Text style={styles.headerSubtitle}>
                            Buradan raporlarınızı alabilirsiniz.
                        </Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Filter Button */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={openModal}
                >
                    <Text style={styles.filterIcon}>🔍</Text>
                    <Text style={styles.filterButtonText}>Filtreler</Text>
                    {getActiveFiltersCount() > 0 && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Table */}
            <View style={styles.tableContainer}>
                {renderTableHeader()}
                {reportData.length == 0 && !loading ? 
                 <View style={styles.emptyState}>
                                <View style={styles.emptyStateCard}>
                                  <Text style={styles.emptyIcon}>📦</Text>
                                  <Text style={styles.emptyTitle}>Henüz kayıt yok</Text>
                                  <Text style={styles.emptySubtitle}>
                                    Rapor verisi mevcut değil
                                  </Text>
                                </View>
                              </View>
                : ''}

                {loading ?
                    <View>
                        <View style={styles.loadingContainer}>
                            <View style={styles.loadingCard}>
                                <ActivityIndicator size="large" color="#667eea" />
                                <Text style={styles.loadingText}>Yükleniyor...</Text>
                                <Text style={styles.loadingSubtext}>Kayıtlar yükleniyor</Text>
                            </View>
                        </View>
                    </View> :

                    <FlatList
                        data={reportData}
                        renderItem={renderTableRow}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        style={styles.tableList}
                    />
                }

            </View>

            {/* Filter Modal */}
            <Modal
                visible={filterModalVisible}
                transparent={true}
                animationType="none"
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackground}
                        activeOpacity={1}
                        onPress={closeModal}
                    />
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                transform: [{
                                    translateY: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [screenHeight, 0]
                                    })
                                }]
                            }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filtreler</Text>
                            <TouchableOpacity
                                onPress={closeModal}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {/* Product Dropdown */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Ürün</Text>
                                <TouchableOpacity
                                    style={styles.dropdownButton}
                                    onPress={() => setProductMenuVisible(!productMenuVisible)}
                                >
                                    <Text style={styles.dropdownButtonText}>
                                        {getSelectedProductLabel()}
                                    </Text>
                                    <Text style={[styles.dropdownArrow, productMenuVisible && styles.dropdownArrowUp]}>
                                        ▼
                                    </Text>
                                </TouchableOpacity>
                                {productMenuVisible && (
                                    <View style={styles.dropdownList}>
                                        <TouchableOpacity
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setSelectedProduct(null);
                                                setProductMenuVisible(false);
                                            }}
                                        >
                                            <Text style={selectedProduct === null ? styles.selectedDropdownText : styles.dropdownText}>
                                                Tümü
                                            </Text>
                                        </TouchableOpacity>
                                        {products.map((product) => (
                                            <TouchableOpacity
                                                key={product.id}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setSelectedProduct(product);
                                                    setProductMenuVisible(false);
                                                }}
                                            >
                                                <Text style={selectedProduct?.id === product.id ? styles.selectedDropdownText : styles.dropdownText}>
                                                    {product.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <Divider style={styles.divider} />

                            {/* Weather Dropdown */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Hava Durumu</Text>
                                <TouchableOpacity
                                    style={styles.dropdownButton}
                                    onPress={() => setWeatherMenuVisible(!weatherMenuVisible)}
                                >
                                    <Text style={styles.dropdownButtonText}>
                                        {getSelectedWeatherLabel()}
                                    </Text>
                                    <Text style={[styles.dropdownArrow, weatherMenuVisible && styles.dropdownArrowUp]}>
                                        ▼
                                    </Text>
                                </TouchableOpacity>
                                {weatherMenuVisible && (
                                    <View style={styles.dropdownList}>
                                        {weatherOptions.map((weather) => (
                                            <TouchableOpacity
                                                key={weather.id}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setSelectedWeather(weather);
                                                    setWeatherMenuVisible(false);
                                                }}
                                            >
                                                <Text style={selectedWeather === weather.id ? styles.selectedDropdownText : styles.dropdownText}>
                                                    {weather.description}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <Divider style={styles.divider} />

                            {/* Date Range Dropdown */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Tarih Aralığı</Text>
                                <TouchableOpacity
                                    style={styles.dropdownButton}
                                    onPress={() => setDateMenuVisible(!dateMenuVisible)}
                                >
                                    <Text style={styles.dropdownButtonText}>
                                        {getSelectedDateLabel()}
                                    </Text>
                                    <Text style={[styles.dropdownArrow, dateMenuVisible && styles.dropdownArrowUp]}>
                                        ▼
                                    </Text>
                                </TouchableOpacity>
                                {dateMenuVisible && (
                                    <View style={styles.dropdownList}>
                                        {dateRanges.map((range) => (
                                            <TouchableOpacity
                                                key={range.value}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setDateRange(range.value);
                                                    setDateMenuVisible(false);
                                                }}
                                            >
                                                <Text style={dateRange === range.value ? styles.selectedDropdownText : styles.dropdownText}>
                                                    {range.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <Button
                                mode="outlined"
                                onPress={clearFilters}
                                style={styles.clearButton}
                            >
                                Temizle
                            </Button>
                            <Button
                                mode="contained"
                                onPress={closeModal}
                                style={styles.applyButton}
                            >
                                Uygula
                            </Button>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

export default ReportsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingBottom: 0,
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        paddingTop: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
    },
    headerSubtitle: {
        color: '#e2e8f0',
        fontSize: 16,
        marginTop: 5,
    },
    filterContainer: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    filterIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    filterButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B6CB7',
    },
    filterBadge: {
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    filterBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    tableContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    tableHeader: {
        marginTop: 15,

        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    tableHeaderText: {
        fontWeight: '700',
        fontSize: 14,
        color: '#374151',
        textAlign: 'center',
    },
    tableList: {
        padding: 5,
        flex: 1,
    },
    tableRow: {
        marginBottom: 8,
        elevation: 2,
        backgroundColor: 'white',

    },
    tableRowContent: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    tableRowText: {
        fontSize: 14,
        color: '#374151',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalBackground: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        minHeight: '60%',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
    },
    closeButtonText: {
        fontSize: 18,
        color: '#6b7280',
        fontWeight: 'bold',
    },
    modalBody: {
        flex: 1,
        padding: 20,
    },
    filterSection: {
        marginBottom: 24,
    },
    filterSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 16,
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#ffffff',
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 8,
        transform: [{ rotate: '0deg' }],
    },
    dropdownArrowUp: {
        transform: [{ rotate: '180deg' }],
    },
    dropdownList: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        backgroundColor: '#ffffff',
        maxHeight: 200,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownText: {
        fontSize: 16,
        color: '#374151',
    },
    selectedDropdownText: {
        fontSize: 16,
        color: '#4B6CB7',
        fontWeight: '600',
    },
    divider: {
        marginVertical: 16,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        gap: 12,
    },
    clearButton: {
        flex: 1,
    },
    applyButton: {
        flex: 1,
        backgroundColor: '#4B6CB7',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50
    },
    loadingCard: {
        backgroundColor: '#FFFFFF',
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 16,
    },
    loadingSubtext: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
      emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100
    },
    emptyStateCard: {
        backgroundColor: '#FFFFFF',
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        maxWidth: 280,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});