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
  Dimensions,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';
import { Provider, Button, ActivityIndicator } from 'react-native-paper';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import '../../src/i18n';
const { height } = Dimensions.get('window');
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import WebView from 'react-native-webview';

const FreezerScreen = ({ navigation }) => {
  const { t } = useTranslation();
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

  const [slideAnim] = useState(new Animated.Value(0));
  const screenHeight = Dimensions.get('window').height;


  // Report modal states
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 1)) // dün
  );
  const [endDate, setEndDate] = useState(new Date()); // bugün


  const [emailAddress, setEmailAddress] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [SaveLoading, setSaveLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [pdfView, setPdfView] = useState(false);
  const [pdfPath, setpdfPath] = useState('');
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [selectedFreezer, setselectedFreezer] = useState(null);
  const [freezers, setFreezers] = useState([]);



  const formatDatePicker = (date) => {
    return date.toLocaleDateString('tr-TR'); // 06.09.2025 formatında
  };
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
    const { data } = await api.post(Endpoint.FreezerList, { date: (all ? null : filterDate) });
    console.log('dd', data)
    setLoading(false);
    if (data && data.status) {
      setFreezerRecords(data.obj.data);
      setFreezers(data.obj.freezers);

    } else {

    }
  };

  const allData = async () => {
    loadFreezerRecords(true);
  };
  const getNowdat = async () => {
    loadFreezerRecords(false);
  };

  const openPdfView = async () => {
    sendReport(false, true)
  };

  const closepdfModal = () => {
    setReportModalVisible(true);
    setPdfView(false);

  };


  const saveFreezerRecords = async () => {
    if (selectedFreezer == null) {
      Alert.alert(t('warning'), t('freezer.name_required_select'));
      return
    }
    const param = {
      fr_id: selectedFreezer.id,
      temp: workingDegree,
      desc: description,
      id: editingId
    };


    setSaveLoading(true)

    const { data } = await api.post(Endpoint.FreeSave, param);
    setSaveLoading(false)

    if (data && data.status) {
      closeModal();
      loadFreezerRecords();
      Alert.alert(t('info'), t('freezer.save_success'));
    } else {
      Alert.alert(t('warning'), t('freezer.operation_failed'));
    }
  };

  const handleEditRecord = (record) => {
    setselectedFreezer({ id: record.fr_id, name: record.fr_name });
    setWorkingDegree(record.temp);
    setDescription(record.desc);
    setIsEditing(true);
    setEditingId(record.id);
    setModalVisible(true);
  };

  const handleDeleteRecord = (id) => {
    Alert.alert(
      t('freezer.delete_title'),
      t('freezer.delete_confirm'),
      [
        { text: t('freezer.cancel'), style: 'cancel' },
        {
          text: t('freezer.delete'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { data } = await api.post(Endpoint.FreeDelete, { id: id });
            setLoading(false);

            if (data && data.status) {
              Alert.alert(t('info'), t('freezer.delete_success'));
              loadFreezerRecords();
            } else {
              Alert.alert(t('warning'), t('freezer.operation_failed'));
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
    setStartDate(new Date(new Date().setDate(new Date().getDate() - 1)));
    setEndDate(new Date());
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

  const sendReport = async (print = false, prew = false, mail = true) => {
    let sendMail = true;
    if (print == true || prew == true) {
      sendMail = false;
    }

    if (sendMail) {
      if (!emailAddress || !validateEmail(emailAddress)) {
        Alert.alert(t('warning'), t('freezer.invalid_email'));
        return;
      }
    }
    setReportLoading(true);

    try {
      const param = {
        startDate: startDate,
        endDate: endDate,
        email: emailAddress,
        print: (print ? 1 : 0),
        prew: (prew ? 1 : 0),
        mail: (sendMail ? 1 : 0)
      };

      const formatLocalISODate = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Ay 0'dan başlar, bu yüzden +1
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      param.startDate = formatLocalISODate(startDate);
      param.endDate = formatLocalISODate(endDate);
      // Replace with your report endpoint
      const { data } = await api.post(Endpoint.FreeReportSend, param);
      console.log(data, emailAddress)
      setReportLoading(false);

      if (data && data.status) {
        if (print && !sendMail) {
          printReportData(data.obj)
          return;
        }

        if (prew && !sendMail) {
          setReportModalVisible(false);
          setPdfView(true);
          setpdfPath(data.obj)
          return;
        }

        Alert.alert(t('info'), t('freezer.report_success'));
        closeReportModal();
      } else {
        Alert.alert(t('warning'), t('freezer.report_failed'));
      }
    } catch (error) {
      Alert.alert(t('warning'), t('freezer.report_failed'));
    } finally {
      setReportLoading(false);
    }
  };

  const print = async () => {
    sendReport(true);
  };

  async function printReportData(pdfUrl) {
    try {
      const localPath = FileSystem.documentDirectory + "temp.pdf";
      const downloadResumable = FileSystem.createDownloadResumable(
        pdfUrl,
        localPath
      );

      const { uri } = await downloadResumable.downloadAsync();
      await Print.printAsync({ uri });

      setPrintLoading(false);
    } catch (error) {
      console.error("PDF açılırken hata:", error);
    }
  }

  const getselectedFreezerName = () => {
    if (!selectedFreezer) return t('freezer.select_freezer');
    return selectedFreezer.name;
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
        <Text style={styles.freezerNameText}>{item.fr_name}</Text>
        <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleDateString("tr-TR")}
        </Text>
      </View>
      <View style={styles.recordContent}>
        <View style={styles.degreeContainer}>
          <Text style={styles.degreeLabel}>{t('freezer.working_degree')}</Text>
          <Text style={styles.degreeValue}>{item.temp}°C</Text>
        </View>
        {item.desc ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>{t('freezer.description')}</Text>
            <Text style={styles.descriptionText}>{item.desc}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.recordActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditRecord(item)}
        >
          <Text style={styles.editButtonText}>{t('freezer.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteRecord(item.id)}
        >
          <Text style={styles.deleteButtonText}>{t('freezer.delete')}</Text>
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
          <Text style={styles.headerTitle}>{t('freezer.title')}</Text>
        </LinearGradient>

        <View style={styles.content}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>{t('freezer.loading')}</Text>
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
                    <Text style={styles.reportButtonText}>{t('freezer.get_report')}</Text>
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
                    <Text style={styles.primaryButtonText}>{t('freezer.new_entry')}</Text>
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
                  <Text style={styles.dateButtonText}>📅 {t('freezer.today')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => allData()}
                >
                  <Text style={styles.clearButtonText}>🔄 {t('freezer.all')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Records List */}
          <View style={styles.listContainer}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {t('freezer.records_count', { count: freezerRecords.length })}
              </Text>
            </View>

            {freezerRecords.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {filterDate ? t('freezer.no_records_for_date') : t('freezer.no_records')}
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
                    {isEditing ? t('freezer.edit_record') : t('freezer.add_record')}
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
                      <Text style={styles.inputLabel}>{t('freezer.name_label')}</Text>
                      {/* <TextInput
                        style={styles.textInput}
                        value={freezerName}
                        onChangeText={setFreezerName}
                        placeholder={t('freezer.name_placeholder')}
                        placeholderTextColor="#999"
                      /> */}

                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setStatusMenuVisible(!statusMenuVisible)}
                      >
                        <Text style={styles.dropdownButtonText}>
                          {getselectedFreezerName()}
                        </Text>
                        <Text style={[styles.dropdownArrow, statusMenuVisible && styles.dropdownArrowUp]}>
                          ▼
                        </Text>
                      </TouchableOpacity>

                      {statusMenuVisible && (
                        <View style={styles.dropdownList}>
                          {freezers.map((fr) => (
                            <TouchableOpacity
                              key={fr.id}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setselectedFreezer(fr);
                                setStatusMenuVisible(false);
                              }}
                            >
                              <Text style={selectedFreezer?.id === fr.id ? styles.selectedDropdownText : styles.dropdownText}>
                                {fr.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>{t('freezer.degree_label')}</Text>
                      <TextInput
                        style={styles.textInput}
                        value={workingDegree}
                        onChangeText={(text) => {
                          // sadece rakam ve '-' kabul et
                          const cleanedText = text.replace(/[^0-9.-]/g, '');
                          setWorkingDegree(cleanedText);
                        }}
                        placeholder={t('freezer.degree_placeholder')}
                        placeholderTextColor="#999"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>{t('freezer.desc_label')}</Text>
                      <TextInput
                        style={[styles.textInput, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder={t('freezer.desc_placeholder')}
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
                    <Text style={styles.cancelButtonText}>{t('freezer.cancel')}</Text>
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
                        {SaveLoading ? t('freezer.saving') : (isEditing ? `✓ ${t('freezer.update')}` : `✓ ${t('freezer.save')}`)}
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
                  <Text style={styles.reportModalTitle}>{t('freezer.create_report')}</Text>
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
                        <Text style={styles.dateRangeTitle}>📅 {t('freezer.date_range')}</Text>
                      </View>

                      <View style={styles.dateRow}>
                        {/* Başlangıç Tarihi */}
                        <View style={styles.dateInputContainer}>
                          <Text style={styles.reportInputLabel}>{t('freezer.start_date')}</Text>
                          <TouchableOpacity
                            onPress={() => setShowStartPicker(true)}
                            style={styles.reportDateInput}
                          >
                            <Text>{formatDatePicker(startDate)}</Text>
                          </TouchableOpacity>

                          {showStartPicker && (
                            <DateTimePicker
                              value={startDate}
                              mode="date"
                              display="default"
                              onChange={(event, selectedDate) => {
                                setShowStartPicker(false);
                                if (selectedDate) setStartDate(selectedDate);
                              }}
                            />
                          )}
                        </View>

                        {/* Bitiş Tarihi */}
                        <View style={styles.dateInputContainer}>
                          <Text style={styles.reportInputLabel}>{t('freezer.end_date')}</Text>
                          <TouchableOpacity
                            onPress={() => setShowEndPicker(true)}
                            style={styles.reportDateInput}
                          >
                            <Text>{formatDatePicker(endDate)}</Text>
                          </TouchableOpacity>

                          {showEndPicker && (
                            <DateTimePicker
                              value={endDate}
                              mode="date"
                              display="default"
                              onChange={(event, selectedDate) => {
                                setShowEndPicker(false);
                                if (selectedDate) setEndDate(selectedDate);
                              }}
                            />
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.emailContainer}>
                      <View style={styles.emailHeader}>
                        <Text style={styles.emailTitle}>✉️ {t('freezer.email_address')}</Text>
                      </View>
                      <TextInput
                        style={styles.reportEmailInput}
                        value={emailAddress}
                        onChangeText={setEmailAddress}
                        placeholder={t('freezer.email_placeholder')}
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.sendReportButton}
                      onPress={print}
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
                            <Text style={styles.sendReportButtonText}>{t('print')}</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sendReportButton}
                      onPress={openPdfView}
                      activeOpacity={0.8}
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
                            <Text style={styles.sendReportButtonIcon}></Text>
                            <Text style={styles.sendReportButtonText}>{t('report.pdf_preview')}</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </ScrollView>

                <View style={styles.reportActions}>
                  <TouchableOpacity
                    style={styles.reportCancelButton}
                    onPress={closeReportModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.reportCancelButtonText}>{t('freezer.cancel')}</Text>
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
                          <Text style={styles.sendReportButtonText}>{t('freezer.send_report')}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>


        <Modal
          visible={pdfView}
          transparent={true}
          animationType="none"

        >
          <View style={styles.modalOverlayPrew}>
            <TouchableOpacity
              style={styles.modalBackgroundPrew}
              activeOpacity={1}

            />
            <View
              style={[
                styles.modalContentPrew

              ]}
            >
              {/* Header */}
              <View style={styles.modalHeaderPrew}>
                <Text style={styles.modalTitlePrew}>{t('report.pdf_preview')}</Text>
                <TouchableOpacity
                  onPress={closepdfModal}
                  style={styles.closeButtonPrew}
                >
                  <Text style={styles.closeButtonTextPrew}>✕</Text>
                </TouchableOpacity>
              </View>


              {/* Body */}
              <View style={styles.modalBodyPrew}>
                {/* Buraya PDF gösterimi */}
                {/* Örneğin react-native-pdf ile */}

                <WebView
                  source={{
                    uri: pdfPath,
                  }}
                  style={{ flex: 1 }}
                />

              </View>

              {/* Footer */}
              <View style={styles.modalFooterPrew}>
                <Button
                  mode="outlined"
                  onPress={closepdfModal}
                  style={styles.clearButtonPrew}
                >
                  {t('report.close')}
                </Button>

              </View>
            </View>
          </View>
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
    marginBottom:20
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
    marginBottom: 10,
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

  modalOverlayPrew: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackgroundPrew: {
    flex: 1,
  },
  modalContentPrew: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '100%',
    minHeight: '85%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalHeaderPrew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitlePrew: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButtonPrew: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  closeButtonTextPrew: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  modalBodyPrew: {
    flex: 1,
    padding: 20,
  },
  modalFooterPrew: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  clearButtonPrew: {
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
    transform: [{ rotate: '0deg' }],
  },
  dropdownArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedDropdownText: {
    fontSize: 16,
    color: '#4B6CB7',
    fontWeight: '600',
  },
});