import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Pdf from 'react-native-pdf';
import RNBlobUtil from 'react-native-blob-util';

export default function PdfViewer({ pdfUrl }) {
    const [base64Data, setBase64Data] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!pdfUrl) return;

        setLoading(true);

        RNBlobUtil.config({ fileCache: true })
            .fetch('GET', pdfUrl, {
                // API token veya header gerekiyorsa buraya ekle:
                // Authorization: `Bearer ${token}`
            })
            .then((res) => res.base64())
            .then((base64) => {
                setBase64Data(base64);
                setLoading(false);
            })
            .catch((err) => {
                console.log('PDF indirme hatası:', err);
                setLoading(false);
            });
    }, [pdfUrl]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!base64Data) return null;

    const source = { uri: `data:application/pdf;base64,${base64Data}` };

    return (
        <View style={styles.container}>
            <Pdf
                source={source}

                style={styles.pdf}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    pdf: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
