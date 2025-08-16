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

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [location, setLocation] = useState(null);

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

  useEffect(() => {
    if (!loading && token) {
      getLocation();
    }
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
      <Stack.Navigator initialRouteName={token ? 'Home' : 'Login'}>
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" options={{ headerShown: false }}>
          {(props) => <LoginScreen {...props} setToken={setToken} />}
        </Stack.Screen>
        <Stack.Screen name="Home" options={{ title:'Ana Sayfa' }}>
          {(props) => <HomeScreen {...props} location={location} />}
        </Stack.Screen>
        <Stack.Screen name="StockScreen" component={StockScreen} options={{ headerShown: true, title:'Stok Girişi' }} />
        <Stack.Screen name="DefinitionsScreen" component={DefinitionsScreen} options={{ headerShown: true, title:'Tanımlar' }} />
        <Stack.Screen name="EndofDayScreen" component={EndofDayScreen} options={{ headerShown: true, title:'Gün Sonu İşlemleri' }} />
        <Stack.Screen name="AddEndOfDayScreen" component={AddEndOfDayScreen} options={{ headerShown: true, title:'Gün Sonu Ekle' }} />
        <Stack.Screen name="ReportsScreen" component={ReportsScreen} options={{ headerShown: true, title:'Raporlar' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
