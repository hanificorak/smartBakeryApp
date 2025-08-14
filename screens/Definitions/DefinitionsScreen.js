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

const { width, height } = Dimensions.get('window');

export default function DefinitionsScreen({ navigation, setToken }) {
    const [definitions, setDefinitions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [snackVisible, setSnackVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDefinition, setSelectedDefinition] = useState(null);
    const [snackMessage, setSnackMessage] = useState('İşlem başarıyla tamamlandı!');
    const [newDefinition, setNewDefinition] = useState({
        id: null,
        productName: '',
        shortDescription: '',
        description: ''
    });

    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useFocusEffect(
        useCallback(() => {
            getProducts();
        }, [])
    );

    const getProducts = async () => {
        setLoading(true);
        try {
            const { data } = await api.post(Endpoint.ProductList);
            if (data && data.status) {
                setDefinitions(data.obj);
                // Animate list appearance
                Animated.stagger(100,
                    data.obj.map((_, index) =>
                        Animated.timing(new Animated.Value(0), {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        })
                    )
                ).start();
            } else {
                showSnack('Veriler yüklenirken hata oluştu', 'error');
            }
        } catch (error) {
            showSnack('Bağlantı hatası', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getProducts();
    }, []);

    const showSnack = (message) => {
        setSnackMessage(message);
        setSnackVisible(true);
    };

    const openModal = (definition = null) => {
        console.log('openModal called with:', definition); // Debug log

        if (definition) {
            setNewDefinition({
                id: definition.id,
                productName: definition.name,
                shortDescription: definition.short_desc || '',
                description: definition.desc || ''
            });
        } else {
            setNewDefinition({ id: null, productName: '', shortDescription: '', description: '' });
        }

        setModalVisible(true);

        // Enhanced modal animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            })
        ]).start();
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start(() => {
            setModalVisible(false);
            setNewDefinition({ id: null, productName: '', shortDescription: '', description: '' });
        });
        Keyboard.dismiss();
    };

    const saveDefinition = async () => {
        if (!newDefinition.productName.trim()) {
            Alert.alert('Hata', 'Ürün adı zorunludur.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post(Endpoint.AddProduct, {
                name: newDefinition.productName,
                shortDesc: newDefinition.shortDescription,
                desc: newDefinition.description,
                id: newDefinition.id
            });
            if (data && data.status) {
                showSnack(newDefinition.id ? 'Ürün başarıyla güncellendi' : 'Ürün başarıyla eklendi');
                closeModal();
                getProducts();
            } else showSnack('İşlem başarısız', 'error');
        } catch (error) {
            showSnack('Bir hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const deleteDefinition = (id) => {
        Alert.alert(
            'Silme Onayı',
            'Bu tanımı silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { data } = await api.post(Endpoint.ProductDelete, { id: id });
                            if (data && data.status) showSnack('Tanım silindi', 'success');
                            else showSnack('İşlem başarısız', 'error');
                            getProducts();
                        } catch (error) {
                            showSnack('Silme işlemi başarısız', 'error');
                        }
                    }
                }
            ]
        );
    };

    const filteredDefinitions = definitions.filter(item =>
        (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.short_desc || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.desc || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderDefinitionCard = ({ item, index }) => (
        <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => { }}
            style={styles.touchableCard}
        >
            <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.gradientCard}
            >
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.cardTitle} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>Aktif</Text>
                            </View>
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => {
                                    console.log('Edit button pressed for:', item.name); // Debug log
                                    openModal(item);
                                }}
                            >
                                <Text style={styles.actionButtonText}>✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => deleteDefinition(item.id)}
                            >
                                <Text style={styles.actionButtonText}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={styles.shortDesc} numberOfLines={2}>
                        {item.short_desc || 'Kısa açıklama yok'}
                    </Text>
                    <View style={styles.cardFooter}>
                        <View style={styles.tagContainer}>
                            <Text style={styles.tag}>#{item.id}</Text>
                        </View>
                        <Text style={styles.dateText}>Güncellendi: Bugün</Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateEmoji}>📋</Text>
            <Text style={styles.emptyStateTitle}>Henüz ürün yok</Text>
            <Text style={styles.emptyStateSubtitle}>
                İlk ürününüzü ekleyerek başlayın
            </Text>
            <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => openModal()}
            >
                <Text style={styles.emptyStateButtonText}>+ İlk Ürünü Ekle</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#667eea" />

            {/* Modern Header */}
            <LinearGradient
                colors={['#1e3a8a', '#3b82f6', '#06b6d4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.title}>Ürün Yönetimi</Text>
                            <Text style={styles.subtitle}>
                                {definitions.length} ürün • {filteredDefinitions.length} gösteriliyor
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.modernAddButton}
                            onPress={() => {
                                console.log('Add button pressed'); // Debug log
                                openModal();
                            }}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#059669', '#10b981']}
                                style={styles.addButtonGradient}
                            >
                                <Text style={styles.addButtonText}>+</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Modern Search Bar */}
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchBar}
                            placeholder="Ürün ara..."
                            onChangeText={setSearchQuery}
                            value={searchQuery}
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>
            </LinearGradient>

            {/* Content Area */}
            <View style={styles.contentArea}>
                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#667eea" />
                        <Text style={styles.loadingText}>Yükleniyor...</Text>
                    </View>
                ) : filteredDefinitions.length > 0 ? (
                    <FlatList
                        data={filteredDefinitions}
                        renderItem={renderDefinitionCard}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#667eea']}
                                tintColor="#667eea"
                            />
                        }
                    />
                ) : (
                    renderEmptyState()
                )}
            </View>

            {/* Fixed Modal */}
            <RNModal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.fixedModalOverlay}>
                        {/* Background Overlay */}
                        <TouchableOpacity
                            style={styles.modalBackgroundTouch}
                            onPress={closeModal}
                            activeOpacity={1}
                        />

                        {/* Modal Content */}
                        <View style={styles.fixedModalContent}>
                            {/* Header */}
                            <View style={styles.fixedModalHeader}>
                                <Text style={styles.fixedModalTitle}>
                                    {newDefinition.id ? 'Ürün Güncelle' : 'Yeni Ürün Ekle'}
                                </Text>
                                <TouchableOpacity
                                    style={styles.fixedCloseButton}
                                    onPress={closeModal}
                                >
                                    <Text style={styles.fixedCloseButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Form Content */}
                            <ScrollView
                                style={styles.fixedModalScroll}
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.fixedInputContainer}>
                                    <Text style={styles.fixedInputLabel}>Ürün Adı *</Text>
                                    <TextInput
                                        style={styles.fixedInput}
                                        placeholder="Ürün adını giriniz"
                                        value={newDefinition.productName}
                                        onChangeText={text => setNewDefinition({ ...newDefinition, productName: text })}
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.fixedInputContainer}>
                                    <Text style={styles.fixedInputLabel}>Kısa Açıklama</Text>
                                    <TextInput
                                        style={styles.fixedInput}
                                        placeholder="Kısa bir açıklama yazın"
                                        value={newDefinition.shortDescription}
                                        onChangeText={text => setNewDefinition({ ...newDefinition, shortDescription: text })}
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.fixedInputContainer}>
                                    <Text style={styles.fixedInputLabel}>Detaylı Açıklama</Text>
                                    <TextInput
                                        style={[styles.fixedInput, { height: 100 }]}
                                        placeholder="Ürün hakkında detaylı bilgi verin"
                                        value={newDefinition.description}
                                        onChangeText={text => setNewDefinition({ ...newDefinition, description: text })}
                                        multiline
                                        textAlignVertical="top"
                                        placeholderTextColor="#999"
                                    />
                                </View>
                            </ScrollView>

                            {/* Action Buttons */}
                            <View style={styles.fixedModalActions}>
                                <TouchableOpacity
                                    style={styles.fixedCancelButton}
                                    onPress={closeModal}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.fixedCancelButtonText}>İptal</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.fixedSaveButton}
                                    onPress={saveDefinition}
                                    activeOpacity={0.8}
                                    disabled={loading}
                                >
                                    <LinearGradient
                                        colors={['#667eea', '#764ba2']}
                                        style={styles.fixedSaveButtonGradient}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <Text style={styles.fixedSaveButtonText}>
                                                {newDefinition.id ? 'Güncelle' : 'Kaydet'}
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </RNModal>

            {/* Enhanced Snackbar */}
            <Snackbar
                visible={snackVisible}
                onDismiss={() => setSnackVisible(false)}
                duration={3000}
                style={styles.modernSnackbar}
                action={{
                    label: 'Tamam',
                    onPress: () => setSnackVisible(false),
                    labelStyle: { color: '#fff' }
                }}
            >
                <Text style={styles.snackbarText}>{snackMessage}</Text>
            </Snackbar>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa'
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 4,
    },
    modernAddButton: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    addButtonGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    searchContainer: {
        marginTop: 10,
    },
    searchBar: {
        height: 50,
        backgroundColor: 'white',
        borderRadius: 25,
        paddingHorizontal: 20,
        fontSize: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    contentArea: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    cardContainer: {
        marginBottom: 16,
    },
    touchableCard: {
        borderRadius: 16,
        marginTop: 10,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 4.65,
    },
    gradientCard: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    titleContainer: {
        flex: 1,
        marginRight: 15,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 4,
    },
    statusBadge: {
        backgroundColor: '#e8f5e8',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusText: {
        color: '#2e7d32',
        fontSize: 10,
        fontWeight: '600',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    deleteButton: {
        backgroundColor: '#ffebee',
    },
    actionButtonText: {
        fontSize: 16,
    },
    shortDesc: {
        fontSize: 14,
        color: '#7f8c8d',
        lineHeight: 20,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    tagContainer: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    tag: {
        color: '#1976d2',
        fontSize: 10,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 10,
        color: '#bdc3c7',
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyStateEmoji: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyStateTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateSubtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    emptyStateButton: {
        backgroundColor: '#667eea',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 4,
    },
    emptyStateButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#7f8c8d',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    blurView: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    keyboardView: {
        flex: 1,
    },
    modalContent: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackground: {
        flex: 1
    },
    modalContainer: {
        maxHeight: height * 0.85,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    modalGradient: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 0,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: '#666',
        fontWeight: 'bold',
    },
    modalScroll: {
        flex: 1,
        paddingHorizontal: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
    },
    modernInput: {
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#2c3e50',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6c757d',
    },
    saveButton: {
        flex: 1,
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    saveButtonGradient: {
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    modernSnackbar: {
        backgroundColor: '#2c3e50',
        margin: 16,
        borderRadius: 12,
        elevation: 8,
    },
    snackbarText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    // Fixed Modal Styles
    fixedModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalBackgroundTouch: {
        flex: 1,
    },
    fixedModalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: height * 0.85,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    fixedModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    fixedModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    fixedCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fixedCloseButtonText: {
        fontSize: 18,
        color: '#6c757d',
        fontWeight: 'bold',
    },
    fixedModalScroll: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    fixedInputContainer: {
        marginBottom: 20,
    },
    fixedInputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
    },
    fixedInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#2c3e50',
    },
    fixedModalActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 30,
        gap: 12,
        backgroundColor: '#f8f9fa',
    },
    fixedCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    fixedCancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6c757d',
    },
    fixedSaveButton: {
        flex: 1,
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    fixedSaveButtonGradient: {
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fixedSaveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});