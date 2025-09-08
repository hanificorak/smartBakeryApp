import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Modal,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    FlatList,
    Animated,

    Keyboard,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Endpoint from '../../tools/endpoint';

import { useTranslation } from "react-i18next";
import "../../src/i18n";
import api from '../../tools/api';
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";


const CustomOrderReportScreen = () => {

    const { t, i18n } = useTranslation();


    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [reportModalVisible, setReportModalVisible] = useState(false);

    // filtre state
    const [customerName, setCustomerName] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState({ id: '', name: 'Tümü' });
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [data, setData] = useState([]);
    const [sendLoading, setSendLoading] = useState(false);

    // rapor gönder state
    const [email, setEmail] = useState('');


    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');   // Gün
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Ay (0-11 olduğu için +1)
        const year = date.getFullYear();  // Yıl
        return `${day}.${month}.${year}`;
    };

    useEffect(() => {
        getParam();
        getReportData();
    }, []);

    const getParam = async () => {
        try {
            const { data } = await api.post(Endpoint.StockParams);
            if (data && data.status) {
                prd = data.obj.products;
                prd.unshift({ id: '', name: 'Tümü' });

                setProducts(data.obj.products);
            }
        } catch (error) {
            console.error('Veriler yüklenirken hata:', error);
        }
    };


    const getReportData = async () => {
        try {
            const { data } = await api.post(Endpoint.CustomOrderReportData, { name_surname: customerName, start_date: startDate, end_date: endDate, product_id: selectedProduct.id || '' });
            console.log("aaa", data)
            if (data && data.status) {
                setFilterModalVisible(false)
                setData(data.obj);
            }
        } catch (error) {
            console.error('Veriler yüklenirken hata:', error);
        }
    };

    const sendReport = async (print = false) => {
        try {
            if (!print) {
                if (email == null || email == "") {
                    Alert.alert('Hata', 'Lütfen geçerli bir mail adresi giriniz.');
                    return;
                }
            }


            setSendLoading(true);
            const { data } = await api.post(Endpoint.CustomOrderReportSend, { print: (print ? 1 : 0), mail: email, name_surname: customerName, start_date: startDate, end_date: endDate, product_id: selectedProduct.id || '' });
            setSendLoading(false);
            if (data && data.status) {
                if (print) {
                    printReportData(data.obj)
                    return;
                }
                setReportModalVisible(false);
                Alert.alert('Başarılı', 'Rapor mail olarak gönderildi.');
            } else {
                Alert.alert('Hata', 'Rapor gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
            }
        } catch (error) {
            setSendLoading(false);
            console.error('Veriler yüklenirken hata:', error);
        }
    };

      async function printReportData(pdfUrl) {
        try {
          const localPath = FileSystem.documentDirectory + "temp.pdf";
          const downloadResumable = FileSystem.createDownloadResumable(
            pdfUrl,
            localPath
          );
    
          const { uri } = await downloadResumable.downloadAsync();
          await Print.printAsync({ uri });
    
          setPrintLoading(false);
        } catch (error) {
          console.error("PDF açılırken hata:", error);
        }
      }

    const print = async () => {
        sendReport(true)
    };

    const formatDateShort = (date) => {
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


    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <LinearGradient
                colors={['#4B6CB7', '#182848']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Özel Sipariş Raporu</Text>

                        <View style={styles.headerTop}>

                            <View style={styles.headerButtons}>
                                {/* Filtreler Butonu */}
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={() => setFilterModalVisible(true)}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#FF6A00', '#FF8E53']}
                                        style={styles.saveButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.saveButtonText}>Filtreler</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Rapor Gönder Butonu */}
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={() => setReportModalVisible(true)}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#00C6FF', '#0072FF']} // mavi gradient
                                        style={styles.saveButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.saveButtonText}>Rapor Gönder</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Modern Liste */}
            {data.length > 0 ?
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                        <View style={styles.modernCard}>
                            {/* Üst Kısım - İsim ve Tarih */}
                            <View style={styles.cardHeader}>
                                <View style={styles.avatarContainer}>
                                    <LinearGradient
                                        colors={['#667eea', '#764ba2']}
                                        style={styles.avatar}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Text style={styles.avatarText}>
                                            {item.name_surname.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </Text>
                                    </LinearGradient>
                                </View>

                                <View style={styles.headerInfo}>
                                    <Text style={styles.customerName}>{item.name_surname}</Text>
                                    <View style={styles.dateContainer}>
                                        <View style={styles.dateIcon}>
                                            <Text style={styles.dateIconText}>📅</Text>
                                        </View>
                                        <Text style={styles.dateText}>
                                            {new Date(item.created_at).toLocaleDateString("tr-TR")}
                                        </Text>
                                    </View>
                                </View>

                            </View>

                            {/* Orta Kısım - Ürün Bilgisi */}
                            <View style={styles.productSection}>
                                <LinearGradient
                                    colors={['#f093fb', '#f5576c']}
                                    style={styles.productBadge}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.productIcon}>📦</Text>
                                </LinearGradient>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>{item.product.name}</Text>
                                    <Text style={styles.productCategory}>Kategori: Gıda</Text>
                                </View>
                            </View>

                            {/* Alt Kısım - Miktar ve Aksiyonlar */}
                            <View style={styles.cardFooter}>
                                <View style={styles.quantitySection}>
                                    <View style={styles.quantityBadge}>
                                        <Text style={styles.quantityIcon}>🔢</Text>
                                        <Text style={styles.quantityText}>Miktar: {item.amount}</Text>
                                    </View>
                                </View>


                            </View>

                        </View>
                    )}
                /> :
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, color: '#666' }}>Kayıt mevcut değil.</Text>
                </View>
            }

            {/* Filtreler Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={filterModalVisible}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity
                        style={styles.modalBackground}
                        activeOpacity={1}
                        onPressOut={() => setFilterModalVisible(false)}
                    >
                        <View style={styles.modalWrapper}>
                            <View style={styles.dragHandle} />

                            {/* Kapat Butonu */}
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setFilterModalVisible(false)}
                            >
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>

                            <ScrollView contentContainerStyle={styles.modalContent}>
                                <Text style={styles.modalTitle}>🔍  Filtreler</Text>

                                <View>
                                    <Text style={{ marginBottom: 8, marginLeft: 4 }}>Müşteri Adı</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Müşteri Adı"
                                        value={customerName}
                                        onChangeText={setCustomerName}
                                    />
                                </View>

                                {/* Başlangıç Tarihi */}
                                <View>
                                    <Text style={{ marginBottom: 8, marginLeft: 4 }}>Başlangıç Tarihi</Text>

                                    <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateInput}>
                                        <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                                    </TouchableOpacity>
                                    {showStartPicker && (
                                        <DateTimePicker
                                            value={startDate}
                                            mode="date"
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowStartPicker(false);
                                                if (selectedDate) setStartDate(selectedDate);
                                            }}
                                        />
                                    )}
                                </View>

                                {/* Bitiş Tarihi */}
                                <View>
                                    <Text style={{ marginBottom: 8, marginLeft: 4 }}>Bitiş Tarihi</Text>
                                    <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateInput}>
                                        <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                                    </TouchableOpacity>
                                    {showEndPicker && (
                                        <DateTimePicker
                                            value={endDate}
                                            mode="date"
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowEndPicker(false);
                                                if (selectedDate) setEndDate(selectedDate);
                                            }}
                                        />
                                    )}
                                </View>

                                {/* Ürün Seçimi */}
                                <View style={styles.inputGroup}>
                                    <Text style={{ marginBottom: 8, marginLeft: 4 }}>Ürün </Text>

                                    <TouchableOpacity
                                        style={[
                                            styles.modernDropdown
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


                                <TouchableOpacity
                                    style={[styles.actionButton, { marginTop: 20 }]}
                                    onPress={() => getReportData()}
                                >
                                    <LinearGradient colors={['#4B6CB7', '#4B6CB7']} style={styles.gradientButton}>
                                        <Text style={styles.buttonText}>Uygula</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Rapor Gönder Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={reportModalVisible}
                onRequestClose={() => setReportModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity
                        style={styles.modalBackground}
                        activeOpacity={1}
                        onPressOut={() => setReportModalVisible(false)}
                    >
                        <View style={styles.modalWrapper}>
                            <View style={styles.dragHandle} />

                            {/* Kapat Butonu */}
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setReportModalVisible(false)}
                            >
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>

                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>📧 Rapor Gönder</Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Mail adresi giriniz"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                />

                                <TouchableOpacity
                                    style={[styles.actionButton, { marginTop: 20 }]}
                                    onPress={() => print()}
                                    disabled={sendLoading}
                                >
                                    <LinearGradient colors={['#4B6CB7', '#4B6CB7']} style={styles.gradientButton}>
                                        <Text style={styles.buttonText}>{(sendLoading ? t('print_loading') : t('print'))}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, { marginTop: 20 }]}
                                    onPress={() => sendReport()}
                                    disabled={sendLoading}
                                >
                                    <LinearGradient colors={['#4B6CB7', '#4B6CB7']} style={styles.gradientButton}>
                                        <Text style={styles.buttonText}>{(sendLoading ? 'Gönderiliyor...' : 'Gönder')}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

export default CustomOrderReportScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 5,
        paddingBottom: 15,
    },
    headerContent: {
        paddingHorizontal: 15,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 12,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 10, // React Native 0.71+ veya marginRight kullanabilirsin
    },
    saveButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    saveButtonGradient: {

        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        textAlign: 'center',
    },
    actionButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        borderRadius: 12,
        padding: 15,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    // Modern kart stilleri
    modernCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerInfo: {
        flex: 1,
    },
    customerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#f0f9ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    dateIconText: {
        fontSize: 10,
    },
    dateText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    statusBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    statusText: {
        color: '#166534',
        fontSize: 12,
        fontWeight: '600',
    },
    productSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fafafa',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    productBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#f093fb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    productIcon: {
        fontSize: 16,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    productCategory: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quantitySection: {
        flex: 1,
    },
    quantityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff7ed',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fed7aa',
        alignSelf: 'flex-start',
    },
    quantityIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    quantityText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#c2410c',
    },
    detailButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#4facfe',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    detailButtonGradient: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 16,
    },
    detailButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    decorativeLine: {
        position: 'absolute',
        bottom: 0,
        left: 20,
        right: 20,
        height: 3,
        backgroundColor: '#4facfe',
        borderRadius: 2,
        opacity: 0.3,
    },
    // Modal stilleri
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalWrapper: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#ccc',
        alignSelf: 'center',
        marginVertical: 10,
    },
    modalContent: {
        paddingBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#222',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        backgroundColor: '#f9fafb',
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
        backgroundColor: '#f9fafb',
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        marginBottom: 15,
        backgroundColor: '#f9fafb',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    closeButton: {
        position: 'absolute',
        right: 15,
        top: 10,
        zIndex: 10,
        padding: 5,
    },
    closeText: {
        fontSize: 22,
        color: '#444',
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