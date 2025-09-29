import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // veya başka bir icon kütüphanesi
import { useTranslation } from "react-i18next";
import "../src/i18n"; // sadece import etmen yeterli
import api from '../tools/api';
import Endpoint from '../tools/endpoint';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [admin, setAdmin] = useState(null);
  const [datachk, setDatachk] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { t, i18n } = useTranslation();

  // Animasyon değeri
  const dropdownAnim = useRef(new Animated.Value(0)).current;

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
      flag: '🇬🇧'
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

  useFocusEffect(
    useCallback(() => {
      dataControl();

      checkAdmin();
      setNotToken();
    }, [])
  );

  const checkAdmin = async () => {
    const admin = await AsyncStorage.getItem('is_admin');
    setAdmin(admin);
  };

  const dataControl = async () => {
    const { data } = await api.post(Endpoint.DataCheck);
    setDatachk(data)

    // if (data.status) {
    // } else {
    //   setDatachk(null)
    // }
  };

  const setNotToken = async () => {
    const token = await AsyncStorage.getItem('not_token');
    let n_tk = token.split('[')[1].split(']')[0];

    const { data } = await api.post(Endpoint.AddToken, { token: n_tk });
    console.log("token", n_tk)
  };

  const handleMenuPress = async (item) => {
    navigation.navigate(item.screen);
  };

  const getNotInfo = async (item) => {

    if (datachk == null) {
      return;
    }
    if (item.id == 1) {
      if (datachk.product == false) {
        return <View style={styles.notificationDot}></View>
      } else {
        return <View style={[styles.notificationDot, { backgroundColor: '#198754' }]}></View>
      }
    }
    if (item.id == 2) {
      if (datachk.end_of_days == false) {
        return <View style={styles.notificationDot}></View>
      } else {
        return <View style={[styles.notificationDot, { backgroundColor: '#198754' }]}></View>
      }
    }
    if (item.id == 5) {
      if (datachk.freezer == false) {
        return <View style={styles.notificationDot}></View>
      } else {
        return <View style={[styles.notificationDot, { backgroundColor: '#198754' }]}></View>
      }
    }
  };


  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const toggleDropdown = () => {
    const toValue = dropdownVisible ? 0 : 1;

    Animated.timing(dropdownAnim, {
      toValue: toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();

    setDropdownVisible(!dropdownVisible);
  };

  // Dil değiştirme fonksiyonu
  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem('selected_lang', languageCode);
      toggleDropdown();
      // AsyncStorage kaydetme işlemi i18n konfigürayonunda otomatik yapılıyor
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
          {/* Dil Değiştirme Butonu ve Dropdown */}
          <View style={styles.languageContainer}>
            <TouchableOpacity
              onPress={toggleDropdown}
              style={styles.languageButton}
            >
              <Text style={styles.flagText}>{getCurrentLanguageFlag()}</Text>
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.dropdownContainer,
                {
                  opacity: dropdownAnim,
                  maxHeight: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 150]
                  }),
                  transform: [{
                    translateY: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0]
                    })
                  }]
                }
              ]}
            >
              {languages.map((language, index) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.dropdownItem,
                    i18n.language === language.code && styles.selectedDropdownItem,
                    index === 0 && styles.firstDropdownItem,
                    index === languages.length - 1 && styles.lastDropdownItem
                  ]}
                  onPress={() => changeLanguage(language.code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemFlag}>{language.flag}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>

          {/* Logout Butonu */}
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Icon name="logout" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer} >
          {menuItems
            .filter(item => admin === "admin" ? true : item.is_user)
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item)}
                activeOpacity={0.7}
              >

                {getNotInfo(item)}

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
    marginBottom: 20
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
    zIndex: 1000,
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
    zIndex: 1001,
  },
  languageContainer: {
    position: 'relative',
    zIndex: 1002,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  flagText: {
    fontSize: 18,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1003,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4.65,
    elevation: 15,
    overflow: 'hidden',
    minWidth: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  firstDropdownItem: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  lastDropdownItem: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  selectedDropdownItem: {
    backgroundColor: '#F0FDF4',
  },
  dropdownItemFlag: {
    fontSize: 18,
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
  notificationDot: {
    width: 15,
    height: 15,
    backgroundColor: 'red',
    position: 'absolute',
    zIndex: 10,
    right: 15,
    top: 10,
    borderRadius: 7.5,
  },
});

export default HomeScreen;