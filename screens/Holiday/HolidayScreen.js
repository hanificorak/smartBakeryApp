import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Button,
    ActivityIndicator,
    TextInput,
    Card,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';
import { useTranslation } from 'react-i18next';
import '../../src/i18n';

const { width, height } = Dimensions.get('window');

const HolidayScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newHolidayName, setNewHolidayName] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        loadHolidays();
    }, []);

    useEffect(() => {
        // const keyboardDidShowListener = Keyboard.addEventListener('keyboardDidShow', (e) => {
        //     setKeyboardHeight(e.endCoordinates.height);
        // });
        // const keyboardDidHideListener = Keyboard.addEventListener('keyboardDidHide', () => {
        //     setKeyboardHeight(0);
        // });

        // return () => {
        //     keyboardDidShowListener?.remove();
        //     keyboardDidHideListener?.remove();
        // };
    }, []);

    const loadHolidays = async () => {
        setLoading(true);
        try {
            const { data } = await api.post(Endpoint.HolidayData);
            setLoading(false);

            if (data && data.status) {
                setHolidays(data.obj);
            }
        } catch (error) {
            console.error('Tatil günleri yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveHoliday = async () => {
        try {
            if (!newHolidayName.trim()) {
                Alert.alert('Uyarı', 'Lütfen tatil günü adını giriniz.');
                return;
            }

            const { data } = await api.post(Endpoint.HolidayAdd, { title: newHolidayName, date: selectedDate.toString() });
            console.log(data);
            if (data && data.status) {
                Alert.alert('Başarılı', 'Tatil günü eklendi.');
                setModalVisible(false);
                setNewHolidayName('');
                setSelectedDate(new Date());
                loadHolidays();
            } else {
                Alert.alert('Hata', data ? data.message : 'Tatil günü eklenirken bir hata oluştu.');
            }
        } catch (error) {
            console.log(error);
        }

    };

    const deleteHoliday = async (id) => {
        Alert.alert(
            'Sil',
            'Bu tatil gününü silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { data } = await api.post(Endpoint.HolidayDelete, { id: id });
                            if (data && data.status) {
                                Alert.alert('Başarılı', 'Kayıt başarıyla silindi.');
                                loadHolidays();
                            } else {
                                Alert.alert('Hata','İşlem başarısız.')
                            }
                        } catch (error) {
                            Alert.alert('Hata', 'Tatil günü silinirken bir hata oluştu.');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const onDateChange = (event, date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
        }
    };

    const renderHolidayItem = (holiday) => (
        <Card key={holiday.id} style={styles.holidayCard} elevation={2}>
            <View style={styles.holidayContent}>
                <View style={styles.holidayInfo}>
                    <Text style={styles.holidayName}>{holiday.title}</Text>
                    <Text style={styles.holidayDate}>{formatDate(holiday.date)}</Text>
                </View>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteHoliday(holiday.id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#ff4757" />
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#667eea" />

            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.headerTitle}>Tatil Günleri</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#667eea" />
                        <Text style={styles.loadingText}>Yükleniyor...</Text>
                    </View>
                ) : holidays.length > 0 ? (
                    holidays.map(renderHolidayItem)
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={80} color="#ddd" />
                        <Text style={styles.emptyText}>Henüz tatil günü eklenmemiş</Text>
                        <Text style={styles.emptySubText}>
                            Yeni tatil günü eklemek için yukarıdaki + butonuna tıklayın
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Add Holiday Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                statusBarTranslucent
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -keyboardHeight}
                >
                    <TouchableOpacity
                        style={styles.modalBackground}
                        onPress={() => setModalVisible(false)}
                        activeOpacity={1}
                    />

                    <View style={[
                        styles.modalContainer,
                        keyboardHeight > 0 && Platform.OS === 'android' && {
                            marginBottom: keyboardHeight / 2
                        }
                    ]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Yeni Tatil Günü</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Tatil Günü Adı</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={newHolidayName}
                                    onChangeText={setNewHolidayName}
                                    placeholder="Örn: Kurban Bayramı"
                                    placeholderTextColor="#999"
                                    mode="outlined"
                                    theme={{
                                        colors: {
                                            primary: '#667eea',
                                            outline: '#ddd',
                                        }
                                    }}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Tarih</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.dateButtonText}>
                                        {formatDate(selectedDate.toISOString())}
                                    </Text>
                                    <Ionicons name="calendar-outline" size={20} color="#667eea" />
                                </TouchableOpacity>
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                />
                            )}
                        </View>

                        <View style={styles.modalFooter}>
                            <Button
                                mode="outlined"
                                onPress={() => setModalVisible(false)}
                                style={styles.cancelButton}
                                labelStyle={styles.cancelButtonText}
                            >
                                İptal
                            </Button>
                            <Button
                                mode="contained"
                                onPress={saveHoliday}
                                style={styles.saveButton}
                                labelStyle={styles.saveButtonText}
                            >
                                Kaydet
                            </Button>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

export default HolidayScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingTop: Platform.OS === 'ios' ? 20 : 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    addButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 50,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 20,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 40,
    },
    holidayCard: {
        backgroundColor: '#fff',
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    holidayContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    holidayInfo: {
        flex: 1,
    },
    holidayName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    holidayDate: {
        fontSize: 14,
        color: '#666',
    },
    deleteButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#fff5f5',
        borderWidth: 1,
        borderColor: '#fed7d7',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: '#fff',
        width: width * 0.9,
        maxWidth: 400,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 25,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#fff',
        fontSize: 16,
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 56,
    },
    dateButtonText: {
        fontSize: 16,
        color: '#333',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 8,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#667eea',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});