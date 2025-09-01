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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import {
    Snackbar,
    ActivityIndicator,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function UserCheckScreen({ navigation }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const insets = useSafeAreaInsets();


    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);

            const { data } = await api.post(Endpoint.GetWaitData);
            setLoading(false);

            if (data && data.status) {
                setUsers(data.obj)
            }

        } catch (error) {
            console.error('Kullanıcılar yüklenirken hata:', error);
            showSnackbar('Kullanıcılar yüklenirken bir hata oluştu');
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadUsers();
        setRefreshing(false);
    }, []);

    const handleApprove = async (userId) => {
        Alert.alert(
            'Kullanıcıyı Onayla',
            'Bu kullanıcıyı onaylamak istediğinizden emin misiniz?',
            [
                {
                    text: 'İptal',
                    style: 'cancel',
                },
                {
                    text: 'Onayla',
                    onPress: () => approveUser(userId),
                    style: 'default',
                },
            ],
        );
    };

    const approveUser = async (userId) => {
        try {
            setLoading(true);

            const { data } = await api.post(Endpoint.ApproveUser, { id: userId });
            if (data && data.status) {
                loadUsers();
                showSnackbar('Kullanıcı başarıyla onaylandı');

            } else {
                showSnackbar('İşlem başarısız');

            }
            // // Gerçek API çağrısı burada yapılacak
            // // await api.post(`${Endpoint.APPROVE_USER}/${userId}`);

            // // Şimdilik local state'i güncelliyoruz
            // setUsers(prevUsers =>
            //     prevUsers.map(user =>
            //         user.id === userId
            //             ? { ...user, approved: true }
            //             : user
            //     )
            // );

        } catch (error) {
            console.error('Kullanıcı onaylanırken hata:', error);
            showSnackbar('Kullanıcı onaylanırken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarVisible(true);
    };

    const renderUserItem = ({ item }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>
                    {`${item.name}`}
                </Text>
                <Text style={styles.userEmail}>
                    {item.email}
                </Text>
            </View>
            <TouchableOpacity
                style={[
                    styles.approveButton,
                    item.approved && styles.approvedButton
                ]}
                onPress={() => !item.approved && handleApprove(item.id)}
                disabled={item.approved || loading}
            >
                <Text style={[
                    styles.approveButtonText,
                    item.approved && styles.approvedButtonText
                ]}>
                    {item.approved ? 'Onaylandı' : 'Onayla'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && users.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.gradient}
                >
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Kullanıcılar yükleniyor...</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#667eea" />
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Kullanıcı Onayları</Text>
                    <Text style={styles.headerSubtitle}>
                        Bekleyen onaylar: {users.filter(u => !u.approved).length}
                    </Text>
                </View>

                <View style={styles.content}>
                    <FlatList
                        data={users}
                        renderItem={renderUserItem}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#667eea"
                                colors={['#667eea']}
                            />
                        }
                        contentContainerStyle={styles.listContainer}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    Henüz kullanıcı bulunmuyor
                                </Text>
                            </View>
                        )}
                    />
                </View>

                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={3000}
                    style={styles.snackbar}
                >
                    {snackbarMessage}
                </Snackbar>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 10,
        fontWeight: '500',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 25,
        paddingTop: Platform.OS === 'ios' ? 10 : 25,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.8,
    },
    content: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingTop: 20,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    userInfo: {
        flex: 1,
        marginRight: 15,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    approveButton: {
        backgroundColor: '#27ae60',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 90,
        alignItems: 'center',
    },
    approvedButton: {
        backgroundColor: '#95a5a6',
    },
    approveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    approvedButtonText: {
        color: '#fff',
    },
    separator: {
        height: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
    },
    snackbar: {
        backgroundColor: '#2c3e50',
    },
});