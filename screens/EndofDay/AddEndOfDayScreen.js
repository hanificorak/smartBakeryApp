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
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    FlatList,
    Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';
import { Modal, Portal, Provider, Button, ActivityIndicator, Checkbox } from 'react-native-paper';
import axios from 'axios';
import { useTranslation } from "react-i18next";
import "../../src/i18n";

const AddEndOfDayScreen = ({ navigation }) => {
      const { t, i18n } = useTranslation();
    
    const [products, setProducts] = useState([]);
    const [inputValues, setInputValues] = useState({});
    const [temp, setTemp] = useState('');
    const [tempCode, setTempCode] = useState('');
    const [weatherModalVisible, setWeatherModalVisible] = useState(false);

    const [selectedWeathers, setSelectedWeathers] = useState('');
    const [weathers, setWeathers] = useState([]);
    const [showWeatherDropdown, setShowWeatherDropdown] = useState(false);

    const [saveLoading, setSaveLoading] = useState(false);
    const [loading, setLoading] = useState(false);



    useEffect(() => {
        getWeatherInfo();
        getEndOfListData();
        getParam();
    }, []);

    const getParam = async () => {
        try {
            const { data } = await api.post(Endpoint.StockParams);
            setWeathers(data.obj.weather);
        } catch (error) {
            console.error('Veriler yüklenirken hata:', error);
        }
    };


    const getWeatherInfo = async () => {
        try {
            let location = await AsyncStorage.getItem('location');
            if (!location) return;

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

                // milisaniyeyi saate çevir
                let diffHours = diffMs / (1000 * 60 * 60);

                if (diffHours >= 2) {
                    getWeatherDataApi(latitude, longitude);
                } else {
                    setTemp(weather_item_response.temperature);
                    setTempCode(weather_item_response.weathercode);
                    getWeatherCodeItem(weather_item_response.weathercode);
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

                setTemp(currentWeather.temperature);
                setTempCode(currentWeather.weathercode);
                getWeatherCodeItem(currentWeather.weathercode);
            } else {
                console.log('Hava Durumu API Hatası');
            }
        } catch (error) {
            console.log('Hava Durumu API Hatası Teknik', error.message);
        }
    };

    const getWeatherCodeItem = async (code) => {
        try {
            const { data } = await api.post(Endpoint.WeatherItem, { code: code });
            if (data && data.status) {
                setSelectedWeathers(data.obj)
            }
        } catch (error) {
            console.log('Hava Durumu Veri Bilgisi', error.message);
        }
    };

    const getEndOfListData = async () => {
        try {
            setLoading(true);
            const { data } = await api.post(Endpoint.EndOfDayListData);
            setLoading(false);

            if (data && data.status) {
                let arr = data.obj.map(el => ({
                    id: el.id,
                    name: el.product.name,
                    product_id: el.product_id,
                    amount: el.amount,
                    ert_status: false,
                    current: 0,
                    parentdate: el.parentdate
                }));
                setProducts(arr);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleInputChange = (productId, value) => {
        let numericValue = value.replace(/[^0-9]/g, '');
        setProducts(prevProducts =>
            prevProducts.map(product => {
                if (product.id === productId) {
                    const maxAllowed = product.amount;
                    const finalValue = Math.min(Number(numericValue), maxAllowed);
                    return { ...product, current: String(finalValue) };
                }
                return product;
            })
        );
    };

    const handleCarryOverChange = (productId, value) => {
        setProducts(prevProducts =>
            prevProducts.map(product => {
                if (product.id === productId) {
                    return { ...product, ert_status: value };
                }
                return product;
            })
        );
    };

    const handleSave = async () => {
        try {

            if (products.length == 0) {
                Alert.alert('Uyarı', 'Bugüne ait stok kaydı mevcut değil.');
                return;
            }
            setSaveLoading(true);

            const { data } = await api.post(Endpoint.EndOfDayAdd, { data: products, weather_temp: temp, weather_temp_code: selectedWeathers.id });

            setSaveLoading(false);

            if (data && data.status) {
                navigation.replace('EndofDayScreen');
                Alert.alert('Bilgi', 'Kayıt işlemi başarıyla gerçekleşti.');
            } else {
                Alert.alert('Uyarı', 'İşlem başarısız');
            }

            // const dataToSave = {
            //     date: new Date().toISOString(),
            //     products: products.map(product => ({
            //         ...product,
            //         inputValue: inputValues[product.id] || '0'
            //     }))
            // };

            // await AsyncStorage.setItem('endOfDayData', JSON.stringify(dataToSave));

            // Alert.alert(
            //     'Başarılı',
            //     'Gün sonu verileri başarıyla kaydedildi.',
            //     [{ text: 'Tamam', onPress: () => navigation.goBack() }]
            // );
        } catch (error) {
            console.log(error.message)
            Alert.alert('Hata', 'Veriler kaydedilirken bir hata oluştu.');
        }
    };

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


    const renderProductItem = (product) => (
        <View key={product.id} style={styles.productCard}>
            <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.stockContainer}>
                        <Text style={styles.stockLabel}>{t('endof.current_amount')}:</Text>
                        <Text style={styles.stockValue}>{product.amount} {t('stock.unit')}</Text>
                    </View>

                </View>
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>{t('endof.new_amount_input')}</Text>

                <TextInput
                    style={styles.numberInput}
                    value={product.current}
                    onChangeText={(value) => handleInputChange(product.id, value)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                />

                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>{t('endof.ert_text_sw')}</Text>
                    <Switch
                        style={{ marginTop: 6 }}
                        value={product.ert_status} // her ürün için state’de tut
                        onValueChange={(value) => handleCarryOverChange(product.id, value)}
                    />
                </View>
                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>{t('endof.urt_date')}</Text>
                    <Text> {product.parentdate}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <Provider>
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
                                <Text style={styles.headerTitle}>{t('endof.add_title')} </Text>
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    disabled={saveLoading}
                                    onPress={handleSave}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#FF6A00', '#FF8E53']} // turuncu → şeftali
                                        style={styles.saveButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.saveButtonText}>{(saveLoading ? t('saving') : t('save'))}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                <View style={{ padding: 10 }}>
                    <TouchableOpacity
                        onPress={() => setWeatherModalVisible(true)}
                        style={{
                            marginRight: 10,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#d0d7ff',
                            backgroundColor: '#f0f4ff',
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 3,
                            padding: 16
                        }}
                    >
                        <Text style={{
                            textAlign: 'center',
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#0033cc'
                        }}>
                            Hava Durumu: {temp}°C
                        </Text>
                        <Text style={{
                            textAlign: 'center',
                            fontSize: 14,
                            color: '#333'
                        }}>
                            {selectedWeathers.description}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.contentContainer}>
                        <View style={styles.productsList}>
                            {(loading ?
                                <View style={styles.loadingContainer}>
                                    <View style={styles.loadingCard}>
                                        <ActivityIndicator size="large" color="#667eea" />
                                        <Text style={styles.loadingText}>{t('loading')}</Text>
                                        <Text style={styles.loadingSubtext}>{t('loading')}</Text>
                                    </View>
                                </View> : (products.length > 0 ? products.map(product => renderProductItem(product)) :


                                    <View style={styles.emptyState}>
                                        <View style={styles.emptyStateCard}>
                                            <Text style={styles.emptyIcon}>📦</Text>
                                            <Text style={styles.emptyTitle}>{t('no_record')}</Text>
                                            <Text style={styles.emptySubtitle}>{t('no_record')}</Text>
                                        </View>
                                    </View>
                                ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Modal */}
                <Portal>
                    <Modal
                        visible={weatherModalVisible}
                        onDismiss={() => setWeatherModalVisible(false)}
                        contentContainerStyle={{
                            backgroundColor: 'white',
                            padding: 20,
                            marginHorizontal: 20,
                            borderRadius: 16
                        }}
                    >
                        <View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{t('endof.weather')}</Text>
                                <TouchableOpacity
                                    style={[styles.dropdownButton, selectedWeathers && styles.dropdownButtonSelected]}
                                    onPress={() => setShowWeatherDropdown(!showWeatherDropdown)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.dropdownButtonText, !selectedWeathers && styles.placeholder]}>
                                        {selectedWeathers.description || t('endof.weather_select')}
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
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{t('endof.temp')} (°C)</Text>
                                <TextInput
                                    style={[styles.textInput, temp && styles.textInputFilled]}
                                    value={temp?.toString() || ""}
                                    onChangeText={setTemp}
                                    keyboardType="numeric"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>
                        <Button mode="contained" onPress={() => setWeatherModalVisible(false)}>
                            {t('close')}
                        </Button>
                    </Modal>
                </Portal>
            </View>
        </Provider>
    );
};

export default AddEndOfDayScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingBottom: 15,
    },
    headerContent: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingTop: 15,
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
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    productsList: {
        gap: 16,
    },
    productCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    productHeader: {
        marginBottom: 16,
    },
    productInfo: {
        flex: 1,
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
    productName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    stockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    stockLabel: {
        fontSize: 12,
        color: '#64748b',
        marginRight: 6,
    },
    stockValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3b82f6',
    },
    inputSection: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#475569',
        marginBottom: 8,
    },
    numberInput: {
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1e293b',
        textAlign: 'center',
        fontWeight: '600',
    },
    inputGroup: {
        gap: 8,
        marginBottom: 15
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        letterSpacing: 0.2,
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
    switchContainer: {
        marginTop: 10,
    },
    switchLabel: {
        fontSize: 14,
        marginRight: 8,
        marginTop: 10,
        color: "#475569",
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
        flex: 1,
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
    dropdownList: {
        maxHeight: 200,
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100
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
});
