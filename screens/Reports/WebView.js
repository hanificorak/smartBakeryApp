import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';

export default function PdfViewer({ pdfUrl }) {
    const [base64Data, setBase64Data] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!pdfUrl) return;

   

        
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
           
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    pdf: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
