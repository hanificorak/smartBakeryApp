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
import { ActivityIndicator, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColorScheme } from 'react-native';
import { useTranslation } from "react-i18next";
import "../../src/i18n"; 

const { width, height } = Dimensions.get('window');

export default function StockScreen({ navigation, setToken }) {
      const { t, i18n } = useTranslation();
    
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [stockEntries, setStockEntries] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [description, setDescription] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [products, setProducts] = useState([]);
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const [date, setDate] = useState(new Date());
    const [showdateSelect, setShowdateSelect] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const colorScheme = useColorScheme(); 



    useEffect(() => {
        getParam();
        getStockData();
        setSelectedDate(tempDate);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            })
        ]).start();
    }, [selectedDate]);

    const getParam = async () => {
        try {
            const { data } = await api.post(Endpoint.StockParams);
            setProducts(data.obj.products);
        } catch (error) {
            console.error('Veriler yüklenirken hata:', error);
        }
    };

    const openModal = () => {
        setModalVisible(true);
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 65,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
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
            Alert.alert(t('warning'), t('stock.warning_save'));
            return;
        }

        setSaveLoading(true);
        const { data } = await api.post(Endpoint.AddStock, {
            product_id: selectedProduct.id,
            amount: quantity,
            desc: description,
        });
        setSaveLoading(false);

        if (data && data.status) {
            Alert.alert(t('info'), t('stock.success_msg'));
            getStockData();
            closeModal();
        } else {
            Alert.alert(t('warning'),t('app_error'));
        }
    };

    const getStockData = async () => {
        setLoading(true);
        const { data } = await api.post(Endpoint.StockData, { date: date });
        setLoading(false);
        if (data && data.status) setStockEntries(data.obj);
    };

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

    const deleteStockEntry = (id) => {
        Alert.alert(
            t('stock.delete_title'),
            t('stock.delete_msg'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { data } = await api.post(Endpoint.StockDelete, { stock_id: id.id });
                            if (data && data.status) {
                                Alert.alert(t('info'), t('stock.delete_success'));
                                getStockData();
                            } else {
                                if (data.sub_info == "usage_rec") {
                                    Alert.alert(t('warning'), t('stock.stock_del_detail'));
                                    return;
                                }
                                Alert.alert(t('warning'), t('app_error'));
                            }
                        } catch (error) {
                            console.error('Silme hatası:', error);
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

    const openLastScreen = () => {
        navigation.replace('LastStockScreen')
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const renderStockEntry = ({ item, index }) => {
        return (
            <Animated.View
                style={[
                    styles.entryCard,
                    {

                    }
                ]}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.productBadge}>
                        <View style={styles.productIcon}>
                            <Text style={styles.productIconText}>📦</Text>
                        </View>
                        <View style={styles.productDetails}>
                            <Text style={styles.productName}>{item.product?.name}</Text>
                            <Text style={styles.productId}>ID: #{item.product?.id}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => deleteStockEntry(item)}
                        style={styles.deleteButton}
                        activeOpacity={0.7}
                    >
                        <View style={styles.deleteIcon}>
                            <Text style={styles.deleteText}>×</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <View style={styles.statIconContainer}>
                            <Text style={styles.statIcon}>📊</Text>
                        </View>
                        <View>
                            <Text style={styles.statValue}>{item.amount}</Text>
                            <Text style={styles.statLabel}>{t('stock.amount')}</Text>
                        </View>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                        <View style={styles.statIconContainer}>
                            <Text style={styles.statIcon}>🕒</Text>
                        </View>
                        <View>
                            <Text style={styles.statValue}>{formatDateTime(item.created_at).split(' ')[1]}</Text>
                            <Text style={styles.statLabel}>{t('stock.time')}</Text>
                        </View>
                    </View>
                </View>

                {item.desc && (
                    <View style={styles.descriptionCard}>
                        <View style={styles.descriptionHeader}>
                            <Text style={styles.descriptionIcon}>💬</Text>
                            <Text style={styles.descriptionTitle}>{t('stock.desc')}</Text>
                        </View>
                        <Text style={styles.descriptionText}>{item.desc}</Text>
                    </View>
                )}

                <View style={styles.cardFooter}>
                    <Text style={styles.timestampText}>
                        {formatDateTime(item.created_at)}
                    </Text>
                </View>
            </Animated.View>
        );
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
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Modern Header with Glassmorphism */}
            <View style={styles.headerContainer}>
                <LinearGradient
                    colors={['#4B6CB7', '#182848']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerBlur}>
                        <Animated.View
                            style={[
                                styles.headerContent
                            ]}
                        >
                            <View style={styles.headerTop}>
                                <View>
                                    <Text style={styles.headerTitle}>{t('stock.title')}</Text>
                                    <Text style={styles.headerSubtitle}>
                                        {formatDate(selectedDate)}
                                    </Text>
                                </View>
                                <View style={styles.headerStats}>
                                    <Text style={styles.statsNumber}>{stockEntries.length}</Text>
                                    <Text style={styles.statsLabel}>{t('record')}</Text>
                                </View>
                            </View>

                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={openLastScreen}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#182848', '#182848']}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.primaryButtonIcon}> </Text>
                                        <Text style={styles.primaryButtonText}>{t('stock.last_btn')}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={openModal}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#FF6A00', '#FF8E53']} // turuncu → şeftali
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.primaryButtonIcon}>+</Text>
                                        <Text style={styles.primaryButtonText}>{t('stock.new_rec')}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                {/* 
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={() => setShowdateSelect(true)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.secondaryButtonContent}>
                                        <Text style={styles.secondaryButtonIcon}>📅</Text>
                                        <Text style={styles.secondaryButtonText}>Tarih</Text>
                                    </View>
                                </TouchableOpacity> */}
                            </View>
                        </Animated.View>
                    </View>
                </LinearGradient>
            </View>

            {/* Content Area */}
            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <View style={styles.loadingCard}>
                            <ActivityIndicator size="large" color="#667eea" />
                            <Text style={styles.loadingText}>{t('loading')}</Text>
                            <Text style={styles.loadingSubtext}>{t('stock.loading')}</Text>
                        </View>
                    </View>
                ) : stockEntries.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyStateCard}>
                            <Text style={styles.emptyIcon}>📦</Text>
                            <Text style={styles.emptyTitle}>{t('no_record')}</Text>
                            <Text style={styles.emptySubtitle}>
                                {t('stock.add_msg')}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <FlatList
                        data={stockEntries}
                        renderItem={renderStockEntry}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                    />
                )}
            </View>

            {/* Enhanced Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="none"
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalKeyboard}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
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
                                <View style={styles.modalHeader}>
                                    <View style={styles.modalHandle} />
                                    <View style={styles.modalTitleContainer}>
                                        <Text style={styles.modalTitle}>{t('stock.add_title')}</Text>
                                        <Text style={styles.modalSubtitle}>{t('stock.add_sub')}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={closeModal}
                                        style={styles.closeButton}
                                    >
                                        <Text style={styles.closeButtonText}>×</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    style={styles.modalContent}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {/* Product Selection */}
                                    <View style={styles.inputContainer}>
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
                                                    {selectedProduct.name ||t('stock.product_sel')}
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

                                    {/* Quantity Input */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>
                                            <Text style={styles.labelIcon}>📊</Text> {t('stock.amount')}
                                        </Text>
                                        <View style={[
                                            styles.modernInput,
                                            quantity && styles.modernInputFilled
                                        ]}>
                                            <TextInput
                                                style={styles.inputField}
                                                value={quantity}
                                                onChangeText={setQuantity}
                                                placeholder="0"
                                                keyboardType="numeric"
                                                placeholderTextColor="#A0A0A0"
                                            />
                                            <Text style={styles.inputUnit}>{t('stock.unit')}</Text>
                                        </View>
                                    </View>

                                    {/* Description Input */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>
                                            <Text style={styles.labelIcon}>💬</Text> {t('stock.desc')}
                                        </Text>
                                        <View style={[
                                            styles.modernTextArea,
                                            description && styles.modernInputFilled
                                        ]}>
                                            <TextInput
                                                style={styles.textAreaField}
                                                value={description}
                                                onChangeText={setDescription}
                                                multiline
                                                numberOfLines={3}
                                                placeholderTextColor="#A0A0A0"
                                                textAlignVertical="top"
                                            />
                                        </View>
                                    </View>
                                </ScrollView>

                                {/* Save Button */}
                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={addStockEntry}
                                        disabled={saveLoading}
                                        activeOpacity={0.9}
                                    >
                                        <LinearGradient
                                            colors={['#667eea', '#764ba2']}
                                            style={styles.saveButtonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.saveButtonText}>{saveLoading ? t('saving') : t('save')}</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>

            {/* Date Picker Modal */}
            <Modal
                visible={showdateSelect}
                transparent
                animationType="fade"
                onRequestClose={() => setShowdateSelect(false)}
            >
                <View style={styles.dateModalOverlay}>
                    <View style={styles.dateModalContainer}>
                        <View style={styles.dateModalHeader}>
                            <Text style={styles.dateModalTitle}>{t('stock.date_sel')}</Text>
                        </View>

                        <DateTimePicker
                            value={Platform.OS === 'ios' ? tempDate : date}
                            mode="date"
                            display="spinner"
                            onChange={onChange}
                            textColor={colorScheme === 'dark' ? '#fff' : '#000'} // Dark modda beyaz

                            style={styles.datePicker}
                        />

                        {Platform.OS === 'ios' && (
                            <View style={styles.dateModalActions}>
                                <TouchableOpacity
                                    style={styles.dateModalButton}
                                    onPress={() => setShowdateSelect(false)}
                                >
                                    <Text style={styles.dateModalCancelText}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.dateModalButton, styles.dateModalConfirmButton]}
                                    onPress={confirmDate}
                                >
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

    // Header Styles
    headerContainer: {
    },
    headerGradient: {
        paddingBottom: 10,
    },
    headerBlur: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
    },
    headerContent: {
        paddingHorizontal: 15,
        paddingTop: 15,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 25,
    },
    headerTitle: {
        fontSize: 23,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
        marginTop: 1,
    },
    headerStats: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    statsNumber: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    statsLabel: {
        fontSize: 8,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: -15,
        gap: 12,
    },
    primaryButton: {
        flex: 1,
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        elevation: 1,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        gap: 8,
    },
    primaryButtonIcon: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffff',
        letterSpacing: 0.3,
    },
    secondaryButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    secondaryButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    secondaryButtonIcon: {
        fontSize: 16,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Content Styles
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    listContainer: {
        paddingVertical: 20,
        paddingBottom: 40,
    },

    // Entry Card Styles
    entryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(229, 231, 235, 0.5)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0,
    },
    productBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    productIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productIconText: {
        fontSize: 18,
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: -0.3,
    },
    productId: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
        marginTop: 2,
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    deleteIcon: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#EF4444',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statIcon: {
        fontSize: 14,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 12,
    },
    descriptionCard: {
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#0EA5E9',
        marginBottom: 12,
    },
    descriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    descriptionIcon: {
        fontSize: 14,
    },
    descriptionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0284C7',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    descriptionText: {
        fontSize: 14,
        color: '#0F172A',
        lineHeight: 20,
        fontWeight: '500',
    },
    cardFooter: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    timestampText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
        textAlign: 'center',
    },

    // Modal Styles
    modalKeyboard: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
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
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        maxHeight: height * 0.9,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 20,
    },
    modalHandle: {
        width: 36,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
    },
    modalHeader: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitleContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 4,
    },
    closeButton: {
        position: 'absolute',
        right: 24,
        top: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#6B7280',
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 8,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
        letterSpacing: 0.2,
    },
    labelIcon: {
        fontSize: 14,
        marginRight: 4,
    },

    // Modern Input Styles
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
    modernInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    modernInputFilled: {
        borderColor: '#8B5CF6',
        backgroundColor: '#FAF5FF',
    },
    inputField: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        paddingVertical: 18,
    },
    inputUnit: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginLeft: 8,
    },
    modernTextArea: {
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
        minHeight: 100,
    },
    textAreaField: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        textAlignVertical: 'top',
        minHeight: 60,
    },
    modalFooter: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingBottom: 34,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    saveButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    saveButtonGradient: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },

    // Date Modal Styles
    dateModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    dateModalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 20,
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
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.3,
    },
    datePicker: {
        backgroundColor: '#FFFFFF',
    },
    dateModalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 12,
    },
    dateModalButton: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    dateModalConfirmButton: {
        backgroundColor: '#8B5CF6',
    },
    dateModalCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
});