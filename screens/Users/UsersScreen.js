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
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import {
    Snackbar,
    ActivityIndicator,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import '../../src/i18n';

const { width, height } = Dimensions.get('window');

export default function UsersScreen({ navigation, setToken }) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets(); // Safe area insets'i al

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [value, setValue] = useState("0");
    const [admin, setAdmin] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        id: null,
    });

    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [userStatus, setUserStatus] = useState("1");

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const data = [
        { label: "Kullanıcı", value: "0" },
        { label: "Admin", value: "1" },
    ];

    const dataStatus = [
        { label: "Pasif", value: "0" },
        { label: "Aktif", value: "1" },
    ];


    // Load users
    const loadUsers = async () => {
        try {
            setLoading(true);
            // // API çağrısı burada yapılacak
            // // const response = await api.get(Endpoint.users);
            // // setUsers(response.data);

            const { data } = await api.post(Endpoint.GetUsers);
            console.log(data)
            if (data && data.status) {
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
            showSnackbar(t('users.load_error'));
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
            errors.firstName = t('users.first_name_required');
        }

        if (!formData.lastName.trim()) {
            errors.lastName = t('users.last_name_required');
        }

        if (!formData.password.trim()) {
            errors.lastName = t('users.password_required');
        }
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
                    id: formData.id,
                    perm: value,
                    status: userStatus,
                    password: formData.password
                });
                console.log(data)
                if (data && data.status) {
                    loadUsers();
                    Alert.alert(t('info'), t('users.add_success'));
                    setFormData({ firstName: '', lastName: '', email: '', password: '' });
                    setFormErrors({});
                    setAddModalVisible(false);
                } else {
                    Alert.alert(t('warning'), t('users.operation_failed'));
                }

            } catch (error) {
                console.log(error)
            }

        } catch (error) {
            showSnackbar(t('users.add_error'));
        } finally {
            setSubmitting(false);
        }
    };

    const checkAdmin = async () => {
        const admin = await AsyncStorage.getItem('is_admin');
        setAdmin(admin);
    };


    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarVisible(true);
    };

    // Effects
    useEffect(() => {
        checkAdmin();
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
                <Text style={{ fontSize: 11, color: 'gray', marginTop: 4 }}>{item.status == 1 ? t('users.active') : t('users.passive')}</Text>

                <Text style={{ fontSize: 11, color: 'gray', marginTop: 4 }}>{item.is_admin == 1 ? t('users.admin') : t('users.user')}</Text>
                <Text style={{ fontSize: 11, color: 'gray', marginTop: 4 }}>{item.admin_onay == 1 ? t('users.approved') : t('users.pending')}</Text>
            </View>
            <TouchableOpacity style={styles.userActionButton} onPress={() => editUser(item)}>
                <Text style={styles.actionButtonText}>{t('users.edit')}</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const editUser = (item) => (
        setFormData({
            firstName: item.name,
            lastName: '',
            email: item.email,
            id: item.id

        }),
        setValue(item.is_admin.toString()),
        setUserStatus(item.status.toString()),
        setAddModalVisible(true)
    );

    const userCheckOpen = () => (
        navigation.replace('UserCheckScreen')

    );

    const openModal = () => (
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            id: null

        }),
        setAddModalVisible(true)
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
                                    <Text style={styles.cancelButtonText}>{t('users.cancel')}</Text>
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>{t('users.new_user')}</Text>
                                <View style={styles.placeholder} />
                            </View>

                            <View style={styles.formContainer}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>{t('users.full_name_label')}</Text>
                                    <TextInput
                                        style={[styles.input, formErrors.firstName && styles.inputError]}
                                        value={formData.firstName}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                                        placeholder={t('users.full_name_placeholder')}
                                        placeholderTextColor="#999"
                                    />
                                    {formErrors.firstName && (
                                        <Text style={styles.errorText}>{formErrors.firstName}</Text>
                                    )}
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>{t('users.email')}</Text>
                                    <TextInput
                                        style={[styles.input, formErrors.email && styles.inputError]}
                                        value={formData.email}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                                        placeholder={t('users.email_placeholder')}
                                        placeholderTextColor="#999"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    {formErrors.email && (
                                        <Text style={styles.errorText}>{formErrors.email}</Text>
                                    )}
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>{t('users.password')}</Text>
                                    <TextInput
                                        style={[styles.input, formErrors.password && styles.inputError]}
                                        value={formData.password}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                                        placeholder={t('users.password')}
                                        placeholderTextColor="#999"
                                        keyboardType="visible-password"
                                        secureTextEntry={true}
                                        autoCapitalize="none"
                                    />
                                    {formErrors.password && (
                                        <Text style={styles.errorText}>{formErrors.password}</Text>
                                    )}
                                </View>
                                <View style={{ marginTop: 0 }}>
                                    <Text>{t('users.status')}</Text>

                                    <Dropdown
                                        style={styles.dropdown}
                                        data={dataStatus}
                                        labelField="label"
                                        valueField="value"
                                        placeholder={t('users.select')}
                                        value={userStatus}
                                        onChange={item => setUserStatus(item.value)}
                                    />
                                </View>

                                {admin == "admin" ? <View style={{ marginTop: 15 }}>
                                    <Text>{t('users.role')}</Text>

                                    <Dropdown
                                        style={styles.dropdown}
                                        data={data}
                                        labelField="label"
                                        valueField="value"
                                        placeholder={t('users.select')}
                                        value={value}
                                        onChange={item => setValue(item.value)}
                                    />
                                </View> : <View></View>}

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
                                            <Text style={styles.submitButtonText}>{t('users.add_user')}</Text>
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
                    <Text style={styles.headerTitle}>{t('users.title')}</Text>
                    <Text style={styles.headerSubtitle}>{t('users.count', { count: users.length })}</Text>
                </Animated.View>


            </LinearGradient>
            {admin == "admin" ? <View style={{ margin: 10 }}>
                <TouchableOpacity style={[styles.userActionButton, {}]} onPress={() => userCheckOpen()}>
                    <Text style={[styles.actionButtonText, { textAlign: 'center', fontSize: 15 }]}>{t('users.approv')}</Text>
                </TouchableOpacity>
            </View> : <View></View>}

            <View style={styles.content}>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#667eea" />
                        <Text style={styles.loadingText}>{t('users.loading')}</Text>
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
                                <Text style={styles.emptyText}>{t('users.empty')}</Text>
                                <Text style={styles.emptySubtext}>{t('users.empty_sub')}</Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* FAB'a bottom insets ekle */}
            <TouchableOpacity
                style={[styles.fab, { bottom: 50 + insets.bottom, marginRight: 20 }]}
                onPress={() => openModal()}
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
        backgroundColor: '#667eea',
        borderRadius: 10
    },
    actionButtonText: {
        fontSize: 12,
        color: 'white',
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
    dropdown: {
        height: 50,
        borderColor: "#D1D5DB",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: "#fff",
        marginTop: 5,
    },
});