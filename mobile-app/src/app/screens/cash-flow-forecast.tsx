import React from 'react';
import { Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { BudgetShell } from '../../components/budget/BudgetShell';
import { BudgetCard, Field, PrimaryButton, money } from '../../components/budget/BudgetUi';
import { budgetApi } from '../../features/budget/budgetApi';
import { useBudgetStore } from '../../features/budget/budgetStore';

export default function CashFlowForecastScreen() {
  const snapshot = useBudgetStore((state) => state.snapshot());
  const forecast = useBudgetStore((state) => state.forecast);
  const setForecast = useBudgetStore((state) => state.setForecast);
  const [currentBalance, setCurrentBalance] = React.useState('5000');
  const mutation = useMutation({
    mutationFn: () => budgetApi.cashflowForecast({
      income: snapshot.totalIncome,
      expenses: snapshot.totalExpenses,
      currentBalance: Number(currentBalance) || 0,
    }),
    onSuccess: (data: any) => setForecast(data),
  });
  const values = [
    ['Worst', forecast?.worstCase || 0],
    ['Predicted', forecast?.predictedBalance || 0],
    ['Best', forecast?.bestCase || 0],
  ] as const;
  const max = Math.max(1, ...values.map(([, value]) => Math.abs(value)));

  return (
    <BudgetShell title="Cash Flow Forecast" subtitle="Next month balance">
      <BudgetCard title="Income used" value={money(snapshot.totalIncome)} icon="trending-up" />
      <BudgetCard title="Expenses used" value={money(snapshot.totalExpenses)} icon="trending-down" />
      <Field label="Current balance" value={currentBalance} onChangeText={setCurrentBalance} keyboardType="numeric" />
      <PrimaryButton label={mutation.isPending ? 'Forecasting...' : 'Run forecast'} icon="activity" onPress={() => mutation.mutate()} />
      <BudgetCard title="Predicted next month balance" value={money(forecast?.predictedBalance || 0)} icon="calendar" />
      <View className="gap-3 rounded-2xl bg-white p-4">
        <Text className="text-base font-black text-slate-900">Trend graph</Text>
        {values.map(([label, value]) => (
          <View key={label}>
            <View className="mb-1 flex-row justify-between">
              <Text className="font-bold text-slate-600">{label}</Text>
              <Text className="font-black text-slate-900">{money(value)}</Text>
            </View>
            <View className="h-3 overflow-hidden rounded-full bg-slate-100">
              <View
                className={value < 0 ? 'h-3 rounded-full bg-rose-500' : 'h-3 rounded-full bg-emerald-500'}
                style={{ width: `${Math.max(6, Math.min(100, (Math.abs(value) / max) * 100))}%` }}
              />
            </View>
          </View>
        ))}
      </View>
      <View className="gap-2 rounded-2xl bg-white p-4">
        <Text className="text-base font-black text-slate-900">Deficit warnings</Text>
        {(forecast?.warnings?.length ? forecast.warnings : ['No deficit warnings yet.']).map((item) => (
          <Text key={item} className="font-semibold text-amber-700">- {item}</Text>
        ))}
      </View>
    </BudgetShell>
  );
}
