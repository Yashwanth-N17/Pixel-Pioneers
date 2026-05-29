import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { C } from '../../constants/colors';
import { useTranslations } from '../../hooks/useTranslations';

const { width: SW } = Dimensions.get('window');
const fmt = (n: number) => 'Rs ' + n.toLocaleString('en-IN');

const RING_SIZE = 160;
const STROKE = 14;

function ArthScoreRing({ score, max = 1000 }: { score: number; max?: number }) {
  const t = useTranslations();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: score / max,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [score, anim, max]);

  const pct = score / max;
  const ringColor = pct > 0.7 ? C.emerald500 : pct > 0.45 ? C.amber500 : C.rose500;
  const label = pct > 0.7 ? t.excellent : pct > 0.55 ? t.good : pct > 0.4 ? t.fair : t.poor;
  const labelColor = pct > 0.7 ? C.emerald600 : pct > 0.45 ? C.amber600 : C.rose600;
  const labelBg = pct > 0.7 ? C.emerald50 : pct > 0.45 ? '#fffbeb' : '#fff1f2';

  return (
    <View className="items-center mb-3">
      <View className="items-center justify-center relative rounded-full border-[#e2e8f0]" style={{ width: RING_SIZE, height: RING_SIZE, borderWidth: STROKE }}>
        <AnimatedArcFill anim={anim} color={ringColor} />
        <View className="items-center">
          <Text className="text-[34px] font-black text-slate-900 leading-[38px]">{score}</Text>
          <Text className="text-[13px] font-semibold text-slate-400">/{max}</Text>
          <View className="mt-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: labelBg }}>
            <Text className="text-[10px] font-black tracking-wider" style={{ color: labelColor }}>{label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function AnimatedArcFill({ anim, color }: { anim: Animated.Value; color: string }) {
  const rotateLeft = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '180deg', '180deg'], extrapolate: 'clamp' });
  const rotateRight = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-180deg', '0deg', '180deg'], extrapolate: 'clamp' });
  const rightOpacity = anim.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' });

  const half = RING_SIZE / 2;
  return (
    <View style={{ position: 'absolute', width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2 }}>
      <Animated.View style={{ position: 'absolute', width: half, height: RING_SIZE, left: half, overflow: 'hidden', opacity: rightOpacity }}>
        <Animated.View
          style={{
            width: RING_SIZE,
            height: RING_SIZE,
            borderRadius: RING_SIZE / 2,
            borderWidth: STROKE,
            borderColor: color,
            position: 'absolute',
            left: -half,
            transform: [{ rotate: rotateRight }],
            transformOrigin: `${half}px ${half}px`,
          }}
        />
      </Animated.View>
      <View style={{ position: 'absolute', width: half, height: RING_SIZE, left: 0, overflow: 'hidden' }}>
        <Animated.View
          style={{
            width: RING_SIZE,
            height: RING_SIZE,
            borderRadius: RING_SIZE / 2,
            borderWidth: STROKE,
            borderColor: color,
            position: 'absolute',
            left: 0,
            transform: [{ rotate: rotateLeft }],
            transformOrigin: `${half}px ${half}px`,
          }}
        />
      </View>
    </View>
  );
}

function RepaymentChart({ emi, income, months }: { emi: number; income: number; months: number }) {
  const bars = Array.from({ length: Math.min(months, 8) }, (_, i) => ({ month: `M${i + 1}`, emi, income }));
  const maxVal = Math.max(income, emi) * 1.1;
  const barW = (SW - 80) / bars.length - 6;

  return (
    <View className="mt-1">
      <View className="flex-row items-end h-[90px] gap-1">
        {bars.map((b, i) => (
          <View key={i} className="items-center flex-1">
            <View className="absolute bottom-0 rounded-t-sm" style={{ width: barW, height: (b.income / maxVal) * 80, backgroundColor: `${C.emerald400}55` }} />
            <View className="absolute bottom-0 rounded-t-sm" style={{ width: barW * 0.6, height: (b.emi / maxVal) * 80, backgroundColor: C.teal600 }} />
          </View>
        ))}
      </View>
      <View className="flex-row gap-1 mt-1">
        {bars.map((b, i) => (
          <Text key={i} className="flex-1 text-center text-[9px] text-slate-400">{b.month}</Text>
        ))}
      </View>
    </View>
  );
}

export default function LoanResultScreen() {
  const router = useRouter();
  const t = useTranslations();
  const params = useLocalSearchParams();
  const score = Number(params.score ?? 742);
  const emi = Number(params.emi ?? 2800);
  const total = Number(params.total ?? 50400);
  const eligible = Number(params.eligible ?? 45000);
  const tenure = Number(params.tenure ?? 18);
  const interest = Number(params.interest ?? 11.5);
  const income = Number(params.income ?? 12000);
  const risk = (params.risk ?? 'safe') as 'safe' | 'moderate' | 'high';
  const purpose = params.purpose ?? 'Working capital';

  // Parse dynamic arrays passed as stringified JSON params
  let parsedPositiveFactors: string[] = [];
  let parsedNegativeFactors: string[] = [];
  let parsedRiskFactors: string[] = [];
  let parsedProducts: any[] = [];

  try {
    if (params.positiveFactors) parsedPositiveFactors = JSON.parse(params.positiveFactors as string);
  } catch (e) {
    console.warn('Failed to parse positiveFactors', e);
  }

  try {
    if (params.negativeFactors) parsedNegativeFactors = JSON.parse(params.negativeFactors as string);
  } catch (e) {
    console.warn('Failed to parse negativeFactors', e);
  }

  try {
    if (params.riskFactors) parsedRiskFactors = JSON.parse(params.riskFactors as string);
  } catch (e) {
    console.warn('Failed to parse riskFactors', e);
  }

  try {
    if (params.recommendedProducts) parsedProducts = JSON.parse(params.recommendedProducts as string);
  } catch (e) {
    console.warn('Failed to parse recommendedProducts', e);
  }

  // Assemble dynamic or static fallback scoreFactors
  const scoreFactors =
    parsedPositiveFactors.length > 0 || parsedNegativeFactors.length > 0
      ? [
          ...parsedPositiveFactors.map((label) => ({ ok: true, label })),
          ...parsedNegativeFactors.map((label) => ({ ok: false, label })),
        ]
      : [
          { ok: true, label: t.regularTransactionsRecorded },
          { ok: true, label: t.noExistingDefaults },
          { ok: true, label: t.landCollateralAvailable },
          { ok: true, label: t.appHistorySixMonths },
          { ok: false, label: t.irregularIncomePastMonths },
          { ok: false, label: t.highExpenseRatio },
        ];

  const riskFactorsList =
    parsedRiskFactors.length > 0
      ? parsedRiskFactors
      : [t.seasonalIncomeThreeMonths, t.noFormalCreditHistory];

  const riskLabel = risk === 'safe' ? t.lowRiskBorrower : risk === 'moderate' ? t.moderateRiskBorrower : t.highRiskBorrower;
  const riskColor = risk === 'safe' ? C.emerald600 : risk === 'moderate' ? C.amber600 : C.rose600;
  const riskBg = risk === 'safe' ? C.emerald50 : risk === 'moderate' ? '#fffbeb' : '#fff1f2';

  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <LinearGradient colors={[C.emerald600, C.teal600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-row items-center px-4 pt-3 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-xl font-black text-white tracking-wide">ArthScore</Text>
          <Text className="text-[11px] text-white/75 mt-0.5">{t.loanEligibilityReport}</Text>
        </View>
        <View className="w-10" />
      </LinearGradient>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View className="bg-white mx-4 mt-4 rounded-3xl p-5 items-center shadow-sm">
            <ArthScoreRing score={score} />
            <View className="flex-row items-center px-3.5 py-1.5 rounded-full mb-2" style={{ backgroundColor: riskBg }}>
              <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: riskColor }} />
              <Text className="text-[13px] font-extrabold" style={{ color: riskColor }}>{riskLabel}</Text>
            </View>
            <Text className="text-xs text-slate-400 text-center">{t.basedOnIncomeExpensesHabits}</Text>
          </View>

          <SectionCard title={t.loanSummary}>
            <SummaryRow icon="✓" label={t.eligibleAmount} value={fmt(eligible)} valueColor={C.emerald600} />
            <SummaryRow icon="📅" label={t.bestTenure} value={`${tenure} ${t.months}`} />
            <SummaryRow icon="💰" label={t.monthlyEmi} value={fmt(emi)} />
            <SummaryRow icon="📊" label={t.interestRate} value={`~${interest}%`} />
            <SummaryRow icon="💸" label={t.totalPayable} value={fmt(total)} valueColor={C.rose600} />
          </SectionCard>

          <SectionCard title={t.repaymentForecast}>
            <Text className="text-xs text-slate-400 mb-3">{t.monthlyEmiVsIncomeOverTenure}</Text>
            <RepaymentChart emi={emi} income={income} months={tenure} />
          </SectionCard>

          <SectionCard title={t.whyThisScore}>
            {scoreFactors.map((f, i) => (
              <View key={i} className="flex-row items-center py-1.5">
                <Text className="text-[15px] mr-2">{f.ok ? '✅' : '⚠️'}</Text>
                <Text className="text-[13px] flex-1 font-medium" style={{ color: f.ok ? C.slate700 : C.amber600 }}>{f.label}</Text>
              </View>
            ))}
          </SectionCard>

          <SectionCard title={t.riskFactors}>
            {riskFactorsList.map((r, i) => (
              <View key={i} className="flex-row items-start py-1">
                <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-2.5" />
                <Text className="flex-1 text-[13px] text-slate-700 leading-5">{r}</Text>
              </View>
            ))}
          </SectionCard>

          <SectionCard title={t.recommendedProducts}>
            {parsedProducts.length > 0 ? (
              parsedProducts.map((p, i) => (
                <ProductCard
                  key={i}
                  icon={p.provider?.toLowerCase().includes('sbi') ? '🏛' : p.provider?.toLowerCase().includes('grameen') ? '🤝' : '🌾'}
                  name={`${p.provider} ${p.productName}`}
                  rate={p.interestRate?.endsWith('%') ? `${p.interestRate} p.a.` : `${p.interestRate}% p.a.`}
                  upto={`Upto Rs ${p.maxAmount?.toLocaleString('en-IN')}`}
                  tag={p.provider?.toLowerCase().includes('sbi') || p.provider?.toLowerCase().includes('nabard') ? 'Govt Scheme' : 'Microfinance'}
                  description={p.reason}
                  url={p.provider?.toLowerCase().includes('sbi') ? 'https://sbi.co.in' : 'https://nabard.org'}
                />
              ))
            ) : (
              <>
                <ProductCard icon="🏛" name={t.sbiKisanCreditCard ?? 'SBI Kisan Credit Card'} rate="7% p.a." upto="₹3L" tag={t.lowRiskBorrower} url="https://sbi.co.in" />
                <ProductCard icon="🌾" name={t.nabardFarmLoan ?? 'NABARD Farm Loan'} rate="9% p.a." upto="₹5L" url="https://nabard.org" />
                <ProductCard icon="🤝" name={t.grameenMfiLoan ?? 'Grameen MFI Loan'} rate="14% p.a." upto="₹1L" url="https://nabard.org" />
              </>
            )}
          </SectionCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-white mx-4 mt-4 rounded-3xl p-4 shadow-sm">
      <Text className="text-[15px] font-black text-slate-900 mb-2.5">{title}</Text>
      <View className="h-[1px] bg-slate-100 mb-3" />
      {children}
    </View>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View className="flex-row items-center py-2 border-b border-slate-50">
      <Text className="text-base mr-2.5 w-[22px]">{icon}</Text>
      <Text className="flex-1 text-[13px] text-slate-600 font-medium">{label}</Text>
      <Text className="text-sm font-black text-slate-900" style={valueColor ? { color: valueColor } : {}}>{value}</Text>
    </View>
  );
}

function ProductCard({
  icon,
  name,
  rate,
  upto,
  tag,
  description,
  url,
}: {
  icon: string;
  name: string;
  rate: string;
  upto: string;
  tag?: string;
  description?: string;
  url?: string;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => url && Linking.openURL(url)} className="mb-2.5 rounded-2xl overflow-hidden border border-slate-100 bg-white p-3.5">
      <View className="flex-row items-start">
        <Text className="text-xl mr-3 mt-0.5">{icon}</Text>
        <View className="flex-1">
          <View className="flex-row items-center flex-wrap gap-2">
            <Text className="text-[13px] font-black text-slate-900">{name}</Text>
            {tag ? (
              <View className="px-2 py-0.5 rounded-full bg-emerald-50">
                <Text className="text-[9px] font-black text-emerald-700">{tag}</Text>
              </View>
            ) : null}
          </View>
          <Text className="text-[12px] text-slate-500 font-medium mt-0.5">{rate} • {upto}</Text>
          {description ? (
            <Text className="text-[11px] text-slate-400 mt-1 leading-4">{description}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
