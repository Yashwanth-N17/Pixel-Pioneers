import React from 'react';
import { Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { BudgetShell } from '../../components/budget/BudgetShell';
import { BudgetCard, PrimaryButton } from '../../components/budget/BudgetUi';
import { budgetApi } from '../../features/budget/budgetApi';
import { useBudgetStore } from '../../features/budget/budgetStore';

function ChipList({ title, items }: { title: string; items: string[] }) {
  return (
    <View className="gap-2 rounded-2xl bg-white p-4" style={{ borderWidth: 1, borderColor: '#eef2f7' }}>
      <Text className="text-base font-black text-slate-900">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {(items.length ? items : ['Not available']).map((item) => (
          <View key={item} className="rounded-xl bg-emerald-50 px-3 py-2">
            <Text className="font-bold text-emerald-700">{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SeasonalIncomeInsightsScreen() {
  const incomeSources = useBudgetStore((state) => state.incomeSources);
  const expenses = useBudgetStore((state) => state.expenses);
  const seasonalInsight = useBudgetStore((state) => state.seasonalInsight);
  const setSeasonalInsight = useBudgetStore((state) => state.setSeasonalInsight);
  const seasonalSources = incomeSources.filter((item) => item.seasonalFlag);
  const mutation = useMutation({
    mutationFn: () => budgetApi.seasonalIncome({
      incomeSources,
      expenses: Object.fromEntries(expenses.map((item) => [item.category, item.amount])),
      highIncomeMonths: seasonalSources.map((item) => item.seasonCategory).filter(Boolean),
    }),
    onSuccess: (data: any) => setSeasonalInsight(data),
  });

  return (
    <BudgetShell title="Seasonal Income" subtitle="Season planning">
      <BudgetCard title="Seasonal income sources" value={String(seasonalSources.length)} subtitle="Marked as seasonal" icon="cloud-rain" />
      <PrimaryButton label={mutation.isPending ? 'Checking seasons...' : 'Generate insights'} icon="zap" onPress={() => mutation.mutate()} />
      <ChipList title="High income seasons" items={seasonalInsight?.highIncomeMonths || []} />
      <ChipList title="Low income seasons" items={seasonalInsight?.lowIncomeMonths || []} />
      <ChipList title="Seasonal risk alerts" items={seasonalInsight?.riskPeriods || []} />
      <View className="gap-2 rounded-2xl bg-white p-4">
        <Text className="text-base font-black text-slate-900">Recommendations</Text>
        {(seasonalInsight?.recommendations || ['Run insights to get seasonal recommendations.']).map((item) => (
          <Text key={item} className="font-semibold text-slate-600">- {item}</Text>
        ))}
      </View>
    </BudgetShell>
  );
}
