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
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Bu import'u ekle
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';
import {
    Snackbar,
    ActivityIndicator,
} from 'react-native-paper';

const { width, height } = Dimensions.get('window');

export default function UsersScreen({ navigation, setToken }) {
    const insets = useSafeAreaInsets(); // Safe area insets'i al
    
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Load users
    const loadUsers = async () => {
        try {
            setLoading(true);
            // // API çağrısı burada yapılacak
            // // const response = await api.get(Endpoint.users);
            // // setUsers(response.data);

            const {data} = await api.post(Endpoint.GetUsers);
            console.log(data)
            if(data && data.status){
                setUsers(data.obj);
            }
            // // Demo data
            // setTimeout(() => {
            //     setUsers([
            //         { id: 1, firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet@example.com' },
            //         { id: 2, firstName: 'Mehmet', lastName: 'Demir', email: 'mehmet@example.com' },
            //         { id: 3, firstName: 'Ayşe', lastName: 'Kaya', email: 'ayse@example.com' },
            //     ]);
                setLoading(false);
            // }, 1000);
        } catch (error) {
            setLoading(false);
            showSnackbar('Kullanıcılar yüklenirken hata oluştu');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUsers();
        setRefreshing(false);
    };

    // Form validation
    const validateForm = () => {
        const errors = {};

        if (!formData.firstName.trim()) {
            errors.firstName = 'Ad gerekli';
        }

        if (!formData.lastName.trim()) {
            errors.lastName = 'Soyad gerekli';
        }

        // if (!formData.email.trim()) {
        //     errors.email = 'Email gerekli';
        // } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        //     errors.email = 'Geçerli bir email adresi girin';
        // }

        // if (!formData.password.trim()) {
        //     errors.password = 'Şifre gerekli';
        // } else if (formData.password.length < 6) {
        //     errors.password = 'Şifre en az 6 karakter olmalı';
        // }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Add user
    const handleAddUser = async () => {

        try {
            setSubmitting(true);

            try {
                const { data } = await api.post(Endpoint.AddUser, {
                    name: formData.firstName,
                    email: formData.email,
                    password: formData.password,
                    firm_id: 1,
                });
                console.log(data)
                if (data && data.status) {
                    loadUsers();
                    Alert.alert('Bilgi', 'Kullanıcı başarıyla eklendi.');
                    setFormData({ firstName: '', lastName: '', email: '', password: '' });
                    setFormErrors({});
                    setAddModalVisible(false);
                } else {
                    Alert.alert('Uyarı', 'İşlem başarısız.');
                }

            } catch (error) {
                console.log(error)
            }

        } catch (error) {
            showSnackbar('Kullanıcı eklenirken hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarVisible(true);
    };

    // Effects
    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const renderUser = ({ item, index }) => (
        <Animated.View
            style={[
                styles.userCard,
                {
                    opacity: fadeAnim,
                    transform: [{
                        translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, index * 10]
                        })
                    }]
                }
            ]}
        >
            <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                    {item.name.charAt(0)}
                </Text>
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <TouchableOpacity style={styles.userActionButton}>
                <Text style={styles.actionButtonText}>⋮</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderAddModal = () => (
        <RNModal
            visible={addModalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setAddModalVisible(false)}
        >
            <SafeAreaView style={styles.modalContainer}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContent}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity
                                    onPress={() => setAddModalVisible(false)}
                                    style={styles.cancelButton}
                                >
                                    <Text style={styles.cancelButtonText}>İptal</Text>
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Yeni Kullanıcı</Text>
                                <View style={styles.placeholder} />
                            </View>

                            <View style={styles.formContainer}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Ad Soyad * </Text>
                                    <TextInput
                                        style={[styles.input, formErrors.firstName && styles.inputError]}
                                        value={formData.firstName}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                                        placeholder="Adınızı ve soyadınızı girin"
                                        placeholderTextColor="#999"
                                    />
                                    {formErrors.firstName && (
                                        <Text style={styles.errorText}>{formErrors.firstName}</Text>
                                    )}
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Email</Text>
                                    <TextInput
                                        style={[styles.input, formErrors.email && styles.inputError]}
                                        value={formData.email}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                                        placeholder="email@example.com"
                                        placeholderTextColor="#999"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    {formErrors.email && (
                                        <Text style={styles.errorText}>{formErrors.email}</Text>
                                    )}
                                </View>

                                {/* <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Şifre</Text>
                                    <TextInput
                                        style={[styles.input, formErrors.password && styles.inputError]}
                                        value={formData.password}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                                        placeholder="En az 6 karakter"
                                        placeholderTextColor="#999"
                                        secureTextEntry
                                    />
                                    {formErrors.password && (
                                        <Text style={styles.errorText}>{formErrors.password}</Text>
                                    )}
                                </View> */}

                                <TouchableOpacity
                                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                                    onPress={handleAddUser}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <LinearGradient
                                            colors={['#667eea', '#764ba2']}
                                            style={styles.submitButtonGradient}
                                        >
                                            <Text style={styles.submitButtonText}>Kullanıcı Ekle</Text>
                                        </LinearGradient>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </RNModal>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#667eea" />

            <LinearGradient colors={['#4B6CB7', '#182848']} style={styles.header}>
                <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
                    <Text style={styles.headerTitle}>Kullanıcılar</Text>
                    <Text style={styles.headerSubtitle}>{users.length} kullanıcı</Text>
                </Animated.View>
            </LinearGradient>

            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#667eea" />
                        <Text style={styles.loadingText}>Kullanıcılar yükleniyor...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={users}
                        renderItem={renderUser}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[
                            styles.listContainer,
                            { paddingBottom: insets.bottom + 100 } // FlatList'e bottom padding ekle
                        ]}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Henüz kullanıcı bulunmuyor</Text>
                                <Text style={styles.emptySubtext}>Yeni kullanıcı eklemek için + butonuna tıklayın</Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* FAB'a bottom insets ekle */}
            <TouchableOpacity
                style={[styles.fab, { bottom: 30 + insets.bottom }]}
                onPress={() => setAddModalVisible(true)}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.fabGradient}
                >
                    <Text style={styles.fabText}>+</Text>
                </LinearGradient>
            </TouchableOpacity>

            {renderAddModal()}

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={[styles.snackbar, { bottom: insets.bottom }]} // Snackbar'a da bottom insets ekle
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
    header: {
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
        paddingBottom: 10,
        paddingHorizontal: 20,
    },
    headerContent: {
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
    },
    content: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    listContainer: {
        padding: 20,
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#667eea',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    userActionButton: {
        padding: 10,
    },
    actionButtonText: {
        fontSize: 20,
        color: '#666',
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabText: {
        fontSize: 30,
        color: '#fff',
        fontWeight: '300',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    modalContent: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    cancelButton: {
        padding: 5,
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#667eea',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    placeholder: {
        width: 50,
    },
    formContainer: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    inputError: {
        borderColor: '#dc3545',
    },
    errorText: {
        fontSize: 12,
        color: '#dc3545',
        marginTop: 5,
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 20,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonGradient: {
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    snackbar: {
        backgroundColor: '#333',
    },
});