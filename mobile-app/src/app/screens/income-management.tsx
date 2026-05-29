import React from 'react';
import { Switch, Text, View } from 'react-native';

import { BudgetShell, SimpleListItem } from '../../components/budget/BudgetShell';
import { Field, PrimaryButton, Segmented, money } from '../../components/budget/BudgetUi';
import { useBudgetStore } from '../../features/budget/budgetStore';
import type { BudgetFrequency } from '../../features/budget/types';

export default function IncomeManagementScreen() {
  const incomeSources = useBudgetStore((state) => state.incomeSources);
  const addIncomeSource = useBudgetStore((state) => state.addIncomeSource);
  const [sourceName, setSourceName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [frequency, setFrequency] = React.useState<BudgetFrequency>('monthly');
  const [seasonalFlag, setSeasonalFlag] = React.useState(false);
  const [seasonCategory, setSeasonCategory] = React.useState('harvest');
  const isSeasonal = seasonalFlag || frequency === 'seasonal';

  return (
    <BudgetShell title="Income Management" subtitle="Income sources">
      <Field label="Source name" value={sourceName} onChangeText={setSourceName} placeholder="Milk, crop sale, wages" />
      <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <Segmented value={frequency} options={['daily', 'weekly', 'monthly', 'seasonal']} onChange={(value) => setFrequency(value as BudgetFrequency)} />
      <View className="min-h-[56px] flex-row items-center justify-between rounded-2xl bg-white px-4" style={{ borderWidth: 1, borderColor: '#eef2f7' }}>
        <Text className="text-base font-black text-slate-800">Seasonal income</Text>
        <Switch value={isSeasonal} onValueChange={setSeasonalFlag} />
      </View>
      {isSeasonal ? (
        <Field label="Season category" value={seasonCategory} onChangeText={setSeasonCategory} />
      ) : null}
      <PrimaryButton
        label="Add income"
        icon="plus"
        onPress={() => {
          addIncomeSource({
            sourceName: sourceName || 'Income source',
            amount: Number(amount) || 0,
            frequency,
            seasonalFlag: isSeasonal,
            seasonCategory: isSeasonal ? seasonCategory : null,
          });
          setSourceName('');
          setAmount('');
          setSeasonalFlag(false);
        }}
      />
      {incomeSources.map((item) => (
        <SimpleListItem key={item.id} title={item.sourceName} subtitle={`${item.frequency}${item.seasonalFlag ? ` - ${item.seasonCategory}` : ''}`} amount={money(item.amount)} />
      ))}
    </BudgetShell>
  );
}
