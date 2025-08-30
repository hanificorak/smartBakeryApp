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
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    FlatList,
    Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';
import { Modal, Portal, Provider, Button, ActivityIndicator, Checkbox } from 'react-native-paper';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';

const AddFreezerScreen = ({ navigation }) => {
    const [freezerName, setFreezerName] = useState('');
    const [workingDegree, setWorkingDegree] = useState('');
    const [description, setDescription] = useState('');
    const [editId, setEditId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const route = useRoute();
    const { name, temp, desc, id } = route.params || {}; // parametreler opsiyonel


    useEffect(() => {
        loadSetData();
    }, []);

    const loadSetData = async () => {
        setFreezerName((name == null ? '' : name));
        setWorkingDegree(temp);
        setDescription(desc);
        setEditId(id);

    };
    const handleSave = async () => {

        if (!freezerName) {
            Alert.alert('Hata', 'Dolap adı gereklidir!');
            return;
        }

        if (!workingDegree) {
            Alert.alert('Hata', 'Çalışma derecesi gereklidir!');
            return;
        }

        const param = {
            name: freezerName,
            temp: workingDegree,
            desc: description,
            id: editId
        };

        setIsLoading(true);
        const { data } = await api.post(Endpoint.FreeSave, param);
        setIsLoading(false);
        if (data && data.status) {
            navigation.replace('FreezerScreen');
            Alert.alert('Bilgi', 'Bilgiler başarıyla kayıt edildi.');
        } else {
            Alert.alert('Uyarı', 'İşlem başarısız.');
        }

    };

    return (
        <Provider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#2196F3" />

                <LinearGradient
          colors={['#4B6CB7', '#182848']}
                    style={styles.header}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Buzdolabı Çalışma Bilgisi {name}</Text>
                    <View style={styles.headerSpacer} />
                </LinearGradient>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 40}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.flex1}>
                            <ScrollView
                                style={styles.content}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.scrollContent}
                                keyboardShouldPersistTaps="handled"
                            >
                                <View style={styles.formContainer}>

                                    {/* Dolap Adı */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Dolap Adı *</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={freezerName}
                                            onChangeText={setFreezerName}
                                            placeholder="Dolap adını giriniz"
                                            placeholderTextColor="#999"
                                        />
                                    </View>

                                    {/* Çalışma Derecesi */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Çalışma Derecesi (°C) *</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={workingDegree}
                                            onChangeText={(text) => {
                                                // Sadece rakamlar ve '-' işaretini kabul et
                                                const cleanedText = text.replace(/[^0-9.-]/g, '');
                                                setWorkingDegree(cleanedText);
                                            }}
                                            placeholder="Örn: -18"
                                            placeholderTextColor="#999"
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    {/* Açıklama */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Açıklama</Text>
                                        <TextInput
                                            style={[styles.textInput, styles.textAreaInput]}
                                            value={description}
                                            onChangeText={setDescription}
                                            placeholder="Açıklama giriniz (isteğe bağlı)"
                                            placeholderTextColor="#999"
                                            multiline={true}
                                            numberOfLines={3}
                                            textAlignVertical="top"
                                        />
                                    </View>

                                    {/* Kaydet Butonu - ScrollView içinde */}
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={[
                                                styles.saveButton,
                                                (!freezerName || !workingDegree || isLoading) && styles.saveButtonDisabled
                                            ]}
                                            onPress={handleSave}
                                            disabled={!freezerName|| !workingDegree || isLoading}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.saveButtonText}>Kaydet</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Provider>
    );
};

export default AddFreezerScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerTitle: {
        flex: 1,
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    keyboardView: {
        flex: 1,
    },
    flex1: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    formContainer: {
        padding: 20,
        flex: 1,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    textAreaInput: {
        height: 80,
        paddingTop: 12,
    },
    buttonContainer: {
        marginTop: 0,
        paddingTop: 0,
    },
    saveButton: {
        backgroundColor: '#2196F3',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    saveButtonDisabled: {
        backgroundColor: '#cccccc',
        elevation: 0,
        shadowOpacity: 0,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});