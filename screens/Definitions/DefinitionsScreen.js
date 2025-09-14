import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    StatusBar,
    Platform,
    ScrollView,
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    TextInput,
    Keyboard,
    TouchableWithoutFeedback,
    Modal as RNModal,
    FlatList,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';
import {
    Snackbar,
    ActivityIndicator,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import '../../src/i18n';
import ProductDef from './ProductDef';
import FreezerDefScreen from './FreezerDefScreen';

const { width, height } = Dimensions.get('window');

export default function DefinitionsScreen({ navigation, setToken }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const slideAnim = useRef(new Animated.Value(0)).current;

    const tabs = [
        { id: 0, title: 'Ürün Tanımı' },
        { id: 1, title: 'Buzdolabı Tanımı' }
    ];

    const handleTabPress = (tabIndex) => {
        setActiveTab(tabIndex);
        Animated.spring(slideAnim, {
            toValue: tabIndex * (width / 2),
            useNativeDriver: true,
            tension: 100,
            friction: 8,
        }).start();
    };

    const renderProductDefinition = () => (
        <ProductDef navigation={navigation} setToken={setToken} />
    );

    const renderFridgeDefinition = () => (
        <FreezerDefScreen navigation={navigation} setToken={setToken} />
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
            
            {/* Tab Bar */}
            <View style={styles.tabContainer}>
                <View style={styles.tabBar}>
                    <Animated.View 
                        style={[
                            styles.activeTabIndicator,
                            {
                                transform: [{ translateX: slideAnim }]
                            }
                        ]} 
                    />
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tab,
                                activeTab === tab.id && styles.activeTab
                            ]}
                            onPress={() => handleTabPress(tab.id)}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === tab.id && styles.activeTabText
                            ]}>
                                {tab.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Tab Content */}
            <View style={styles.contentWrapper}>
                {activeTab === 0 ? renderProductDefinition() : renderFridgeDefinition()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#2196F3',
        paddingVertical: 16,
        paddingHorizontal: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    tabContainer: {
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    tabBar: {
        flexDirection: 'row',
        position: 'relative',
        backgroundColor: '#fff',
    },
    activeTabIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        width: width / 2,
        backgroundColor: '#2196F3',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTab: {
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
    contentWrapper: {
        flex: 1,
    },
    tabContent: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        marginBottom: 16,
    },
    infoText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
});