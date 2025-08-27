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
    const [dateRange, setDateRange] = useState('today');
    const [products, setProducts] = useState([]);
    const [weatherOptions, setWeatherOptions] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mailModal, setMailModal] = useState(false);
    const [reportMail, setReportMail] = useState('');
    const [sendLoading, setSendLoading] = useState(false);

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
            console.log(data)
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
        if (dateRange != null && dateRange != 'today') {
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

    // Modern Card Component for each report item
    const renderReportCard = ({ item, index }) => (
        <View style={styles.reportCard}>
            <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={styles.productIcon}>
                            <Text style={styles.productIconText}>📦</Text>
                        </View>
                        <View style={styles.cardHeaderInfo}>
                            <Text style={styles.productName} numberOfLines={2}>
                                {item.product.name}
                            </Text>
                            <Text style={styles.cardDate}>
                                Gün Sonu Tarihi: {formatDate(item.created_at)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.weatherContainer}>
                        <Text style={styles.weatherEmoji}>
                            {getWeatherEmoji(item.weather.description)}
                        </Text>
                        <Text style={styles.weatherText} numberOfLines={1}>
                            {item.weather.description}
                        </Text>
                    </View>
                </View>

                <Divider style={styles.cardDivider} />

                {/* Card Body - Stats */}
                <View style={styles.cardBody}>
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#E0F2FE' }]}>
                                <Text style={styles.statIconText}>🏭</Text>
                            </View>
                            <View style={styles.statContent}>
                                <Text style={styles.statLabel}>Üretilen</Text>
                                <Text style={styles.statValue}>{item.amount}</Text>
                            </View>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#DCFCE7' }]}>
                                <Text style={styles.statIconText}>💰</Text>
                            </View>
                            <View style={styles.statContent}>
                                <Text style={styles.statLabel}>Satılan</Text>
                                <Text style={styles.statValue}>{item.sales_amount}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.statsContainer2}>
                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                                <Text style={styles.statIconText}>🗑️</Text>
                            </View>
                            <View style={styles.statContent}>
                                <Text style={styles.statLabel}>Atık</Text>
                                <Text style={styles.statValue}>{item.remove_amount}</Text>
                            </View>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
                                <Text style={styles.statIconText}>➡️</Text>
                            </View>
                            <View style={styles.statContent}>
                                <Text style={styles.statLabel}>Ertesi Güne Aktarılan</Text>
                                <Text style={styles.statValue}>{item.ert_count || 0}</Text>
                            </View>
                        </View>


                    </View>
                    {item.parentdate != null ? <View style={{ padding: 10, backgroundColor: '#f1f5f9', borderRadius: 10, marginTop: 10 }}>
                        <Text>İlk Üretim Tarihi: {item.parentdate}</Text>
                        <Text>Üretilen sayısı bugüne aktarılan sayısıdır. İlk üretim tarihi üst kısımda yazıyor. </Text>
                    </View> : <View></View>}
                </View>


            </LinearGradient>
        </View>
    );

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getWeatherEmoji = (weather) => {
        const weatherMap = {
            'Güneşli': '☀️',
            'Yağmurlu': '🌧️',
            'Bulutlu': '☁️',
            'Karlı': '❄️',
            'Sisli': '🌫️',
        };
        return weatherMap[weather] || '🌤️';
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
                        {/* Stats Summary in Header */}
                        {reportData.length > 0 && (
                            <View style={styles.headerStats}>
                                <View style={styles.headerStatItem}>
                                    <Text style={styles.headerStatValue}>{reportData.length}</Text>
                                    <Text style={styles.headerStatLabel}>Toplam Kayıt</Text>
                                </View>
                                <View style={styles.headerStatItem}>
                                    <Text style={styles.headerStatValue}>
                                        {reportData.reduce((sum, item) => sum + parseInt(item.amount || 0), 0)}
                                    </Text>
                                    <Text style={styles.headerStatLabel}>Toplam Satış</Text>
                                </View>
                            </View>
                        )}
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

            {/* Reports List */}
            <View style={styles.reportsContainer}>
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
                        renderItem={renderReportCard}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.reportsList}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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

            {/* Mail Modal */}
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
        backgroundColor: '#f1f5f9',
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
    headerStats: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 20,
    },
    headerStatItem: {
        alignItems: 'center',
    },
    headerStatValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
    },
    headerStatLabel: {
        fontSize: 12,
        color: '#cbd5e1',
        marginTop: 2,
    },
    filterContainer: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginHorizontal: 4,
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
    reportsContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    reportsList: {
        paddingTop: 16,
        paddingBottom: 20,
    },

    // Modern Card Styles
    reportCard: {
        marginHorizontal: 4,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        backgroundColor: 'transparent',
    },
    cardGradient: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        marginRight: 12,
    },
    productIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    productIconText: {
        fontSize: 20,
    },
    cardHeaderInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        lineHeight: 24,
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    weatherContainer: {
        alignItems: 'center',
        backgroundColor: '#f0f9ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#0ea5e9',
        minWidth: 80,
    },
    weatherEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    weatherText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0369a1',
        textAlign: 'center',
    },
    cardDivider: {
        marginVertical: 16,
        backgroundColor: '#e5e7eb',
    },
    cardBody: {
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statsContainer2: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statIconText: {
        fontSize: 16,
    },
    statContent: {
        flex: 1,
    },
    statLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 16,
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 16,
    },
    cardActionButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cardActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B6CB7',
    },
    cardActionArrow: {
        fontSize: 16,
        color: '#4B6CB7',
        fontWeight: '700',
    },

    // Loading and Empty States
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
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
        marginTop: 100,
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

    // Modal Styles
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

    // Mail Modal Styles
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