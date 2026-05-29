// mobile-app/src/app/screens/payment.tsx
// Complete Razorpay UPI payment screen

import React, { useState } from 'react';
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
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { endpoints } from '../../services/api';
import { useStore } from '../../store';

// ── Types ──────────────────────────────────────────────
interface PaymentFormData {
  amount: string;
  description: string;
  category: string;
  upiId: string;  // Recipient UPI ID
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

const isRazorpayNativeAvailable = () =>
  Constants.appOwnership !== 'expo' && typeof (RazorpayCheckout as any)?.open === 'function';

// ── Component ──────────────────────────────────────────
export default function PaymentScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const addTransaction = useStore((s) => s.addTransaction);

  const [form, setForm] = useState<PaymentFormData>({
    amount: '',
    description: '',
    category: 'Other',
    upiId: '',
  });
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
  'idle' | 'creating' | 'processing' | 'success' | 'failed'
>('idle');

  // ── Handle Pay Button ────────────────────────────────
  const handlePay = async () => {
    // Basic validation
    if (!form.amount || parseFloat(form.amount) < 1) {
      Alert.alert('Invalid Amount', 'Please enter an amount of at least ₹1');
      return;
    }

    if (!isRazorpayNativeAvailable()) {
      Alert.alert(
        'Razorpay unavailable',
        'Razorpay needs a custom development build or production app. It does not run inside Expo Go because the native module is not bundled.'
      );
      return;
    }

    setLoading(true);
    setPaymentStatus('creating');

    try {
      // ── Step 1: Create Razorpay Order ──────────────
      // POST /api/payments/create-order
      const orderResponse = await endpoints.createPaymentOrder({
        amount: parseFloat(form.amount),
        description: form.description || 'HealthSehat Payment',
        category: form.category,
      });

      const { orderId, amount, keyId } = orderResponse.data.data;

      setPaymentStatus('processing');

      // ── Step 2: Open Razorpay Checkout ─────────────
      // This opens GPay / PhonePe / Paytm etc.
      // Amount is already pre-filled.
      // User only needs to enter UPI PIN.
      const razorpayOptions = {
  description: form.description || 'HealthSehat Payment',
  image: 'https://your-logo-url.com/logo.png',
  currency: 'INR',
  key: keyId,
  amount: String(amount),
  name: 'HealthSehat',
  order_id: orderId,

  prefill: {
    email: user?.email || '',
    contact: user?.phone || '',
    name: user?.name || '',
  },

  notes: {
    payment_for: 'HealthSehat',
  },

  theme: {
    color: '#16A34A',
  },

  modal: {
    ondismiss: () => {
      setPaymentStatus('idle');
      setLoading(false);
    },
  },
};

      // ── Step 3: Razorpay handles UPI payment ───────
      // User sees GPay / PhonePe / Paytm
      // User enters their UPI PIN
      // Razorpay completes the transaction
      const razorpayResponse = await RazorpayCheckout.open(razorpayOptions);

      // razorpayResponse contains:
      // {
      //   razorpay_payment_id: "pay_XXXXX",
      //   razorpay_order_id: "order_XXXXX",
      //   razorpay_signature: "HMAC_SIGNATURE"
      // }

      // ── Step 4: Verify Payment on Backend ──────────
      // POST /api/payments/verify
      const verifyResponse = await endpoints.verifyPayment({
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
      });

      const { transaction } = verifyResponse.data.data;

      // ── Step 5: Update local store ─────────────────
      if (transaction) {
        addTransaction({
          amount: parseFloat(form.amount),
          type: 'expense',
          category: form.category,
          note: form.description || `Paid via Razorpay`,
          date: new Date().toISOString(),
        });
      }

      setPaymentStatus('success');
      setLoading(false);

      // Show success alert
      Alert.alert(
        '✅ Payment Successful!',
        `₹${form.amount} paid successfully.\nTransaction ID: ${transaction?.id || 'N/A'}`,
        [
          {
            text: 'View Transactions',
            onPress: () => router.push('/(tabs)/ledger'),
          },
          {
            text: 'Pay Again',
            onPress: () => {
              setForm({ amount: '', description: '', category: 'Other', upiId: '' });
              setPaymentStatus('idle');
            },
          },
        ]
      );
    } catch (error: any) {
      setLoading(false);

      // Razorpay throws when user cancels OR payment fails
      // error.code === 0 means user cancelled
      if (error?.code === 0 || error?.description === 'User cancelled') {
        setPaymentStatus('idle');
        Alert.alert('Payment Cancelled', 'You cancelled the payment.');
        return;
      }

      setPaymentStatus('failed');
      console.error('[PAYMENT ERROR]', error);

      if (String(error?.message || '').includes("Cannot read property 'open' of null")) {
        Alert.alert(
          'Razorpay native module missing',
          'Create and run a custom dev build after installing react-native-razorpay. Expo Go cannot open Razorpay checkout.'
        );
        return;
      }

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
        <Text style={styles.heading}>Make a Payment</Text>
        <Text style={styles.subtitle}>
          Powered by Razorpay · UPI / GPay / PhonePe / Paytm
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
              {form.amount ? `Pay ₹${form.amount}` : 'Pay Now'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Status indicator */}
        {paymentStatus === 'creating' && (
          <Text style={styles.statusText}>⏳ Creating payment order...</Text>
        )}
        {paymentStatus === 'processing' && (
          <Text style={styles.statusText}>⏳ Processing payment...</Text>
        )}
        {paymentStatus === 'success' && (
          <Text style={[styles.statusText, styles.statusSuccess]}>
            ✅ Payment successful!
          </Text>
        )}
        {paymentStatus === 'failed' && (
          <Text style={[styles.statusText, styles.statusFailed]}>
            ❌ Payment failed. Please try again.
          </Text>
        )}

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            1. Enter amount and tap Pay{'\n'}
            2. Razorpay opens — choose GPay / PhonePe / Paytm{'\n'}
            3. Amount is pre-filled{'\n'}
            4. Enter your UPI PIN{'\n'}
            5. Payment recorded automatically
          </Text>
        </View>
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
  infoBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  infoText: { fontSize: 13, color: '#166534', lineHeight: 22 },
});
