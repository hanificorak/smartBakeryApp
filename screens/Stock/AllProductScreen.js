import React, {useState, useCallback} from 'react';
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
    FlatList,
    Alert,
    SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../tools/api';
import { ActivityIndicator } from 'react-native-paper';
import { useTranslation } from "react-i18next";
import "../../src/i18n";
import endpoint from "../../tools/endpoint";
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function AllStockScreen({ navigation }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    const updateQuantity = (id, value) => {
        const numValue = value === '' ? 0 : parseInt(value) || 0;
        setProducts(products.map(product =>
            product.id === id ? { ...product, quantity: numValue } : product
        ));
    };

    const getAllProducts = async () => {
        const {data} = await api.post(endpoint.AllProductData);
        if(data && data.status) {
            setProducts(data.obj)
        }
    };

    const handleSave = async () => {
        setLoading(true);
        const {data} = await api.post(endpoint.AllProductSave,{data:products});
        setLoading(false);
        if(data && data.status) {
            navigation.replace('StockScreen')
            Alert.alert(t('info'), t('last_stock.added'));
        }else{
            Alert.alert(t('warning'), t('app_error'));
        }
    };

    useFocusEffect(
        useCallback(() => {
            getAllProducts();
        }, [])
    );

    const renderProduct = ({ item }) => (
        <View style={styles.productCard}>
            <LinearGradient
                colors={['#ffffff', '#fafafa']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={{marginBottom:7,fontSize:10}}>
                    {t('all_products.last_day_sales')}: {item.last_quantity}
                </Text>
                <View style={styles.quantitySection}>
                    <TextInput
                        style={styles.quantityInput}
                        value={item.quantity.toString()}
                        onChangeText={(text) => updateQuantity(item.id, text)}
                        keyboardType="numeric"
                        placeholder={t('all_products.placeholder')}
                        placeholderTextColor="#cbd5e1"
                        selectTextOnFocus
                    />
                </View>
            </LinearGradient>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('all_products.title')}</Text>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#3b82f6', '#2563eb']}
                            style={styles.saveButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                                <Text style={styles.saveButtonText}>{t('all_products.save')}</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Products List */}
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    keyboardView: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        paddingTop: Platform.OS === 'ios' ? 10 : 18,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    headerTitle: { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
    saveButton: { borderRadius: 12, overflow: 'hidden', elevation: 3 },
    saveButtonGradient: { paddingHorizontal: 24, paddingVertical: 12 },
    saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
    listContent: { padding: 12, paddingBottom: 30 },
    row: { justifyContent: 'space-between' },
    productCard: {
        width: (width - 36) / 2,
        marginBottom: 12,
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    cardGradient: { padding: 18 },
    productName: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 0 },
    quantitySection: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    quantityInput: {
        fontSize: 32,
        fontWeight: '700',
        color: '#3b82f6',
        textAlign: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
});
