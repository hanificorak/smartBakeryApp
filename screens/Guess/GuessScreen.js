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
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Button,
    ActivityIndicator,
    Card,
    Chip,
    Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';
import { useTranslation } from 'react-i18next';
import '../../src/i18n';
import axios from 'axios';

import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import { WebView } from "react-native-webview";
import PdfViewer from '../Reports/WebView';

const { height: screenHeight } = Dimensions.get('window');

const GuessScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [weatherData, setWeatherData] = useState({
        temperature: 24,
        condition: 'Açık (Clear)',
        conditionId: 1
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [temperatureModalVisible, setTemperatureModalVisible] = useState(false);
    const [tempInput, setTempInput] = useState('24');
    const [slideAnim] = useState(new Animated.Value(0));
    const [products, setProducts] = useState([]);
    const [weatherOptions, setWeatherOptions] = useState([]);
    const [calcModalVisible, setCalcModalVisible] = useState(false)
    const [wait_message, setWaitMessage] = useState('')
    const [detail_text, setDetailText] = useState('')
    const [mailModalVisible, setMailModalVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [printLoading, setPrintLoading] = useState(false);
    const [allVisible, setAllVisible] = useState(false);
    const [productionData, setProductionData] = useState([]);
    const [pdfPath, setPdfPath] = useState("");
    const [pdfView, setPdfView] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [pdfPrewLoading, setPdfPrewLoading] = useState(false);
    const [mailLoading, setMailLoading] = useState(false);

    useEffect(() => {
        getWeatherInfo();
        getProducts();
    }, []);

    // Hava durumu seçenekleri (ikon olmadan)



    const getProducts = async () => {
        const lang = await AsyncStorage.getItem('selected_lang');
        const { data } = await api.post(Endpoint.StockParams, { lang: lang });
        if (data && data.status) {
            let arr = data.obj.products;
            arr.unshift({ id: -99, name: t('common.all') });
            setProducts(arr);
            setWeatherOptions(data.obj.weather)
        }
    };


    const getWeatherInfo = async () => {
        try {
            let location = await AsyncStorage.getItem('location');
            if (location == null) {
                Alert.alert(t('warning'), t('guess.location_permission_warning'))
                return;
            }
            const loc_data = JSON.parse(location);
            const latitude = loc_data.latitude;
            const longitude = loc_data.longitude;

            const weather_item = await AsyncStorage.getItem("weather_data");

            if (weather_item == null) {
                getWeatherDataApi(latitude, longitude);
            } else {
                let weather_item_js = JSON.parse(weather_item);
                let weather_item_response = weather_item_js?.data?.data?.current_weather;

                let time = weather_item_js.time; // string tarih
                let date = new Date(time);       // Date nesnesine çevir
                let now = new Date();            // şu anki zaman
                let diffMs = now - date;


                let diffHours = diffMs / (1000 * 60 * 60);
                if (diffHours >= 2) {
                    getWeatherDataApi(latitude, longitude);
                } else {
                    setWdata(weather_item_response.temperature, weather_item_response.weathercode)
                }



            }
        } catch (error) {
            console.log('Hava Durumu Hatası', error.message);
        }
    };

    const getWeatherDataApi = async (latitude, longitude) => {
        try {
            const response = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
                params: {
                    latitude,
                    longitude,
                    current_weather: true,
                    timezone: 'Europe/Istanbul'
                }
            });

            if (response && response.data) {
                AsyncStorage.setItem('weather_data', JSON.stringify({ data: response, time: new Date().toISOString() }));
                const currentWeather = response?.data?.current_weather;
                setWdata(currentWeather.temperature, currentWeather.weathercode)
                console.log("apii", currentWeather.weathercode)
                console.log("currentWeather", currentWeather)
            } else {
                console.log('Hava Durumu API Hatası');
            }
        } catch (error) {
            console.log('Hava Durumu API Hatası Teknik', error.message);
        }
    };

    const setWdata = async (temp, condi, id = 1) => {
        const lang = await AsyncStorage.getItem('selected_lang');
        const { data } = await api.post(Endpoint.WeatherItem, { code: condi, lang: lang });
        if (data && data.status) {
            setWeatherData({
                temperature: temp,
                condition: data.obj.description,
                conditionId: id
            })
        }
    };

    const showModal = () => {
        setModalVisible(true);
    };

    const hideModal = () => {
        setModalVisible(false);
    };

    const showCalcModal = () => {
        setCalcModalVisible(true);
    };

    const hideCalcModal = () => {
        setCalcModalVisible(false);
    };

    const showTemperatureModal = () => {
        setTempInput(weatherData.temperature.toString());
        setTemperatureModalVisible(true);
    };

    const hideTemperatureModal = () => {
        setTemperatureModalVisible(false);
    };

    const updateTemperature = () => {
        const temp = parseInt(tempInput);
        if (!isNaN(temp) && temp >= -50 && temp <= 60) {
            setWeatherData(prev => ({
                ...prev,
                temperature: temp
            }));
            hideTemperatureModal();
        } else {
            Alert.alert(t('guess.error'), t('guess.invalid_temp'));
        }
    };

    const selectWeatherCondition = (condition) => {
        setWeatherData(prev => ({
            ...prev,
            condition: condition.description,
            conditionId: condition.id
        }));
        hideModal();
    };

    const handleProductPress = (product) => {
        if (product.id == -99) {
            allGuest();
            return;
        }
        Alert.alert(
            product.name,
            `${(product.short_desc == null ? '' : product.short_desc)}\n\n${t('guess.product_calc_confirm')}`,
            [
                { text: t('guess.cancel'), style: 'cancel' },
                { text: t('guess.continue'), onPress: () => calcDay(product) }
            ]
        );
    };

    const allGuest = async () => {
        const lang = await AsyncStorage.getItem('selected_lang');

        const { data } = await api.post(Endpoint.TotalGuessList, { lang: lang, weather: weatherData.conditionId });
        if (data && data.status) {
            console.log(data.obj)
            setProductionData(data.obj)
        }
        setAllVisible(true);

    };

    const sendMail = async (print = false, preview = false) => {
        setMailLoading(true);
        const lang = await AsyncStorage.getItem('selected_lang');
        const { data } = await api.post(Endpoint.GuessMail, { lang: lang, weather: weatherData.conditionId, email: email, print: (print ? 1 : 0), prev: (preview ? 1 : 0) });
        setMailLoading(false);

        if (data && data.status) {
            if (print) {
                printReportData(data.obj)
                setPrintLoading(false)
                return;
            }

            if (preview && print == false) {

                
                setPdfPath(data.sub_info);

                setPdfView(true);
                setPdfPrewLoading(false)
                return;
            }
            setMailModalVisible(false);
            Alert.alert(t('info'), t('guess.mail_success'));
        } else {
            Alert.alert(t('warning'), t('guess.operation_failed'));
        }
    };

    const downloadPdf = async (pdfUrl) => {
        try {
            const localPath = FileSystem.documentDirectory + "temp.pdf";
            await FileSystem.downloadAsync(pdfUrl, localPath);
            // setLocalUri(localPath);
            return localPath;
        } catch (e) {
            console.error("PDF indirme hatası", e);
        }
    };

    const calcDay = async (product) => {
        const lang = await AsyncStorage.getItem('selected_lang');
        const { data } = await api.post(Endpoint.GuessData, { weather_code: weatherData.conditionId, product_id: product.id, lang: lang });
        console.log(data)
        if (data && data.status) {
            setDetailText(t('guess.detail_text', { day: data.obj.day, weather: data.obj.weather, avgProduced: data.obj.average_produced, avgSold: data.obj.average_sold }))
            setWaitMessage(t('guess.wait_message', { suggested: data.obj.suggested_production }))
        } else {
            Alert.alert(t('warning'), t('guess.no_history'));
            return;
        }
        showCalcModal(true)
    };

    const print = async () => {
        setPrintLoading(true)
        sendMail(true, false)
    };

    const preview = async () => {
        setPdfPrewLoading(true);
        sendMail(false, true);

    };

    const closepdfModal = async () => {
        setPdfView(false)
    };

    async function printReportData(pdfUrl) {
        if (printing) return; // Zaten baskı işlemi varsa tekrar çağırma

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

            // Kullanıcı iptal ettiyse, bunu konsola hata olarak yazma
            if (error?.message?.includes("did not complete")) {
                console.log("Kullanıcı yazdırma ekranını iptal etti.");
                setPrinting(false); // Hata olsa da olmasa da printing durumunu sıfırla

            } else {
                setPrinting(false); // Hata olsa da olmasa da printing durumunu sıfırla

                console.error("PDF açılırken hata:", error);
            }
        } finally {

            setPrinting(false); // Hata olsa da olmasa da printing durumunu sıfırla
        }
    }



    const renderProductItem = ({ item, index }) => (
        <TouchableOpacity
            style={[
                styles.productCard,
                index % 2 === 0 ? styles.productCardLeft : styles.productCardRight
            ]}
            onPress={() => handleProductPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.productContent}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDescription}>{item.short_desc}</Text>
            </View>
        </TouchableOpacity>
    );

    const ProductCard = ({ item }) => (
        <View style={styles2.productCard}>
            <View style={styles2.productHeader}>
                <Text style={styles2.productName}>{item.prod_name}</Text>
            </View>
            <Text style={styles2.productDescription}>{item.msg}</Text>

        </View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
                            <Text style={styles.headerTitle}>{t('guess.title')}</Text>
                        </View>
                        <Text style={styles.headerSubtitle}>
                            {t('guess.subtitle')}
                        </Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Hava Durumu Alanı */}
            <View style={styles.weatherContainer}>
                <TouchableOpacity style={styles.weatherSection} onPress={showTemperatureModal}>
                    <Text style={styles.temperature}>{weatherData.temperature}°C</Text>
                    <Text style={styles.tempChangeText}>{t('guess.change_temp')}</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.weatherSection} onPress={showModal}>
                    <Text style={styles.condition}>{weatherData.condition}</Text>
                    <Text style={styles.conditionChangeText}>{t('guess.change_condition')}</Text>
                </TouchableOpacity>
            </View>


            <View style={{ marginLeft: 20, marginRight: 20, marginTop: 10 }}>
                <TouchableOpacity
                    style={{
                        padding: 10,
                        backgroundColor: '#667eea',
                        borderRadius: 10
                    }}
                    onPress={() => setMailModalVisible(true)}  // Modal açılır
                >
                    <Text style={{ color: 'white', textAlign: 'center' }}>{t('guess.send_mail')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        padding: 10,
                        backgroundColor: '#667eea',
                        borderRadius: 10,
                        marginTop: 10,
                    }}
                    onPress={() => print()}  // Modal açılır
                >
                    <Text style={{ color: 'white', textAlign: 'center' }}>{(printLoading ? t('print_loading') : t('print'))}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    disabled={pdfPrewLoading}
                    style={{
                        padding: 10,
                        backgroundColor: '#667eea',
                        borderRadius: 10,
                        marginTop: 10,
                    }}
                    onPress={() => preview()}  // Modal açılır
                >
                    <Text style={{ color: 'white', textAlign: 'center' }}>{(pdfPrewLoading ? t('report.loading') : t('report.pdf_preview'))}</Text>
                </TouchableOpacity>
            </View>

            {/* Ürün Listesi */}
            <View style={styles.productsContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('guess.select_products')}</Text>
                    <Text style={styles.sectionSubtitle}>{t('guess.select_product_sub')}</Text>
                </View>

                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderProductItem}
                    numColumns={2}
                    columnWrapperStyle={styles.productRow}
                    scrollEnabled={false}
                    contentContainerStyle={styles.productList}
                />
            </View>

            {/* Hava Durumu Seçim Modal */}
            <Modal
                transparent
                visible={modalVisible}
                onRequestClose={hideModal}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        onPress={hideModal}
                        activeOpacity={1}
                    />
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>{t('guess.select_weather')}</Text>

                        <FlatList
                            data={weatherOptions}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.optionItem,
                                        item.id === weatherData.conditionId && styles.selectedOption
                                    ]}
                                    onPress={() => selectWeatherCondition(item)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        item.id === weatherData.conditionId && styles.selectedOptionText
                                    ]}>
                                        {item.description}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Sıcaklık Değiştirme Modal */}
            <Modal
                transparent
                visible={temperatureModalVisible}
                onRequestClose={hideTemperatureModal}
                animationType="fade"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.tempModalOverlay}
                >
                    <View style={styles.tempModalContainer}>
                        <Text style={styles.tempModalTitle}>{t('guess.set_temperature')}</Text>
                        <TextInput
                            style={styles.tempInput}
                            value={tempInput}
                            onChangeText={setTempInput}
                            placeholder={t('guess.temperature_placeholder')}
                            keyboardType="numeric"
                            autoFocus
                            placeholderTextColor="#9ca3af"
                        />
                        <View style={styles.tempModalButtons}>
                            <TouchableOpacity
                                style={[styles.tempButton, styles.cancelButton]}
                                onPress={hideTemperatureModal}
                            >
                                <Text style={styles.cancelButtonText}>{t('guess.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tempButton, styles.confirmButton]}
                                onPress={updateTemperature}
                            >
                                <Text style={styles.confirmButtonText}>{t('guess.ok')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                transparent
                visible={calcModalVisible}
                onRequestClose={hideTemperatureModal}
                animationType="fade"
                statusBarTranslucent
            >
                <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalBackdrop}>
                        {/* Blur effect alternative - uncomment if you have blur library */}
                        {/* <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={10} /> */}

                        <Animated.View style={styles.modalContainer}>
                            {/* Header with icon */}
                            <View style={styles.modalHeader}>

                                <Text style={styles.modalTitle}>{t('guess.calc_title')}</Text>


                            </View>

                            {/* Content */}
                            <View style={styles.modalContent}>
                                {/* Product card */}


                                {/* Production recommendation */}
                                <View style={styles.recommendationCard}>
                                    <View style={styles.recommendationHeader}>
                                        <Text style={styles.recommendationIcon}>🎯</Text>
                                        <Text style={styles.recommendationTitle}>{t('guess.daily_recommendation')}</Text>
                                    </View>
                                    <Text style={styles.recommendationText}>
                                        {detail_text}
                                    </Text>

                                    <Text style={styles.wait_ok_count}>{wait_message}</Text>

                                    <View style={styles.progressBar}>
                                        <View style={styles.progressFill} />
                                    </View>
                                </View>
                            </View>

                            {/* Actions */}
                            <View style={styles.modalActions}>


                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={hideCalcModal}
                                >
                                    <Text style={styles.primaryButtonText}>{t('guess.got_it')}</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            <Modal
                transparent
                visible={mailModalVisible}
                onRequestClose={() => setMailModalVisible(false)}
                animationType="fade"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.centeredOverlay}
                >
                    <View style={styles.mailModalContainer}>
                        <Text style={styles.mailModalTitle}>{t('guess.enter_email')}</Text>

                        <TextInput
                            style={styles.mailInput}
                            value={email}
                            onChangeText={setEmail}
                            placeholder={t('guess.email_placeholder')}
                            keyboardType="email-address"
                            autoFocus
                            placeholderTextColor="#9ca3af"
                        />

                        <View style={styles.mailModalButtons}>
                            <TouchableOpacity
                                style={[styles.mailButton, styles.cancelButton]}
                                onPress={() => setMailModalVisible(false)}
                            >
                                <Text style={styles.cancelText}>{t('guess.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.mailButton, styles.sendButton]}
                                disabled={mailLoading}
                                onPress={() => {
                                    if (!email.includes('@')) {
                                        Alert.alert(t('guess.error'), t('guess.invalid_email'));
                                        return;
                                    }

                                    sendMail();
                                }}
                            >
                                <Text style={styles.sendText}>{(mailLoading ? t('common.sending') : t('guess.send'))}</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                transparent
                visible={allVisible}
                onRequestClose={() => setAllVisible(false)}
                animationType="fade"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles2.centeredOverlay}
                >
                    <View style={styles2.modalContainer}>
                        {/* Header */}
                        <View style={styles2.modalHeader}>
                            <View style={styles2.headerContent}>
                                <Text style={styles2.modalTitle}>{t('common.all')}</Text>
                                <Text style={styles2.modalSubtitle}>
                                    {productionData.length}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles2.closeButton}
                                onPress={() => setAllVisible(false)}
                            >
                                <Text style={styles2.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Product List */}
                        <ScrollView
                            style={styles2.listContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            {productionData.map((item, index) => (
                                <ProductCard key={index} item={item} />
                            ))}
                        </ScrollView>


                    </View>
                </KeyboardAvoidingView>
            </Modal>


            <Modal
                transparent
                visible={pdfView}
                onRequestClose={() => setPdfView(false)}
                animationType="fade"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles2.centeredOverlay}
                >
                    <View style={styles2.modalContainer}>
                        {/* Header */}
                        <View style={styles2.modalHeader}>
                            <View style={styles2.headerContent}>
                                <Text style={styles2.modalTitle}>{t('report.pdf_preview')}</Text>

                            </View>
                            <TouchableOpacity
                                style={styles2.closeButton}
                                onPress={() => closepdfModal()}
                            >
                                <Text style={styles2.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Product List */}
                        <View
                            style={styles2.listContainer}

                        >
                            {pdfView && <PdfViewer key={pdfPath} pdfUrl={pdfPath} />}



                        </View>


                    </View>
                </KeyboardAvoidingView>
            </Modal>



        </ScrollView>
    );
};

export default GuessScreen;

const styles = StyleSheet.create({

    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        width: '100%',
        maxWidth: 360,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 20,
        },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 15,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 5,
        paddingTop: 30,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    centeredOverlay: {
        flex: 1,
        justifyContent: 'center', // dikey ortala
        alignItems: 'center',     // yatay ortala
        backgroundColor: 'rgba(0,0,0,0.5)', // arka plan karartma
    },
    mailModalContainer: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 5,
    },
    mailModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'center',
        color: '#111827',
    },
    mailInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 20,
        color: '#111827',
    },
    mailModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    mailButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
    },
    sendButton: {
        backgroundColor: '#3b82f6',
    },
    cancelText: {
        color: '#374151',
        fontWeight: '600',
    },
    sendText: {
        color: '#fff',
        fontWeight: '600',
    },
    modalTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',

    },

    modalContent: {
        padding: 20,
        paddingLeft: 0,
        paddingRight: 0,

    },
    productCard: {
        backgroundColor: '#F8F9FF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E8EAFF',
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    productBadge: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    productCode: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    recommendationCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    recommendationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    recommendationIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    recommendationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#15803D',
    },
    recommendationText: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
        marginBottom: 5,
    },
    highlightNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#059669',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        width: '75%',
        backgroundColor: '#10B981',
        borderRadius: 3,
    },
    modalActions: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 8,
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    primaryButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },

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
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
    },
    modalBody: {
        flex: 1,
        padding: 20,
    },
    headerSubtitle: {
        color: '#e2e8f0',
        fontSize: 16,
        marginTop: 5,
    },
    // Hava Durumu Stilleri
    weatherContainer: {
        marginHorizontal: 20,
        marginTop: 15,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    weatherSection: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 8,
    },
    temperature: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    condition: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
        textAlign: 'center',
    },
    tempChangeText: {
        fontSize: 12,
        color: '#3b82f6',
        fontWeight: '500',
    },
    conditionChangeText: {
        fontSize: 12,
        color: '#3b82f6',
        fontWeight: '500',
    },
    // Ürün Listesi Stilleri
    productsContainer: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 70,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#64748b',
    },
    productList: {
        paddingBottom: 10,
    },
    productRow: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    productCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        width: '48%',
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    productCardLeft: {
        marginRight: 4,
    },
    productCardRight: {
        marginLeft: 4,
    },
    productContent: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
        lineHeight: 20,
    },
    productDescription: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
    },
    // Modal Stilleri
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalBackdrop: {
        flex: 1,
    },
    modalContainer: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 30,
        maxHeight: screenHeight * 0.6,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    wait_ok_count: {
        marginTop: 10,
        marginBottom: 15,
        fontSize: 17,
        textAlign: 'center',
        color: '#15803D',
        fontWeight: 'bold'
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 20,
        textAlign: 'center',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#f8fafc',
    },
    selectedOption: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    optionText: {
        fontSize: 16,
        color: '#1e293b',
    },
    selectedOptionText: {
        color: '#3b82f6',
        fontWeight: '500',
    },
    // Sıcaklık Modal Stilleri
    tempModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tempModalContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        maxWidth: 300,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    tempModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 20,
        textAlign: 'center',
    },
    tempInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#1e293b',
        backgroundColor: '#ffffff',
    },
    tempModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    tempButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
        marginRight: 8,
    },
    confirmButton: {
        backgroundColor: '#3b82f6',
        marginLeft: 8,
    },
    cancelButtonText: {
        color: '#374151',
        fontWeight: '500',
    },
    confirmButtonText: {
        color: '#ffffff',
        fontWeight: '500',
    },
});

const styles2 = StyleSheet.create({
    centeredOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '100%',
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 25,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fafafa',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    headerContent: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ecf0f1',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
    },
    closeButtonText: {
        fontSize: 18,
        color: '#7f8c8d',
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 16,
        height: 450
    },
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e8e8e8',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        flex: 1,
        marginRight: 12,
        lineHeight: 24,
    },
    statusBadge: {
        backgroundColor: '#27ae60',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    productDescription: {
        fontSize: 15,
        color: '#7f8c8d',
        lineHeight: 22,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f8f9fa',
    },
    productId: {
        fontSize: 14,
        color: '#95a5a6',
        fontWeight: '600',
    },
    detailButton: {
        backgroundColor: '#3498db',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    detailButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fafafa',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    addButton: {
        backgroundColor: '#2ecc71',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#2ecc71',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});