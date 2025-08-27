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
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Button,
    ActivityIndicator,
    TextInput,
    Card,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';

const ProfileScreen = ({ navigation }) => {
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
    });
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            // API'den kullanıcı verilerini yükle
            // const response = await api.get(Endpoint.GET_USER_PROFILE);
            // setUserData(response.data);

            // Geçici test verisi
            setUserData({
                firstName: 'Ahmet',
                lastName: 'Yılmaz',
                email: 'ahmet.yilmaz@email.com',
            });
        } catch (error) {
            Alert.alert('Hata', 'Profil bilgileri yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!userData.firstName.trim() || !userData.lastName.trim() || !userData.email.trim()) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            Alert.alert('Hata', 'Geçerli bir e-posta adresi girin.');
            return;
        }

        try {
            setLoading(true);

            const { data } = await api.post(Endpoint.UpdateProfile, { name: userData.firstName, email: userData.email });
            setIsEditing(false);

            if (data && data.status) {
                Alert.alert('Bilgi', 'Bilgiler başarıyla güncellendi.');
            } else {
                Alert.alert('Uyarı','İşlem başarısız.');
            }

        } catch (error) {
            Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
            Alert.alert('Hata', 'Lütfen tüm şifre alanlarını doldurun.');
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            Alert.alert('Hata', 'Yeni şifre ve onay şifresi eşleşmiyor.');
            return;
        }

        if (passwords.newPassword.length < 6) {
            Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
            return;
        }

        try {
            setLoading(true);
            const {data} = await api.post(Endpoint.UpdatePassword,{last_pass:passwords.currentPassword,new_pass:passwords.confirmPassword});
            if(data && data.status){
                Alert.alert('Bilgi','Şifreniz başarıyla güncellenmiştir.');
            }else{
                if(data.sub_info == "last_error"){
                    Alert.alert('Uyarı','Mevcut şifrenizi yanlış girdiniz.');
                    return;
                }else{
                    Alert.alert('Uyarı','İşlem başarısız.');
                }
            }
            // API çağrısı
            // await api.put(Endpoint.CHANGE_PASSWORD, {
            //     currentPassword: passwords.currentPassword,
            //     newPassword: passwords.newPassword,
            // });

            Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi.');
            setPasswords({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error) {
            Alert.alert('Hata', 'Şifre değiştirilirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

            <LinearGradient
                colors={['#4B6CB7', '#182848']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil Ayarları</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditing(!isEditing)}
                >
                    <Ionicons
                        name={isEditing ? "close" : "create-outline"}
                        size={24}
                        color="white"
                    />
                </TouchableOpacity>
            </LinearGradient>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profil Bilgileri Kartı */}
                    <Card style={styles.card}>
                        <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Ad Soyad</Text>
                            <TextInput
                                mode="outlined"
                                value={userData.firstName}
                                onChangeText={(text) => setUserData(prev => ({ ...prev, firstName: text }))}
                                style={styles.textInput}
                                editable={isEditing}
                                theme={{
                                    colors: {
                                        primary: '#6366f1',
                                        outline: isEditing ? '#6366f1' : '#e5e7eb',
                                    }
                                }}
                            />
                        </View>



                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>E-posta</Text>
                            <TextInput
                                mode="outlined"
                                value={userData.email}
                                onChangeText={(text) => setUserData(prev => ({ ...prev, email: text }))}
                                style={styles.textInput}
                                editable={isEditing}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                theme={{
                                    colors: {
                                        primary: '#6366f1',
                                        outline: isEditing ? '#6366f1' : '#e5e7eb',
                                    }
                                }}
                            />
                        </View>

                        {isEditing && (
                            <Button
                                mode="contained"
                                onPress={handleUpdateProfile}
                                loading={loading}
                                style={styles.updateButton}
                                buttonColor="#6366f1"
                            >
                                Bilgileri Güncelle
                            </Button>
                        )}
                    </Card>

                    {/* Şifre Değiştirme Kartı */}
                    <Card style={styles.card}>
                        <Text style={styles.cardTitle}>Şifre Değiştir</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Mevcut Şifre</Text>
                            <TextInput
                                mode="outlined"
                                value={passwords.currentPassword}
                                onChangeText={(text) => setPasswords(prev => ({ ...prev, currentPassword: text }))}
                                style={styles.textInput}
                                secureTextEntry={!showPasswords.current}
                                right={
                                    <TextInput.Icon
                                        icon={showPasswords.current ? "eye-off" : "eye"}
                                        onPress={() => togglePasswordVisibility('current')}
                                    />
                                }
                                theme={{
                                    colors: {
                                        primary: '#6366f1',
                                    }
                                }}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Yeni Şifre</Text>
                            <TextInput
                                mode="outlined"
                                value={passwords.newPassword}
                                onChangeText={(text) => setPasswords(prev => ({ ...prev, newPassword: text }))}
                                style={styles.textInput}
                                secureTextEntry={!showPasswords.new}
                                right={
                                    <TextInput.Icon
                                        icon={showPasswords.new ? "eye-off" : "eye"}
                                        onPress={() => togglePasswordVisibility('new')}
                                    />
                                }
                                theme={{
                                    colors: {
                                        primary: '#6366f1',
                                    }
                                }}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Yeni Şifre (Tekrar)</Text>
                            <TextInput
                                mode="outlined"
                                value={passwords.confirmPassword}
                                onChangeText={(text) => setPasswords(prev => ({ ...prev, confirmPassword: text }))}
                                style={styles.textInput}
                                secureTextEntry={!showPasswords.confirm}
                                right={
                                    <TextInput.Icon
                                        icon={showPasswords.confirm ? "eye-off" : "eye"}
                                        onPress={() => togglePasswordVisibility('confirm')}
                                    />
                                }
                                theme={{
                                    colors: {
                                        primary: '#6366f1',
                                    }
                                }}
                            />
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleChangePassword}
                            loading={loading}
                            style={styles.updateButton}
                            buttonColor="#dc2626"
                        >
                            Şifreyi Değiştir
                        </Button>
                    </Card>

                    <View style={styles.bottomSpacing} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        paddingTop: Platform.OS === 'ios' ? 15 : 15,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 20,
    },
    editButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: 'white',
        marginTop: 20,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: 'white',
    },
    updateButton: {
        marginTop: 20,
        paddingVertical: 8,
        borderRadius: 12,
    },
    bottomSpacing: {
        height: 40,
    },
});