import React from 'react';
import { Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { BudgetShell } from '../../components/budget/BudgetShell';
import { BudgetCard, PrimaryButton, money } from '../../components/budget/BudgetUi';
import { budgetApi } from '../../features/budget/budgetApi';
import { useBudgetStore } from '../../features/budget/budgetStore';

export default function AiBudgetPlannerScreen() {
  const snapshot = useBudgetStore((state) => state.snapshot());
  const expenses = useBudgetStore((state) => state.expenses);
  const aiPlan = useBudgetStore((state) => state.aiPlan);
  const setAiPlan = useBudgetStore((state) => state.setAiPlan);
  const mutation = useMutation({
    mutationFn: () => budgetApi.budgetPlan({
      income: snapshot.totalIncome,
      expenses: Object.fromEntries(expenses.map((item) => [item.category, item.amount])),
      goals: { emergency: true, education: true, gold: true },
    }),
    onSuccess: (data: any) => setAiPlan(data),
  });

  return (
    <BudgetShell title="AI Budget Planner" subtitle="AI ಬಜೆಟ್ ಸಲಹೆಗಳು">
      <BudgetCard title="Recommended savings" value={money(aiPlan?.recommendedSavings || snapshot.recommendedSavings)} icon="target" />
      <PrimaryButton label={mutation.isPending ? 'Planning...' : 'Generate AI plan'} icon="zap" onPress={() => mutation.mutate()} />
      <View className="gap-2 rounded-2xl bg-white p-4">
        <Text className="text-base font-black text-slate-900">Warnings</Text>
        {(aiPlan?.warnings?.length ? aiPlan.warnings : ['No overspending warnings yet.']).map((item) => (
          <Text key={item} className="font-semibold text-amber-700">- {item}</Text>
        ))}
      </View>
      <View className="gap-2 rounded-2xl bg-white p-4">
        <Text className="text-base font-black text-slate-900">Smart recommendations</Text>
        {(aiPlan?.recommendations || ['Tap generate to get rural-friendly recommendations.']).map((item) => (
          <Text key={item} className="font-semibold text-slate-600">- {item}</Text>
        ))}
      </View>
      <View className="gap-2 rounded-2xl bg-white p-4">
        <Text className="text-base font-black text-slate-900">Category limits</Text>
        {Object.entries(aiPlan?.suggestedCategoryLimits || {}).map(([key, value]) => (
          <Text key={key} className="font-semibold text-slate-600">{key.replace('_', ' ')}: {money(Number(value))}</Text>
        ))}
      </View>
    </BudgetShell>
  );
}
