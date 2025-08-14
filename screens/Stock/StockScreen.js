import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    Modal,
    FlatList,
    Keyboard,
    TouchableWithoutFeedback,
    SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import Endpoint from '../../tools/endpoint';
import api from '../../tools/api';
import { Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

export default function StockScreen({ navigation, setToken }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [stockEntries, setStockEntries] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedWeathers, setSelectedWeathers] = useState('');
    const [quantity, setQuantity] = useState('');
    const [description, setDescription] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [showWeatherDropdown, setShowWeatherDropdown] = useState(false);
    const [weathers, setWeathers] = useState([]);
    const [products, setProducts] = useState([]);
    const [tempValue, setTempValue] = useState(null);

    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    const [date, setDate] = useState(new Date());
    const [showdateSelect, setShowdateSelect] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());

    const onChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowdateSelect(false);
            if (selectedDate) setDate(selectedDate);
        } else {
            if (selectedDate) setTempDate(selectedDate);
        }
    };

    const confirmDate = () => {
        setDate(tempDate);
        setSelectedDate(tempDate);
        setShowdateSelect(false);
        getStockData()
    };

    useEffect(() => {
        getParam();
        getLocation();
        getStockData();
        setSelectedDate(tempDate);

        // Entry animasyonu
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();
    }, [selectedDate]);

    const getParam = async () => {
        try {
            const { data } = await api.post(Endpoint.StockParams);
            setWeathers(data.obj.weather);
            setProducts(data.obj.products);
        } catch (error) {
            console.error('Veriler yüklenirken hata:', error);
        }
    };

    const getTurkeyDate = () => {
        const now = new Date();
        const options = {
            timeZone: "Europe/Istanbul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        };
        const formatter = new Intl.DateTimeFormat("en-GB", options);
        const parts = formatter.formatToParts(now);
        const year = parts.find(p => p.type === "year").value;
        const month = parts.find(p => p.type === "month").value;
        const day = parts.find(p => p.type === "day").value;
        const hour = parts.find(p => p.type === "hour").value;
        const minute = parts.find(p => p.type === "minute").value;
        const second = parts.find(p => p.type === "second").value;
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    };

    const toDate = (str) => {
        const [datePart, timePart] = str.split(" ");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split(":").map(Number);
        return new Date(year, month - 1, day, hour, minute, second);
    };

    const getWeatherApi = async (latitude, longitude) => {

        const response = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
            params: {
                latitude,
                longitude,
                current_weather: true,
                timezone: 'Europe/Istanbul'
            }
        });
        AsyncStorage.setItem('weather_data', JSON.stringify({ data: response, time: getTurkeyDate() }));
        const currentWeather = response?.data?.current_weather;
        setTempValue(currentWeather.temperature);
        getWeatherItem(currentWeather?.weathercode);
    };

    const getLocation = async () => {
        try {
            let location = await AsyncStorage.getItem('location');
            if (!location) return;
            let x = JSON.parse(location);
            let latitude = x.latitude;
            let longitude = x.longitude;

            const weather_item = await AsyncStorage.getItem("weather_data");
            if (weather_item == null) {
                getWeatherApi(latitude, longitude);
                return;
            }

            let w_item = JSON.parse(weather_item);
            const lastDate = toDate(w_item.time);
            const currentDate = toDate(getTurkeyDate());
            const diffHours = (currentDate - lastDate) / (1000 * 60 * 60);


            if (diffHours >= 3) {
                getWeatherApi(latitude, longitude);
            } else {
                let w_l_data = JSON.parse(await AsyncStorage.getItem('weather_data'));
                let w_l_data_response = w_l_data?.data?.data?.current_weather;
                setTempValue(w_l_data_response?.temperature);
                getWeatherItem(w_l_data_response?.weathercode);
            }


        } catch (error) {
            console.error("Hava durumu alınamadı:", error);
        }
    };

    const getWeatherItem = async (weather_code) => {
        const { data } = await api.post(Endpoint.WeatherItem, { code: weather_code });
        if (data && data.status) setSelectedWeathers(data.obj);
    };

    const openModal = () => {
        setModalVisible(true);
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            })
        ]).start(() => {
            setModalVisible(false);
            resetForm();
        });
        Keyboard.dismiss();
    };

    const resetForm = () => {
        setSelectedProduct('');
        setQuantity('');
        setDescription('');
        setShowProductDropdown(false);
    };

    const addStockEntry = async () => {
        if (!selectedProduct || !quantity) {
            Alert.alert('Hata', 'Ürün adı ve miktar alanları zorunludur.');
            return;
        }

        const { data } = await api.post(Endpoint.AddStock, {
            product_id: selectedProduct.id,
            weather_id: selectedWeathers.id,
            amount: quantity,
            desc: description,
            temperature: tempValue
        });
        if (data && data.status) {
            Alert.alert('Bilgi', 'Kayıt başarıyla eklendi.');
            getStockData();
            closeModal();
        } else {
            Alert.alert('Uyarı', 'İşlem başarısız.');
        }
    };

    const getStockData = async () => {
        const { data } = await api.post(Endpoint.StockData, { date: date });
        if (data && data.status) setStockEntries(data.obj);
    };

    const deleteStockEntry = (id) => {
        Alert.alert(
            'Silme Onayı',
            'Bu stok kaydını silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { data } = await api.post(Endpoint.StockDelete, { stock_id: id.id });
                            if (data && data.status) {
                                Alert.alert('Bilgi', 'Stok kaydı başarıyla silindi.');
                                getStockData();
                            } else {
                                Alert.alert('Uyarı', 'İşlem başarısız.');
                            }
                        } catch (error) {

                        }
                    }
                }
            ]
        );
    };




    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const renderStockEntry = ({ item, index }) => (
        <View
            style={[
                styles.entryCard,

            ]}
        >
            <View style={styles.entryHeader}>
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.product?.name}</Text>

                </View>
                <TouchableOpacity
                    onPress={() => deleteStockEntry(item)}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                >
                    <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.entryDetails}>
                <View style={styles.detailRow}>
                    <View style={[styles.iconContainer, { marginTop: -15, marginBottom: -0 }]}>
                        <Text style={styles.iconText}>📦</Text>
                    </View>
                    <Text style={{ fontSize: 19, fontWeight: 'bold', marginTop: -18, color: 'teal' }}>{item.amount} Adet</Text>
                </View>
                <View style={styles.detailRow}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>🕐</Text>
                    </View>
                    <Text style={styles.detailText}>{formatDateTime(item.created_at)}</Text>
                </View>

                {tempValue && (
                    <View style={styles.detailRow}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.iconText}>🌡️</Text>
                        </View>
                        <Text style={styles.detailText}>{tempValue}°C</Text>
                    </View>
                )}

            </View>

            {item.description ? (
                <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Açıklama:</Text>
                    <Text style={styles.descriptionText}>{item.description}</Text>
                </View>
            ) : null}
        </View>
    );

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const renderProductItem = ({ item }) => (
        <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
                setSelectedProduct(item);
                setShowProductDropdown(false);
                Keyboard.dismiss();
            }}
            activeOpacity={0.7}
        >
            <Text style={styles.dropdownItemText}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderWeatherItem = ({ item }) => (
        <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
                setSelectedWeathers(item);
                setShowWeatherDropdown(false);
                Keyboard.dismiss();
            }}
            activeOpacity={0.7}
        >
            <Text style={styles.dropdownItemText}>{item.description}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#667eea" />

            <LinearGradient
                colors={['#1e3a8a', '#3b82f6', '#06b6d4']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>

                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.addButton} onPress={openModal} activeOpacity={0.8}>
                            <LinearGradient
                                colors={['#059669', '#10b981']}
                                style={styles.addButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.addButtonText}>+ Yeni Giriş</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowdateSelect(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.dateButtonText}>📅 Tarih Seç</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.listContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.listTitle}>Günlük Girişler</Text>
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateBadgeText}>{formatDate(selectedDate)}</Text>
                    </View>
                </View>

                {stockEntries.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📦</Text>
                        <Text style={styles.emptyText}>Henüz stok girişi yok</Text>
                        <Text style={styles.emptySubText}>Yeni bir giriş eklemek için yukarıdaki butona dokunun</Text>
                    </View>
                ) : (
                    <FlatList
                        data={stockEntries}
                        renderItem={renderStockEntry}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    />
                )}
            </View>

            {/* Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="none"
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
                            <TouchableOpacity style={styles.modalBackground} activeOpacity={1} onPress={closeModal} />
                            <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
                                <View style={styles.modalHandle} />

                                <View keyboardShouldPersistTaps="handled" nestedScrollEnabled={true} contentContainerStyle={{ paddingBottom: 20 }}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Yeni Stok Girişi</Text>
                                        <TouchableOpacity onPress={closeModal} style={styles.closeButton} activeOpacity={0.7}>
                                            <Text style={styles.closeButtonText}>✕</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.formContainer}>
                                        {/* Ürün Dropdown */}
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Ürün Seçimi</Text>
                                            <TouchableOpacity
                                                style={[styles.dropdownButton, selectedProduct && styles.dropdownButtonSelected]}
                                                onPress={() => setShowProductDropdown(!showProductDropdown)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[styles.dropdownButtonText, !selectedProduct && styles.placeholder]}>
                                                    {selectedProduct.name || 'Ürün seçiniz'}
                                                </Text>
                                                <Text style={[styles.dropdownArrow, showProductDropdown && styles.dropdownArrowUp]}>
                                                    ▼
                                                </Text>
                                            </TouchableOpacity>
                                            {showProductDropdown && (
                                                <View style={styles.dropdown}>
                                                    <FlatList
                                                        data={products}
                                                        nestedScrollEnabled={true}
                                                        renderItem={renderProductItem}
                                                        keyExtractor={item => item.id.toString()}
                                                        style={styles.dropdownList}
                                                    />
                                                </View>
                                            )}
                                        </View>

                                        {/* Hava Durumu */}
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Hava Durumu</Text>
                                            <TouchableOpacity
                                                style={[styles.dropdownButton, selectedWeathers && styles.dropdownButtonSelected]}
                                                onPress={() => setShowWeatherDropdown(!showWeatherDropdown)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[styles.dropdownButtonText, !selectedWeathers && styles.placeholder]}>
                                                    {selectedWeathers.description || 'Hava durumu seçiniz'}
                                                </Text>
                                                <Text style={[styles.dropdownArrow, showWeatherDropdown && styles.dropdownArrowUp]}>
                                                    ▼
                                                </Text>
                                            </TouchableOpacity>
                                            {showWeatherDropdown && (
                                                <View style={styles.dropdown}>
                                                    <FlatList
                                                        data={weathers}
                                                        renderItem={renderWeatherItem}
                                                        keyExtractor={item => item.id}
                                                        style={styles.dropdownList}
                                                    />
                                                </View>
                                            )}
                                        </View>

                                        {/* Miktar */}
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Miktar</Text>
                                            <TextInput
                                                style={[styles.textInput, quantity && styles.textInputFilled]}
                                                value={quantity}
                                                onChangeText={setQuantity}
                                                placeholder="Miktar giriniz"
                                                keyboardType="numeric"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        </View>

                                        {/* Sıcaklık */}
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Sıcaklık (°C)</Text>
                                            <TextInput
                                                style={[styles.textInput, tempValue && styles.textInputFilled]}
                                                value={tempValue?.toString() || ""}
                                                onChangeText={setTempValue}
                                                placeholder="Derece"
                                                keyboardType="numeric"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        </View>

                                        {/* Açıklama */}
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Açıklama (İsteğe bağlı)</Text>
                                            <TextInput
                                                style={[styles.textInput, styles.textArea, description && styles.textInputFilled]}
                                                value={description}
                                                onChangeText={setDescription}
                                                placeholder="Açıklama giriniz"
                                                multiline
                                                numberOfLines={3}
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        </View>
                                    </View>

                                    <TouchableOpacity style={styles.saveButton} onPress={addStockEntry} activeOpacity={0.9}>
                                        <LinearGradient
                                            colors={['#667eea', '#764ba2']}
                                            style={styles.saveButtonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.saveButtonText}>Kaydet</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>

            {/* Tarih Modal */}
            <Modal
                visible={showdateSelect}
                transparent
                animationType="slide"
                onRequestClose={() => setShowdateSelect(false)}
            >
                <View style={styles.dateModalBackground}>
                    <View style={styles.dateModalContainer}>
                        <View style={styles.dateModalHeader}>
                            <Text style={styles.dateModalTitle}>Tarih Seçin</Text>
                        </View>

                        <DateTimePicker
                            value={Platform.OS === 'ios' ? tempDate : date}
                            mode="date"
                            display="spinner"
                            onChange={onChange}
                            style={{ backgroundColor: 'white' }}
                        />

                        {Platform.OS === 'ios' && (
                            <View style={styles.dateButtonRow}>
                                <TouchableOpacity style={styles.dateModalCancelBtn} onPress={() => setShowdateSelect(false)}>
                                    <Text style={styles.dateModalCancelText}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.dateModalConfirmBtn} onPress={confirmDate}>
                                    <Text style={styles.dateModalConfirmText}>Tamam</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: StatusBar.currentHeight + 10,
        paddingBottom: 25,
        paddingHorizontal: 20,
    },
    headerContent: {
        gap: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    weatherInfo: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    tempText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    headerActions: {
        marginTop: 10,
        flexDirection: 'row',
        gap: 12,
    },
    addButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    addButtonGradient: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderRadius: 16,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.3,
    },
    dateButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        minWidth: 130,
        alignItems: 'center',
    },
    dateButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    listTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: 0.3,
    },
    dateBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    dateBadgeText: {
        color: '#4338CA',
        fontWeight: '600',
        fontSize: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
    },
    listContent: {
        paddingBottom: 20,
    },
    entryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    productInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    productName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: 0.3,
        flex: 1,
    },
    quantityBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    quantityText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    deleteButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
    entryDetails: {
        gap: 8,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        fontSize: 14,
    },
    detailText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    descriptionContainer: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#8B5CF6',
        marginTop: 8,
    },
    descriptionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8B5CF6',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    descriptionText: {
        fontSize: 14,
        color: '#4B5563',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
    },
    modalBackground: {
        flex: 1,
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: height * 0.9,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 16,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: 0.3,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 18,
        color: '#6B7280',
        fontWeight: '600',
    },
    formContainer: {
        paddingHorizontal: 24,
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        letterSpacing: 0.2,
    },
    textInput: {
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        color: '#1F2937',
        transition: 'all 0.2s ease',
    },
    textInputFilled: {
        borderColor: '#8B5CF6',
        backgroundColor: '#FAF5FF',
    },
    textArea: {
        height: 90,
        textAlignVertical: 'top',
        paddingTop: 14,
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        minHeight: 52,
    },
    dropdownButtonSelected: {
        borderColor: '#8B5CF6',
        backgroundColor: '#FAF5FF',
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
        flex: 1,
    },
    placeholder: {
        color: '#9CA3AF',
        fontWeight: '400',
    },
    dropdownArrow: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
        marginLeft: 8,
        transition: 'transform 0.2s ease',
    },
    dropdownArrowUp: {
        transform: [{ rotate: '180deg' }],
    },
    dropdown: {
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    dropdownList: {
        maxHeight: 200,
    },
    dropdownItem: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    saveButton: {
        marginHorizontal: 24,
        marginVertical: 24,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    saveButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    dateModalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    dateModalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 350,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 16,
    },
    dateModalHeader: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dateModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: 0.3,
    },
    dateButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    dateModalCancelBtn: {
        flex: 1,
        padding: 14,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    dateModalConfirmBtn: {
        flex: 1,
        padding: 14,
        alignItems: 'center',
        backgroundColor: '#8B5CF6',
        borderRadius: 12,
    },
    dateModalCancelText: {
        color: '#6B7280',
        fontWeight: '600',
        fontSize: 16,
    },
    dateModalConfirmText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
});