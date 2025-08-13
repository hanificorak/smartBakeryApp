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
    RefreshControl,
    SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';

import {
    Provider as PaperProvider,
    Button,
    Searchbar,
    Card,
    Title,
    Paragraph,
    Portal,
    Modal,
    TextInput as PaperTextInput,
    Snackbar,
    ActivityIndicator,
    Chip,
    IconButton,
    Divider,
} from 'react-native-paper';

const { width, height } = Dimensions.get('window');

export default function DefinitionsScreen({ navigation, setToken }) {
    const [definitions, setDefinitions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [visible, setVisible] = useState(false);
    const [snackVisible, setSnackVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDefinition, setSelectedDefinition] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [snackMessage, setSnackMessage] = useState('İşlem başarıyla tamamlandı!');
    const [newDefinition, setNewDefinition] = useState({
        id: null,
        productName: '',
        shortDescription: '',
        description: ''
    });

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const filteredDefinitions = definitions.filter(item =>
        (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.short_desc || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.desc || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    useFocusEffect(
        useCallback(() => {
            getProducts();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getProducts().then(() => setRefreshing(false));
    }, []);

    const getProducts = async () => {
        setLoading(true);
        try {
            const { data } = await api.post(Endpoint.ProductList);
            if (data && data.status) {
                setDefinitions(data.obj);
            } else {
                showSnack('Veriler yüklenirken hata oluştu', 'error');
            }
        } catch (error) {
            showSnack('Bağlantı hatası', 'error');
        } finally {
            setLoading(false);
        }
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
            })
            if (data && data.status) {
                showSnack(newDefinition.id ? 'Ürün başarıyla güncellendi' : 'Ürün başarıyla eklendi', 'success');
                setVisible(false);
                setNewDefinition({ id: null, productName: '', shortDescription: '', description: '' });
                getProducts();
            } else {
                showSnack('İşlem başarısız', 'error');
            }
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
                            if (data && data.status) {
                                Alert.alert('Bilgi', 'Kayıt başarıyla silindi.');
                                getProducts();
                            } else {
                                Alert.alert('Uyarı', 'İşlem başarısız.');
                            }
                            showSnack('Tanım silindi', 'success');
                        } catch (error) {
                            showSnack('Silme işlemi başarısız', 'error');
                        }
                    }
                }
            ]
        );
    };

    const showSnack = (message, type = 'success') => {
        setSnackMessage(message);
        setSnackVisible(true);
    };

    const showModal = (definition = null) => {
        if (definition) {
            // Düzenleme için modal aç
            setNewDefinition({
                id: definition.id,
                productName: definition.name,
                shortDescription: definition.short_desc || '',
                description: definition.desc || ''
            });
        } else {
            setNewDefinition({ id: null, productName: '', shortDescription: '', description: '' });
        }
        setVisible(true);
    };

    const hideModal = () => setVisible(false);
    const showDetail = (definition) => {
        setSelectedDefinition(definition);
        setDetailVisible(true);
    };
    const hideDetail = () => setDetailVisible(false);

    const renderDefinitionCard = (item) => (
        <TouchableOpacity key={item.id} onPress={() => showDetail(item)}>
            <Card style={styles.definitionCard}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <Title style={styles.cardTitle} numberOfLines={1}>{item.name}</Title>
                        <View style={styles.cardActions}>
                            <IconButton
                                icon="pencil"
                                size={20}
                                onPress={() => showModal(item)}
                                style={styles.editButton}
                            />
                            <IconButton
                                icon="delete"
                                iconColor="#ff5722"
                                size={20}
                                onPress={() => deleteDefinition(item.id)}
                                style={styles.deleteIconButton}
                            />
                        </View>
                    </View>
                    <Paragraph style={styles.shortDesc} numberOfLines={2}>
                        {item.short_desc || 'Kısa açıklama yok'}
                    </Paragraph>
                    <View style={styles.cardFooter}>
                        <Chip mode="outlined" compact style={styles.chip}>
                            Detayı Gör
                        </Chip>
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );

    return (
        <PaperProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#667eea" />

                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Animated.View
                        style={[
                            styles.headerContent,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        <View style={styles.headerTop}>
                            <View style={styles.headerTextContainer}>
                                <Title style={styles.title}>Ürün Tanımları</Title>
                                <Text style={styles.subtitle}>{definitions.length} ürün mevcut</Text>
                            </View>
                            <Button
                                mode="contained"
                                onPress={() => showModal()}
                                icon="plus"
                                style={styles.headerAddButton}
                            >
                                Ekle
                            </Button>
                        </View>
                    </Animated.View>
                </LinearGradient>

                <View style={styles.searchContainer}>
                    <Searchbar
                        placeholder="Ürün ara..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchBar}
                    />
                </View>

                <ScrollView
                    style={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#667eea" />
                            <Text style={styles.loadingText}>Yükleniyor...</Text>
                        </View>
                    ) : filteredDefinitions.length > 0 ? (
                        filteredDefinitions.map(renderDefinitionCard)
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'Arama kriterine uygun sonuç bulunamadı' : 'Henüz ürün tanımı yok'}
                            </Text>
                            {!searchQuery && (
                                <Button mode="outlined" onPress={() => showModal()} icon="plus">
                                    İlk Ürününü Ekle
                                </Button>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Add/Edit Modal */}
                <Portal>
                    <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Title style={styles.modalTitle}>{newDefinition.id ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</Title>
                            <IconButton icon="close" onPress={hideModal} />
                        </View>

                        <Divider style={styles.divider} />

                        <ScrollView>
                            <PaperTextInput
                                label="Ürün Adı *"
                                value={newDefinition.productName}
                                onChangeText={text => setNewDefinition({ ...newDefinition, productName: text })}
                                style={styles.input}
                                mode="outlined"
                            />
                            <PaperTextInput
                                label="Kısa Açıklama"
                                value={newDefinition.shortDescription}
                                onChangeText={text => setNewDefinition({ ...newDefinition, shortDescription: text })}
                                style={styles.input}
                                mode="outlined"
                            />
                            <PaperTextInput
                                label="Detaylı Açıklama"
                                value={newDefinition.description}
                                onChangeText={text => setNewDefinition({ ...newDefinition, description: text })}
                                style={styles.input}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                            />
                            <View style={styles.buttonContainer}>
                                <Button mode="outlined" onPress={hideModal} style={[styles.button, styles.cancelButton]}>
                                    İptal
                                </Button>
                                <Button mode="contained" onPress={saveDefinition} style={[styles.button, styles.addButton]} loading={loading}>
                                    {newDefinition.id ? 'Güncelle' : 'Ekle'}
                                </Button>
                            </View>
                        </ScrollView>
                    </Modal>
                </Portal>

                {/* Detail Modal */}
                <Portal>
                    <Modal visible={detailVisible} onDismiss={hideDetail} contentContainerStyle={styles.detailModal}>
                        {selectedDefinition && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Title style={styles.modalTitle}>{selectedDefinition.name}</Title>
                                    <IconButton icon="close" onPress={hideDetail} />
                                </View>

                                <Divider style={styles.divider} />

                                <ScrollView>
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Kısa Açıklama</Text>
                                        <Text style={styles.detailText}>{selectedDefinition.short_desc || 'Kısa açıklama bulunmuyor'}</Text>
                                    </View>

                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Detaylı Açıklama</Text>
                                        <Text style={styles.detailText}>{selectedDefinition.desc || 'Detaylı açıklama bulunmuyor'}</Text>
                                    </View>
                                </ScrollView>
                            </>
                        )}
                    </Modal>
                </Portal>

                {/* Snackbar */}
                <Snackbar
                    visible={snackVisible}
                    onDismiss={() => setSnackVisible(false)}
                    duration={3000}
                    style={styles.snackbar}
                >
                    <Text style={styles.snackText}>{snackMessage}</Text>
                </Snackbar>
            </SafeAreaView>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { paddingTop: Platform.OS === 'ios' ? 20 : 20, paddingBottom: 25, paddingHorizontal: 20 },
    headerContent: {},
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    headerTextContainer: { flex: 1 },
    title: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 2 },
    subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    headerAddButton: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, elevation: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    searchContainer: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    searchBar: { elevation: 0, backgroundColor: '#f5f5f5', borderRadius: 25 },
    content: { flex: 1, paddingHorizontal: 15, paddingTop: 15 },
    definitionCard: { marginBottom: 12, borderRadius: 12, elevation: 2, backgroundColor: 'white' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
    cardActions: { flexDirection: 'row' },
    deleteIconButton: { margin: 0, backgroundColor: '#ffebee' },
    editButton: { margin: 0, backgroundColor: '#ebf7ffff', marginRight: 10 },
    shortDesc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
    chip: { backgroundColor: '#e3f2fd', borderColor: '#667eea' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    loadingText: { marginTop: 15, fontSize: 16, color: '#666' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50, paddingHorizontal: 40 },
    emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 24 },
    modal: { backgroundColor: 'white', margin: 20, borderRadius: 15, maxHeight: height * 0.8 },
    detailModal: { backgroundColor: 'white', margin: 20, borderRadius: 15, maxHeight: height * 0.7 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', flex: 1 },
    divider: { marginHorizontal: 20, marginBottom: 20 },
    input: { marginBottom: 15, marginHorizontal: 20, backgroundColor: 'white' },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, marginBottom: 20, paddingHorizontal: 20 },
    button: { minWidth: 100, borderRadius: 25 },
    cancelButton: { borderColor: '#666' },
    addButton: { backgroundColor: '#667eea' },
    detailSection: { marginBottom: 20, paddingHorizontal: 20 },
    detailLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    detailText: { fontSize: 15, color: '#666', lineHeight: 22 },
    snackbar: { backgroundColor: '#4caf50', marginBottom: 20 },
    snackText: { color: 'white', fontSize: 14 },
});
