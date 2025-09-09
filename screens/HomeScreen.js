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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // veya başka bir icon kütüphanesi
import { useTranslation } from "react-i18next";
import "../src/i18n"; // sadece import etmen yeterli

const HomeScreen = ({ navigation }) => {
  const [admin, setAdmin] = useState(null);
  const { t, i18n } = useTranslation();

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
      id: 9,
      title: t('menu.def_freezer'),
      subtitle: t('menu.def_freezer_msg'),
      icon: 'ac-unit', // kar tanesi ikonu (soğutmayı temsil eder)
      color: '#0EA5E9', // mavi ton (soğuk, güven verici)
      bgColor: '#E0F2FE', // açık mavi arka plan
      screen: 'FreezerDefScreen',
      is_user: true

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
  }, []);


  const checkAdmin = async () => {
    const admin = await AsyncStorage.getItem('is_admin');
    setAdmin(admin);
    console.log("asd", admin);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>smart Bakery</Text>
          <Text style={styles.headerSubtitle}>{t('welcome')}</Text>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Icon name="logout" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hoş Geldin Kartı */}

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
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
  footer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default HomeScreen;