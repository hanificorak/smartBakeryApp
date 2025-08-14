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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';

const AddEndOfDayScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [inputValues, setInputValues] = useState({});
    const [temp, setTemp] = useState('');
    const [tempCode, setTempCode] = useState('')


    useEffect(() => {
        getWeatherInfo();
        getEndOfListData()
    }, []);

    const getWeatherInfo = async () => {
        try {
            let location = await AsyncStorage.getItem('location');
            if (!location) return; // Konum aluyor yoksa işlem duruyor


            const loc_data = JSON.parse(location); // Konum bilgileri
            const latitude = loc_data.latitude;
            const longitude = loc_data.longitude;

            const weather_item = await AsyncStorage.getItem("weather_data"); // son hava durumu bilgi verisi
            if (weather_item == null) { // eğer hiç hava durumu bilgisi yok ise 
                getWeatherDataApi(latitude, longitude);
            } else {
                let weather_item_js = JSON.parse(weather_item);
                let weather_item_response = weather_item_js?.data?.data?.current_weather;

                setTemp(weather_item_response.temperature);
                setTempCode(weather_item_response.weathercode);
            }
        } catch (error) {
            console.log('Hava Durumu Hatası', error.message);
        }
    }

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
            if (response != null && response.data != null) {
                AsyncStorage.setItem('weather_data', JSON.stringify({ data: response, time: getTurkeyDate() }));
                const currentWeather = response?.data?.current_weather;

                setTemp(currentWeather.temperature);
                setTempCode(currentWeather.weathercode);
            } else {
                console.log('Hava Durumu API Hatası')
            }
        } catch (error) {
            console.log('Hava Durumu API Hatası Teknik', error.message)

        }
    }

    const getEndOfListData = async () => {
        try {
            const { data } = await api.post(Endpoint.EndOfDayListData);
            if (data && data.status) {
                let arr = [];
                for (let i = 0; i < data.obj.length; i++) {
                    const el = data.obj[i];
                    arr.push({
                        id: el.id,
                        name: el.product.name,
                        product_id: el.product_id,
                        amount: el.amount,
                        current: 0
                    })

                }
                setProducts(arr);
            }
        } catch (error) {
            console.log(error)
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

    const handleSave = async () => {
        try {
            // Girilen değerleri kontrol et
            console.log(products);
            return;
            const hasValues = Object.values(inputValues).some(value => value !== '');

            if (!hasValues) {
                Alert.alert('Uyarı', 'Lütfen en az bir ürün için değer girin.');
                return;
            }

            // Burada AsyncStorage'a kaydetme işlemi yapılacak
            const dataToSave = {
                date: new Date().toISOString(),
                products: products.map(product => ({
                    ...product,
                    inputValue: inputValues[product.id] || '0'
                }))
            };

            await AsyncStorage.setItem('endOfDayData', JSON.stringify(dataToSave));

            Alert.alert(
                'Başarılı',
                'Gün sonu verileri başarıyla kaydedildi.',
                [
                    {
                        text: 'Tamam',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Hata', 'Veriler kaydedilirken bir hata oluştu.');
        }
    };

    const renderProductItem = (product) => (
        <View key={product.id} style={styles.productCard}>
            <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.stockContainer}>
                        <Text style={styles.stockLabel}>Mevcut Stok:</Text>
                        <Text style={styles.stockValue}>{product.amount} adet</Text>
                    </View>
                </View>
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Yeni Miktar Girin:</Text>
                <TextInput
                    style={styles.numberInput}
                    value={product.current}
                    onChangeText={(value) => handleInputChange(product.id, value)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
            <LinearGradient
                colors={['#1e3a8a', '#3b82f6', '#06b6d4']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <View style={styles.headerTop}>
                            <Text style={styles.headerTitle}>Gün Sonu</Text>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSave}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#059669', '#10b981']}
                                    style={styles.saveButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.saveButtonText}>Kaydet</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <View style={{ flexDirection: 'row', padding: 10 }}>
                <View style={{ flex: 1, marginRight: 10, borderColor: '#004ad3ff', borderRadius: 10, borderWidth: 1, backgroundColor: '#0000ff5e', justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity style={{ padding: 10 }}>
                        <Text style={{ textAlign: 'center' }}>Hava Durumu: 13 C</Text>
                        <Text style={{ textAlign: 'center' }}>Açık (Clear)</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                    <TouchableOpacity style={{ padding: 10, backgroundColor: 'gray' }}>
                        <Text>13 C</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.contentContainer}>
                    <View style={styles.productsList}>
                        {products.map(product => renderProductItem(product))}
                    </View>
                </View>
            </ScrollView>
        </View>
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
        shadowColor: '#059669',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    saveButtonGradient: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    saveButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
        letterSpacing: 0.3,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    sectionHeader: {
        backgroundColor: '#ffffff',
        padding: 20,
        marginBottom: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        fontStyle: 'italic',
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
        shadowOffset: {
            width: 0,
            height: 2,
        },
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
});