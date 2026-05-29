import React from 'react';
import { useMutation } from '@tanstack/react-query';

import { BudgetShell } from '../../components/budget/BudgetShell';
import { BudgetCard, Field, PrimaryButton, ProgressBar, money } from '../../components/budget/BudgetUi';
import { budgetApi } from '../../features/budget/budgetApi';
import { useBudgetStore } from '../../features/budget/budgetStore';

export default function EmergencyFundPlannerScreen() {
  const snapshot = useBudgetStore((state) => state.snapshot());
  const emergencyFund = useBudgetStore((state) => state.emergencyFund);
  const setEmergencyFund = useBudgetStore((state) => state.setEmergencyFund);
  const [currentSaved, setCurrentSaved] = React.useState('2500');
  const mutation = useMutation({
    mutationFn: () => budgetApi.emergencyFund({
      monthlyExpenses: snapshot.totalExpenses,
      currentSaved: Number(currentSaved) || 0,
      reserveMonths: 6,
    }),
    onSuccess: (data: any) => setEmergencyFund({ ...data, currentSaved: Number(currentSaved) || 0 }),
  });

  const target = emergencyFund?.reserveTarget || snapshot.totalExpenses * 6;
  const progress = target ? (Number(currentSaved) || 0) / target : 0;

  return (
    <BudgetShell title="Emergency Fund" subtitle="ತುರ್ತು ನಿಧಿ">
      <BudgetCard title="Recommended reserve" value={money(target)} subtitle="3-6 months of expenses" icon="shield" />
      <ProgressBar progress={progress} />
      <Field label="Current saved" value={currentSaved} onChangeText={setCurrentSaved} keyboardType="numeric" />
      <PrimaryButton label={mutation.isPending ? 'Calculating...' : 'Calculate monthly target'} onPress={() => mutation.mutate()} />
      <BudgetCard title="Monthly contribution" value={money(emergencyFund?.monthlySavingsTarget || emergencyFund?.monthlyTarget || 0)} icon="calendar" />
    </BudgetShell>
  );
}
