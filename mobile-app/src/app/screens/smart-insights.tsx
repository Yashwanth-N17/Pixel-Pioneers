import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, PermissionsAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// @ts-ignore
import SmsAndroid from 'react-native-get-sms-android';

import { endpoints } from '../../services/api';
import C from '../../constants/colors';

const Card = ({ children, style = {} }: any) => (
  <View style={[{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }, style]}>
    {children}
  </View>
);

export default function SmartInsightsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [scanned, setScanned] = useState(false);

  const requestSmsPermission = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Unsupported', 'This feature is only available on Android.');
      return false;
    }
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: "SMS Permission Needed",
          message: "ArthSaathi needs access to your SMS to scan for scams and phishing.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const fetchAndAnalyzeSms = async () => {
    const hasPermission = await requestSmsPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Cannot read SMS without permission.');
      return;
    }

    setLoading(true);
    setInsights([]);
    setScanned(false);

    try {
      // Fetch last 50 SMS
      const filter = {
        box: 'inbox',
        maxCount: 50,
      };

      SmsAndroid.list(
        JSON.stringify(filter),
        (fail: any) => {
          console.error("Failed with this error: " + fail);
          setLoading(false);
          Alert.alert('Error', 'Failed to read SMS messages.');
        },
        async (count: number, smsList: string) => {
          try {
            const arr = JSON.parse(smsList);
            const messages = arr.map((msg: any) => ({
              id: msg._id.toString(),
              sender: msg.address,
              body: msg.body,
              timestamp: msg.date,
            }));

            // Send to AI Service
            const response = await endpoints.analyzeSms(messages);
            const data = response.data?.data?.insights || response.data?.insights || [];
            
            // Map the insights back to the original messages for display
            const combined = data.map((insight: any) => {
              const original = messages.find((m: any) => m.id === insight.id);
              return {
                ...insight,
                sender: original?.sender || 'Unknown',
                body: original?.body || '',
              };
            });

            // Filter out safe messages or sort them so scams appear first
            const sorted = combined.sort((a: any, b: any) => {
              if (a.status === 'SCAM') return -1;
              if (b.status === 'SCAM') return 1;
              if (a.status === 'WARNING') return -1;
              if (b.status === 'WARNING') return 1;
              return 0;
            });

            setInsights(sorted);
            setScanned(true);
          } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to analyze SMS messages.');
          } finally {
            setLoading(false);
          }
        }
      );
    } catch (error) {
      console.error(error);
      setLoading(false);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'SCAM') return C.rose600;
    if (status === 'WARNING') return C.amber600;
    return C.emerald600;
  };

  const getStatusBg = (status: string) => {
    if (status === 'SCAM') return '#FFF1F2'; // rose-50
    if (status === 'WARNING') return '#FFFBEB'; // amber-50
    return '#ECFDF5'; // emerald-50
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.slate50 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <Ionicons name="chevron-back" size={24} color={C.slate800} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '900', color: C.slate900, marginLeft: 16 }}>Smart Insights</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Card style={{ backgroundColor: C.blue600, padding: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="shield-checkmark" size={28} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginLeft: 10 }}>SMS Scam Guard</Text>
          </View>
          <Text style={{ color: '#E0F2FE', fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
            Protect yourself from phishing, fake lotteries, and malicious links. We use AI to scan your last 50 text messages and flag potential threats.
          </Text>
          <TouchableOpacity
            onPress={fetchAndAnalyzeSms}
            disabled={loading}
            style={{ backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
          >
            {loading ? (
              <ActivityIndicator color={C.blue600} />
            ) : (
              <>
                <Ionicons name="scan-outline" size={20} color={C.blue600} style={{ marginRight: 8 }} />
                <Text style={{ color: C.blue600, fontWeight: '900', fontSize: 16 }}>Scan Recent SMS</Text>
              </>
            )}
          </TouchableOpacity>
        </Card>

        {scanned && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: C.slate900, fontSize: 18, fontWeight: '900', marginBottom: 12 }}>Analysis Results</Text>
            
            {insights.length === 0 ? (
              <Card>
                <Text style={{ color: C.slate500, textAlign: 'center' }}>No messages found.</Text>
              </Card>
            ) : (
              insights.map((item, idx) => (
                <Card key={idx} style={{ borderColor: getStatusBg(item.status), borderWidth: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: C.slate900, fontWeight: '900' }}>{item.sender}</Text>
                    <View style={{ backgroundColor: getStatusBg(item.status), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ color: getStatusColor(item.status), fontWeight: '900', fontSize: 10 }}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={{ color: C.slate600, fontSize: 13, marginBottom: 10 }} numberOfLines={3}>
                    "{item.body}"
                  </Text>
                  <View style={{ backgroundColor: C.slate50, padding: 10, borderRadius: 8 }}>
                    <Text style={{ color: getStatusColor(item.status), fontSize: 13, fontWeight: '700' }}>
                      <Ionicons name="information-circle" size={14} /> AI Insight:
                    </Text>
                    <Text style={{ color: C.slate700, fontSize: 13, marginTop: 4 }}>
                      {item.reason}
                    </Text>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
