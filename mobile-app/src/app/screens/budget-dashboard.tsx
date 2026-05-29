import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BudgetShell } from '../../components/budget/BudgetShell';
import { BudgetCard, ProgressBar, money } from '../../components/budget/BudgetUi';
import { connectBudgetRealtime } from '../../features/budget/budgetRealtime';
import { useBudgetStore } from '../../features/budget/budgetStore';

const actions = [
  ['Income', '/screens/income-management'],
  ['Expenses', '/screens/expense-tracker'],
  ['AI Budget', '/screens/ai-budget-planner'],
  ['Emergency', '/screens/emergency-fund-planner'],
  ['Education', '/screens/child-education-planner'],
  ['Gold', '/screens/gold-savings-planner'],
  ['Cash Flow', '/screens/cash-flow-forecast'],
  ['Seasons', '/screens/seasonal-income-insights'],
] as const;

export default function BudgetDashboardScreen() {
  const router = useRouter();
  const snapshot = useBudgetStore((state) => state.snapshot());
  const aiPlan = useBudgetStore((state) => state.aiPlan);
  const forecast = useBudgetStore((state) => state.forecast);
  const seasonalInsight = useBudgetStore((state) => state.seasonalInsight);

  React.useEffect(() => {
    let disconnect: undefined | (() => void);
    connectBudgetRealtime().then((connection) => {
      disconnect = connection?.disconnect;
    });
    return () => disconnect?.();
  }, []);

  return (
    <BudgetShell title="Budget Planning" subtitle="ಬಜೆಟ್ ಯೋಜನೆ">
      <View className="flex-row gap-3">
        <View className="flex-1"><BudgetCard title="Income" value={money(snapshot.totalIncome)} icon="trending-up" /></View>
        <View className="flex-1"><BudgetCard title="Expenses" value={money(snapshot.totalExpenses)} icon="trending-down" /></View>
      </View>
      <BudgetCard title="Suggested savings" value={money(snapshot.recommendedSavings)} subtitle="AI recommended monthly target" icon="target" />
      <BudgetCard title="Emergency fund" subtitle={`${Math.round(snapshot.emergencyProgress * 100)}% ready`} icon="shield" />
      <ProgressBar progress={snapshot.emergencyProgress} />
      <BudgetCard title="Education savings" subtitle={`${Math.round(snapshot.educationProgress * 100)}% ready`} icon="book-open" />
      <ProgressBar progress={snapshot.educationProgress} />
      <BudgetCard title="Gold savings value" value={money(snapshot.goldValue)} subtitle="Estimated future value" icon="award" />
      <BudgetCard title="Cash flow forecast" value={forecast ? money(forecast.predictedBalance) : 'Run forecast'} subtitle={forecast?.warnings?.[0] || 'Next month balance prediction'} icon="activity" />
      <BudgetCard title="Seasonal alerts" subtitle={seasonalInsight?.riskPeriods?.join(', ') || 'No seasonal risks yet'} icon="cloud-rain" />
      <View className="gap-2 rounded-2xl bg-white p-4">
        <Text className="text-base font-black text-slate-900">AI recommendations</Text>
        {(aiPlan?.recommendations || ['Run AI budget planner to get smart recommendations.']).map((item) => (
          <Text key={item} className="text-sm font-semibold text-slate-600">- {item}</Text>
        ))}
      </View>
      <View className="flex-row flex-wrap gap-3">
        {actions.map(([label, href]) => (
          <TouchableOpacity key={label} onPress={() => router.push(href as any)} className="min-h-[52px] flex-1 basis-[45%] items-center justify-center rounded-2xl bg-white px-3">
            <Text className="text-center font-black text-emerald-700">{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </BudgetShell>
  );
}
