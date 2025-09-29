import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, View, Platform, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

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
import CustomOrderReportScreen from './screens/CustomOrderReport/CustomOrderReportScreen';
import FreezerDefScreen from './screens/Definitions/FreezerDefScreen';
import i18n from './src/i18n';
import AllStockScreen from './screens/Stock/AllProductScreen';

const Stack = createNativeStackNavigator();

// Bildirim geldiğinde foregroundda nasıl görüneceğini ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [location, setLocation] = useState(null);
  const [screen, setScreen] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();

  // Token kontrolü ve konum
  useEffect(() => {
    const checkToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        setToken(savedToken);
      } catch (err) {
      } finally {
        setLoading(false);
      }

      const lang = await AsyncStorage.getItem('selected_lang');
      i18n.changeLanguage(lang)
    };
    checkToken();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Uyarı', 'Konum izni reddedildi');
        return;
      }

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
    const is_admin = await AsyncStorage.getItem('is_admin');
    setScreen(is_admin === 'admin' ? 'Home' : 'Home');
  };

  useEffect(() => {
    if (!loading && token) {
      getLocation();
    }
    getUserType();
  }, [loading, token]);

  // Push notification setup
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Bildirim geldi:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Bildirime tıklandı:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

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
        <Stack.Screen name="Login" options={{ headerShown: false }}>
          {(props) => <LoginScreen {...props} setToken={setToken} />}
        </Stack.Screen>
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" options={{ title: 'Ana Sayfa' }}>
          {(props) => <HomeScreen {...props} location={location} />}
        </Stack.Screen>
        <Stack.Screen name="StockScreen" component={StockScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="DefinitionsScreen" component={DefinitionsScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="EndofDayScreen" component={EndofDayScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="AddEndOfDayScreen" component={AddEndOfDayScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="ReportsScreen" component={ReportsScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="GuessScreen" component={GuessScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="UsersScreen" component={UsersScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="CompanyScreen" component={CompanyScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="ReinstallScreen" component={ReinstallScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="FreezerScreen" component={FreezerScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="AddFreezerScreen" component={AddFreezerScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="LastStockScreen" component={LastStockScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="UserCheckScreen" component={UserCheckScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="HolidayScreen" component={HolidayScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="CustomOrderScreen" component={CustomOrderScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="CustomOrderReportScreen" component={CustomOrderReportScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="FreezerDefScreen" component={FreezerDefScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="AllStockScreen" component={AllStockScreen} options={{ headerShown: true, title: '' }} />
        
      </Stack.Navigator>


    </NavigationContainer>
  );
}

// Push token almak için fonksiyon
async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Bildirim izni verilmedi!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    await AsyncStorage.setItem('not_token', token);
    console.log('Expo Push Token:', token);
  } else {
    
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}