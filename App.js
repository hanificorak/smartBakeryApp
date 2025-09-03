import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Location from 'expo-location'; // Expo Location paketi

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import StockScreen from './screens/Stock/StockScreen';
import DefinitionsScreen from './screens/Definitions/DefinitionsScreen';
import EndofDayScreen from './screens/EndofDay/EndofDayScreen';
import AddEndOfDayScreen from './screens/EndofDay/AddEndOfDayScreen';
import ReportsScreen from './screens/Reports/ReportsScreen';
import GuessScreen from './screens/Guess/GuessScreen';
import ProfileScreen from './screens/Profile/ProfileScreen';
import UsersScreen from './screens/Users/UsersScreen';
import CompanyScreen from './screens/Company/CompanyScreen';
import ReinstallScreen from './screens/Reinstall/ReinstallScreen';
import UserSelectScreen from './screens/UserSelect/UserSelectScreen';
import FreezerScreen from './screens/Freezer/FreezerScreen';
import AddFreezerScreen from './screens/Freezer/AddFreezerScreen';
import LastStockScreen from './screens/Stock/LastStockScreen';
import UserCheckScreen from './screens/Users/UserCheckScreen';
import HolidayScreen from './screens/Holiday/HolidayScreen';
import CustomOrderScreen from './screens/CustomOrder/CustomOrderScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [location, setLocation] = useState(null);
  const [screen, setScreen] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        setToken(savedToken);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, []);

  // Konumu alma fonksiyonu (expo-location ile)
  const getLocation = async () => {
    try {
      // İzin isteme
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Uyarı', 'Konum izni reddedildi');
        return;
      }

      // Konumu alma
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      setLocation(loc.coords);
      await AsyncStorage.setItem('location', JSON.stringify(loc.coords));
    } catch (error) {
      console.log(error);
      Alert.alert('Hata', 'Konum alınamadı');
    }
  };
  const getUserType = async () => {
    // is_admin
    const is_admin = await AsyncStorage.getItem('is_admin');
    setScreen((is_admin == 'admin' ? 'Home' : 'UserSelectScreen'))
  };

  useEffect(() => {
    if (!loading && token) {
      getLocation();
    }

    getUserType();
  }, [loading, token]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={token ? screen : 'Login'}>
        <Stack.Screen name="Login" options={{ headerShown: false }}>
          {(props) => <LoginScreen {...props} setToken={setToken} />}
        </Stack.Screen>
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" options={{ title: 'Ana Sayfa' }}>
          {(props) => <HomeScreen {...props} location={location} />}
        </Stack.Screen>
        <Stack.Screen name="StockScreen" component={StockScreen} options={{ headerShown: true, title: 'Stok Girişi' }} />
        <Stack.Screen name="DefinitionsScreen" component={DefinitionsScreen} options={{ headerShown: true, title: 'Tanımlar' }} />
        <Stack.Screen name="EndofDayScreen" component={EndofDayScreen} options={{ headerShown: true, title: 'Gün Sonu İşlemleri' }} />
        <Stack.Screen name="AddEndOfDayScreen" component={AddEndOfDayScreen} options={{ headerShown: true, title: 'Gün Sonu Ekle' }} />
        <Stack.Screen name="ReportsScreen" component={ReportsScreen} options={{ headerShown: true, title: 'Raporlar' }} />
        <Stack.Screen name="GuessScreen" component={GuessScreen} options={{ headerShown: true, title: 'Günlük Üretim Tahmini' }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: true, title: 'Profilim' }} />
        <Stack.Screen name="UsersScreen" component={UsersScreen} options={{ headerShown: true, title: 'Kullanıcılar' }} />
        <Stack.Screen name="CompanyScreen" component={CompanyScreen} options={{ headerShown: true, title: 'İşletme Ayarları' }} />
        <Stack.Screen name="ReinstallScreen" component={ReinstallScreen} options={{ headerShown: true, title: 'Re-Install' }} />
        <Stack.Screen name="FreezerScreen" component={FreezerScreen} options={{ headerShown: true, title: 'Dolap Çalışma Takibi' }} />
        <Stack.Screen name="AddFreezerScreen" component={AddFreezerScreen} options={{ headerShown: true, title: 'Dolap Çalışma Kaydı Ekle' }} />
        <Stack.Screen name="LastStockScreen" component={LastStockScreen} options={{ headerShown: true, title: 'Düne Ait Kayıtlar' }} />
        <Stack.Screen name="UserCheckScreen" component={UserCheckScreen} options={{ headerShown: true, title: 'Kullanıcı Onay İşlemleri' }} />
        <Stack.Screen name="HolidayScreen" component={HolidayScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="CustomOrderScreen" component={CustomOrderScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="UserSelectScreen" options={{ headerShown: true, title: 'Kullanıcı Seçin' }}>
          {(props) => <UserSelectScreen {...props} setToken={setToken} />}
        </Stack.Screen>

      </Stack.Navigator>
    </NavigationContainer>
  );
}
