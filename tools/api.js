import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

let baseURL = '';

if (Platform.OS === 'ios') {
  baseURL = 'http://127.0.0.1:8000'; // iOS simulator
} else {
  baseURL = 'http://10.0.2.2:8000/api'; // Android emulator
}
// Eğer gerçek cihazdan bağlanıyorsan:
// baseURL = 'http://192.168.1.25:8000/api'; // bilgisayar IP'si

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // if (error.response?.status === 401) {
    //   await AsyncStorage.removeItem('token');
    //   Alert.alert('Uyarı', 'Giriş süreniz doldu. Lütfen tekrar giriş yapınız.');
    // }
    return Promise.reject(error);
  }
);

export default api;
