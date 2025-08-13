import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import Endpoint from '../tools/endpoint';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation, setToken }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Animasyon değerleri
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Sayfa yüklenme animasyonu
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleRegister = async () => {
        try {
            if(name == null){
             Alert.alert('Hata', 'Lütfen adınız ve soyadınızı girin');
                return;   
            }

            if (password !== confirmPassword) {
                Alert.alert('Hata', 'Şifreler eşleşmiyor');
                return;
            }

            if (password.length < 6) {
                Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
                return;
            }

            setIsLoading(true);

            // Button press animasyonu
            Animated.sequence([
                Animated.timing(buttonScale, {
                    toValue: 0.95,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(buttonScale, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            const { data } = await axios.post(Endpoint.Register, { 
                name: name, 
                email: email, 
                password: password 
            });

            setIsLoading(false);

            if (data && data.status) {
                Alert.alert('Kayıt işlemi başarıyla gerçekleşti')
                navigation.replace('Login');
            } else {
                Alert.alert('Uyarı', 'Kayıt işlemi başarısız. Lütfen bilgilerinizi kontrol edin.');
            }

        } catch (error) {
            setIsLoading(false);
            Alert.alert('Hata', 'Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    const goToLogin = () => {
        navigation.replace('Login');
    };

    const isFormValid = name.length > 0 && email.length > 0 && password.length > 0 && confirmPassword.length > 0;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" />

            {/* Gradyan Arka Plan */}
            <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >

                {/* Dekoratif Circles */}
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
                <View style={[styles.circle, styles.circle3]} />

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >

                        {/* Logo/Title Area */}
                        <View style={styles.headerContainer}>
                            <View style={styles.logoContainer}>
                                <Text style={styles.logoText}>✨</Text>
                            </View>
                            <Text style={styles.welcomeText}>Hesap Oluştur</Text>
                            <Text style={styles.subtitleText}>Yeni bir hesap oluşturun</Text>
                        </View>

                        {/* Form Container */}
                        <View style={styles.formContainer}>

                            {/* Name Input */}
                            <View style={styles.inputContainer}>
                                <View style={styles.inputIconContainer}>
                                    <Text style={styles.inputIcon}>👤</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Adınız ve Soyadınız"
                                    placeholderTextColor="#A0A0A0"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <View style={styles.inputIconContainer}>
                                    <Text style={styles.inputIcon}>📧</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="E-posta adresiniz"
                                    placeholderTextColor="#A0A0A0"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <View style={styles.inputIconContainer}>
                                    <Text style={styles.inputIcon}>🔒</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Şifreniz (en az 6 karakter)"
                                    placeholderTextColor="#A0A0A0"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Confirm Password Input */}
                            <View style={styles.inputContainer}>
                                <View style={styles.inputIconContainer}>
                                    <Text style={styles.inputIcon}>🔐</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Şifrenizi tekrar girin"
                                    placeholderTextColor="#A0A0A0"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Terms and Conditions */}
                            <View style={styles.termsContainer}>
                                <Text style={styles.termsText}>
                                    Kayıt olarak{' '}
                                    <Text style={styles.termsLink}>Kullanım Şartları</Text>
                                    {' '}ve{' '}
                                    <Text style={styles.termsLink}>Gizlilik Politikası</Text>
                                    'nı kabul etmiş olursunuz.
                                </Text>
                            </View>

                            {/* Register Button */}
                            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                                <TouchableOpacity
                                    style={[
                                        styles.registerButton,
                                        { opacity: isFormValid ? 1 : 0.6 }
                                    ]}
                                    onPress={handleRegister}
                                    disabled={!isFormValid || isLoading}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#4CAF50', '#45A049']}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        {isLoading ? (
                                            <View style={styles.loadingContainer}>
                                                <View style={styles.spinner} />
                                                <Text style={styles.buttonText}>Hesap Oluşturuluyor...</Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.buttonText}>Hesap Oluştur</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* Login Link */}
                            <View style={styles.loginContainer}>
                                <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
                                <TouchableOpacity onPress={goToLogin}>
                                    <Text style={styles.loginLink}>Giriş Yap</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </Animated.View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    circle: {
        position: 'absolute',
        borderRadius: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    circle1: {
        width: 200,
        height: 200,
        top: -100,
        right: -100,
    },
    circle2: {
        width: 150,
        height: 150,
        top: height * 0.2,
        left: -75,
    },
    circle3: {
        width: 100,
        height: 100,
        bottom: 100,
        right: 50,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        marginTop: -50,
        flex: 1,
        justifyContent: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        fontSize: 40,
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 25,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 15,
        marginBottom: 20,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    inputIconContainer: {
        marginRight: 10,
    },
    inputIcon: {
        fontSize: 20,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    eyeButton: {
        padding: 5,
    },
    eyeIcon: {
        fontSize: 18,
    },
    termsContainer: {
        marginBottom: 25,
        paddingHorizontal: 5,
    },
    termsText: {
        fontSize: 12,
        color: '#6C757D',
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: '#667eea',
        fontWeight: '500',
    },
    registerButton: {
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 25,
    },
    buttonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    spinner: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'white',
        borderTopColor: 'transparent',
        marginRight: 10,
        // Note: Gerçek uygulamada ActivityIndicator kullanın
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#6C757D',
        fontSize: 14,
    },
    loginLink: {
        color: '#667eea',
        fontSize: 14,
        fontWeight: 'bold',
    },
});