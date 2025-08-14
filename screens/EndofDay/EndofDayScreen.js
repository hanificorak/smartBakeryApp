import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const EndofDayScreen = ({ navigation }) => {

      const openAddEndOfDay = () => {
        navigation.replace('AddEndOfDayScreen')
        
      };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      <LinearGradient 
        colors={['#1e3a8a', '#3b82f6', '#06b6d4']} 
        style={styles.header}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Gün Sonu İşlemleri</Text>
            <Text style={styles.headerSubtitle}>Günlük verilerinizi girin</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openAddEndOfDay()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#059669', '#10b981']}
              style={styles.addButtonGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              <View style={styles.buttonIconContainer}>
                <Text style={styles.buttonIcon}>📝</Text>
              </View>
              <Text style={styles.addButtonText}>Gün Sonu Bilgilerini Gir</Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
};

export default EndofDayScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
  },
  addButton: {
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#059669',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'left',
    padding:20,
    justifyContent: 'left',
  },
  buttonIconContainer: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  buttonIcon: {
    fontSize: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 17,
    letterSpacing: 0.3,
  },
});