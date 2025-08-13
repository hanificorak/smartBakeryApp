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
    const slideAnim = useRef(new Animated.Value(height)).current;
    const [products, setProducts] = useState([]);

    const [date, setDate] = useState(new Date());
    const [showdateSelect, setShowdateSelect] = useState(false);
    const [tempDate, setTempDate] = useState(new Date()); // Geçici seçim

    const onChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            showDateModal(false);
            if (selectedDate) setDate(selectedDate);
        } else {
            if (selectedDate) setTempDate(selectedDate);
        }
    };

    const confirmDate = () => {
        setDate(tempDate);
        setSelectedDate(tempDate)
        setShowdateSelect(false);
    };

    useEffect(() => {
        getParam();
        getLocation();
        getStockData();

        setSelectedDate(tempDate)

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

    const getLocation = async () => {
        try {

            let location = await AsyncStorage.getItem('location');
            if (!location) {
                return;
            }

            let x = JSON.parse(location);
            let latitude = x.latitude;
            let longitude = x.longitude;


            const response = await axios.get(
                `https://api.open-meteo.com/v1/forecast`, {
                params: {
                    latitude: latitude,
                    longitude: longitude,
                    current_weather: true,
                    timezone: 'Europe/Istanbul'
                }
            }
            );


            const currentWeather = response.data.current_weather;

            const { data } = await api.post(Endpoint.WeatherItem, { code: currentWeather.weathercode });
            if (data && data.status) {
                setSelectedWeathers(data.obj)
            }

        } catch (error) {
            console.error("Hava durumu alınamadı:", error);
        }
    };





    const openModal = () => {
        setModalVisible(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeModal = () => {
        Animated.timing(slideAnim, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setModalVisible(false);
            resetForm();
        });
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
            desc: description
        });
        if (data && data.status) {
            Alert.alert('Bilgi', 'Kayıt başarıyla eklendi.');
            closeModal();
        } else {
            Alert.alert('Uyarı', 'İşlem başarısız.');

        }
    };


    const getStockData = async () => {
        const { data } = await api.post(Endpoint.StockData, { date: date });
        if (data && data.status) {
            setStockEntries(data.obj)
        }
    };



    const deleteStockEntry = (id) => {
        Alert.alert(
            'Silme Onayı',
            'Bu stok girişini silmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        const updatedEntries = stockEntries.filter(entry => entry.id !== id);
                        setStockEntries(updatedEntries);
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

    const renderStockEntry = ({ item }) => (
        <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
                <Text style={styles.productName}>{item.product.name}</Text>
                <TouchableOpacity
                    onPress={() => deleteStockEntry(item.id)}
                    style={styles.deleteButton}
                >
                    <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.entryDetails}>
                <Text style={styles.detailText}>Miktar: {item.amount}</Text>
                <Text style={styles.detailText}>Saat: {formatDateTime(item.created_at)}</Text>
            </View>
            {item.description ? (
                <Text style={styles.descriptionText}>{item.description}</Text>
            ) : null}
        </View>
    );

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Ay 0'dan başlıyor
        const year = date.getFullYear();

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}.${month}.${year} ${hours}:${minutes}`;
    };

    const renderProductItem = ({ item }) => (
        <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
                setSelectedProduct(item);
                setShowProductDropdown(false);
            }}
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
            }}
        >
            <Text style={styles.dropdownItemText}>{item.description}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

            {/* Header */}
            <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                style={styles.header}
            >


                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.addButton} onPress={openModal}>
                        <Text style={styles.addButtonText}>+ Günlük Giriş</Text>
                    </TouchableOpacity>

                    <Button onPress={() => setShowdateSelect(true)} style={styles.dateButton}>
                        <Text style={styles.dateButtonText}>Tarih Seç</Text>
                    </Button>
                </View>
            </LinearGradient>

            {/* Stock Entries List */}
            <View style={styles.listContainer}>
                <Text style={styles.listTitle}>
                    Günlük Stok Girişleri ({formatDate(selectedDate)})
                </Text>

                {stockEntries.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            Bu tarih için henüz stok girişi bulunmuyor.
                        </Text>
                        <Text style={styles.emptySubText}>
                            "Günlük Giriş" butonuna basarak stok ekleyebilirsiniz.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={stockEntries}
                        renderItem={renderStockEntry}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
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
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackground}
                        activeOpacity={1}
                        onPress={closeModal}
                    />

                    <Animated.View
                        style={[
                            styles.modalContainer,
                            { transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.modalContent}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Stok Girişi</Text>
                                <TouchableOpacity
                                    onPress={closeModal}
                                    style={styles.closeButton}
                                >
                                    <Text style={styles.closeButtonText}>×</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.formContainer}>
                                {/* Ürün Dropdown */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Ürün Adı *</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowProductDropdown(!showProductDropdown)}
                                    >
                                        <Text style={[
                                            styles.dropdownButtonText,
                                            !selectedProduct && styles.placeholder
                                        ]}>
                                            {selectedProduct.name || 'Ürün seçiniz'}
                                        </Text>
                                        <Text style={styles.dropdownArrow}>▼</Text>
                                    </TouchableOpacity>

                                    {showProductDropdown && (
                                        <View style={styles.dropdown}>
                                            <FlatList
                                                data={products}
                                                renderItem={renderProductItem}
                                                keyExtractor={item => item}
                                                style={styles.dropdownList}
                                            />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Hava Durumu *</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowWeatherDropdown(!showWeatherDropdown)}
                                    >
                                        <Text style={[
                                            styles.dropdownButtonText,
                                            !selectedWeathers && styles.placeholder
                                        ]}>
                                            {selectedWeathers.description || 'Hava durumu seçiniz'}
                                        </Text>
                                        <Text style={styles.dropdownArrow}>▼</Text>
                                    </TouchableOpacity>

                                    {showWeatherDropdown && (
                                        <View style={styles.dropdown}>
                                            <FlatList
                                                data={weathers}
                                                renderItem={renderWeatherItem}
                                                keyExtractor={item => item}
                                                style={styles.dropdownList}
                                            />
                                        </View>
                                    )}
                                </View>

                                {/* Miktar */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Miktar *</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={quantity}
                                        onChangeText={setQuantity}
                                        placeholder="Miktar giriniz"
                                        keyboardType="numeric"
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                {/* Açıklama */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Açıklama</Text>
                                    <TextInput
                                        style={[styles.textInput, styles.textArea]}
                                        value={description}
                                        onChangeText={setDescription}
                                        placeholder="Açıklama giriniz (isteğe bağlı)"
                                        multiline
                                        numberOfLines={3}
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                {/* Tarih */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Tarih</Text>
                                    <TextInput
                                        style={[styles.textInput, styles.disabledInput]}
                                        value={selectedDate}
                                        editable={false}
                                    />
                                </View>
                            </ScrollView>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={addStockEntry}
                            >
                                <Text style={styles.saveButtonText}>Kaydet</Text>
                            </TouchableOpacity>
                        </KeyboardAvoidingView>
                    </Animated.View>
                </View>
            </Modal>
            <Modal
                visible={showdateSelect}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDateModal(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <DateTimePicker
                            value={Platform.OS === 'ios' ? tempDate : date}
                            mode="date"
                            display="spinner"
                            onChange={onChange}
                            style={{ backgroundColor: 'white' }}
                        />
                        {Platform.OS === 'ios' && (
                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowdateSelect(false)}>
                                    <Text style={styles.cancelText}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmBtn} onPress={confirmDate}>
                                    <Text style={styles.confirmText}>Tamam</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingTop: StatusBar.currentHeight + 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateLabel: {
        color: '#fff',
        fontSize: 16,
        marginRight: 10,
        fontWeight: '500',
    },
    dateInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        minWidth: 120,
        textAlign: 'center',
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
    entryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    productName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    deleteButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#ff4757',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    entryDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
    },
    descriptionText: {
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalBackground: {
        flex: 1,
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: height * 0.9,
    },
    modalContent: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: '#666',
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    inputGroup: {
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginTop: 20,

        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    disabledInput: {
        backgroundColor: '#f5f5f5',
        color: '#666',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    cancelBtn: {
        padding: 10,
        flex: 1,

        marginBottom: 20,

        alignItems: 'center',
    },
    confirmBtn: {
        padding: 10,
        marginBottom: 20,
        flex: 1,
        alignItems: 'center',
    },
    cancelText: {
        color: 'red',
        fontWeight: 'bold',
    },
    confirmText: {
        color: 'blue',
        fontWeight: 'bold',
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#333',
    },
    placeholder: {
        color: '#999',
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#666',
    },
    dropdown: {
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        maxHeight: 200,
    },
    dateButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 0,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    dateButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    dropdownList: {
        maxHeight: 200,
    },
    dropdownItem: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#333',
    },
    saveButton: {
        backgroundColor: '#4A90E2',
        marginHorizontal: 20,
        marginVertical: 20,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});