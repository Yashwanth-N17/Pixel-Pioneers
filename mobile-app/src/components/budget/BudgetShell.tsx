import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { C } from '../../constants/colors';

export function BudgetShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="bg-emerald-600 px-5 pb-5 pt-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-white/15"
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-black text-white">{title}</Text>
            {subtitle ? <Text className="mt-1 text-sm font-semibold text-emerald-50">{subtitle}</Text> : null}
          </View>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View className="gap-4">{children}</View>
      </ScrollView>
    </View>
  );
}

export function SimpleListItem({
  title,
  subtitle,
  amount,
}: {
  title: string;
  subtitle?: string;
  amount?: string;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-white p-4" style={{ borderWidth: 1, borderColor: '#eef2f7' }}>
      <View className="flex-1">
        <Text className="text-base font-black text-slate-900">{title}</Text>
        {subtitle ? <Text className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</Text> : null}
      </View>
      {amount ? <Text className="text-base font-black" style={{ color: C.emerald600 }}>{amount}</Text> : null}
    </View>
  );
}
