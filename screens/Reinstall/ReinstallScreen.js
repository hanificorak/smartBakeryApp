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

const { width, height } = Dimensions.get('window');

export default function ReinstallScreen({ navigation, setToken }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processStep, setProcessStep] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // Animasyonlar
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        // Sayfa yüklenirken animasyon
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animasyonu
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );
        pulseAnimation.start();

        return () => pulseAnimation.stop();
    }, []);

    const processSteps = [
        'Kullanıcı verileri temizleniyor...',
        'Cache dosyaları siliniyor...',
        'Uygulama ayarları sıfırlanıyor...',
        'Sistem dosyaları onarılıyor...',
        'Yeniden başlatılıyor...',
        'Tamamlandı!'
    ];

    const handleReinstall = async () => {
        setIsProcessing(true);
        setProcessStep(0);
        
        // Progress animasyonunu başlat
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 6000,
            useNativeDriver: false,
        }).start();

        // Adım adım işlemi simüle et
        for (let i = 0; i < processSteps.length; i++) {
            setProcessStep(i);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {

            const {data} = await api.post(Endpoint.ReinstallStart);
            if(data && data.status == false){
                
                Alert.alert('Uyarı','İşlem başarısız. Lütfen uygulamayı kapatıp açın.');
                return;
            }
            // Gerçek temizleme işlemleri
            await AsyncStorage.clear();
            
            // Token'ı temizle
            if (setToken) {
                setToken(null);
            }


            // İşlem tamamlandı
            setTimeout(() => {
                Alert.alert(
                    'Başarılı!',
                    'Uygulama başarıyla yeniden yüklendi. Giriş ekranına yönlendiriliyorsunuz.',
                    [
                        {
                            text: 'Tamam',
                            onPress: () => {
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                });
                            }
                        }
                    ]
                );
            }, 1000);
        } catch (error) {
            console.error('Yeniden yükleme hatası:', error);
            setIsProcessing(false);
            Alert.alert('Hata', 'Yeniden yükleme işlemi sırasında bir hata oluştu.');
        }
    };

    const showConfirmation = () => {
        setShowConfirmModal(true);
    };

    const confirmReinstall = () => {
        setShowConfirmModal(false);
        handleReinstall();
    };

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar 
                barStyle={isDark ? "light-content" : "dark-content"} 
                backgroundColor={isDark ? "#1a1a1a" : "#ffffff"} 
            />
            
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View 
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    {!isProcessing ? (
                        <>
                            {/* Ana İkon */}
                            <Animated.View 
                                style={[
                                    styles.iconContainer,
                                    { transform: [{ scale: pulseAnim }] }
                                ]}
                            >
                                <LinearGradient
                                    colors={isDark ? ['#ff6b6b', '#ee5a24'] : ['#4ecdc4', '#44a08d']}
                                    style={styles.iconGradient}
                                >
                                    <Text style={styles.iconText}>⟲</Text>
                                </LinearGradient>
                            </Animated.View>

                            {/* Başlık */}
                            <Text style={[styles.title, isDark && styles.titleDark]}>
                                Uygulama Yeniden Yükle
                            </Text>

                            {/* Açıklama */}
                            <Text style={[styles.description, isDark && styles.descriptionDark]}>
                                Bu işlem uygulamayı tamamen tamir edecek ve bugüne ait tüm verilerinizi temizleyecektir.
                            </Text>

                            {/* Uyarı Kutusu */}
                            <View style={[styles.warningBox, isDark && styles.warningBoxDark]}>
                                <Text style={styles.warningIcon}>⚠️</Text>
                                <Text style={[styles.warningText, isDark && styles.warningTextDark]}>
                                    • Tüm yerel veriler silinecek{'\n'}
                                    • Uygulama ayarları sıfırlanacak{'\n'}
                                    • Yeniden giriş yapmanız gerekecek
                                </Text>
                            </View>

                            {/* Başlat Butonu */}
                            <TouchableOpacity 
                                style={styles.startButton}
                                onPress={showConfirmation}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#ff6b6b', '#ee5a24']}
                                    style={styles.startButtonGradient}
                                >
                                    <Text style={styles.startButtonText}>İşlemi Başlat</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Geri Butonu */}
                            <TouchableOpacity 
                                style={[styles.backButton, isDark && styles.backButtonDark]}
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.backButtonText, isDark && styles.backButtonTextDark]}>
                                    İptal Et
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* İşlem Ekranı */}
                            <View style={styles.processingContainer}>
                                <View style={[styles.processingIconContainer, isDark && styles.processingIconContainerDark]}>
                                    <ActivityIndicator 
                                        size={80} 
                                        color={isDark ? "#ff6b6b" : "#4ecdc4"} 
                                    />
                                </View>

                                <Text style={[styles.processingTitle, isDark && styles.processingTitleDark]}>
                                    Uygulama Yeniden Yükleniyor
                                </Text>

                                <Text style={[styles.processingStep, isDark && styles.processingStepDark]}>
                                    {processSteps[processStep]}
                                </Text>

                                {/* Progress Bar */}
                                <View style={[styles.progressBarContainer, isDark && styles.progressBarContainerDark]}>
                                    <Animated.View 
                                        style={[
                                            styles.progressBar,
                                            {
                                                width: progressAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%']
                                                })
                                            }
                                        ]}
                                    />
                                </View>

                                <Text style={[styles.processingWarning, isDark && styles.processingWarningDark]}>
                                    Lütfen uygulamayı kapatmayınız
                                </Text>
                            </View>
                        </>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Onay Modal */}
            <Modal
                visible={showConfirmModal}
                transparent={true}
                animationType="fade"
                statusBarTranslucent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
                        <Text style={styles.modalIcon}>🔄</Text>
                        <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                            Emin misiniz?
                        </Text>
                        <Text style={[styles.modalDescription, isDark && styles.modalDescriptionDark]}>
                            Bu işlem geri alınamaz. Tüm verileriniz silinecek ve uygulamadan çıkış yapılacaktır.
                        </Text>
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowConfirmModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>İptal</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={confirmReinstall}
                            >
                                <Text style={styles.confirmButtonText}>Devam Et</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    containerDark: {
        backgroundColor: '#1a1a1a',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    // Ana Ekran Stilleri
    iconContainer: {
        marginBottom: 30,
    },
    iconGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    iconText: {
        fontSize: 50,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    titleDark: {
        color: '#ffffff',
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    descriptionDark: {
        color: '#cccccc',
    },
    warningBox: {
        backgroundColor: '#fff3cd',
        borderWidth: 1,
        borderColor: '#ffeaa7',
        borderRadius: 15,
        padding: 20,
        marginBottom: 40,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    warningBoxDark: {
        backgroundColor: '#2d2d30',
        borderColor: '#404040',
    },
    warningIcon: {
        fontSize: 24,
        marginRight: 15,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: '#856404',
        lineHeight: 22,
    },
    warningTextDark: {
        color: '#ffd93d',
    },
    startButton: {
        width: '100%',
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    startButtonGradient: {
        paddingVertical: 18,
        paddingHorizontal: 30,
        borderRadius: 12,
        alignItems: 'center',
    },
    startButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        backgroundColor: 'transparent',
    },
    backButtonDark: {
        borderColor: '#555',
    },
    backButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    backButtonTextDark: {
        color: '#cccccc',
    },

    // İşlem Ekranı Stilleri
    processingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    processingIconContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    processingIconContainerDark: {
        backgroundColor: '#2d2d30',
    },
    processingTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    processingTitleDark: {
        color: '#ffffff',
    },
    processingStep: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        minHeight: 20,
    },
    processingStepDark: {
        color: '#cccccc',
    },
    progressBarContainer: {
        width: width - 80,
        height: 8,
        backgroundColor: '#e9ecef',
        borderRadius: 4,
        marginBottom: 20,
        overflow: 'hidden',
    },
    progressBarContainerDark: {
        backgroundColor: '#404040',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4ecdc4',
        borderRadius: 4,
    },
    processingWarning: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    processingWarningDark: {
        color: '#aaaaaa',
    },

    // Modal Stilleri
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 30,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalContentDark: {
        backgroundColor: '#2d2d30',
    },
    modalIcon: {
        fontSize: 50,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalTitleDark: {
        color: '#ffffff',
    },
    modalDescription: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    modalDescriptionDark: {
        color: '#cccccc',
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 15,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    cancelButtonText: {
        color: '#6c757d',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        backgroundColor: '#dc3545',
    },
    confirmButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});