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
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Button,
    ActivityIndicator,
    Card,
    Chip,
    Divider,
    TextInput,
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
    const [loading, setLoading] = useState(false);
    const [mailModal, setMailModal] = useState(false);
    const [reportMail, setReportMail] = useState('');
    const [sendLoading, setSendLoading] = useState(false);

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

    const getReportData = async (clear = false) => {
        try {
            setLoading(true);
            let params = {
                product: (selectedProduct == null ? null : selectedProduct.id),
                weather: (selectedWeather == null ? null : selectedWeather.id),
                date: dateRange,
            }

            if (clear) {
                params = {
                    product: null,
                    weather: null,
                    date: 'all',
                }
            }

            const { data } = await api.post(Endpoint.ReportData, params);
            setLoading(false)
            if (data && data.status) {
                setReportData(data.obj)
            }
        } catch (error) {
            console.log(error.message)

        }
    };

    const clearFilters = async () => {
        setSelectedProduct(null);
        setSelectedWeather(null);
        setDateRange('all');
        closeModal();

        getReportData(true);

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

        });
    };


    const openModalMail = () => {
        setMailModal(true);
        Animated.timing(slideAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };


    const closeModalMail = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setMailModal(false);

        });
    };

    const applyFilter = () => {
        getReportData();
        closeModal();
    }

    const getActiveFiltersCount = () => {

        if (filterModalVisible) {
            return;
        }
        let count = 0;
        if (selectedProduct != null) {
            count++;
        }
        if (selectedWeather != null) {
            count++;
        }
        if (dateRange != null && dateRange != 'all') {
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

    const sendReportMail = async () => {
        try {
            if (reportMail == null) {
                Alert.alert('Uyarı', 'Gönderilecek Mail Adresini yazmalısınız.');
                return;
            }

            if (!checkMail()) {
                Alert.alert('Uyarı', 'Lütfen geçerli bir mail adresi giriniz.');
                return;
            }
            setSendLoading(true);
            let params = {
                product: (selectedProduct == null ? null : selectedProduct.id),
                weather: (selectedWeather == null ? null : selectedWeather.id),
                date: dateRange,
                mail: reportMail
            }
            const { data } = await api.post(Endpoint.ReportSend, params);
            setSendLoading(false);

            if (data && data.status) {
                Alert.alert('Bilgi', `Rapor ${reportMail} adresine başarıyla gönderilmiştir. Spam kutunuzu da kontrol edebilirsiniz.`);
                setMailModal(false);
                setReportMail('');
            } else {
                Alert.alert('Uyarı', 'İşlem başarısız.');
            }
        } catch (error) {
            console.log(error)
        }
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

    const checkMail = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(reportMail);
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
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 2 }}>
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
                    <View style={{ flex: 2 }}>
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={openModalMail}
                        >
                            <Text style={styles.filterIcon}>📧</Text>
                            <Text style={styles.filterButtonText}>Rapor Gönder</Text>

                        </TouchableOpacity>
                    </View>
                </View>

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
                                onPress={applyFilter}
                                style={styles.applyButton}
                            >
                                Uygula
                            </Button>
                        </View>
                    </Animated.View>
                </View>
            </Modal>




            <Modal
                visible={mailModal}
                transparent={true}
                animationType="none"
                onRequestClose={closeModalMail}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity
                            style={styles.modalBackground}
                            activeOpacity={1}
                            onPress={closeModalMail}
                        />

                        <Animated.View
                            style={[
                                styles.mailModalContent,
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
                            {/* Modern Header */}
                            <View style={styles.mailModalHeader}>
                                <View style={styles.mailHeaderLeft}>
                                    <View style={styles.mailIconContainer}>
                                        <Text style={styles.mailIcon}>📧</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.mailModalTitle}>Rapor Gönder</Text>
                                        <Text style={styles.mailModalSubtitle}>E-posta adresini girin</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={closeModalMail}
                                    style={styles.modernCloseButton}
                                >
                                    <Text style={styles.modernCloseButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={styles.mailModalBody}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{ flexGrow: 1 }}
                            >
                                {/* Email Input Section */}
                                <View style={styles.mailInputSection}>
                                    <Text style={styles.mailInputLabel}>E-posta Adresi</Text>
                                    <View style={styles.mailInputContainer}>
                                        <View style={styles.emailIconContainer}>
                                            <Text style={styles.emailInputIcon}>@</Text>
                                        </View>
                                        <TextInput
                                            placeholder='ornek@domain.com'
                                            value={reportMail}
                                            onChangeText={text => setReportMail(text)}
                                            style={styles.mailInput}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            placeholderTextColor="#9CA3AF"
                                            returnKeyType="done"
                                            blurOnSubmit={true}
                                        />
                                    </View>
                                </View>

                                {/* Info Card */}
                                <View style={styles.infoCard}>
                                    <View style={styles.infoIconContainer}>
                                        <Text style={styles.infoIcon}>ℹ️</Text>
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoTitle}>Rapor Bilgisi</Text>
                                        <Text style={styles.infoText}>
                                            Mevcut filtrelerinize göre oluşturulan rapor belirtilen e-posta adresine gönderilecektir.
                                        </Text>
                                    </View>
                                </View>

                                {/* Active Filters Display */}
                                {getActiveFiltersCount() > 0 && (
                                    <View style={styles.activeFiltersCard}>
                                        <Text style={styles.activeFiltersTitle}>Aktif Filtreler:</Text>
                                        <View style={styles.filterChipsContainer}>
                                            {selectedProduct && (
                                                <View style={styles.filterChip}>
                                                    <Text style={styles.filterChipText}>{selectedProduct.name}</Text>
                                                </View>
                                            )}
                                            {selectedWeather && (
                                                <View style={styles.filterChip}>
                                                    <Text style={styles.filterChipText}>{selectedWeather.description}</Text>
                                                </View>
                                            )}
                                            {dateRange !== 'all' && (
                                                <View style={styles.filterChip}>
                                                    <Text style={styles.filterChipText}>{getSelectedDateLabel()}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </ScrollView>

                            {/* Modern Footer */}
                            <View style={styles.mailModalFooter}>
                                <TouchableOpacity
                                    style={styles.cancelMailButton}
                                    onPress={closeModalMail}
                                    disabled={sendLoading}
                                >
                                    <Text style={styles.cancelMailButtonText}>İptal</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.sendMailButton, sendLoading && styles.sendMailButtonDisabled]}
                                    onPress={sendReportMail}
                                    disabled={sendLoading || !reportMail.trim()}
                                >
                                    {sendLoading ? (
                                        <View style={styles.sendButtonContent}>
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                            <Text style={styles.sendMailButtonText}>Gönderiliyor...</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.sendButtonContent}>
                                            <Text style={styles.sendMailButtonIcon}>📤</Text>
                                            <Text style={styles.sendMailButtonText}>Gönder</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
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
    modalContentReportmail: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '30%',
        minHeight: '30%',
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
    applyButtonMail: {
        flex: 1,
        borderRadius: 0,
        marginTop: 10,
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
    mailModalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
        minHeight: '45%',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 25,
    },
    mailModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    mailHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    mailIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    mailIcon: {
        fontSize: 24,
    },
    mailModalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    mailModalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    modernCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modernCloseButtonText: {
        fontSize: 18,
        color: '#6B7280',
        fontWeight: '600',
    },
    mailModalBody: {
        flex: 1,
        paddingHorizontal: 24,
    },
    mailInputSection: {
        marginBottom: 24,
    },
    mailInputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    mailInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    emailIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    emailInputIcon: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B6CB7',
    },
    mailInput: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#0EA5E9',
    },
    infoIconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    infoIcon: {
        fontSize: 20,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    activeFiltersCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeFiltersTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    filterChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        backgroundColor: '#4B6CB7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    filterChipText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    mailModalFooter: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: 24,
        backgroundColor: '#FAFBFC',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
    cancelMailButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    cancelMailButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    sendMailButton: {
        flex: 2,
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4B6CB7',
        shadowColor: '#4B6CB7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    sendMailButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
        elevation: 0,
    },
    sendButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sendMailButtonIcon: {
        fontSize: 16,
    },
    sendMailButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

const newStyles = {
    // Mail Modal Styles

};