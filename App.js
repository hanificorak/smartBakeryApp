import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View, Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import StockScreen from './screens/Stock/StockScreen';
import DefinitionsScreen from './screens/Definitions/DefinitionsScreen';

import Geolocation from 'react-native-geolocation-service';

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
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, []);

  // Konum izni isteme
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Konum izni",
          message: "Uygulama konumunuza erişmek istiyor",
          buttonNeutral: "Sonra Sor",
          buttonNegative: "İptal",
          buttonPositive: "Tamam"
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS otomatik
  };

  // Konumu alma fonksiyonu
  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Uyarı', 'Konum izni reddedildi');
      return;
    }

    Geolocation.getCurrentPosition(
      (position)  =>  {
        setLocation(position.coords);
         AsyncStorage.setItem('location',JSON.stringify(position.coords))
      },
      (error) => {
        Alert.alert(error.message)
        Alert.alert('Hata', 'Konum alınamadı');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
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
        <Stack.Screen name="Home">
          {(props) => <HomeScreen {...props} location={location} />}
        </Stack.Screen>
        <Stack.Screen name="StockScreen" component={StockScreen} options={{ headerShown: true, title:'Stok Girişi' }} />
        <Stack.Screen name="DefinitionsScreen" component={DefinitionsScreen} options={{ headerShown: true, title:'Tanımlar' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
