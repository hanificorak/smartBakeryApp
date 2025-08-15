import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Endpoint from '../../tools/endpoint';
import api from '../../tools/api';

const EndofDayScreen = ({ navigation }) => {
  const [dailyData, setDailyData] = useState([]);

  useEffect(() => {
    getEndData();
  }, []);

  const getEndData = async () => {
    try {
      const { data } = await api.post(Endpoint.EndOfData);
      if (data && data.status) {
        setDailyData(data.obj || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteRecord = async (id) => {
    Alert.alert(
      'Silme Onayı',
      'Bu kaydı silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data } = await api.post(Endpoint.EndOfDelete, { id:id });
              if (data && data.status) {
                Alert.alert('Bilgi','Kayıt başarıyla silindi.')
                getEndData();
              } else {
                Alert.alert('Hata', 'Kayıt silinemedi.');
              }
            } catch (error) {
              console.log(error);
              Alert.alert('Hata', 'Bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const openAddEndOfDay = () => {
    if (dailyData.length > 0) {
      Alert.alert(
        'Uyarı',
        'Bugüne ait gün sonu kaydı girilmiş. Bugüne ait kaydı silerek işlem yapabilirsiniz.'
      );
    } else {
      navigation.replace('AddEndOfDayScreen');
    }
  };

  const ProductCard = ({ title, data, gradient, icon }) => (
    <View style={styles.productCard}>
      <LinearGradient
        colors={gradient}
        style={styles.productCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Üst başlık ve Sil butonu */}
        <View style={styles.productHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={styles.productIcon}>{icon}</Text>
            <Text style={styles.productTitle}>{title}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteRecord(data.id)}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Bugün Üretilen</Text>
            <Text style={styles.statValue}>{data.amount} adet</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Satılan</Text>
            <Text style={styles.statValue}>{data.current} adet</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Atık</Text>
            <Text style={styles.statValue}>{data.amount - data.current} adet</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Sıcaklık</Text>
            <Text style={[styles.statValue, styles.wasteValue]}>{data.temperature}°C</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Hava Durumu</Text>
            <Text style={[styles.statValue, styles.wasteValue]}>{data.weather.description}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const gradients = [
    ['#f59e0b', '#f97316'],
    ['#8b5cf6', '#a855f7'],
    ['#06b6d4', '#3b82f6'],
    ['#059669', '#10b981'],
  ];
  const icons = ['🥐', '🥧', '🍞', '🥖', '🧁', '🍰'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <LinearGradient
        colors={['#1e3a8a', '#3b82f6', '#06b6d4']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Gün Sonu İşlemleri</Text>
            <Text style={styles.headerSubtitle}>Günlük verilerinizi girin</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <TouchableOpacity style={styles.addButton} onPress={openAddEndOfDay} activeOpacity={0.8}>
            <LinearGradient
              colors={['#059669', '#10b981']}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.buttonIconContainer}>
                <Text style={styles.buttonIcon}>📝</Text>
              </View>
              <Text style={styles.addButtonText}>Gün Sonu Bilgilerini Gir</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>Günlük Üretim Özeti</Text>
            {dailyData.length > 0 ? (
              <>
                {dailyData.map((item, index) => (
                  <ProductCard
                    key={item.id}
                    title={item.product?.name || `Ürün ${index + 1}`}
                    data={item}
                    gradient={gradients[index % gradients.length]}
                    icon={icons[index % icons.length]}
                  />
                ))}
                <View style={styles.totalCard}>
                  <Text style={styles.totalText}>
                    Toplam Üretilen:{' '}
                    <Text style={styles.totalNumber}>
                      {dailyData.reduce((sum, item) => sum + item.amount, 0)} adet
                    </Text>
                  </Text>
                  <Text style={styles.totalText}>
                    Toplam Atık:{' '}
                    <Text style={[styles.totalNumber, { color: '#dc2626' }]}>
                      {dailyData.reduce((sum, item) => sum + (item.amount - item.current), 0)} adet
                    </Text>
                  </Text>
                </View>
              </>
            ) : (
              <Text style={{ textAlign: 'center', color: '#6b7280' }}>Veri bulunamadı</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default EndofDayScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {},
  headerContent: { paddingHorizontal: 24, paddingVertical: 20, paddingTop: 15 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#ffffff', marginBottom: 6 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '400' },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20 },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    marginBottom: 20,
  },
  addButtonGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, justifyContent: 'flex-start' },
  buttonIconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  buttonIcon: { fontSize: 20 },
  addButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 17, letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
  productsSection: { marginTop: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#1f2937', marginBottom: 20, textAlign: 'center' },
  productCard: {
    borderRadius: 16, marginBottom: 16, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, overflow: 'hidden',
  },
  productCardGradient: { padding: 20 },
  productHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  productIcon: { fontSize: 24, marginRight: 12 },
  productTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  deleteButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 6,
    borderRadius: 8,
  },
  deleteButtonText: { fontSize: 16, color: '#fff' },
  statsContainer: { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12, padding: 16 },
  statItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold' },
  statValue: { fontSize: 16, color: '#ffffff', fontWeight: '700' },
  wasteValue: { color: '#fef3c7' },
  totalCard: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 16, marginTop: 10 },
  totalText: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 6 },
  totalNumber: { fontSize: 16, fontWeight: '700', color: '#059669' },
});
