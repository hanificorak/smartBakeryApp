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
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Bu import'u ekle
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';
import { useTranslation } from 'react-i18next';
import '../../src/i18n';

const CompanyScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets(); // Safe area insets'i al
    
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadCompanyData();
    }, []);

    const loadCompanyData = async () => {
        try {
            setLoading(true);
            const { data } = await api.post(Endpoint.GetCompanyInfo);
            console.log(data)
            setLoading(false);
            if (data && data.status) {
                setFormData({
                    name: data.obj.company_title,
                    address: data.obj.company_address,
                    phone: data.obj.company_phone
                })
            }

        } catch (error) {
            console.log(error)
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = t('company.name_required');
        }

        if (!formData.address.trim()) {
            newErrors.address = t('company.address_required');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            Alert.alert(t('company.error'), t('company.fill_fields'));
            return;
        }

        try {
            setSaving(true);

            const { data } = await api.post(Endpoint.SaveSettings, {
                title: formData.name,
                address: formData.address,
                phone: formData.phone
            });
            console.log(data)
            if (data && data.status) {
                Alert.alert(t('info'), t('company.save_success'));
            } else {
                Alert.alert(t('warning'), t('company.operation_failed'))
            }

        } catch (error) {
            console.error('Kaydetme hatası:', error);
            Alert.alert(t('company.error'), t('company.save_error'));
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Hata varsa temizle
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const renderInput = (field, label, icon, placeholder, options = {}) => (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={[styles.inputContainer, errors[field] && styles.inputError]}>
                <Ionicons
                    name={icon}
                    size={20}
                    color={errors[field] ? '#ef4444' : '#6b7280'}
                    style={styles.inputIcon}
                />
                <TextInput
                    style={[styles.textInput, options.multiline && styles.multilineInput]}
                    value={formData[field]}
                    onChangeText={(value) => handleInputChange(field, value)}
                    placeholder={placeholder}
                    placeholderTextColor="#9ca3af"
                    {...options}
                />
            </View>
            {errors[field] && (
                <Text style={styles.errorText}>{errors[field]}</Text>
            )}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.gradient}
                >
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#ffffff" />
                        <Text style={styles.loadingText}>{t('company.loading')}</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#667eea" />

            <LinearGradient
                colors={['#4B6CB7', '#182848']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{t('company.title')}</Text>
                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} // ScrollView'e padding ekle
                >
                    <View style={styles.formContainer}>
                        <View style={styles.formHeader}>
                            <Ionicons name="business" size={24} color="#6366f1" />
                            <Text style={styles.formTitle}>{t('company.form_title')}</Text>
                        </View>

                        <View style={styles.formContent}>
                            {renderInput(
                                'name',
                                t('company.name_label'),
                                'business-outline',
                                t('company.name_placeholder'),
                                { autoCapitalize: 'words' }
                            )}

                            {renderInput(
                                'address',
                                t('company.address_label'),
                                'location-outline',
                                t('company.address_placeholder'),
                                {
                                    multiline: true,
                                    numberOfLines: 3,
                                    textAlignVertical: 'top'
                                }
                            )}

                            {renderInput(
                                'phone',
                                t('company.phone_label'),
                                'call-outline',
                                t('company.phone_placeholder'),
                                { keyboardType: 'phone-pad' }
                            )}
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom container'a insets padding'i ekle */}
                <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <LinearGradient
                            colors={saving ? ['#9ca3af', '#9ca3af'] : ['#667eea', '#764ba2']}
                            style={styles.saveButtonGradient}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={20} color="#ffffff" />
                                    <Text style={styles.saveButtonText}>{t('company.save_changes')}</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default CompanyScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    flex: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
        paddingBottom: 20,
    },
    headerContent: {
        flexDirection: 'row',
        padding: 20
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        marginTop: -10,
        backgroundColor: '#f8fafc',
    },
    formContainer: {
        margin: 20,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginLeft: 12,
    },
    formContent: {
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        minHeight: 50,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        paddingVertical: 12,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
        marginLeft: 4,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#f0f4ff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#4338ca',
        marginLeft: 8,
        lineHeight: 18,
    },
    bottomContainer: {
        padding: 20,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    saveButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom:25
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#ffffff',
        fontSize: 16,
        marginTop: 12,
    },
});