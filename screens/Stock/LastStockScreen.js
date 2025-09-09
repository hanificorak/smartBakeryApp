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

export default function LastStockScreen({ navigation, setToken }) {
    const { t, i18n } = useTranslation();

    const [productionData, setProductionData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [weatherData, setWeatherData] = useState({
        temperature: '24',
        condition: 'Açık'
    });
    const [quantities, setQuantities] = useState({});
    const [deferredItems, setDeferredItems] = useState(new Set());

    useEffect(() => {
        fetchDailyProduction();
    }, []);

    const fetchDailyProduction = async () => {
        setLoading(true);
        try {

            const { data } = await api.post(Endpoint.LastStockData);
            console.log(data)
            if (data && data.status) {
                const dt = [];
                for (let i = 0; i < data.obj.length; i++) {
                    const el = data.obj[i];
                    dt.push({
                        id: el.product_id,
                        name: el.product.name,
                        amount: el.amount,
                        current: el.amount.toString()
                    })
                }
                setProductionData(dt)
            }

        } catch (error) {
            console.log(error)
            Alert.alert('Hata', 'Veriler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (productId, quantity) => {
        setProductionData(prevData =>
            prevData.map(item =>
                item.id === productId ? { ...item, current: quantity } : item
            )
        );

    };

    const handleSave = async () => {
        const { data } = await api.post(Endpoint.LastStockSave, { data: productionData });
        if (data && data.status) {
            navigation.replace('StockScreen')
            Alert.alert(t('info'), t('last_stock.added'));
        } else {
            Alert.alert('Uyarı', 'İşlem başarısız.');
        }
    };

    const renderProductItem = ({ item }) => (
        <View style={styles.productCard}>
            <View style={styles.productHeader}>
                <Text style={styles.productName}>{item.name}</Text>
            </View>

            <View style={styles.stockInfo}>
                <Text style={styles.stockLabel}>{t('last_stock.amount')}:</Text>
                <Text style={styles.stockValue}>{item.amount} {t('stock.unit')}</Text>
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>{t('last_stock.now_amount')}:</Text>
                <TextInput
                    style={styles.quantityInput}
                    value={item.current ? String(item.current) : ""}  // string'e çevir
                    onChangeText={(text) => handleQuantityChange(item.id, text)}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#5468ff" />

            {/* Title Bar */}
            <LinearGradient
                colors={['#5468ff', '#4c63d2']}
                style={styles.titleBar}
            >
                <Text style={styles.titleText}>{t('last_stock.title')}</Text>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>{t('save')}</Text>
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Weather Info */}


                {/* Products List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#5468ff" />
                    </View>
                ) : (
                    <FlatList
                        data={productionData}
                        renderItem={renderProductItem}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        marginRight: 16,
    },
    backButtonText: {
        fontSize: 16,
        color: '#5468ff',
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        textAlign: 'center',
        marginRight: 60,
    },
    titleBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    titleText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    saveButton: {
        backgroundColor: '#ff6b35',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        marginBottom:40

    },
    weatherCard: {
        backgroundColor: '#e8f0ff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
    },
    weatherTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5468ff',
        marginBottom: 4,
    },
    weatherCondition: {
        fontSize: 14,
        color: '#666',
    },
    productCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#5468ff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    productHeader: {
        marginBottom: 12,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    stockInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    stockLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    stockValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5468ff',
    },
    inputSection: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    quantityInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        textAlign: 'center',
    },
    deferSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    deferToggle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ddd',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deferToggleActive: {
        borderColor: '#5468ff',
        backgroundColor: '#5468ff',
    },
    deferToggleInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'white',
    },
    deferText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    productionDate: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
});