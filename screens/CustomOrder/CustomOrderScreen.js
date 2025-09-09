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
    FlatList,
    Keyboard,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Endpoint from '../../tools/endpoint';
import api from '../../tools/api';
import { useTranslation } from "react-i18next";
import "../../src/i18n";

const { width } = Dimensions.get('window');

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
    const [loading,setLoading] = useState(false)

    // Modal form state'leri
    const [formData, setFormData] = useState({
        name_surname: '',
        phone: '',
        product: '',
        amount: '',
        id: null
    });


    useEffect(() => {
        loadOrders();
        getParam();
    }, [selectedDate]);

    // AsyncStorage'dan siparişleri yükleme
    const loadOrders = async () => {
        try {
            const { data } = await api.post(Endpoint.CustomOrderData, {date:selectedDate});
            console.log(data);
            if (data && data.status) {
                setOrders(data.obj);
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
    const handleAddOrder = async () => {
        if (!formData.product) {
            Alert.alert(t('customord.error'), t('customord.select_product'));
            return;
        }
        if (!formData.amount.trim() || parseInt(formData.amount) <= 0) {
            Alert.alert(t('customord.error'), t('customord.enter_valid_amount'));
            return;
        }

        setLoading(true)

        const { data } = await api.post(Endpoint.CustomOrderAdd, {
            name_surname: formData.name_surname,
            phone: formData.phone,
            product_id: formData.product,
            amount: formData.amount,
            id:formData.id
        });
        setLoading(false)
        if (data && data.status) {
            setFormData({
                name_surname: '',
                phone: '',
                product: '',
                amount: '',
                id: null
            });
            setIsModalVisible(false);
            Alert.alert(t('customord.success'), t('customord.order_added_success'));
            loadOrders(); // Listeyi yenile
        } else {
            Alert.alert(t('customord.error'), t('customord.order_add_error'));
        }
    };

    // Sipariş silme
    const handleDeleteOrder = (orderId) => {
        Alert.alert(
            t('customord.delete_order'),
            t('customord.delete_order_confirm'),
            [
                { text: t('customord.cancel'), style: 'cancel' },
                {
                    text: t('customord.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        const {data} = await api.post(Endpoint.CustomOrderDelete, {id: orderId});
                        if(data && data.status){    
                            Alert.alert(t('customord.success'), t('customord.order_deleted_success'));
                            loadOrders(); // Listeyi yenile
                        }else{
                            Alert.alert(t('customord.error'), t('customord.order_delete_error'));
                        }
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

    const editOrder = (item) => {
        console.log("item_id,", item.id)
        setFormData({
            name_surname: item.name_surname,
            phone: item.phone,
            product: item.product.id,
            amount: item.amount.toString(),
            id: item.id
        });

        setSelectedProduct(item.product)
        setIsModalVisible(true);

    };

    const renderProductItem = ({ item }) => (
        <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
                setSelectedProduct(item);
                setFormData(prev => ({ ...prev, product: item.id }));
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

    // Modern Order Item Component
    const renderOrderItem = ({ item, index }) => (
        <View style={[styles.modernOrderItem, {
            transform: [{ scale: 1 }],
            opacity: 1
        }]}>
            <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.orderItemGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Customer Info */}
                <View style={styles.customerSection}>
                    <View style={styles.customerAvatar}>
                        <Text style={styles.avatarText}>
                            {item.name_surname ? item.name_surname.charAt(0).toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <View style={styles.customerInfo}>
                        <Text style={styles.customerName}>{item.name_surname || t('customord.name_not_specified')}</Text>
                        <Text style={styles.customerPhone}>{item.phone || t('customord.phone_not_specified')}</Text>
                    </View>
                </View>
                {/* Product Info */}
                <View style={styles.productSection}>
                    <View style={styles.productIcon}>
                        <Text style={styles.productEmoji}>📦</Text>
                    </View>
                    <View style={styles.productDetails}>
                        <Text style={styles.productName}>{item.product?.name || t('customord.product_not_specified')}</Text>
                        <View style={styles.quantityContainer}>
                            <Text style={styles.quantityLabel}>{t('customord.quantity')}:</Text>
                            <View style={styles.quantityBadge}>
                                <Text style={styles.quantityText}>{item.amount}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        onPress={() => {
                            editOrder(item)
                        }}
                        style={styles.editButton}
                        activeOpacity={0.7}
                    >
                        <LinearGradient
                            colors={['#667EEA', '#764BA2']}
                            style={styles.editButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.editButtonText}>✏️</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteOrder(item.id)}
                        activeOpacity={0.7}
                    >
                        <LinearGradient
                            colors={['#FF6B6B', '#EE5A5A']}
                            style={styles.deleteButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.deleteButtonText}>🗑️</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Decorative Elements */}
                <View style={styles.decorativeCircle} />
                <View style={styles.decorativeLine} />
            </LinearGradient>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

            {/* Header */}
            <LinearGradient colors={['#4B6CB7', '#182848']} style={styles.header}>
                  <Text style={{ fontSize:20,marginBottom:20,color:'white',fontWeight:'bold' }}>{t('customord.title')}</Text>
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
                            colors={['#FF6A00', '#FF8E53']}
                            style={styles.saveButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.saveButtonText}>{t('customord.add_new')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
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

            {/* Modern Sipariş Listesi */}
            <View style={styles.listContainer}>
                {orders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Text style={styles.emptyIconText}>📋</Text>
                        </View>
                        <Text style={styles.emptyTitle}>{t('customord.no_orders_yet')}</Text>
                        <Text style={styles.emptyText}>{t('customord.no_orders_for_date')}</Text>
                        <TouchableOpacity
                            style={styles.emptyActionButton}
                            onPress={() => setIsModalVisible(true)}
                        >
                            <LinearGradient
                                colors={['#667EEA', '#764BA2']}
                                style={styles.emptyActionGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.emptyActionText}>{t('customord.add_first_order')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        renderItem={renderOrderItem}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.flatListContent}
                    />
                )}
            </View>

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
                                <Text style={styles.modalTitle}>{t('customord.add_new_order')}</Text>
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
                                    <Text style={styles.inputLabel}>{t('customord.full_name')} *</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder={t('customord.enter_full_name')}
                                        value={formData.name_surname}
                                        onChangeText={(text) => updateFormData('name_surname', text)}
                                    />
                                </View>

                                {/* phone */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>{t('customord.phone_number')}</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder={t('customord.enter_phone_number')}
                                        keyboardType="phone-pad"
                                        value={formData.phone}
                                        onChangeText={(text) => updateFormData('phone', text)}
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
                                </View>

                                {/* amount */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>{t('customord.product_quantity')} *</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder={t('customord.enter_quantity')}
                                        keyboardType="numeric"
                                        value={formData.amount}
                                        onChangeText={(text) => updateFormData('amount', text)}
                                    />
                                </View>

                                {/* Butonlar */}
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setIsModalVisible(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>{t('customord.cancel')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveButtonModal}
                                        activeOpacity={0.8}
                                        disabled={loading}
                                        onPress={() => handleAddOrder()}
                                    >
                                        <LinearGradient
                                            colors={['#FF6A00', '#FF8E53']}
                                            style={styles.saveButtonGradientModal}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.saveButtonTextModal}>{loading ? t('customord.saving') : t('customord.save')}</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
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
        backgroundColor: '#F1F5F9',
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
    listContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    flatListContent: {
        paddingTop: 16,
        paddingBottom: 100,
    },

    // Modern Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyIconText: {
        fontSize: 48,
        opacity: 0.6,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    emptyActionButton: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#667EEA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    emptyActionGradient: {
        paddingHorizontal: 32,
        paddingVertical: 16,
    },
    emptyActionText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
        textAlign: 'center',
    },

    // Modern Order Item
    modernOrderItem: {
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    orderItemGradient: {
        padding: 20,
        position: 'relative',
    },

    // Order Header
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    orderBadge: {
        backgroundColor: '#667EEA',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    orderBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    orderStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
    },

    // Customer Section
    customerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    customerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#667EEA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
    },
    customerInfo: {
        flex: 1,
    },
    customerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    customerPhone: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },

    // Product Section
    productSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    productIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    productEmoji: {
        fontSize: 20,
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 6,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    quantityLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    quantityBadge: {
        backgroundColor: '#667EEA',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 32,
        alignItems: 'center',
    },
    quantityText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },

    // Action Buttons
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    editButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#667EEA',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    editButtonGradient: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButtonText: {
        fontSize: 16,
    },
    deleteButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    deleteButtonGradient: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 16,
    },

    // Decorative Elements
    decorativeCircle: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        opacity: 0.3,
    },
    decorativeLine: {
        position: 'absolute',
        bottom: 0,
        left: 20,
        right: 20,
        height: 2,
        backgroundColor: '#667EEA',
        opacity: 0.1,
    },

    // Modal Styles
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
    labelIcon: {
        fontSize: 16,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
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
    saveButtonModal: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 4,
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    saveButtonGradientModal: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    saveButtonTextModal: {
        color: '#ffffff',
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 16,
        letterSpacing: 0.3,
    },

    // Dropdown Styles
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