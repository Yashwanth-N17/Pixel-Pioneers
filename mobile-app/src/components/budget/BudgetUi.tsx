import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { C } from '../../constants/colors';

export const money = (value: number) => `Rs ${Math.round(value || 0).toLocaleString('en-IN')}`;

export function BudgetCard({
  title,
  value,
  subtitle,
  icon = 'pie-chart',
}: {
  title: string;
  value?: string;
  subtitle?: string;
  icon?: keyof typeof Feather.glyphMap;
}) {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm" style={{ borderWidth: 1, borderColor: '#eef2f7' }}>
      <View className="mb-3 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
          <Feather name={icon} size={19} color={C.emerald600} />
        </View>
        <Text className="flex-1 text-base font-black text-slate-900">{title}</Text>
      </View>
      {value ? <Text className="text-2xl font-black text-slate-950">{value}</Text> : null}
      {subtitle ? <Text className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon = 'arrow-right',
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5"
    >
      <Text className="text-base font-black text-white">{label}</Text>
      <Feather name={icon} size={18} color="#fff" />
    </TouchableOpacity>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric';
  placeholder?: string;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-black text-slate-700">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        className="min-h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-900"
      />
    </View>
  );
}

export function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const active = option === value;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onChange(option)}
            className={`min-h-[44px] justify-center rounded-xl px-4 ${active ? 'bg-emerald-600' : 'bg-white'}`}
            style={{ borderWidth: 1, borderColor: active ? C.emerald600 : '#e2e8f0' }}
          >
            <Text className={active ? 'font-black text-white' : 'font-bold text-slate-700'}>
              {option.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function ProgressBar({ progress }: { progress: number }) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View className="h-3 overflow-hidden rounded-full bg-slate-100">
      <View className="h-3 rounded-full bg-emerald-500" style={{ width: `${pct * 100}%` }} />
    </View>
  );
}
