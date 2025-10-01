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

import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";

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
    const [loading, setLoading] = useState(false);
    const [reportView, setReportView] = useState(false);
    const [reportViewSingle, setReportViewSingle] = useState(false);
    const [email, setEmail] = useState('');
    const [selOrderId, setSelOrderId] = useState(null);
    const [printing, setPrinting] = useState(false);

    // Modal form state'leri - Çoklu ürün için güncellendi
    const [formData, setFormData] = useState({
        name_surname: '',
        phone: '',
        selectedProducts: [], // Çoklu ürün için array
        id: null,
        desc: ''
    });

    useEffect(() => {
        loadOrders();
        getParam();
    }, [selectedDate]);

    // AsyncStorage'dan siparişleri yükleme
    const loadOrders = async () => {
        try {
            const { data } = await api.post(Endpoint.CustomOrderData);
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

    // Ürün ekleme fonksiyonu
    const addProduct = () => {
        if (!selectedProduct || !selectedProduct.id) {
            Alert.alert(t('customord.error'), t('customord.select_product'));
            return;
        }

        // Ürün zaten eklenmiş mi kontrol et
        const existingProductIndex = formData.selectedProducts.findIndex(
            p => p.product.id === selectedProduct.id
        );

        if (existingProductIndex !== -1) {
            Alert.alert(t('customord.error'), 'Bu ürün zaten eklenmiş!');
            return;
        }

        const newProduct = {
            product: selectedProduct,
            amount: '1'
        };

        setFormData(prev => ({
            ...prev,
            selectedProducts: [...prev.selectedProducts, newProduct]
        }));

        setSelectedProduct('');
        setShowProductDropdown(false);
    };

    // Ürün silme fonksiyonu
    const removeProduct = (index) => {
        setFormData(prev => ({
            ...prev,
            selectedProducts: prev.selectedProducts.filter((_, i) => i !== index)
        }));
    };

    // Ürün miktarını güncelleme fonksiyonu
    const updateProductAmount = (index, amount) => {
        setFormData(prev => ({
            ...prev,
            selectedProducts: prev.selectedProducts.map((item, i) =>
                i === index ? { ...item, amount } : item
            )
        }));
    };

    // Yeni sipariş ekleme - Çoklu ürün için güncellendi
    const handleAddOrder = async () => {
        if (formData.selectedProducts.length === 0) {
            Alert.alert(t('customord.error'), 'En az bir ürün eklemelisiniz!');
            return;
        }

        // Tüm ürünlerin miktarlarını kontrol et
        const invalidProduct = formData.selectedProducts.find(
            item => !item.amount.trim() || parseInt(item.amount) <= 0
        );

        if (invalidProduct) {
            Alert.alert(t('customord.error'), 'Tüm ürünler için geçerli miktar giriniz!');
            return;
        }

        setLoading(true);

        try {
        
            const { data } = await api.post(Endpoint.CustomOrderAdd, {
                name_surname: formData.name_surname,
                phone: formData.phone,
                products: formData.selectedProducts.map(item => ({
                    product_id: item.product.id,
                    amount: item.amount
                })),
                id: formData.id,
                desc: formData.desc,
                delivery_date: selectedDate
            });

            setLoading(false);
            console.log(data)
            if (data && data.status) {
                setFormData({
                    name_surname: '',
                    phone: '',
                    selectedProducts: [],
                    id: null
                });

                
                setIsModalVisible(false);
                Alert.alert(t('customord.success'), t('customord.order_added_success'));
                loadOrders();
            } else {
                Alert.alert(t('customord.error'), t('customord.order_add_error'));
            }
        } catch (error) {
            setLoading(false);
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
                        const { data } = await api.post(Endpoint.CustomOrderDelete, { id: orderId });
                        if (data && data.status) {
                            Alert.alert(t('customord.success'), t('customord.order_deleted_success'));
                            loadOrders();
                        } else {
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

    const sendReport = () => {
        setReportView(true);
    };

    const sendReportMail = async () => {
        const lang = await AsyncStorage.getItem('selected_lang');
        const { data } = await api.post(Endpoint.CustomOrderReportSend, { lang: lang, print: 0, mail: email });
        if (data && data.status) {
            setReportView(false);
            Alert.alert(t('common.success'), t('report_order.report_sent_success'));
        } else {
            Alert.alert(t('common.error'), t('report_order.report_sent_error'));
        }
    };

    const sendReportMailSingle = async (print = false, id = null) => {
        const lang = await AsyncStorage.getItem('selected_lang');
        const { data } = await api.post(Endpoint.CustomOrderPrint, { lang: lang, print: (print == false ? 0 : 1), mail: email, id: id });
        setSelOrderId(null);
        console.log(data)
        if (data && data.status) {
            if (print) {
                printReportData(data.obj)
                return;
            }
            setReportViewSingle(false);
            setReportView(false);
            Alert.alert(t('common.success'), t('report_order.report_sent_success'));
        } else {
            Alert.alert(t('common.error'), t('report_order.report_sent_error'));
        }
    };

    const printOrder = async (sel_id = null) => {
        sendReportMailSingle(true, sel_id);
    };

    const mailAllData = async (sel_id = null) => {
        setSelOrderId(null);
        setReportViewSingle(true)
    };

    const allPrint = async (sel_id = null) => {
        setSelOrderId(null);
        sendReportMailSingle(true)
    };

    async function printReportData(pdfUrl) {
        if (printing) return;

        setPrinting(true);
        try {
            const localPath = FileSystem.documentDirectory + "temp.pdf";

            const downloadResumable = FileSystem.createDownloadResumable(
                pdfUrl,
                localPath
            );

            const { uri } = await downloadResumable.downloadAsync();

            await Print.printAsync({ uri });
        } catch (error) {
            if (error?.message?.includes("did not complete")) {
                console.log("Kullanıcı yazdırmayı iptal etti.");
            } else {
                console.error("PDF açılırken hata:", error);
            }
        } finally {
            setPrinting(false);
        }
    }

    const editOrder = (item) => {
        console.log("item_id,", item.id);
        setFormData({
            name_surname: item.name_surname,
            phone: item.phone,
            selectedProducts: [{
                product: item.product,
                amount: item.amount.toString()
            }],
            id: item.id
        });
        setIsModalVisible(true);
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

    // Seçili ürünleri render eden component
    const renderSelectedProduct = ({ item, index }) => (
        <View style={styles.selectedProductItem}>
            <LinearGradient
                colors={['#F8F9FA', '#E9ECEF']}
                style={styles.selectedProductGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View style={styles.selectedProductInfo}>
                    <View style={styles.selectedProductIcon}>
                        <Text>📦</Text>
                    </View>
                    <View style={styles.selectedProductDetails}>
                        <Text style={styles.selectedProductName}>{item.product.name}</Text>
                        <Text style={styles.selectedProductId}>ID: {item.product.id}</Text>
                    </View>
                </View>

                <View style={styles.selectedProductControls}>
                    <View style={styles.amountInputContainer}>
                        <Text style={styles.amountLabel}>{t('stock.unit')}:</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={item.amount}
                            onChangeText={(text) => updateProductAmount(index, text)}
                            keyboardType="numeric"
                            placeholder="1"
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.removeProductButton}
                        onPress={() => removeProduct(index)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.removeProductText}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
    );

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
                        <Text style={styles.customerPhone}>{t('customord.pay_desc')}: {(item.desc == null ? '-' : item.desc)}</Text>
                    </View>
                    <Text>
                        {new Date(item.delivery_date).toLocaleDateString("tr-TR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                        })}
                    </Text>
                </View>

                {item.order_products?.map((op, idx) => (
                    <View key={idx} style={styles.productSection}>
                        <View style={styles.productIcon}>
                            <Text style={styles.productEmoji}>📦</Text>
                        </View>
                        <View style={styles.productDetails}>
                            <Text style={styles.productName}>
                                {op.product?.name || t('customord.product_not_specified')}
                            </Text>
                            <View style={styles.quantityContainer}>
                                <Text style={styles.quantityLabel}>{t('customord.quantity')}:</Text>
                                <View style={styles.quantityBadge}>
                                    <Text style={styles.quantityText}>{op.amount}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    {/* <TouchableOpacity
                    onPress={() => { editOrder(item); }}
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
                </TouchableOpacity> */}

                    <TouchableOpacity
                        onPress={() => { printOrder(item.id); }}
                        style={styles.editButton}
                        activeOpacity={0.7}
                    >
                        <LinearGradient
                            colors={['#667EEA', '#764BA2']}
                            style={styles.editButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.editButtonText}>🖨️</Text>
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
                <Text style={{ fontSize: 20, marginBottom: 20, color: 'white', fontWeight: 'bold' }}>{t('customord.title')}</Text>
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
                            <Text style={[styles.saveButtonText, { fontSize: 14 }]}>+ {t('customord.add_new')}</Text>
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

            <View style={{ padding: 10 }}>
                <TouchableOpacity style={{ backgroundColor: '#4B6CB7', padding: 10, borderRadius: 10 }} onPress={() => mailAllData()}>
                    <Text style={{ textAlign: 'center', fontSize: 15, color: 'white' }}>{t('report.send_report')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ backgroundColor: '#4B6CB7', padding: 10, borderRadius: 10, marginTop: 7 }} onPress={() => allPrint()}>
                    <Text style={{ textAlign: 'center', fontSize: 15, color: 'white' }}>{t('customord.all_print')}</Text>
                </TouchableOpacity>
            </View>

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

            {/* Ana Modal - Çoklu Ürün Seçimi ile Güncellendi */}
            <Modal

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

                            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
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

                                {/* Telefon */}
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

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>{t('customord.pay_desc')}</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder={t('customord.pay_desc')}
                                        value={formData.desc}
                                        onChangeText={(text) => updateFormData('desc', text)}
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

                                    {/* Ürün Ekle Butonu */}
                                    <TouchableOpacity
                                        style={styles.addProductButton}
                                        onPress={addProduct}
                                        activeOpacity={0.7}
                                    >
                                        <LinearGradient
                                            colors={['#28A745', '#20C997']}
                                            style={styles.addProductGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.addProductText}>+ {t('stock.product_sel')}</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>

                                {/* Seçili Ürünler Listesi */}
                                {formData.selectedProducts.length > 0 && (
                                    <View style={styles.selectedProductsContainer}>
                                        <Text style={styles.selectedProductsTitle}> ({formData.selectedProducts.length})</Text>
                                        <FlatList
                                            data={formData.selectedProducts}
                                            renderItem={renderSelectedProduct}
                                            keyExtractor={(item, index) => `${item.product.id}_${index}`}
                                            scrollEnabled={false}
                                            showsVerticalScrollIndicator={false}
                                        />
                                    </View>
                                )}

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
                                            <Text style={styles.saveButtonTextModal}>
                                                {loading ? t('customord.saving') : t('customord.save')}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Rapor Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={reportView}
                onRequestClose={() => setReportView(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                    >
                        <View style={styles.modalContent}>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('report.send_report')}</Text>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setReportView(false)}
                                >
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalForm}>
                                <View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>{t('login.email')} *</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder={t('login.email')}
                                            value={email}
                                            onChangeText={(text) => setEmail(text)}
                                        />
                                    </View>
                                </View>
                                {/* Butonlar */}
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setReportView(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>İptal</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveButtonModal}
                                        activeOpacity={0.8}
                                        onPress={() => sendReportMail()}
                                    >
                                        <LinearGradient
                                            colors={['#FF6A00', '#FF8E53']}
                                            style={styles.saveButtonGradientModal}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.saveButtonTextModal}>{t('report.send')}</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Yeni Rapor tekli */}

            <Modal
                animationType="slide"
                transparent={true}
                visible={reportViewSingle}
                onRequestClose={() => setReportViewSingle(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                    >
                        <View style={styles.modalContent}>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('report.send_report')}</Text>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setReportViewSingle(false)}
                                >
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalForm}>
                                <View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>{t('login.email')} *</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder={t('login.email')}
                                            value={email}
                                            onChangeText={(text) => setEmail(text)}
                                        />
                                    </View>
                                </View>
                                {/* Butonlar */}
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setReportViewSingle(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>{t('customord.cancel')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveButtonModal}
                                        activeOpacity={0.8}
                                        onPress={() => sendReportMailSingle()}
                                    >
                                        <LinearGradient
                                            colors={['#FF6A00', '#FF8E53']}
                                            style={styles.saveButtonGradientModal}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.saveButtonTextModal}>{t('report.send')}</Text>
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
        maxHeight: '100%',
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
        marginBottom:30,
        paddingBottom: Platform.OS === 'ios' ? 20 : 40,
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

    addProductGradient: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    addProductText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },

    selectedProductGradient: {
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedProductInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedProductIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    selectedProductDetails: {
        flex: 1,
    },
    selectedProductName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 2,
    },
    selectedProductId: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    selectedProductControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    amountLabel: {
        fontSize: 12,
        color: '#6C757D',
        marginRight: 5,
    },
    amountInput: {
        width: 50,
        height: 50,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#495057',
    },
    removeProductButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFE6E6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    removeProductText: {
        fontSize: 14,
    },
});