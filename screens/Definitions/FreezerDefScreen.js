import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    StatusBar,
    Platform,
    ScrollView,
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    TextInput,
    Keyboard,
    TouchableWithoutFeedback,
    Modal as RNModal,
    FlatList,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../tools/api';
import Endpoint from '../../tools/endpoint';
import {
    Snackbar,
    ActivityIndicator,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import '../../src/i18n';

const { width, height } = Dimensions.get('window');

export default function FreezerDefScreen({ navigation, setToken }) {
    const { t } = useTranslation();
    const [freezers, setFreezers] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newFreezerName, setNewFreezerName] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [editingFreezerId, setEditingFreezerId] = useState(null);

    const onDismissSnackbar = () => setSnackbarVisible(false);

    const fetchFreezers = async () => {
        setLoading(true);
        const { data } = await api.post(Endpoint.FreezerDefList);
        setLoading(false)
        if (data && data.status) {
            setFreezers(data.obj);
        }
    };

    useEffect(() => {
        fetchFreezers();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchFreezers();
        }, [])
    );

    const handleAddFreezer = async () => {
        if (!newFreezerName.trim()) {
            Alert.alert(t('warning'), t('freezer.name_required'));
            return;
        }

        setLoading(true);

        const { data } = await api.post(Endpoint.FreezerDefSave, { name: newFreezerName, id: editingFreezerId });
        setLoading(false);
        if (data && data.status) {

            setModalVisible(false);
            setNewFreezerName('');
            setEditingFreezerId(null);
            fetchFreezers();

            Alert.alert(t('info'), t('product.op_success'));
        } else {
            Alert.alert(t('error'), t('users.operation_failed'));

        }

    };

    const handleEditFreezer = (freezer) => {
        setNewFreezerName(freezer.name);
        setEditingFreezerId(freezer.id);
        setModalVisible(true);
    };

    const handleDeleteFreezer = (freezerId) => {
        Alert.alert(
            t('product.delete_confirm_title'),
            t('product.delete_confirm_message'),
            [
                { text: t('cancel'), style: 'delete' },
                {
                    text: t('delete'),
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const {data} = await api.post(Endpoint.FreezerDefDelete, { id: freezerId });
                            if(data && data.status){
                                Alert.alert(t('info'), t('product.op_success'));
                                fetchFreezers();
                            }else{
                                Alert.alert(t('error'), t('users.operation_failed'));
                            }
                        } catch (error) {
                            console.error('Error deleting freezer:', error);
                            setSnackbarMessage(t('An error occurred while deleting the freezer.'));
                            setSnackbarVisible(true);
                        } finally {
                            setLoading(false);
                        }
                    },
                    style: 'destructive',
                },
            ],
            { cancelable: false }
        );
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchFreezers();
    }, []);

    const renderFreezerItem = ({ item }) => (
        <View style={styles.freezerItem}>
            <Text style={styles.freezerName}>{item.name}</Text>
            <View style={styles.freezerActions}>
                <TouchableOpacity onPress={() => handleEditFreezer(item)} style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteFreezer(item.id)} style={[styles.actionButton, styles.deleteButton]}>
                    <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4a90e2" />
            <LinearGradient
                    colors={['#4B6CB7', '#182848']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>{t('freezer.def_title')}</Text>
                <TouchableOpacity
                    onPress={() => {
                        setNewFreezerName('');
                        setEditingFreezerId(null);
                        setModalVisible(true);
                    }}
                    style={styles.addNewButton}
                >
                    <Text style={styles.addNewButtonText}>+</Text>
                </TouchableOpacity>
            </LinearGradient>

            {loading && <ActivityIndicator animating={true} color="#4a90e2" style={styles.activityIndicator} />}

            <FlatList
                data={freezers}
                renderItem={renderFreezerItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4a90e2']}
                        tintColor={'#4a90e2'}
                    />
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyListContainer}>
                            <Text style={styles.emptyListText}>{t('no_record')}</Text>
                            <Text style={styles.emptyListSubText}>{t('freezer.add_record')}</Text>
                        </View>
                    )
                }
            />

            <RNModal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                    setNewFreezerName('');
                    setEditingFreezerId(null);
                }}
            >
                <KeyboardAvoidingView
                    style={styles.centeredView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalView}>
                            <Text style={styles.modalTitle}>{editingFreezerId ? t('freezer.add_record') : t('freezer.add_record')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholderTextColor="#ccc"
                                value={newFreezerName}
                                onChangeText={setNewFreezerName}
                            />
                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonClose]}
                                    onPress={() => {
                                        setModalVisible(!modalVisible);
                                        setNewFreezerName('');
                                        setEditingFreezerId(null);
                                    }}
                                >
                                    <Text style={styles.textStyle}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonSave]}
                                    onPress={handleAddFreezer}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator animating={true} color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.textStyle}>{editingFreezerId ? t('product.update') : t('save')}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </RNModal>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={onDismissSnackbar}
                duration={3000}
                style={styles.snackbar}
                action={{
                    label: t('Dismiss'),
                    onPress: () => {
                        onDismissSnackbar();
                    },
                }}
            >
                {snackbarMessage}
            </Snackbar>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        width: '100%',
        height: Platform.OS === 'ios' ? 80 : 40, // Increased height for iOS to accommodate notch
        paddingTop: Platform.OS === 'ios' ? 10 : 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },

    headerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    addNewButton: {
        backgroundColor: '#28a745',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    addNewButtonText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        lineHeight: 30, // Adjust line height to center the '+'
    },
    activityIndicator: {
        marginTop: 20,
    },
    listContent: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    freezerItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    freezerName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    freezerActions: {
        flexDirection: 'row',
    },
    actionButton: {
        marginLeft: 10,
        padding: 8,
        borderRadius: 5,
        backgroundColor: '#f0f0f0',
    },
    deleteButton: {
        backgroundColor: '#ff4d4f',
    },
    actionButtonText: {
        fontSize: 18,
        color: '#333',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%',
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        width: '100%',
        marginBottom: 20,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        borderRadius: 10,
        padding: 12,
        elevation: 2,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    buttonClose: {
        backgroundColor: '#f44336',
    },
    buttonSave: {
        backgroundColor: '#4a90e2',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    snackbar: {
        backgroundColor: '#333',
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyListText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 5,
        fontWeight: 'bold',
    },
    emptyListSubText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
});