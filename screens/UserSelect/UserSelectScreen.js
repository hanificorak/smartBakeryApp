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
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function UserSelectScreen({ navigation, setToken }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Basit animasyonlar
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // Basit kullanıcı verisi
    const mockUsers = [
        {
            id: 1,
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            email: 'ahmet.yilmaz@email.com',
            isOnline: true,
        },
        {
            id: 2,
            firstName: 'Ayşe',
            lastName: 'Kaya',
            email: 'ayse.kaya@email.com',
            isOnline: false,
        },
        {
            id: 3,
            firstName: 'Mehmet',
            lastName: 'Demir',
            email: 'mehmet.demir@email.com',
            isOnline: true,
        },
        {
            id: 4,
            firstName: 'Fatma',
            lastName: 'Öztürk',
            email: 'fatma.ozturk@email.com',
            isOnline: true,
        },
        {
            id: 5,
            firstName: 'Ali',
            lastName: 'Çelik',
            email: 'ali.celik@email.com',
            isOnline: false,
        },
        {
            id: 6,
            firstName: 'Zeynep',
            lastName: 'Aksoy',
            email: 'zeynep.aksoy@email.com',
            isOnline: true,
        },
    ];

    useEffect(() => {
        loadUsers();

        // Basit giriş animasyonu
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Arama filtresi
    useEffect(() => {
        if (searchText.trim() === '') {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user =>
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchText.toLowerCase()) ||
                user.email.toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [searchText, users]);

    const loadUsers = async () => {
        try {
            setLoading(true);

            const { data } = await api.post(Endpoint.GetUsers);
            if (data && data.status) {
                setUsers(data.obj)
            }
            setLoading(false)
            // Kısa yükleme simülasyonu
            // setTimeout(() => {
            //     setUsers(mockUsers);
            //     setFilteredUsers(mockUsers);
            //     setLoading(false);
            // }, 800);

        } catch (error) {
            console.error('Kullanıcı yükleme hatası:', error);
            setLoading(false);
            showSnackbarMessage('Kullanıcılar yüklenemedi');
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadUsers();
        setRefreshing(false);
    }, []);

    const handleUserSelect = (user) => {
        setSelectedUser(user);

        Alert.alert(
            'Kullanıcı Seç',
            `${user.name} olarak devam edilsin mi?`,
            [
                {
                    text: 'İptal',
                    style: 'cancel',
                    onPress: () => setSelectedUser(null)
                },
                {
                    text: 'Seç',
                    onPress: () => proceedWithUser(user)
                }
            ]
        );
    };

    const proceedWithUser = async (user) => {
        try {

            const { data } = await api.post(Endpoint.UserChange, { user_id: user.id });
            console.log(data)
            if (data && data.status) {
                await AsyncStorage.setItem('token', data.access_token);;
                setToken(data.access_token);

                navigation.replace('Home');
            } else {
                Alert.alert('Uyarı', 'Kullanıcı seçimi başarısız.')
            }

        } catch (error) {
            console.log(error);
        }
        // showSnackbarMessage(`${user.name} seçildi`);
        // // İşlem burada yapılır
        // console.log('Seçilen kullanıcı:', user);
    };

    const showSnackbarMessage = (message) => {
        setSnackbarMessage(message);
        setShowSnackbar(true);
    };

    const getInitials = (firstName) => {
        return `${firstName.charAt(0)}`.toUpperCase();
    };

    const getAvatarColor = (id) => {
        const colors = [
            ['#667eea', '#764ba2'],
            ['#f093fb', '#f5576c'],
            ['#4facfe', '#00f2fe'],
            ['#43e97b', '#38f9d7'],
            ['#fa709a', '#fee140'],
            ['#a8edea', '#fed6e3']
        ];
        return colors[(id - 1) % colors.length];
    };

    const renderUserCard = ({ item, index }) => {
        const isSelected = selectedUser?.id === item.id;

        return (
            <TouchableOpacity
                onPress={() => handleUserSelect(item)}
                style={[
                    styles.userCard,
                    isSelected && styles.selectedUserCard
                ]}
                activeOpacity={0.7}
            >
                {/* Avatar */}
                <LinearGradient
                    colors={getAvatarColor(item.id)}
                    style={styles.avatar}
                >
                    <Text style={styles.avatarText}>
                        {getInitials(item.name)}
                    </Text>
                </LinearGradient>

                {/* Kullanıcı Bilgileri */}
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                        {item.name}
                    </Text>
                    <Text style={styles.userEmail}>
                        {item.email}
                    </Text>

                </View>

                {/* Seçim İşareti */}
                <View style={styles.selectContainer}>
                    {isSelected ? (
                        <View style={styles.selectedIcon}>
                            <Text style={styles.checkmark}>✓</Text>
                        </View>
                    ) : (
                        <View style={styles.unselectedIcon} />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Kullanıcılar yükleniyor...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <Text style={styles.headerTitle}>Kullanıcı Seç</Text>

            </Animated.View>

            {/* Arama */}
            <Animated.View
                style={[
                    styles.searchContainer,
                    { opacity: fadeAnim }
                ]}
            >
                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Kullanıcı ara..."
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearchText('')}
                            style={styles.clearButton}
                        >
                            <Text style={styles.clearText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>

            {/* Kullanıcı Listesi */}
            <Animated.View
                style={[
                    styles.listContainer,
                    { opacity: fadeAnim }
                ]}
            >
                <FlatList
                    data={filteredUsers}
                    renderItem={renderUserCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#667eea']}
                        />
                    }
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Kullanıcı bulunamadı</Text>
                        </View>
                    )}
                />
            </Animated.View>

            {/* Snackbar */}
            <Snackbar
                visible={showSnackbar}
                onDismiss={() => setShowSnackbar(false)}
                duration={2000}
                style={styles.snackbar}
            >
                {snackbarMessage}
            </Snackbar>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },

    // Header
    header: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },

    // Arama
    searchContainer: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 12,
        color: '#666',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1a1a1a',
        fontWeight: '400',
    },
    clearButton: {
        padding: 4,
    },
    clearText: {
        fontSize: 16,
        color: '#666',
    },

    // Liste
    listContainer: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 24,
    },
    separator: {
        height: 12,
    },

    // Kullanıcı Kartı
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    selectedUserCard: {
        borderWidth: 2,
        borderColor: '#667eea',
        elevation: 4,
    },

    // Avatar
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    online: {
        backgroundColor: '#22c55e',
    },
    offline: {
        backgroundColor: '#ef4444',
    },

    // Kullanıcı Bilgileri
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    onlineText: {
        color: '#22c55e',
    },
    offlineText: {
        color: '#ef4444',
    },

    // Seçim
    selectContainer: {
        marginLeft: 16,
    },
    selectedIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#22c55e',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmark: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    unselectedIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#d1d5db',
    },

    // Boş liste
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        fontWeight: '500',
    },

    // Snackbar
    snackbar: {
        backgroundColor: '#1a1a1a',
        marginHorizontal: 16,
        marginBottom: 16,
    },
});