import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // veya başka bir icon kütüphanesi
import { useTranslation } from "react-i18next";
import "../src/i18n"; // sadece import etmen yeterli
import api from '../tools/api';
import Endpoint from '../tools/endpoint';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [admin, setAdmin] = useState(null);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const { t, i18n } = useTranslation();

  // Dil seçenekleri
  const languages = [
    {
      code: 'tr',
      name: 'Türkçe',
      flag: '🇹🇷'
    },
    {
      code: 'de',
      name: 'Deutsch',
      flag: '🇩🇪'
    },
    {
      code: 'en',
      name: 'English',
      flag: '🇺🇸'
    }
  ];

  const menuItems = [
    {
      id: 1,
      title: t('menu.stock_login'),
      subtitle: t('menu.stock_login_msg'),
      icon: 'inventory',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      screen: 'StockScreen',
      is_user: true,
      image: require('../assets/menu/tages.png')
    },
    {
      id: 2,
      title: t('menu.end_of_day'),
      subtitle: t('menu.end_of_day_msg'),
      icon: 'trending-up',
      color: '#10B981',
      bgColor: '#ECFDF5',
      screen: 'EndofDayScreen',
      is_user: true,
      image: require('../assets/menu/abs.png')
    },
    {
      id: 3,
      title: t('menu.reports'),
      subtitle: t('menu.report_msg'),
      icon: 'bar-chart',
      color: '#8B5CF6',
      bgColor: '#F3F4F6',
      screen: 'ReportsScreen',
      is_user: false,
      image: require('../assets/menu/pro.png')
    },
    {
      id: 4,
      title: t('menu.guess'),
      subtitle: t('menu.guess_msg'),
      icon: 'wb-sunny',
      color: '#8B5CF6',
      bgColor: '#F3F4F6',
      screen: 'GuessScreen',
      is_user: true,
      image: require('../assets/menu/prn.png')
    },
    {
      id: 5,
      title: t('menu.freezer'),
      subtitle: t('menu.freezer_msg'),
      icon: 'ac-unit',
      color: '#8B5CF6',
      bgColor: '#F3F4F6',
      screen: 'FreezerScreen',
      is_user: true,
      image: require('../assets/menu/temp.png')
    },
    {
      id: 6,
      title: t('menu.custom_order'),
      subtitle: t('menu.custom_order_msg'),
      icon: 'assignment', // sipariş/iş emri ikonu
      color: '#10B981',   // yeşil (tailwind: emerald-500)
      bgColor: '#ECFDF5', // açık yeşil arka plan
      screen: 'CustomOrderScreen',
      is_user: true,
      image: require('../assets/menu/custor.png')
    },
    {
      id: 7,
      title: t('menu.custom_order_report'),
      subtitle: t('menu.custom_order_report_msg'),
      icon: 'description',  // veya insert-chart
      color: '#3B82F6',     // Mavi (analiz vurgusu)
      bgColor: '#EFF6FF',
      screen: 'CustomOrderReportScreen',
      is_user: true
    },
    {
      id: 8,
      title: t('menu.def'),
      subtitle: t('menu.def_msg'),
      icon: 'settings',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      screen: 'DefinitionsScreen',
      is_user: true,
      image: require('../assets/menu/datenbank.png')
    },
  
    {
      id: 10,
      title: t('menu.holiday'),
      subtitle: t('menu.holiday_msg'),
      icon: 'event',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      screen: 'HolidayScreen',
      is_user: true,
      image: require('../assets/menu/feir.png')
    },
    {
      id: 11,
      title: t('menu.users'),
      subtitle: t('menu.users_msg'),
      icon: 'group',
      color: '#0049e5ff',
      bgColor: '#d8d8d8ff',
      screen: 'UsersScreen',
      is_user: false,
      image: require('../assets/menu/benutzer.png')
    },
    {
      id: 12,
      title: t('menu.profile'),
      subtitle: t('menu.profile_msg'),
      icon: 'person',
      color: '#EF4444',
      bgColor: '#FEE2E2',
      screen: 'ProfileScreen',
      is_user: false,
      image: require('../assets/menu/profile.png')
    },
    {
      id: 13,
      title: t('menu.comp'),
      subtitle: t('menu.comp_msg'),
      icon: 'business',
      color: '#8B5CF6',
      bgColor: '#F3F4F6',
      screen: 'CompanyScreen',
      is_user: false,
      image: require('../assets/menu/comp.png')
    },
    {
      id: 14,
      title: t('menu.reinstall'),
      subtitle: t('menu.reinstall_msg'),
      icon: 'refresh',
      color: '#8B5CF6',
      bgColor: '#F3F4F6',
      screen: 'ReinstallScreen',
      is_user: true,
      image: require('../assets/menu/reins.png')
    }
  ];

  useEffect(() => {
    checkAdmin();
    setNotToken();
  }, []);

  const checkAdmin = async () => {
    const admin = await AsyncStorage.getItem('is_admin');
    setAdmin(admin);
    console.log("asd", admin);
  };

  const setNotToken = async () => {
    const token = await AsyncStorage.getItem('not_token');
    let n_tk = token.split('[')[1].split(']')[0];

    const {data} = await api.post(Endpoint.AddToken,{token:n_tk});
    console.log("token", n_tk)
  };

  const handleMenuPress = async (item) => {
    navigation.navigate(item.screen);
  };

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  // Dil değiştirme fonksiyonu
  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem('selected_lang',languageCode);
      setLanguageModalVisible(false);
      // AsyncStorage kaydetme işlemi i18n konfigürasyonunda otomatik yapılıyor
    } catch (error) {
      console.log('Dil değiştirme hatası:', error);
    }
  };

  // Aktif dilin bayrağını getir
  const getCurrentLanguageFlag = () => {
    const currentLang = languages.find(lang => lang.code === i18n.language);
    return currentLang ? currentLang.flag : '🌐';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>smart Bakery</Text>
          <Text style={styles.headerSubtitle}>{t('welcome')}</Text>
        </View>

        <View style={styles.headerButtons}>
          {/* Dil Değiştirme Butonu */}
          <TouchableOpacity
            onPress={() => setLanguageModalVisible(true)}
            style={styles.languageButton}
          >
            <Text style={styles.flagText}>{getCurrentLanguageFlag()}</Text>
            <Icon name="keyboard-arrow-down" size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* Logout Butonu */}
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Icon name="logout" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dil Seçimi Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('selectLanguage', 'Dil Seçin')}</Text>
              
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    (i18n && i18n.language === language.code) && styles.selectedLanguage
                  ]}
                  onPress={() => changeLanguage(language.code)}
                >
                  <Text style={styles.flagEmoji}>{language.flag}</Text>
                  <Text style={[
                    styles.languageName,
                    (i18n && i18n.language === language.code) && styles.selectedLanguageName
                  ]}>
                    {language.name}
                  </Text>
                  {(i18n && i18n.language === language.code) && (
                    <Icon name="check" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setLanguageModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>{t('cancel', 'İptal')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
          {menuItems
            .filter(item => admin === "admin" ? true : item.is_user)
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                  {item.image ? (
                    <Image
                      source={item.image}
                      style={{ width: 80, height: 80, resizeMode: 'contain' }}
                    />
                  ) : (
                    <Icon name={item.icon} size={24} color={item.color} />
                  )}
                </View>

                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  flagText: {
    fontSize: 18,
    marginRight: 4,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.8,
    maxWidth: 300,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedLanguage: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedLanguageName: {
    color: '#10B981',
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default HomeScreen;