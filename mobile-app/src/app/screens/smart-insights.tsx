import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, PermissionsAndroid, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// @ts-ignore
import SmsAndroid from 'react-native-get-sms-android';

import { endpoints } from '../../services/api';
import { C } from '../../constants/colors';
import { useStore } from '../../store';

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
  const [manualSms, setManualSms] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const userLanguage = useStore((s: any) => s.user?.language) || 'en';

  useEffect(() => {
    fetchAndAnalyzeSms();
  }, []);

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

  const loadMockData = async () => {
    setLoading(true);
    setInsights([]);
    setScanned(false);
    console.warn("Falling back to mock data");
    const mockMessages = [
      { id: "1", sender: "VK-HDFCBK", body: "Rs 5000 withdrawn from HDFC a/c **1234 on 12-May. If not done by you call 18002026161.", timestamp: Date.now() },
      { id: "2", sender: "JD-JIOKBC", body: "Congratulations! Your mobile number has won Rs 25,00,000 in KBC Jio Lucky Draw. Call Mr. Sharma immediately on 9876543210 to claim your prize.", timestamp: Date.now() - 3600000 },
      { id: "3", sender: "MD-EPFGOV", body: "Dear Member, Your KYC details need immediate update to prevent account deactivation. Click here: http://bit.ly/kyc-update-epfo", timestamp: Date.now() - 7200000 },
      { id: "4", sender: "RM-MYNTRA", body: "Your order #12345 has been shipped and will be delivered by tomorrow. Track here: myntra.com/track", timestamp: Date.now() - 86400000 },
      { id: "5", sender: "AD-AXISBK", body: "Dear Customer, 439812 is your OTP for transaction of Rs 1500 at Amazon. Do not share it with anyone.", timestamp: Date.now() - 172800000 },
    ];
    
    // Hardcoded instant mock insights to save API calls in Expo Go
    const getReason = (en: string, hi: string, kn: string) => {
      if (userLanguage === 'hi') return hi;
      if (userLanguage === 'kn') return kn;
      return en;
    };

    const mockInsightsData = [
      { id: "2", status: "SCAM", sender: "JD-JIOKBC", body: mockMessages[1].body, reason: getReason("Fake lottery scam promising money.", "पैसे का वादा करने वाला नकली लॉटरी घोटाला।", "ಹಣದ ಭರವಸೆ ನೀಡುವ ನಕಲಿ ಲಾಟರಿ ಹಗರಣ.") },
      { id: "3", status: "SCAM", sender: "MD-EPFGOV", body: mockMessages[2].body, reason: getReason("Phishing link pretending to be KYC update.", "KYC अपडेट का दिखावा करने वाला फिशिंग लिंक।", "KYC ಅಪ್ಡೇಟ್ ಎಂದು ನಟಿಸುವ ಫಿಶಿಂಗ್ ಲಿಂಕ್.") },
      { id: "5", status: "WARNING", sender: "AD-AXISBK", body: mockMessages[4].body, reason: getReason("Bank OTP. Do not share it with anyone.", "बैंक OTP। इसे किसी के साथ शेयर न करें।", "ಬ್ಯಾಂಕ್ OTP. ಇದನ್ನು ಯಾರೊಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.") },
      { id: "1", status: "SAFE", sender: "VK-HDFCBK", body: mockMessages[0].body, reason: getReason("Standard bank withdrawal alert.", "सामान्य बैंक निकासी अलर्ट।", "ಸಾಮಾನ್ಯ ಬ್ಯಾಂಕ್ ಹಿಂತೆಗೆದುಕೊಳ್ಳುವಿಕೆ ಎಚ್ಚರಿಕೆ.") },
      { id: "4", status: "SAFE", sender: "RM-MYNTRA", body: mockMessages[3].body, reason: getReason("Standard shopping delivery update.", "सामान्य शॉपिंग डिलीवरी अपडेट।", "ಸಾಮಾನ್ಯ ಶಾಪಿಂಗ್ ವಿತರಣೆ ಅಪ್ಡೇಟ್.") },
    ];

    setInsights(mockInsightsData);
    setScanned(true);
    setLoading(false);
    Alert.alert("Simulated Mode", "Since you are in Expo Go without native SMS permissions, we are instantly showing 5 simulated test messages.");
  };

  const fetchAndAnalyzeSms = async () => {
    const hasPermission = await requestSmsPermission();
    if (!hasPermission) {
      await loadMockData();
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
            
            await processMessages(messages);
          } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to analyze SMS messages.');
            setLoading(false);
          }
        }
      );
    } catch (error) {
      console.warn("Native SMS read failed", error);
      await loadMockData();
    }
  };

  const processMessages = async (messages: any[]) => {
    try {
      // Send to AI Service
      const response = await endpoints.analyzeSms(messages, userLanguage);
      const data = response.data?.data?.result?.insights || response.data?.data?.insights || response.data?.insights || [];
      
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
  };

  const analyzeManualSms = async () => {
    if (!manualSms.trim()) {
      Alert.alert('Empty', 'Please paste an SMS message to analyze.');
      return;
    }
    setManualLoading(true);
    try {
      const messages = [{ id: "manual-" + Date.now(), sender: "Pasted Message", body: manualSms, timestamp: Date.now() }];
      const response = await endpoints.analyzeSms(messages, userLanguage);
      const data = response.data?.data?.result?.insights || response.data?.data?.insights || response.data?.insights || [];
      
      if (data.length > 0) {
        const insight = data[0];
        const resultItem = {
          ...insight,
          sender: "Pasted Message",
          body: manualSms,
        };
        // Prepend to insights so it shows at the top
        setInsights(prev => [resultItem, ...prev]);
        setScanned(true);
        setManualSms('');
        Alert.alert('Analysis Complete', `This message is flagged as: ${insight.status}`);
      } else {
        Alert.alert('Analysis Complete', 'No specific threats detected, but always stay cautious.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to analyze pasted SMS.');
    } finally {
      setManualLoading(false);
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
                <Ionicons name="refresh-outline" size={20} color={C.blue600} style={{ marginRight: 8 }} />
                <Text style={{ color: C.blue600, fontWeight: '900', fontSize: 16 }}>Rescan Recent SMS</Text>
              </>
            )}
          </TouchableOpacity>
        </Card>

        {/* Manual Input Section */}
        <Card style={{ backgroundColor: '#fff', padding: 20, borderWidth: 1, borderColor: C.slate200 }}>
          <Text style={{ color: C.slate900, fontSize: 16, fontWeight: '900', marginBottom: 8 }}>Or Paste a Suspicious SMS</Text>
          <TextInput
            value={manualSms}
            onChangeText={setManualSms}
            placeholder="Paste message here..."
            placeholderTextColor={C.slate400}
            multiline
            style={{ backgroundColor: C.slate50, borderRadius: 12, padding: 14, minHeight: 80, textAlignVertical: 'top', color: C.slate900, marginBottom: 12, borderWidth: 1, borderColor: C.slate200 }}
          />
          <TouchableOpacity
            onPress={analyzeManualSms}
            disabled={manualLoading}
            style={{ backgroundColor: C.emerald600, borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
          >
            {manualLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="search-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Analyze Text</Text>
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
