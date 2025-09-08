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
    useColorScheme,
    Switch,
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
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import AntDesign from '@expo/vector-icons/AntDesign';
import { WebView } from "react-native-webview";

import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";

import { useTranslation } from "react-i18next";
import "../../src/i18n";

const ReportsScreen = ({ navigation }) => {
    const { t, i18n } = useTranslation();

    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [slideAnim] = useState(new Animated.Value(0));

    // Dropdown visibility states
    const [productMenuVisible, setProductMenuVisible] = useState(false);
    const [weatherMenuVisible, setWeatherMenuVisible] = useState(false);
    const [dateMenuVisible, setDateMenuVisible] = useState(false);

    // Date picker states
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [hasCustomDateRange, setHasCustomDateRange] = useState(false);

    // Text input date states
    const [startDateText, setStartDateText] = useState('');
    const [endDateText, setEndDateText] = useState('');
    const [startDateError, setStartDateError] = useState('');
    const [endDateError, setEndDateError] = useState('');

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
    const [value, setValue] = useState("gunluk");
    const [WeatherView, setWeatherView] = useState(null);
    const [showdateSelect, setShowdateSelect] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const [dateType, setDateType] = useState(null);

    const [selectedProd, setSelectedProd] = useState([]);
    const [pdfView, setPdfView] = useState(false);
    const [pdfPath, setpdfPath] = useState('');


    const dateRanges = [
        { label: t('report.date_now'), value: 'today' },
        { label: t('report.date_week'), value: 'week' },
        { label: t('report.date_month'), value: 'month' },
        { label: t('report.custom_date'), value: 'custom' }
    ];

    const data = [
        { label: t('report.type_total'), value: "toplam" },
        { label: t('report.type_daily'), value: "gunluk" },
    ];

    const dataWeather = [
        { label: t('report.show'), value: "view" },
        { label: t('report.hide'), value: "not_view" },
    ];

    useEffect(() => {
        getParam();
        getReportData();
    }, []);

    // Date formatting and validation functions
    const formatDateInput = (text) => {
        // Remove all non-numeric characters
        const numbersOnly = text.replace(/\D/g, '');

        // Add dots automatically
        if (numbersOnly.length <= 2) {
            return numbersOnly;
        } else if (numbersOnly.length <= 4) {
            return numbersOnly.slice(0, 2) + '.' + numbersOnly.slice(2);
        } else {
            return numbersOnly.slice(0, 2) + '.' + numbersOnly.slice(2, 4) + '.' + numbersOnly.slice(4, 8);
        }
    };

    const validateDate = (dateString) => {
        // Check format: DD.MM.YYYY
        const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
        const match = dateString.match(dateRegex);

        if (!match) {
            return { isValid: false, error: 'Tarih formatı: GG.AA.YYYY' };
        }

        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);

        // Basic validation
        if (month < 1 || month > 12) {
            return { isValid: false, error: 'Geçersiz ay (1-12)' };
        }

        if (day < 1 || day > 31) {
            return { isValid: false, error: 'Geçersiz gün (1-31)' };
        }

        if (year < 1900 || year > new Date().getFullYear() + 10) {
            return { isValid: false, error: 'Geçersiz yıl' };
        }

        // Create date object
        const dateObj = new Date(year, month - 1, day);

        // Check if the date is valid (e.g., not 31.02.2023)
        if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
            return { isValid: false, error: 'Geçersiz tarih' };
        }

        return { isValid: true, date: dateObj };
    };

    const parseCustomDates = () => {
        let startDateObj = null;
        let endDateObj = null;

        if (startDateText.length === 10) {
            const startValidation = validateDate(startDateText);
            if (startValidation.isValid) {
                startDateObj = startValidation.date;
                setStartDate(startDateObj);
                setStartDateError('');
            } else {
                setStartDateError(startValidation.error);
            }
        }

        if (endDateText.length === 10) {
            const endValidation = validateDate(endDateText);
            if (endValidation.isValid) {
                endDateObj = endValidation.date;
                setEndDate(endDateObj);
                setEndDateError('');
            } else {
                setEndDateError(endValidation.error);
            }
        }

        return { startDateObj, endDateObj };
    };

    const handleStartDateChange = (text) => {
        const formatted = formatDateInput(text);
        setStartDateText(formatted);

        if (formatted.length === 10) {
            const validation = validateDate(formatted);
            if (validation.isValid) {
                setStartDate(validation.date);
                setStartDateError('');
                setHasCustomDateRange(true);
            } else {
                setStartDateError(validation.error);
            }
        } else {
            setStartDateError('');
        }
    };

    const handleEndDateChange = (text) => {
        const formatted = formatDateInput(text);
        setEndDateText(formatted);

        if (formatted.length === 10) {
            const validation = validateDate(formatted);
            if (validation.isValid) {
                setEndDate(validation.date);
                setEndDateError('');
                setHasCustomDateRange(true);
            } else {
                setEndDateError(validation.error);
            }
        } else {
            setEndDateError('');
        }
    };

    const getParam = async () => {
        const { data } = await api.post(Endpoint.StockParams, { lang: i18n.language });
        if (data && data.status) {
            setProducts(data.obj.products)
            setWeatherOptions(data.obj.weather)
        }
    };

    const getReportData = async (clear = false) => {
        try {
            setLoading(true);
            let params = {
                product: (selectedProduct == "all" ? null : (selectedProduct == null ? null : selectedProduct.id)),
                weather: (selectedWeather == null ? null : selectedWeather.id),
                date: dateRange,
                startDate: startDate,
                endDate: endDate
            }

            // Add custom date range if selected
if (dateRange === 'custom' && hasCustomDateRange) {

                  const formatLocalISODate = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Ay 0'dan başlar, bu yüzden +1
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


             params.startDate = formatLocalISODate(startDate);
    params.endDate = formatLocalISODate(endDate);
            }

            if (clear) {
                params = {
                    product: null,
                    weather: null,
                    date: 'today',
                    startDate: null,
                    endDate: null,
                }
            }

            const { data } = await api.post(Endpoint.ReportData, params);
            console.log(params)
            setLoading(false)
            if (data && data.status) {
                const updatedReportData = data.obj.map(item => ({
                    ...item,
                    is_view: item.report_view == 1 ? true : false // Convert to boolean
                }));
                setReportData(updatedReportData);
            }
        } catch (error) {
            console.log(error.message)
        }
    };

    const clearFilters = async () => {
        setSelectedProduct(null);
        setSelectedWeather(null);
        setDateRange('today');
        setHasCustomDateRange(false);
        setStartDate(new Date());
        setEndDate(new Date());
        setStartDateText('');
        setEndDateText('');
        setStartDateError('');
        setEndDateError('');
        closeModal();
        getReportData(true);
    };

    const closeDatePicker = async () => {
        setShowdateSelect(false);
        setFilterModalVisible(true)
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
        setReportMail('');
        setSelectedProd([]);
        setValue('gunluk');
        setWeatherView('view');
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
        // Validate custom dates before applying filter
        if (dateRange === 'custom') {
            const { startDateObj, endDateObj } = parseCustomDates();

            if (startDateText.length === 10 && endDateText.length === 10) {
                if (startDateError || endDateError) {
                    Alert.alert(t('warning'), t('report.enter_valid_dates'));
                    return;
                }

                if (startDateObj && endDateObj && startDateObj > endDateObj) {
                    Alert.alert(t('warning'), t('report.start_before_end'));
                    return;
                }
            } else if (startDateText.length > 0 || endDateText.length > 0) {
                Alert.alert(t('warning'), t('report.enter_both_dates'));
                return;
            }
        }

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

        if (!selectedProduct) return t('report.select_product');
        if (selectedProduct == "all") return t('report.all');
        return selectedProduct.name;
    };

    const getSelectedWeatherLabel = () => {
        if (selectedWeather == null) {
            return t('report.all')
        }

        const weather = weatherOptions.find(w => w.id === selectedWeather.id);
        return weather ? weather.description : t('report.all');
    };

    const sendReportMail = async (type = "mail", print = false) => {
        try {

            if (reportMail == null) {
                Alert.alert(t('warning'), t('report.enter_email'));
                return;
            }

            if (!checkMail() && type == "mail") {
                Alert.alert(t('warning'), t('report.invalid_email'));
                return;
            }
            setSendLoading(true);
            let params = {
                product: (selectedProduct == null ? null : selectedProduct.id),
                weather: (selectedWeather == null ? null : selectedWeather.id),
                date: dateRange,
                mail: reportMail,
                type: value,
                startDate: startDate,
                endDate: endDate,
                hiddenProd: selectedProd,
                weatherView: WeatherView,
                type_dt: type
            }

            // Add custom date range if selected
            if (dateRange === 'custom' && hasCustomDateRange) {
               
                  const formatLocalISODate = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Ay 0'dan başlar, bu yüzden +1
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


             params.startDate = formatLocalISODate(startDate);
    params.endDate = formatLocalISODate(endDate);
            }

            const { data } = await api.post(Endpoint.ReportSend, params);
            setSendLoading(false);
            console.log(data)
            if (data && data.status) {
                if (type == "mail") {
                    Alert.alert(t('info'), t('report.mail_success', { email: reportMail }));
                    setMailModal(false);
                    setReportMail('');

                } else {
                    if (print) {
                        setMailModal(false);
                        printReportData(data.obj);

                        return;
                    }
                    setpdfPath(data.sub_info)
                    // console.log(data.sub_info)
                    setMailModal(false);
                    setTimeout(() => {
                        setPdfView(true);
                    }, 1000);
                }
            } else {
                Alert.alert(t('warning'), t('report.operation_failed'));
            }
        } catch (error) {
            console.log(error)
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
        } catch (error) {
            console.error("PDF açılırken hata:", error);
        }
    }

    const getSelectedDateLabel = () => {
        const date = dateRanges.find(d => d.value === dateRange);
        if (dateRange === 'custom' && hasCustomDateRange) {
            return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;
        }
        return date ? date.label : t('report.select_date_range');
    };

    const formatDateShort = (date) => {
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const onStartDateChange = (event, selectedDate) => {
        setShowStartDatePicker(false);
        if (selectedDate) {
            setStartDate(selectedDate);
            setHasCustomDateRange(true);
        }
    };

    const onEndDateChange = (event, selectedDate) => {
        setShowEndDatePicker(false);
        if (selectedDate) {
            setEndDate(selectedDate);
            setHasCustomDateRange(true);
        }
    };

    const onChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowdateSelect(false);
            if (selectedDate) {
                if (dateType === "start") {
                    setStartDate(selectedDate);
                    setHasCustomDateRange(true);
                } else {
                    setEndDate(selectedDate);
                    setHasCustomDateRange(true);
                }
            }
            setFilterModalVisible(true);
        } else {
            // iOS handling
            if (selectedDate) {
                setTempDate(selectedDate);
            }
        }
    };

    const handleDateRangeSelection = (range) => {
        setDateRange(range.value);
        setDateMenuVisible(false);

        if (range.value !== 'custom') {
            setHasCustomDateRange(false);
            setStartDateText('');
            setEndDateText('');
            setStartDateError('');
            setEndDateError('');
        }
    };

    const toggleSwitch = async (itemId) => {
        setReportData(prevReportData =>
            prevReportData.map(item =>
                item.id === itemId ? { ...item, is_view: !item.is_view } : item
            )


        );

        try {
            const { data } = await api.post(Endpoint.ReportViewChange, { id: itemId });
            console.log(data)
            if (data && data.status) {
                Alert.alert(t('info'), t('report.view_status_changed'));
            }
        } catch (error) {
            console.log(error)
        }




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
                                {t('report.eod_date')} {formatDate(item.created_at)}
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
                                <Text style={styles.statLabel}>{t('report.produced')}</Text>
                                <Text style={styles.statValue}>{item.amount}</Text>
                            </View>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#DCFCE7' }]}>
                                <Text style={styles.statIconText}>💰</Text>
                            </View>
                            <View style={styles.statContent}>
                                <Text style={styles.statLabel}>{t('report.sold')}</Text>
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
                                <Text style={styles.statLabel}>{t('report.waste')}</Text>
                                <Text style={styles.statValue}>{item.remove_amount}</Text>
                            </View>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
                                <Text style={styles.statIconText}>➡️</Text>
                            </View>
                            <View style={styles.statContent}>
                                <Text style={styles.statLabel}>{t('report.carry_over')}</Text>
                                <Text style={styles.statValue}>{item.ert_count || 0}</Text>
                            </View>
                        </View>

                    </View>
                    {item.parentdate != null ? <View style={{ padding: 10, backgroundColor: '#f1f5f9', borderRadius: 10, marginTop: 10 }}>
                        <Text>{t('report.first_production_date')} {item.parentdate}</Text>
                        <Text>{t('report.parent_info')} </Text>
                    </View> : <View></View>}

                    <View style={{ marginTop: 20 }}>
                        <Text>Raporda Gizle/Göster</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={item.is_view ? "#f5dd4b" : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={() => toggleSwitch(item.id)} // <<-- BURADA DEĞİŞİKLİK YAPILMALI
                            value={item.is_view}
                        />
                    </View>

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

    const confirmDate = () => {
        // Apply the temp date to the appropriate state
        if (dateType === "start") {
            setStartDate(tempDate);
        } else {
            setEndDate(tempDate);
        }
        setHasCustomDateRange(true);
        setShowdateSelect(false);
        setFilterModalVisible(true);
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

    const closepdfModal = () => {
        setPdfView(false);
        setMailModal(true)
    };

    const checkMail = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(reportMail);
    };

    const reportPreview = () => {
        sendReportMail("link")
    };
    const print_report = () => {
        sendReportMail("link", true)
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
                            <Text style={styles.headerTitle}>{t('report.title')}</Text>
                        </View>
                        <Text style={styles.headerSubtitle}>
                            {t('report.subtitle')}
                        </Text>
                        {/* Stats Summary in Header */}
                        {reportData.length > 0 && (
                            <View style={styles.headerStats}>
                                <View style={styles.headerStatItem}>
                                    <Text style={styles.headerStatValue}>{reportData.length}</Text>
                                    <Text style={styles.headerStatLabel}>{t('report.total_records')}</Text>
                                </View>
                                <View style={styles.headerStatItem}>
                                    <Text style={styles.headerStatValue}>
                                        {reportData.reduce((sum, item) => sum + parseInt(item.amount || 0), 0)}
                                    </Text>
                                    <Text style={styles.headerStatLabel}>{t('report.total_sales')}</Text>
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
                            <Text style={styles.filterButtonText}>{t('report.filters')}</Text>
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
                            <Text style={styles.filterButtonText}>{t('report.send_report')}</Text>
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
                            <Text style={styles.emptyTitle}>{t('report.empty_title')}</Text>
                            <Text style={styles.emptySubtitle}>
                                {t('report.empty_subtitle')}
                            </Text>
                        </View>
                    </View>
                    : ''}

                {loading ?
                    <View>
                        <View style={styles.loadingContainer}>
                            <View style={styles.loadingCard}>
                                <ActivityIndicator size="large" color="#667eea" />
                                <Text style={styles.loadingText}>{t('report.loading')}</Text>
                                <Text style={styles.loadingSubtext}>{t('report.loading_records')}</Text>
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


            {/* VİEW */}

            <Modal
                visible={pdfView}
                transparent={true}
                animationType="none"

            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackground}
                        activeOpacity={1}

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
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('report.pdf_preview')}</Text>
                            <TouchableOpacity
                                onPress={closepdfModal}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>


                        {/* Body */}
                        <View style={styles.modalBody}>
                            {/* Buraya PDF gösterimi */}
                            {/* Örneğin react-native-pdf ile */}

                            <WebView
                                source={{
                                    uri: pdfPath,
                                }}
                                style={{ flex: 1 }}
                            />


                        </View>

                        {/* Footer */}
                        <View style={styles.modalFooter}>
                            <Button
                                mode="outlined"
                                onPress={closepdfModal}
                                style={styles.clearButton}
                            >
                                {t('report.close')}
                            </Button>

                        </View>
                    </Animated.View>
                </View>
            </Modal>


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
                            <Text style={styles.modalTitle}>{t('report.filters')}</Text>
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
                                <Text style={styles.filterSectionTitle}>{t('report.product')}</Text>
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
                                                setSelectedProduct("all");
                                                setProductMenuVisible(false);
                                            }}
                                        >
                                            <Text style={selectedProduct === null ? styles.selectedDropdownText : styles.dropdownText}>
                                                {t('report.all')}
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
                                <Text style={styles.filterSectionTitle}>{t('report.weather')}</Text>
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
                                        <TouchableOpacity
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setSelectedWeather(null);
                                                setWeatherMenuVisible(false);
                                            }}
                                        >
                                            <Text style={selectedWeather === null ? styles.selectedDropdownText : styles.dropdownText}>
                                                {t('report.all')}
                                            </Text>
                                        </TouchableOpacity>
                                        {weatherOptions.map((weather) => (
                                            <TouchableOpacity
                                                key={weather.id}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setSelectedWeather(weather);
                                                    setWeatherMenuVisible(false);
                                                }}
                                            >
                                                <Text style={selectedWeather?.id === weather.id ? styles.selectedDropdownText : styles.dropdownText}>
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
                                <Text style={styles.filterSectionTitle}>{t('report.date_range')}</Text>
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
                                                onPress={() => handleDateRangeSelection(range)}
                                            >
                                                <Text style={dateRange === range.value ? styles.selectedDropdownText : styles.dropdownText}>
                                                    {range.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {/* Custom Date Range Section */}
                                {dateRange === 'custom' && (
                                    <View style={styles.customDateSection}>
                                        <Text style={styles.customDateTitle}>{t('report.custom_date')}</Text>

                                        {/* Start Date Input */}
                                        <View style={styles.dateInputRow}>
                                            <Text style={styles.dateLabel}>{t('report.start_date')}</Text>
                                            <View style={styles.dateInputContainer}>
                                                <TextInput
                                                    style={[
                                                        styles.dateTextInput,
                                                        startDateError ? styles.dateTextInputError : null
                                                    ]}
                                                    value={startDateText}
                                                    onChangeText={handleStartDateChange}
                                                    placeholder={t('report.date_placeholder')}
                                                    placeholderTextColor="#9CA3AF"
                                                    keyboardType="numeric"
                                                    maxLength={10}
                                                    underlineColorAndroid="transparent"
                                                />
                                                <Text style={styles.dateInputIcon}>📅</Text>
                                            </View>
                                            {startDateError ? (
                                                <Text style={styles.dateErrorText}>{startDateError}</Text>
                                            ) : null}
                                        </View>

                                        {/* End Date Input */}
                                        <View style={styles.dateInputRow}>
                                            <Text style={styles.dateLabel}>{t('report.end_date')}</Text>
                                            <View style={styles.dateInputContainer}>
                                                <TextInput
                                                    style={[
                                                        styles.dateTextInput,
                                                        endDateError ? styles.dateTextInputError : null
                                                    ]}
                                                    value={endDateText}
                                                    onChangeText={handleEndDateChange}
                                                    placeholder={t('report.date_placeholder')}
                                                    placeholderTextColor="#9CA3AF"
                                                    keyboardType="numeric"
                                                    maxLength={10}
                                                    underlineColorAndroid="transparent"
                                                />
                                                <Text style={styles.dateInputIcon}>📅</Text>
                                            </View>
                                            {endDateError ? (
                                                <Text style={styles.dateErrorText}>{endDateError}</Text>
                                            ) : null}
                                        </View>

                                        {/* Date Format Info */}
                                        <View style={styles.dateFormatInfo}>
                                            <Text style={styles.dateFormatIcon}>ℹ️</Text>
                                            <Text style={styles.dateFormatText}>
                                                {t('report.date_format_info')}
                                            </Text>
                                        </View>
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
                                {t('report.clear')}
                            </Button>
                            <Button
                                mode="contained"
                                onPress={applyFilter}
                                style={styles.applyButton}
                            >
                                {t('report.apply')}
                            </Button>
                        </View>
                    </Animated.View>
                </View>
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
                            <Text style={styles.dateModalTitle}>{t('report.select_date')}</Text>
                        </View>

                        <DateTimePicker
                            value={tempDate} // Always use tempDate which is guaranteed to be a Date object
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChange}
                            textColor={useColorScheme === 'dark' ? '#fff' : '#000'}
                            style={styles.datePicker}
                        />

                        {Platform.OS === 'ios' && (
                            <View style={styles.dateModalActions}>
                                <TouchableOpacity
                                    style={styles.dateModalButton}
                                    onPress={() => closeDatePicker()}
                                >
                                    <Text style={styles.dateModalCancelText}>{t('report.cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.dateModalButton, styles.dateModalConfirmButton]}
                                    onPress={confirmDate}
                                >
                                    <Text style={styles.dateModalConfirmText}>{t('report.ok')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
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
                                        <Text style={styles.mailModalTitle}>{t('report.send_report')}</Text>
                                        <Text style={styles.mailModalSubtitle}>{t('report.email_address')}</Text>
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
                                    <Text style={styles.mailInputLabel}>{t('report.email_address')}</Text>
                                    <View style={styles.mailInputContainer}>
                                        <View style={styles.emailIconContainer}>
                                            <Text style={styles.emailInputIcon}>@</Text>
                                        </View>
                                        <TextInput
                                            placeholder={t('report.email_placeholder')}
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
                                    <View style={{ marginTop: 15 }}>
                                        <Text>{t('report.hidden_products')}</Text>
                                        <MultiSelect
                                            style={styles.dropdown}
                                            placeholderStyle={styles.placeholderStyle}
                                            selectedTextStyle={styles.selectedTextStyle}
                                            inputSearchStyle={styles.inputSearchStyle}
                                            iconStyle={styles.iconStyle}
                                            search
                                            data={products}
                                            labelField="name"
                                            valueField="id"
                                            placeholder={t('report.select_product_placeholder')}
                                            searchPlaceholder={t('report.search_placeholder')}
                                            value={selectedProd}
                                            onChange={item => {
                                                setSelectedProd(item);
                                            }}
                                            renderLeftIcon={() => (
                                                <AntDesign
                                                    style={styles.icon}
                                                    color="black"
                                                    name="Safety"
                                                    size={20}
                                                />
                                            )}
                                            selectedStyle={styles.selectedStyle}
                                        />
                                    </View>

                                    <View style={{ marginTop: 15 }}>
                                        <Text>{t('report.report_type')}</Text>

                                        <Dropdown
                                            style={styles.dropdown}
                                            data={data}
                                            labelField="label"
                                            valueField="value"
                                            placeholder={t('report.select')}
                                            value={value}
                                            onChange={item => setValue(item.value)}
                                        />
                                    </View>
                                    <View style={{ marginTop: 15 }}>
                                        <Text>{t('report.weather_view')}</Text>

                                        <Dropdown
                                            style={styles.dropdown}
                                            data={dataWeather}
                                            labelField="label"
                                            valueField="value"
                                            placeholder={t('report.select')}
                                            value={WeatherView}
                                            onChange={item => setWeatherView(item.value)}
                                        />
                                    </View>

                                </View>

                                {/* Info Card */}
                                <View style={styles.infoCard}>
                                    <View style={styles.infoIconContainer}>
                                        <Text style={styles.infoIcon}>ℹ️</Text>
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoTitle}>{t('report.info_title')}</Text>
                                        <Text style={styles.infoText}>
                                            {t('report.info_text')}
                                        </Text>
                                    </View>
                                </View>

                                {/* Active Filters Display */}
                                {getActiveFiltersCount() > 0 && (
                                    <View style={styles.activeFiltersCard}>
                                        <Text style={styles.activeFiltersTitle}>{t('report.active_filters')}</Text>
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


                                <View style={{ flexDirection: 'row' }}>
                                    <TouchableOpacity
                                        onPress={reportPreview}
                                        style={[styles.sendMailButton, sendLoading && styles.sendMailButtonDisabled]}
                                    >
                                        <View style={styles.sendButtonContent}>
                                            <Text style={styles.sendMailButtonIcon}></Text>
                                            <Text style={styles.sendMailButtonText}>{t('report.preview')}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={print_report}
                                        style={[styles.sendMailButton, sendLoading && styles.sendMailButtonDisabled]}
                                    >
                                        <View style={styles.sendButtonContent}>
                                            <Text style={styles.sendMailButtonIcon}></Text>
                                            <Text style={styles.sendMailButtonText}>{t('print')}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>



                            </ScrollView>

                            {/* Modern Footer */}
                            <View style={styles.mailModalFooter}>
                                <TouchableOpacity
                                    style={styles.cancelMailButton}
                                    onPress={closeModalMail}
                                    disabled={sendLoading}
                                >
                                    <Text style={styles.cancelMailButtonText}>{t('report.cancel')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.sendMailButton, sendLoading && styles.sendMailButtonDisabled]}
                                    onPress={() => sendReportMail('mail')}
                                    disabled={sendLoading || !reportMail.trim()}
                                >
                                    {sendLoading ? (
                                        <View style={styles.sendButtonContent}>
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                            <Text style={styles.sendMailButtonText}>{t('report.sending')}</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.sendButtonContent}>
                                            <Text style={styles.sendMailButtonIcon}>📤</Text>
                                            <Text style={styles.sendMailButtonText}>{t('report.send')}</Text>
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
    dropdown: {
        height: 50,
        borderColor: "#D1D5DB",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: "#fff",
        marginTop: 5,
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
        maxHeight: '100%',
        minHeight: '85%',
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

    // Custom Date Picker Styles
    customDateSection: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    customDateTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 16,
    },
    datePickerRow: {
        marginBottom: 12,
    },
    dateLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
        marginBottom: 8,
    },
    datePickerButton: {
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
    datePickerButtonText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    calendarIcon: {
        fontSize: 16,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 12,
        backgroundColor: '#fef3cd',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    warningIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    warningText: {
        fontSize: 14,
        color: '#92400e',
        flex: 1,
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
        maxHeight: '100%',
        minHeight: '60%',
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
        paddingHorizontal: 8,
        paddingVertical: 2,
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
        marginBottom: 10,

        marginRight: 5,
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
        paddingHorizontal: 16,
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

    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: 'white',
        borderRadius: 8,
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    dateTextInput: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        paddingHorizontal: 0,
        paddingVertical: 4,
        fontWeight: '500',
    },
    dateTextInputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    dateInputIcon: {
        fontSize: 16,
        marginLeft: 8,
        color: '#6b7280',
    },
    dateErrorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
        marginLeft: 4,
    },
    dateFormatInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f0f9ff',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#0ea5e9',
        marginTop: 8,
    },
    dateFormatIcon: {
        fontSize: 14,
        marginRight: 8,
        marginTop: 1,
    },
    dateFormatText: {
        fontSize: 12,
        color: '#0369a1',
        flex: 1,
        lineHeight: 16,
    },

});