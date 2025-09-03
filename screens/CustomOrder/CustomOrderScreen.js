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
    Alert,
    Modal,
    TextInput,
    Platform,
    Animated,

    KeyboardAvoidingView,
    FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Endpoint from '../../tools/endpoint';
import api from '../../tools/api';
import { useTranslation } from "react-i18next";
import "../../src/i18n";

const CustomOrderScreen = ({ navigation }) => {
    const { t, i18n } = useTranslation();

    // State tanımlamaları
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [orders, setOrders] = useState([]);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
const [products, setProducts] = useState([]);

    // Modal form state'leri
    const [formData, setFormData] = useState({
        adSoyad: '',
        telefon: '',
        urun: '',
        adet: '',
    });

    // Ürün listesi (örnek veriler)
    const urunListesi = [
        { label: 'Ürün Seçiniz', value: '' },
        { label: 'Laptop', value: 'laptop' },
        { label: 'Telefon', value: 'telefon' },
        { label: 'Tablet', value: 'tablet' },
        { label: 'Kulaklık', value: 'kulaklik' },
        { label: 'Mouse', value: 'mouse' },
    ];

    useEffect(() => {
        loadOrders();
        getParam();
    }, [selectedDate]);

    // AsyncStorage'dan siparişleri yükleme
    const loadOrders = async () => {
        try {
            const dateKey = selectedDate.toISOString().split('T')[0];
            const savedOrders = await AsyncStorage.getItem(`orders_${dateKey}`);
            if (savedOrders) {
                setOrders(JSON.parse(savedOrders));
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error('Siparişler yüklenirken hata:', error);
        }
    };

        const getParam = async () => {
        try {
            const { data } = await api.post(Endpoint.StockParams);
            setProducts(data.obj.products);
        } catch (error) {
            console.error('Veriler yüklenirken hata:', error);
        }
    };


    // Siparişleri kaydetme
    const saveOrders = async (newOrders) => {
        try {
            const dateKey = selectedDate.toISOString().split('T')[0];
            await AsyncStorage.setItem(`orders_${dateKey}`, JSON.stringify(newOrders));
        } catch (error) {
            console.error('Siparişler kaydedilirken hata:', error);
        }
    };

    // Tarih değişikliği
    const onDateChange = (event, date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
        }
    };

    // Form verilerini güncelleme
    const updateFormData = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Yeni sipariş ekleme
    const handleAddOrder = () => {
        // Form validasyonu

        if (!formData.telefon.trim()) {
            Alert.alert('Hata', 'Telefon alanı boş olamaz');
            return;
        }
        if (!formData.urun) {
            Alert.alert('Hata', 'Lütfen bir ürün seçiniz');
            return;
        }
        if (!formData.adet.trim() || parseInt(formData.adet) <= 0) {
            Alert.alert('Hata', 'Geçerli bir adet giriniz');
            return;
        }

        // Yeni sipariş oluşturma
        const newOrder = {
            id: Date.now().toString(),
            adSoyad: formData.adSoyad,
            telefon: formData.telefon,
            urun: urunListesi.find(u => u.value === formData.urun)?.label || formData.urun,
            adet: parseInt(formData.adet),
            tarih: selectedDate.toISOString().split('T')[0],
        };

        const updatedOrders = [...orders, newOrder];
        setOrders(updatedOrders);
        saveOrders(updatedOrders);

        // Form ve modal'ı temizleme
        setFormData({
            adSoyad: '',
            telefon: '',
            urun: '',
            adet: '',
        });
        setIsModalVisible(false);

        Alert.alert('Başarılı', 'Sipariş başarıyla eklendi');
    };

    // Sipariş silme
    const handleDeleteOrder = (orderId) => {
        Alert.alert(
            'Sipariş Sil',
            'Bu siparişi silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        const updatedOrders = orders.filter(order => order.id !== orderId);
                        setOrders(updatedOrders);
                        saveOrders(updatedOrders);
                    }
                }
            ]
        );
    };

    // Tarih formatı
    const formatDate = (date) => {
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const renderProductItem = ({ item }) => (
        <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
                setShowProductDropdown(false);
                Keyboard.dismiss();
            }}
            activeOpacity={0.7}
        >
            <View style={styles.dropdownItemContent}>
                <View style={styles.dropdownItemIcon}>
                    <Text>📦</Text>
                </View>
                <View style={styles.dropdownItemText}>
                    <Text style={styles.dropdownItemName}>{item.name}</Text>
                    <Text style={styles.dropdownItemId}>ID: {item.id}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

            {/* Header */}
            <LinearGradient colors={['#4B6CB7', '#182848']} style={styles.header}>
                <View style={styles.headerContent}>
                    {/* Tarih Seçimi */}
                    <TouchableOpacity
                        style={styles.dateSelector}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.dateText}>📅 {formatDate(selectedDate)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.saveButton}
                        activeOpacity={0.8}
                        onPress={() => setIsModalVisible(true)}
                    >
                        <LinearGradient
                            colors={['#FF6A00', '#FF8E53']} // turuncu → şeftali
                            style={styles.saveButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.saveButtonText}>Yeni Ekle</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    {/* Yeni Ekle Butonu */}
                    {/* <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Yeni Ekle</Text>
          </TouchableOpacity> */}
                </View>
            </LinearGradient>

            {/* Tarih Seçici */}
            {showDatePicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}

            {/* Sipariş Listesi */}
            <ScrollView style={styles.listContainer}>
                {orders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Bu tarih için henüz sipariş bulunmuyor</Text>
                    </View>
                ) : (
                    orders.map((order) => (
                        <View key={order.id} style={styles.orderItem}>
                            <View style={styles.orderInfo}>
                                <Text style={styles.orderName}>{order.adSoyad}</Text>
                                <Text style={styles.orderPhone}>📞 {order.telefon}</Text>
                                <Text style={styles.orderProduct}>🛍️ {order.urun} (x{order.adet})</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteOrder(order.id)}
                            >
                                <Text style={styles.deleteButtonText}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                    >
                        <View style={styles.modalContent}>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Yeni Sipariş Ekle</Text>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setIsModalVisible(false)}
                                >
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalForm}>
                                {/* Ad Soyad */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Ad Soyad *</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Ad soyad giriniz"
                                        value={formData.adSoyad}
                                        onChangeText={(text) => updateFormData('adSoyad', text)}
                                    />
                                </View>

                                {/* Telefon */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Telefon Numarası</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Telefon numarası giriniz"
                                        keyboardType="phone-pad"
                                        value={formData.telefon}
                                        onChangeText={(text) => updateFormData('telefon', text)}
                                    />
                                </View>

                                {/* Ürün Seçimi */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>
                                        <Text style={styles.labelIcon}>📦</Text> {t('stock.product_sel')}
                                    </Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.modernDropdown,
                                            selectedProduct && styles.modernDropdownSelected
                                        ]}
                                        onPress={() => setShowProductDropdown(!showProductDropdown)}
                                    >
                                        <View style={styles.dropdownContent}>
                                            <Text style={[
                                                styles.dropdownText,
                                                !selectedProduct && styles.placeholderText
                                            ]}>
                                                {selectedProduct.name || t('stock.product_sel')}
                                            </Text>
                                            <Animated.View
                                                style={[
                                                    styles.dropdownArrow,
                                                    {
                                                        transform: [{
                                                            rotate: showProductDropdown ? '180deg' : '0deg'
                                                        }]
                                                    }
                                                ]}
                                            >
                                                <Text style={styles.arrowIcon}>▼</Text>
                                            </Animated.View>
                                        </View>
                                    </TouchableOpacity>


                                    {showProductDropdown && (
                                        <Animated.View style={styles.modernDropdownList}>
                                            <FlatList
                                                data={products}
                                                renderItem={renderProductItem}
                                                keyExtractor={item => item.id.toString()}
                                                style={styles.dropdownScrollView}
                                                nestedScrollEnabled={true}
                                            />
                                        </Animated.View>
                                    )}
                                    {/* <Text style={styles.inputLabel}>Ürün Seçimi *</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={formData.urun}
                                            style={styles.picker}
                                            onValueChange={(itemValue) => updateFormData('urun', itemValue)}
                                        >
                                            {urunListesi.map((urun, index) => (
                                                <Picker.Item
                                                    key={index}
                                                    label={urun.label}
                                                    value={urun.value}
                                                />
                                            ))}
                                        </Picker>
                                    </View> */}
                                </View>

                                {/* Adet */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Ürün Adedi *</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Adet giriniz"
                                        keyboardType="numeric"
                                        value={formData.adet}
                                        onChangeText={(text) => updateFormData('adet', text)}
                                    />
                                </View>

                                {/* Butonlar */}
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setIsModalVisible(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>İptal</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveButtonModal}
                                        activeOpacity={0.8}
                                        onPress={() => handleAddOrder()}
                                    >
                                        <LinearGradient
                                            colors={['#FF6A00', '#FF8E53']} // turuncu → şeftali
                                            style={styles.saveButtonGradientModal}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.saveButtonTextModal}>Kaydet</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    {/* <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleAddOrder}
                >
                  <Text style={styles.saveButtonText}>Kaydet</Text>
                </TouchableOpacity> */}
                                </View>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default CustomOrderScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateSelector: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    dateText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    addButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContainer: {
        flex: 1,
        padding: 15,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    orderItem: {
        backgroundColor: 'white',
        padding: 15,
        marginBottom: 10,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderInfo: {
        flex: 1,
    },
    orderName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    orderPhone: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
    },
    orderProduct: {
        fontSize: 14,
        color: '#4A90E2',
        fontWeight: '500',
    },
    deleteButton: {
        backgroundColor: '#FF6B6B',
        width: 35,
        height: 35,
        borderRadius: 17.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
        flex: 1,
        marginTop: 100,
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
        fontWeight: 'bold',
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
        fontSize: 16,
        color: '#666',
    },
    modalForm: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fafafa',
        overflow: 'hidden',
    },
    picker: {
        height: 150,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
        marginTop: 30,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    saveButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowOpacity: 0.25,
        width: 150,
        shadowRadius: 4,
    },
    saveButtonGradient: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    saveButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 16,
        letterSpacing: 0.3,
    },
    saveButtonModal: {
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 4,
        shadowOpacity: 0.25,
        width: 150,
    },
    saveButtonGradientModal: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    saveButtonTextModal: {
        color: '#ffffff',
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 16,
        letterSpacing: 0.3,
    },


    dropdownItem: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dropdownItemIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownItemText: {
        flex: 1,
    },
    dropdownItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    dropdownItemId: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
        marginTop: 2,
    },

    modernDropdownList: {
        marginTop: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
    },
    dropdownScrollView: {
        maxHeight: 200,
    },

    modernDropdown: {
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    modernDropdownSelected: {
        borderColor: '#8B5CF6',
        backgroundColor: '#FAF5FF',
    },
    dropdownContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    dropdownText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
    },
    placeholderText: {
        color: '#9CA3AF',
        fontWeight: '400',
    },
    dropdownArrow: {
        marginLeft: 12,
    },
    arrowIcon: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    modernDropdownList: {
        marginTop: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
    },
    dropdownScrollView: {
        maxHeight: 200,
    },
    dropdownItem: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dropdownItemIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownItemText: {
        flex: 1,
    },
    dropdownItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    dropdownItemId: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
        marginTop: 2,
    },
});