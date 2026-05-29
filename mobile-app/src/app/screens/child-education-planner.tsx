import React from 'react';
import { Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { BudgetShell } from '../../components/budget/BudgetShell';
import { BudgetCard, Field, PrimaryButton, money } from '../../components/budget/BudgetUi';
import { budgetApi } from '../../features/budget/budgetApi';
import { useBudgetStore } from '../../features/budget/budgetStore';

export default function ChildEducationPlannerScreen() {
  const addEducationPlan = useBudgetStore((state) => state.addEducationPlan);
  const latest = useBudgetStore((state) => state.educationPlans[0]);
  const [childAge, setChildAge] = React.useState('8');
  const [targetAmount, setTargetAmount] = React.useState('300000');
  const [yearsRemaining, setYearsRemaining] = React.useState('10');
  const mutation = useMutation({
    mutationFn: () => budgetApi.educationPlan({
      childAge: Number(childAge),
      targetAmount: Number(targetAmount),
      yearsRemaining: Number(yearsRemaining),
    }),
    onSuccess: (data: any) => addEducationPlan(data),
  });

  return (
    <BudgetShell title="Child Education Planner" subtitle="ಮಕ್ಕಳ ಶಿಕ್ಷಣ ಉಳಿತಾಯ">
      <Field label="Child age" value={childAge} onChangeText={setChildAge} keyboardType="numeric" />
      <Field label="Target education goal" value="College / Skill training" onChangeText={() => {}} />
      <Field label="Years remaining" value={yearsRemaining} onChangeText={setYearsRemaining} keyboardType="numeric" />
      <Field label="Target amount" value={targetAmount} onChangeText={setTargetAmount} keyboardType="numeric" />
      <PrimaryButton label={mutation.isPending ? 'Planning...' : 'Create education plan'} icon="book-open" onPress={() => mutation.mutate()} />
      <BudgetCard title="Monthly savings required" value={money(latest?.monthlySavingsNeeded || 0)} icon="calendar" />
      <BudgetCard title="Estimated future cost" value={money(latest?.estimatedFutureCost || 0)} icon="trending-up" />
      <View className="gap-2 rounded-2xl bg-white p-4">
        <Text className="text-base font-black text-slate-900">Savings strategy</Text>
        {(latest?.strategy || ['Create a plan to see strategy.']).map((item: string) => (
          <Text key={item} className="font-semibold text-slate-600">- {item}</Text>
        ))}
      </View>
    </BudgetShell>
  );
}
