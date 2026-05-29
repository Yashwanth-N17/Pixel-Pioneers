import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { BudgetShell, SimpleListItem } from '../../components/budget/BudgetShell';
import { BudgetCard, Field, PrimaryButton, Segmented, money } from '../../components/budget/BudgetUi';
import { useBudgetStore } from '../../features/budget/budgetStore';
import type { ExpenseCategory } from '../../features/budget/types';

const categories: ExpenseCategory[] = ['food', 'farming', 'healthcare', 'education', 'loan_repayment', 'transport', 'utilities', 'miscellaneous'];

export default function ExpenseTrackerScreen() {
  const expenses = useBudgetStore((state) => state.expenses);
  const addExpense = useBudgetStore((state) => state.addExpense);
  const updateExpense = useBudgetStore((state) => state.updateExpense);
  const removeExpense = useBudgetStore((state) => state.removeExpense);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [category, setCategory] = React.useState<ExpenseCategory>('food');
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);

  const resetForm = () => {
    setEditingId(null);
    setCategory('food');
    setAmount('');
    setDescription('');
  };

  return (
    <BudgetShell title="Expense Tracker" subtitle="Expenses">
      <BudgetCard title="Monthly summary" value={money(total)} subtitle={`${expenses.length} expenses recorded`} icon="bar-chart-2" />
      <Segmented value={category} options={categories} onChange={(value) => setCategory(value as ExpenseCategory)} />
      <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <Field label="Description" value={description} onChangeText={setDescription} />
      <PrimaryButton
        label={editingId ? 'Save expense' : 'Add expense'}
        icon={editingId ? 'check' : 'plus'}
        onPress={() => {
          const payload = { category, amount: Number(amount) || 0, description };
          if (editingId) updateExpense(editingId, payload);
          else addExpense(payload);
          resetForm();
        }}
      />
      <View className="rounded-2xl bg-white p-4">
        <Text className="mb-3 text-base font-black text-slate-900">Expense chart</Text>
        {categories.map((item) => {
          const value = expenses.filter((expense) => expense.category === item).reduce((sum, expense) => sum + expense.amount, 0);
          return (
            <View key={item} className="mb-2">
              <View className="flex-row justify-between"><Text className="font-bold text-slate-600">{item.replace('_', ' ')}</Text><Text className="font-black">{money(value)}</Text></View>
              <View className="mt-1 h-2 rounded-full bg-slate-100"><View className="h-2 rounded-full bg-emerald-500" style={{ width: `${total ? Math.min(100, (value / total) * 100) : 0}%` }} /></View>
            </View>
          );
        })}
      </View>
      {expenses.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => {
            setEditingId(item.id);
            setCategory(item.category);
            setAmount(String(item.amount));
            setDescription(item.description || '');
          }}
          onLongPress={() => removeExpense(item.id)}
        >
          <SimpleListItem title={item.category.replace('_', ' ')} subtitle={item.description || 'Tap to edit, long press to delete'} amount={money(item.amount)} />
        </TouchableOpacity>
      ))}
    </BudgetShell>
  );
}
