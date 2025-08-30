import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    FlatList,
    Switch,
    Modal,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';
import {   Provider, Button, ActivityIndicator } from 'react-native-paper';
import axios from 'axios';
const { height } = Dimensions.get('window');

const FreezerScreen = ({ navigation }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [freezerRecords, setFreezerRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterDate, setFilterDate] = useState('');

    // Modal form states
    const [freezerName, setFreezerName] = useState('');
    const [workingDegree, setWorkingDegree] = useState('');
    const [description, setDescription] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Report modal states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [emailAddress, setEmailAddress] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [SaveLoading, setSaveLoading] = useState(false);

    // ScrollView ref for auto-scrolling
    const scrollViewRef = React.useRef(null);

    useEffect(() => {
        loadSetData();
    }, [filterDate]);

    const loadSetData = async () => {
        loadFreezerRecords(false, true);
    };

    const loadFreezerRecords = async (all = false, first = false) => {
        setLoading(true);
        if (first) {
            await setFilterDate(getCurrentDate());
        }
        console.log((all ? null : filterDate))
        const { data } = await api.post(Endpoint.FreezerList, { date: (all ? null : filterDate) });
        setLoading(false);

        if (data && data.status) {
            setFreezerRecords(data.obj);
        } else {

        }
    };

    const allData = async () => {
        loadFreezerRecords(true);
    };
    const getNowdat = async () => {
        loadFreezerRecords(false);
    };

    const saveFreezerRecords = async () => {
        const param = {
            name: freezerName,
            temp: workingDegree,
            desc: description,
            id: editingId
        };

        if (param.name == null || param.name == "") {
            Alert.alert('Uyarı', 'Dolap adı girmelisiniz.');
            return;
        }

        setSaveLoading(true)

        const { data } = await api.post(Endpoint.FreeSave, param);
        setSaveLoading(false)

        if (data && data.status) {
            closeModal();
            loadFreezerRecords();
            Alert.alert('Bilgi', 'Bilgiler başarıyla kayıt edildi.');
        } else {
            Alert.alert('Uyarı', 'İşlem başarısız.');
        }
    };

    const handleEditRecord = (record) => {
        // navigation.replace('AddFreezerScreen', {
        //     name: record.name,
        //     temp:record.temp,
        //     desc:record.desc,
        //     id:record.id
        // });

        setFreezerName(record.name);
        setWorkingDegree(record.temp);
        setDescription(record.desc);
        setIsEditing(true);
        setEditingId(record.id);
        setModalVisible(true);
    };

    const handleDeleteRecord = (id) => {
        Alert.alert(
            'Kayıt Sil',
            'Bu kaydı silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        const { data } = await api.post(Endpoint.FreeDelete, { id: id });
                        setLoading(false);

                        if (data && data.status) {
                            Alert.alert('Bilgi', 'Kayıt başarıyla silindi.');
                            loadFreezerRecords();
                        } else {
                            Alert.alert('Uyarı', 'İşlem başarısız.');
                        }
                    }
                }
            ]
        );
    };

    const openModal = () => {
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setFreezerName('');
        setWorkingDegree('');
        setDescription('');
        setIsEditing(false);
        setEditingId(null);
    };

    const openReportModal = () => {
        setReportModalVisible(true);
    };

    const closeReportModal = () => {
        setReportModalVisible(false);
        setStartDate('');
        setEndDate('');
        setEmailAddress('');
    };

    const formatDate = (text) => {
        // Sadece rakamları al
        let cleaned = text.replace(/\D/g, "");

        // gün.ay.yıl formatı ekle
        if (cleaned.length >= 5) {
            cleaned = cleaned.replace(/(\d{2})(\d{2})(\d{0,4})/, "$1.$2.$3");
        } else if (cleaned.length >= 3) {
            cleaned = cleaned.replace(/(\d{2})(\d{0,2})/, "$1.$2");
        }

        return cleaned;
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const sendReport = async () => {
        // Validations
        if (!startDate || startDate.length !== 10) {
            Alert.alert('Uyarı', 'Başlangıç tarihi formatı hatalı. (gg.aa.yyyy)');
            return;
        }

        if (!endDate || endDate.length !== 10) {
            Alert.alert('Uyarı', 'Bitiş tarihi formatı hatalı. (gg.aa.yyyy)');
            return;
        }

        if (!emailAddress || !validateEmail(emailAddress)) {
            Alert.alert('Uyarı', 'Geçerli bir e-mail adresi girmelisiniz.');
            return;
        }

        setReportLoading(true);

        try {
            // API call for report
            const param = {
                startDate: startDate,
                endDate: endDate,
                email: emailAddress
            };

            // Replace with your report endpoint
            const { data } = await api.post(Endpoint.FreeReportSend, param);
            console.log(data)
            if (data && data.status) {
                Alert.alert('Bilgi', 'Rapor başarıyla e-mail adresinize gönderildi.');
                closeReportModal();
            } else {
                Alert.alert('Uyarı', 'Rapor gönderilirken hata oluştu.');
            }
        } catch (error) {
            Alert.alert('Uyarı', 'Rapor gönderilirken hata oluştu.');
        } finally {
            setReportLoading(false);
        }
    };

    const getCurrentDate = () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const renderRecordItem = ({ item }) => (
        <View style={styles.recordCard}>
            <View style={styles.recordHeader}>
                <Text style={styles.freezerNameText}>{item.name}</Text>
                <Text style={styles.dateText}>
                    {new Date(item.created_at).toLocaleDateString("tr-TR")}
                </Text>
            </View>
            <View style={styles.recordContent}>
                <View style={styles.degreeContainer}>
                    <Text style={styles.degreeLabel}>Çalışma Derecesi:</Text>
                    <Text style={styles.degreeValue}>{item.temp}°C</Text>
                </View>
                {item.desc ? (
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionLabel}>Açıklama:</Text>
                        <Text style={styles.descriptionText}>{item.desc}</Text>
                    </View>
                ) : null}
            </View>
            <View style={styles.recordActions}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditRecord(item)}
                >
                    <Text style={styles.editButtonText}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteRecord(item.id)}
                >
                    <Text style={styles.deleteButtonText}>Sil</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Provider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#2196F3" />

                <LinearGradient
                    colors={['#4B6CB7', '#182848']}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>Buzdolabı Çalışma Saatleri</Text>
                </LinearGradient>

                <View style={styles.content}>
                 {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        )}
                    {/* Filter Section */}
                    <View style={styles.filterContainer}>
                        <View style={styles.filterHeader}>
                            <View style={styles.headerButtons}>
                                <TouchableOpacity
                                    style={styles.reportButton}
                                    onPress={openReportModal}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#9C27B0', '#E91E63']}
                                        style={styles.reportButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.reportButtonIcon}>📊</Text>
                                        <Text style={styles.reportButtonText}>Rapor Al</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={openModal}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#FF6A00', '#FF8E53']}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.primaryButtonIcon}>+</Text>
                                        <Text style={styles.primaryButtonText}>Yeni Giriş</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.dateSelector}>
                            <View style={styles.dateActions}>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => getNowdat()}
                                >
                                    <Text style={styles.dateButtonText}>📅 Bugün</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.clearButton}
                                    onPress={() => allData()}
                                >
                                    <Text style={styles.clearButtonText}>🔄 Tümü</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Records List */}
                    <View style={styles.listContainer}>
                        <View style={styles.listHeader}>
                            <Text style={styles.listTitle}>
                                Kayıtlar ({freezerRecords.length})
                            </Text>
                        </View>

                        {freezerRecords.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    {filterDate ? 'Bu tarih için kayıt bulunamadı' : 'Henüz kayıt yok'}
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={freezerRecords}
                                renderItem={renderRecordItem}
                                keyExtractor={(item) => item.id}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.listContent}
                            />
                        )}
                    </View>
                </View>

                {/* Add/Edit Modal */}
               <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeModal} // Android geri tuşu
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle'}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* İçerik */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={true}
              nestedScrollEnabled={true}
            >
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Buzdolabı Adı *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={freezerName}
                    onChangeText={setFreezerName}
                    placeholder="Örn: Mutfak Buzdolabı"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Çalışma Derecesi (°C) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={workingDegree}
                    onChangeText={(text) => {
                      // sadece rakam ve '-' kabul et
                      const cleanedText = text.replace(/[^0-9.-]/g, '');
                      setWorkingDegree(cleanedText);
                    }}
                    placeholder="Örn: -18"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Açıklama</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="İsteğe bağlı açıklama..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => {
                        if (scrollViewRef.current) {
                          scrollViewRef.current.scrollTo({
                            y: 300,
                            animated: true,
                          });
                        }
                      }, 300);
                    }}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Butonlar */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                disabled={SaveLoading}
                onPress={saveFreezerRecords}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4CAF50', '#66BB6A']}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.saveButtonText}>
                    {SaveLoading ? 'Kaydediliyor...'  :(isEditing ? '✓ Güncelle' : '✓ Kaydet')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

                {/* Report Modal */}
                <Modal
      visible={reportModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeReportModal} // Android geri tuşu için
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.reportModalContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalInnerContainer}>
            <View style={styles.modalHandle} />

            <View style={styles.reportModalHeader}>
              <Text style={styles.reportModalTitle}>Rapor Oluştur</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeReportModal}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.reportFormContainer}>
                <View style={styles.dateRangeContainer}>
                  <View style={styles.dateRangeHeader}>
                    <Text style={styles.dateRangeTitle}>📅 Tarih Aralığı</Text>
                  </View>

                  <View style={styles.dateRow}>
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.reportInputLabel}>Başlangıç Tarihi</Text>
                      <TextInput
                        style={styles.reportDateInput}
                        value={startDate}
                        onChangeText={(text) => setStartDate(formatDate(text))}
                        placeholder="01.01.2024"
                        placeholderTextColor="#999"
                        maxLength={10}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.dateInputContainer}>
                      <Text style={styles.reportInputLabel}>Bitiş Tarihi</Text>
                      <TextInput
                        style={styles.reportDateInput}
                        value={endDate}
                        onChangeText={(text) => setEndDate(formatDate(text))}
                        placeholder="31.12.2024"
                        placeholderTextColor="#999"
                        maxLength={10}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.emailContainer}>
                  <View style={styles.emailHeader}>
                    <Text style={styles.emailTitle}>✉️ E-mail Adresi</Text>
                  </View>
                  <TextInput
                    style={styles.reportEmailInput}
                    value={emailAddress}
                    onChangeText={setEmailAddress}
                    placeholder="ornek@email.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.reportActions}>
              <TouchableOpacity
                style={styles.reportCancelButton}
                onPress={closeReportModal}
                activeOpacity={0.8}
              >
                <Text style={styles.reportCancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendReportButton}
                onPress={sendReport}
                activeOpacity={0.8}
                disabled={reportLoading}
              >
                <LinearGradient
                  colors={reportLoading ? ['#ccc', '#999'] : ['#9C27B0', '#E91E63']}
                  style={styles.sendReportButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {reportLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.sendReportButtonIcon}>📧</Text>
                      <Text style={styles.sendReportButtonText}>Rapor Gönder</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
            </SafeAreaView>
        </Provider>
    );
};

export default FreezerScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 15,
    },
    filterContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    filterLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    reportButton: {
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#9C27B0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500'
  },
    reportButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    reportButtonIcon: {
        fontSize: 16,
        color: '#fff',
    },
    reportButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    primaryButton: {
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#FF6A00',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    primaryButtonIcon: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    dateSelector: {
        gap: 12,
    },
    dateInput: {
        borderWidth: 2,
        borderColor: '#e3f2fd',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: '#fafafa',
        color: '#333',
    },
    dateActions: {
        flexDirection: 'row',
        gap: 10,
    },
    dateButton: {
        flex: 1,
        backgroundColor: '#e3f2fd',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2196F3',
    },
    dateButtonText: {
        color: '#1976D2',
        fontSize: 14,
        fontWeight: '600',
    },
    clearButton: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    clearButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    listContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    listHeader: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    listTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    listContent: {
        padding: 10,
    },
    recordCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    recordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    freezerNameText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    dateText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 10,
    },
    recordContent: {
        marginBottom: 10,
    },
    degreeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    degreeLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 5,
    },
    degreeValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2196F3',
    },
    descriptionContainer: {
        marginTop: 5,
    },
    descriptionLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    descriptionText: {
        fontSize: 14,
        color: '#333',
        fontStyle: 'italic',
    },
    recordActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    editButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#F44336',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // Centered Modal Styles
    centeredModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 50,
    },
    centeredModalContainer: {
        width: '100%',
        maxHeight: '85%',
    },
    centeredModalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,

        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        maxHeight: '100%',
    },
    centeredModalScrollView: {
        maxHeight: '70%',
    },
    centeredModalScrollContent: {
        paddingBottom: 10,
    },
    centeredModalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        backgroundColor: 'white',
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        backgroundColor: 'white',

        color: '#333',
        flex: 1,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'bold',
    },
    formContainer: {
        padding: 24,
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
        borderWidth: 2,
        borderColor: '#e8f4fd',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: '#fafbfc',
        color: '#333',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 14,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    cancelButtonText: {
        color: '#6c757d',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // Report Modal Styles
    reportModalContainer: {
    },

    reportModalHeader: {
        backgroundColor: 'white',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    reportModalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#333',
        flex: 1,
    },
    reportFormContainer: {
        padding: 24,
    },
    modalScrollContent: {
        backgroundColor: 'white',
    },
    dateRangeContainer: {

        backgroundColor: '#f8f9ff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#e8ebff',
    },
    dateRangeHeader: {
        marginBottom: 16,
    },
    dateRangeTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateInputContainer: {
        flex: 1,
    },
    reportInputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
    },
    reportDateInput: {
        borderWidth: 2,
        borderColor: '#d1d9ff',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#333',
        fontWeight: '600',
        textAlign: 'center',
    },
    emailContainer: {
        backgroundColor: '#f0f8ff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        borderWidth: 2,
        borderColor: '#d4eaff',
    },
    emailHeader: {
        marginBottom: 16,
    },
    emailTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    reportEmailInput: {
        borderWidth: 2,
        borderColor: '#b3d9ff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#333',
        fontWeight: '500',
    },
    reportActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    reportCancelButton: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e9ecef',
    },
    reportCancelButtonText: {
        color: '#6c757d',
        fontSize: 16,
        fontWeight: '600',
    },
    sendReportButton: {
        flex: 2,
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#9C27B0',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    sendReportButtonGradient: {
        flexDirection: 'row',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    sendReportButtonIcon: {
        fontSize: 18,
        color: '#fff',
    },
    sendReportButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
     reportModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)', // arka plan blur efekti gibi
  },

  // Modal iç kutu
  modalInnerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    maxHeight: '%100', // ekranın %80’inden fazla yer kaplamasın
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },

  // Üstte küçük tutma çizgisi
  modalHandle: {
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 12,
  },

  // Header
  reportModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  reportModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },

  // Scroll içeriği
  modalScrollView: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },

  // Form alanları
  reportFormContainer: {
    gap: 20,
  },
  dateRangeContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
  },
  dateRangeHeader: {
    marginBottom: 10,
  },
  dateRangeTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#444',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateInputContainer: {
    flex: 1,
  },
  reportInputLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  reportDateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },

  // Email alanı
  emailContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
  },
  emailHeader: {
    marginBottom: 8,
  },
  emailTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#444',
  },
  reportEmailInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },

  // Butonlar
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  reportCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  reportCancelButtonText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '500',
  },
  sendReportButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendReportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  sendReportButtonIcon: {
    marginRight: 6,
    fontSize: 16,
  },
  sendReportButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',              
    paddingBottom: 10,
    maxHeight: '%100',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  closeButton: {
    padding: 5,
  },

  modalScrollView: {
  },

  modalScrollContent: {
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: '#444',
    marginBottom:10,
  },

  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },

  cancelButtonText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },

  saveButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },

  saveButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },

  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});