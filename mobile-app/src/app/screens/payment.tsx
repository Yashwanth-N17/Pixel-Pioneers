import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { endpoints } from '../../services/api';
import { useStore } from '../../store';

// ── Types ──────────────────────────────────────────────
interface PaymentFormData {
  amount: string;
  description: string;
  category: string;
  isShgPayment: boolean;
  shgGroupId: string;
  shgTransactionType: 'deposit' | 'loan_repayment';
  repaymentDeadline: string;
}

const CATEGORIES = [
  'Food',
  'Transport',
  'Grocery',
  'Medical',
  'Education',
  'Rent',
  'Utilities',
  'Business',
  'Agriculture',
  'Other',
];

// ── Component ──────────────────────────────────────────
export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const user = useStore((s) => s.user);
  const addTransaction = useStore((s) => s.addTransaction);

  const [form, setForm] = useState<PaymentFormData>({
    amount: '',
    description: '',
    category: 'Other',
    isShgPayment: params.isShgPayment === 'true',
    shgGroupId: (params.shgGroupId as string) || '',
    shgTransactionType: 'deposit',
    repaymentDeadline: '', // YYYY-MM-DD
  });
  
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'processing' | 'success' | 'failed'
  >('idle');

  // Pre-fetch user's SHG groups for convenience
  const [shgGroups, setShgGroups] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    endpoints.getMyShgGroups()
      .then(res => {
        if (res.data?.data) {
          setShgGroups(res.data.data);
          if (res.data.data.length > 0) {
            setForm(f => ({ ...f, shgGroupId: res.data.data[0].id }));
          }
        }
      })
      .catch(err => console.error('Failed to load SHG groups:', err));
  }, []);

  // ── Handle Pay Button ────────────────────────────────
  const handlePay = async () => {
    // Basic validation
    if (!form.amount || parseFloat(form.amount) < 1) {
      Alert.alert('Invalid Amount', 'Please enter an amount of at least ₹1');
      return;
    }
    
    if (form.isShgPayment && !form.shgGroupId) {
      Alert.alert('Missing Info', 'Please provide an SHG Group ID.');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    try {
      // Create mock checkout order
      const response = await endpoints.processMockCheckout({
        amount: parseFloat(form.amount),
        description: form.description || 'Mock Payment',
        category: form.category,
        ...(form.isShgPayment && {
          shgGroupId: form.shgGroupId,
          shgTransactionType: form.shgTransactionType,
          repaymentDeadline: form.shgTransactionType === 'loan_repayment' && form.repaymentDeadline ? new Date(form.repaymentDeadline).toISOString() : undefined,
        })
      });

      const { transaction, payment, shgTransaction, lateFeeApplied } = response.data?.data || {};

      // Local state update for non-SHG transactions to keep ledger updated instantly
      if (transaction && !form.isShgPayment) {
        addTransaction({
          amount: parseFloat(form.amount),
          type: 'expense',
          category: form.category,
          note: form.description || `Paid via Mock Payment`,
          date: new Date().toISOString(),
        });
      }

      setPaymentStatus('success');
      setLoading(false);

      let successMessage = `₹${form.amount} paid successfully.\nTransaction ID: ${transaction?.id || payment?.id || 'N/A'}`;
      
      if (lateFeeApplied) {
        successMessage = `Late Fee Applied: ₹${lateFeeApplied.feeAmount}\nTotal Paid: ₹${lateFeeApplied.totalAmount}\nTransaction ID: ${payment?.id}`;
      }

      if (form.isShgPayment) {
        successMessage += `\nSHG Transaction: ${shgTransaction?.id}\nStatus: ${shgTransaction?.status}`;
      }

      // Show success alert
      Alert.alert(
        '✅ Payment Successful!',
        successMessage,
        [
          {
            text: 'View Ledger',
            onPress: () => router.push('/(tabs)/ledger'),
          },
          {
            text: 'Done',
            onPress: () => {
              setForm(f => ({ ...f, amount: '', description: '' }));
              setPaymentStatus('idle');
            },
          },
        ]
      );
    } catch (error: any) {
      setLoading(false);
      setPaymentStatus('failed');
      console.error('[MOCK PAYMENT ERROR]', error?.response?.data || error);

      Alert.alert(
        '❌ Payment Failed',
        error?.response?.data?.message ||
          error?.message ||
          'Payment could not be processed. Please try again.',
        [{ text: 'Try Again', onPress: () => setPaymentStatus('idle') }]
      );
    }
  };

  // ── Render ────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Make a Mock Payment</Text>
        <Text style={styles.subtitle}>
          Simulated checkout for demo purposes (No real money).
        </Text>

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount (₹) *</Text>
          <TextInput
            style={styles.input}
            value={form.amount}
            onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
            keyboardType="numeric"
            placeholder="Enter amount"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={styles.input}
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            placeholder="e.g. Grocery shopping"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Category Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    form.category === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setForm((f) => ({ ...f, category: cat }))}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      form.category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* SHG Payment Toggle */}
        <View style={[styles.inputGroup, styles.switchContainer]}>
          <Text style={styles.label}>Is this an SHG Payment?</Text>
          <Switch
            value={form.isShgPayment}
            onValueChange={(val) => setForm(f => ({ ...f, isShgPayment: val }))}
          />
        </View>

        {form.isShgPayment && (
          <View style={styles.shgContainer}>
            <Text style={styles.infoTitle}>SHG Demo Options</Text>
            
            <Text style={styles.label}>Select SHG Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={styles.categoryRow}>
                {shgGroups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={[styles.categoryChip, form.shgGroupId === group.id && styles.categoryChipActive]}
                    onPress={() => setForm((f) => ({ ...f, shgGroupId: group.id }))}
                  >
                    <Text style={[styles.categoryText, form.shgGroupId === group.id && styles.categoryTextActive]}>
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>Transaction Type</Text>
            <View style={[styles.categoryRow, { marginBottom: 12 }]}>
              {['deposit', 'loan_repayment'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.categoryChip, form.shgTransactionType === type && styles.categoryChipActive]}
                  onPress={() => setForm((f) => ({ ...f, shgTransactionType: type as 'deposit' | 'loan_repayment' }))}
                >
                  <Text style={[styles.categoryText, form.shgTransactionType === type && styles.categoryTextActive]}>
                    {type === 'deposit' ? 'Deposit' : 'Loan Repayment'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.shgTransactionType === 'loan_repayment' && (
              <>
                <Text style={styles.label}>Simulated Repayment Deadline</Text>
                <TextInput
                  style={styles.input}
                  value={form.repaymentDeadline}
                  onChangeText={(v) => setForm((f) => ({ ...f, repaymentDeadline: v }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, marginBottom: 8 }}>
                  (Set to a past date to test the automated late fee penalty)
                </Text>
              </>
            )}
          </View>
        )}

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>
              {form.amount ? `Simulate Pay ₹${form.amount}` : 'Simulate Payment'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Status indicator */}
        {paymentStatus === 'processing' && (
          <Text style={styles.statusText}>⏳ Processing mock payment...</Text>
        )}
        {paymentStatus === 'success' && (
          <Text style={[styles.statusText, styles.statusSuccess]}>
            ✅ Mock Payment successful!
          </Text>
        )}
        {paymentStatus === 'failed' && (
          <Text style={[styles.statusText, styles.statusFailed]}>
            ❌ Mock Payment failed. Please try again.
          </Text>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 24,
  },
  inputGroup: { marginBottom: 20 },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  categoryRow: { flexDirection: 'row', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  categoryText: { fontSize: 13, color: '#374151' },
  categoryTextActive: { color: '#FFFFFF', fontWeight: '600' },
  shgContainer: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 12,
  },
  payButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  payButtonDisabled: { backgroundColor: '#9CA3AF' },
  payButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  statusText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  statusSuccess: { color: '#16A34A', fontWeight: '600' },
  statusFailed: { color: '#DC2626', fontWeight: '600' },
});
