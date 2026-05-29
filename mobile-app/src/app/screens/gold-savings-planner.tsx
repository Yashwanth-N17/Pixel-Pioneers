import React from 'react';
import { Text, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';

import { BudgetShell } from '../../components/budget/BudgetShell';
import { BudgetCard, Field, PrimaryButton, money } from '../../components/budget/BudgetUi';
import { budgetApi } from '../../features/budget/budgetApi';
import { useBudgetStore } from '../../features/budget/budgetStore';

export default function GoldSavingsPlannerScreen() {
  const goldSavingsData = useBudgetStore((state) => state.goldSavingsData);
  const setGoldSavingsData = useBudgetStore((state) => state.setGoldSavingsData);
  const [savingsAmount, setSavingsAmount] = React.useState('10000');
  const goldPrice = useQuery({
    queryKey: ['gold-price'],
    queryFn: budgetApi.getGoldPrice,
  });
  const mutation = useMutation({
    mutationFn: () => budgetApi.goldPlan({ savingsAmount: Number(savingsAmount) || 0 }),
    onSuccess: (data: any) => setGoldSavingsData(data),
  });
  const pricePerGram = (goldPrice.data as any)?.pricePerGram || 7200;

  return (
    <BudgetShell title="Gold Savings" subtitle="Gold equivalent savings">
      <BudgetCard
        title="Current gold value"
        value={money(pricePerGram)}
        subtitle="Price per gram"
        icon="award"
      />
      <Field label="Savings amount" value={savingsAmount} onChangeText={setSavingsAmount} keyboardType="numeric" />
      <PrimaryButton label={mutation.isPending ? 'Converting...' : 'Convert to gold'} icon="repeat" onPress={() => mutation.mutate()} />
      <BudgetCard title="Gold equivalent" value={`${goldSavingsData?.goldEquivalent || 0} grams`} icon="circle" />
      <BudgetCard title="Estimated future value" value={money(goldSavingsData?.estimatedGrowth || 0)} icon="trending-up" />
      <View className="gap-2 rounded-2xl bg-white p-4">
        <Text className="text-base font-black text-slate-900">Recommendations</Text>
        {(goldSavingsData?.recommendations || ['Enter savings to see gold planning advice.']).map((item) => (
          <Text key={item} className="font-semibold text-slate-600">- {item}</Text>
        ))}
      </View>
    </BudgetShell>
  );
}
