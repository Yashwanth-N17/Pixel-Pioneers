import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { C } from '../../constants/colors';
import { useStore } from '../../store';
import { useTranslations } from '../../hooks/useTranslations';

const baseInsights = {
  FARMER: [
    ['Mandi price timing', 'Growth', 'Tomato and onion rates are trending higher in the local mock market. Consider splitting sales across two mandi days.'],
    ['Input cost watch', 'Savings', 'Seed and fertilizer spending is above baseline. Keep separate receipts in Ledger this week.'],
    ['RTC readiness', 'Scheme', 'Your simulated RTC scan is ready for loan and scheme checks.'],
  ],
  SHOP_OWNER: [
    ['Udhar collection', 'Alert', 'Three customer balances can be followed up before weekly supplier payment day.'],
    ['Inventory cycle', 'Growth', 'Fast moving goods should be restocked weekly to protect cash rotation.'],
    ['Supplier credit', 'Savings', 'Supplier credit is active. Keep repayment date visible in Ledger.'],
  ],
  TAILOR: [
    ['Delivery queue', 'Alert', 'Prioritize urgent alteration orders before new stitching work.'],
    ['Cloth yield', 'Savings', 'Batch similar garment cuts to reduce cloth waste this week.'],
    ['Capacity plan', 'Growth', 'Keep 20 percent weekly capacity free for walk-in orders.'],
  ],
  DAILY_WAGE: [
    ['Shift target', 'Goal', 'You are tracking toward a full work month. Add missed-payment notes in Ledger.'],
    ['Cash safety', 'Safety', 'Split cash income into home expense and saving buckets on payment day.'],
    ['Employer stability', 'Growth', 'Same-employer work gives better repayment confidence for local loan estimates.'],
  ],
};

const TAG_COLOR: Record<string, string> = {
  Savings: C.emerald500,
  Goal: C.blue500,
  Alert: C.rose500,
  Safety: C.amber500,
  Growth: C.teal600,
  Scheme: '#64748b',
};

export default function InsightsScreen() {
  const router = useRouter();
  const t = useTranslations();
  const occupation = useStore((s) => s.occupation);
  const insights = baseInsights[occupation];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0f172a' }}>{t.smartInsights}</Text>
        <TouchableOpacity onPress={() => router.push('/screens/voice')} style={{ backgroundColor: '#ecfdf5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.emerald600 }}>{t.askAi}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {insights.map(([title, tag, desc]) => {
          const color = TAG_COLOR[tag] ?? '#64748b';
          return (
            <View
              key={title}
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                marginTop: 12,
                flexDirection: 'row',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
                overflow: 'hidden',
              }}
            >
              <View style={{ width: 6, backgroundColor: color }} />
              <View style={{ flex: 1, padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#1e293b', flex: 1 }} numberOfLines={1}>{title}</Text>
                  <View style={{ marginLeft: 8, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: `${color}1A` }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color }}>{tag}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: '#475569', lineHeight: 16 }}>{desc}</Text>
              </View>
            </View>
          );
        })}

        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/screens/smart-insights')} style={{ marginTop: 18 }}>
          <View style={{ backgroundColor: C.blue600, borderRadius: 16, padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginBottom: 4 }}>SMS Scam Guard</Text>
            <Text style={{ color: '#eff6ff', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              Protect yourself from phishing, fake lotteries, and malicious links. We use AI to scan your text messages and flag potential threats.
            </Text>
            <View style={{ marginTop: 12, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8 }}>
              <Text style={{ color: C.blue600, fontWeight: 'bold', fontSize: 13 }}>Scan Recent SMS</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/screens/voice')} style={{ marginTop: 18, marginBottom: 18 }}>
          <View style={{ backgroundColor: C.emerald600, borderRadius: 16, padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginBottom: 4 }}>{t.wantDeeperFinancialAnalysis}</Text>
            <Text style={{ color: '#ecfdf5', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              {t.voiceAssistantHelp}
            </Text>
            <View style={{ marginTop: 12, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8 }}>
              <Text style={{ color: C.emerald600, fontWeight: 'bold', fontSize: 13 }}>{t.startVoiceAssistant}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
