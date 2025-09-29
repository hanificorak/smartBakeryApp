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
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import Endpoint from '../tools/endpoint';
import { useTranslation } from "react-i18next";
import "../src/i18n"; // sadece import etmen yeterli

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation, setToken }) {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState('tr');

    // Animasyon değerleri
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;
    const dropdownAnim = useRef(new Animated.Value(0)).current;

    // Dil seçenekleri
    const languages = [
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
    ];

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
        clearData();
        loadCurrentLanguage();
    }, []);

    const loadCurrentLanguage = async () => {
        const lang = await AsyncStorage.getItem('user-language');
        if (lang != null) {
            setCurrentLanguage(lang);
        }
    };

    const changeLanguage = async (lang) => {
        await i18n.changeLanguage(lang);
        await AsyncStorage.setItem("user-language", lang);
        await AsyncStorage.setItem('selected_lang', lang);

        setCurrentLanguage(lang);
        toggleDropdown();
    };

    const getCurrentLanguageFlag = () => {
        const currentLang = languages.find(lang => lang.code === currentLanguage);
        return currentLang ? currentLang.flag : '🇹🇷';
    };

    const toggleDropdown = () => {
        const toValue = dropdownVisible ? 0 : 1;

        Animated.timing(dropdownAnim, {
            toValue: toValue,
            duration: 200,
            useNativeDriver: false,
        }).start();

        setDropdownVisible(!dropdownVisible);
    };

    const handleLogin = async () => {
        try {
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

            const { data } = await axios.post(Endpoint.Login, { email: email, password: password });
            setIsLoading(false);

            console.log(data)
            if (!data.is_onay) {
                Alert.alert(t('warning'), t('login.approve_msg'));
                return;
            }
            if (!data.user_status) {
                Alert.alert(t('warning'), t('login.passive_msg'));
                return;
            }
            if (data && data.status) {
                await AsyncStorage.setItem('token', data.access_token);
                await AsyncStorage.setItem('is_admin', (data.admin_status == 1 ? 'admin' : 'user'));
                console.log(data.admin_status);
                setToken(data.access_token);
                navigation.replace('Home');
            } else {
                Alert.alert(t('warning'), t('login.login_error'))
            }

        } catch (error) {
            console.log(error)
        }
    };

    const clearData = async () => {
        const lang = await AsyncStorage.getItem('user-language');
        if (lang != null) {
            changeLanguage(lang)
        }

        AsyncStorage.removeItem('token');
        AsyncStorage.removeItem('is_admin');
    };

    const register = async () => {
        navigation.replace('Register');
    };

    const isFormValid = email.length > 0 && password.length > 0;
    const { t, i18n } = useTranslation();

    return (
        <LinearGradient LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }
            }
            end={{ x: 1, y: 1 }}
        >


            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >

                {/* Gradyan Arka Plan */}

                {/* Dil Seçici Butonu ve Dropdown */}
                <View style={styles.languageContainer}>
                    <TouchableOpacity
                        style={styles.languageButton}
                        onPress={toggleDropdown}
                        activeOpacity={0.8}
                    >
                        <View style={styles.languageFlagContainer}>
                            <Text style={styles.languageFlag}>{getCurrentLanguageFlag()}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Dropdown Liste */}
                    <Animated.View
                        style={[
                            styles.dropdownContainer,
                            {
                                opacity: dropdownAnim,
                                maxHeight: dropdownAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 200]
                                }),
                                transform: [{
                                    translateY: dropdownAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-10, 0]
                                    })
                                }]
                            }
                        ]}
                    >
                        {languages.map((language, index) => (
                            <TouchableOpacity
                                key={language.code}
                                style={[
                                    styles.dropdownItem,
                                    currentLanguage === language.code && styles.selectedDropdownItem,
                                    index === 0 && styles.firstDropdownItem,
                                    index === languages.length - 1 && styles.lastDropdownItem
                                ]}
                                onPress={() => changeLanguage(language.code)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.dropdownItemFlag}>{language.flag}</Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </View>

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
                            <Image style={{ height: 140, width: 140, borderRadius: 70 }} source={require('../assets/logo.jpeg')}></Image>
                            <View style={{ marginTop: 20, alignItems: 'center' }}>
                                <Text style={styles.welcomeText}>{t('login.welcome')}</Text>
                                <Text style={styles.subtitleText}>{t('login.sub_message')}</Text>
                            </View>
                        </View>

                        {/* Form Container */}
                        <View style={styles.formContainer}>

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <View style={styles.inputIconContainer}>
                                    <Text style={styles.inputIcon}>📧</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('login.email')}
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
                                    placeholder={t('login.password')}
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

                            {/* Login Button */}
                            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                                <TouchableOpacity
                                    style={[
                                        styles.loginButton,
                                        { opacity: isFormValid ? 1 : 0.6 }
                                    ]}
                                    onPress={handleLogin}
                                    disabled={!isFormValid || isLoading}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#FF6B6B', '#FF8E53']}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        {isLoading ? (
                                            <View style={styles.loadingContainer}>
                                                <View style={styles.spinner} />
                                                <Text style={styles.buttonText}>{t('login.login_loading')}</Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.buttonText}>{t('login.login')}</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* Sign Up Link */}
                            <View style={styles.signupContainer}>
                                <Text style={styles.signupText}>{t('login.register_msg')} </Text>
                                <TouchableOpacity onPress={register}>
                                    <Text style={styles.signupLink}>{t('login.register')}</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </Animated.View>

                </ScrollView>

            </KeyboardAvoidingView>
        </LinearGradient>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    languageContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        right: 20,
        zIndex: 1000,
    },
    languageButton: {
        alignItems: 'flex-end',
    },
    languageFlagContainer: {
        marginTop: 10,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    languageFlag: {
        fontSize: 45,
    },
    dropdownContainer: {
        marginTop: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        overflow: 'hidden',
        minWidth: 60,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    firstDropdownItem: {
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    lastDropdownItem: {
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    selectedDropdownItem: {
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
    },
    dropdownItemFlag: {
        fontSize: 24,
    },
    dropdownItemText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    selectedDropdownText: {
        color: '#667eea',
        fontWeight: 'bold',
    },
    dropdownCheckmark: {
        fontSize: 14,
        color: '#667eea',
        fontWeight: 'bold',
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
        marginTop: -100,
        flex: 1,
        justifyContent: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop:85
    },
    logoContainer: {
        width: 130,
        height: 130,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },

    welcomeText: {
        fontSize: 27,
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
    loginButton: {
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
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupText: {
        color: '#6C757D',
        fontSize: 14,
    },
    signupLink: {
        color: '#667eea',
        fontSize: 14,
        fontWeight: 'bold',
    },
});