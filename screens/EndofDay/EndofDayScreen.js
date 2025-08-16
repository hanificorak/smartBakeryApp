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
import { ActivityIndicator } from 'react-native-paper';

const EndofDayScreen = ({ navigation }) => {
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getEndData();
  }, []);

  const getEndData = async () => {
    try {
      setLoading(true);
      const { data } = await api.post(Endpoint.EndOfData);
      setLoading(false);
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
              const { data } = await api.post(Endpoint.EndOfDelete, { id: id });
              if (data && data.status) {
                Alert.alert('Bilgi', 'Kayıt başarıyla silindi.')
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
    ['#42A5F5', '#64B5F6'], // Açık mavi gradient

  ];
  const icons = ['🥐', '🥧', '🍞', '🥖', '🧁', '🍰'];

  const today = new Date();
  const formattedDate = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#4B6CB7', '#182848']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerBlur}>
            <View
              style={[
                styles.headerContent
              ]}
            >
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.headerTitle}>Gün Sonu İşlemleri</Text>
                  <Text style={styles.headerSubtitle}>
                    {formattedDate}
                  </Text>
                </View>
                <View style={styles.headerStats}>
                  <Text style={styles.statsNumber}>{dailyData.length}</Text>
                  <Text style={styles.statsLabel}>Kayıt</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={openAddEndOfDay}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#FF6A00', '#FF8E53']} // turuncu → şeftali
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.primaryButtonIcon}>+</Text>
                    <Text style={styles.primaryButtonText}>Yeni Giriş</Text>
                  </LinearGradient>
                </TouchableOpacity>


              </View>
            </View>
          </View>
        </LinearGradient>
      </View>


      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>


          <View style={styles.productsSection}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="large" color="#667eea" />
                  <Text style={styles.loadingText}>Yükleniyor...</Text>
                  <Text style={styles.loadingSubtext}>Kayıtlar yükleniyor</Text>
                </View>
              </View>
            ) : dailyData.length > 0 ? (
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
              <View style={styles.emptyState}>
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyIcon}>📦</Text>
                  <Text style={styles.emptyTitle}>Henüz kayıt yok</Text>
                  <Text style={styles.emptySubtitle}>
                    Yeni bir gün sonu ekleyerek başlayın
                  </Text>
                </View>
              </View>
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
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#ffffff', marginBottom: 6 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '400' },
  contentContainer: { padding: 5 },
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
  headerContainer: {
  },
  headerGradient: {
    paddingBottom: 10,
  },
  headerBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
  },
  headerContent: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginTop: 1,
  },
  headerStats: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:100
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: 280,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsLabel: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: -15,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    elevation: 1,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  primaryButtonIcon: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffff',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonIcon: {
    fontSize: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
