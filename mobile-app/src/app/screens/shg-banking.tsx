import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import { C } from '../../constants/colors';
import { endpoints } from '../../services/api';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
type ShgTab = 'overview' | 'transactions' | 'approvals' | 'proposals' | 'members';

type ShgGroup = {
  id: string;
  name: string;
  inviteCode?: string;
  totalBalance?: number;
  approvalThreshold?: number;
  memberCount?: number;
  currentUserRole?: string;
};

type ShgTransaction = {
  id: string;
  type: 'deposit' | 'withdrawal' | 'loan_repayment';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  description?: string;
  createdAt?: string;
  createdBy?: { name?: string; phone?: string };
};

type ShgApproval = {
  id: string;
  transactionId: string;
  amount: number;
  description?: string;
  requestedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
};

type ShgProposal = {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'passed' | 'rejected' | 'expired';
  deadline?: string;
  votes?: Array<{ vote: 'yes' | 'no'; userId: string }>;
};

type ShgMember = {
  id: string;
  userId?: string;
  name?: string;
  role: string;
  trustScore?: number;
  joinedAt?: string;
  user?: { id: string; name: string; phone: string; village?: string };
};

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
const fmt = (amount: number) => 'Rs ' + (amount || 0).toLocaleString('en-IN');

function statusColor(status: string) {
  if (status === 'executed' || status === 'approved' || status === 'passed') return C.emerald600;
  if (status === 'pending' || status === 'open') return C.amber600;
  return C.rose600;
}

function statusBg(status: string) {
  if (status === 'executed' || status === 'approved' || status === 'passed') return '#ECFDF5';
  if (status === 'pending' || status === 'open') return '#FFFBEB';
  return '#FFF1F2';
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: C.slate100,
        marginBottom: 12,
        ...style,
      }}
    >
      {children}
    </View>
  );
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      <Text style={{ color, fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>{text}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: React.ReactNode; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 14,
          padding: 14,
          minHeight: 92,
          borderWidth: 1,
          borderColor: C.slate100,
        }}
      >
        <View
          style={{
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: `${color}1F`,
            alignItems: 'center', justifyContent: 'center', marginBottom: 10,
          }}
        >
          {icon}
        </View>
        <Text style={{ color: C.slate800, fontSize: 13, fontWeight: '900', lineHeight: 17 }}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// QR Code Modal
function QRModal({ visible, inviteCode, groupName, onClose }: {
  visible: boolean;
  inviteCode: string;
  groupName: string;
  onClose: () => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={{
            backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center',
            width: Dimensions.get('window').width - 64,
          }}>
            <LinearGradient
              colors={[C.emerald600, C.teal600]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}
            >
              <Ionicons name="people" size={26} color="#fff" />
            </LinearGradient>

            <Text style={{ fontSize: 17, fontWeight: '900', color: C.slate900, textAlign: 'center', marginBottom: 4 }}>
              {groupName}
            </Text>
            <Text style={{ color: C.slate500, fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
              Scan this QR code to join the SHG group
            </Text>

            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <View style={{
                padding: 16,
                backgroundColor: '#fff',
                borderRadius: 16,
                borderWidth: 2,
                borderColor: C.emerald600,
                shadowColor: C.emerald600,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 8,
              }}>
                <QRCode
                  value={inviteCode}
                  size={180}
                  color={C.slate900}
                  backgroundColor="#fff"
                />
              </View>
            </Animated.View>

            <View style={{
              marginTop: 20,
              backgroundColor: C.slate50,
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderWidth: 1,
              borderColor: C.slate200,
              alignItems: 'center',
            }}>
              <Text style={{ color: C.slate500, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                Invite Code
              </Text>
              <Text style={{ color: C.emerald600, fontSize: 28, fontWeight: '900', letterSpacing: 4, marginTop: 4 }}>
                {inviteCode}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                marginTop: 20,
                backgroundColor: C.slate900,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 36,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '900' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────
export default function ShgBankingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ShgTab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [group, setGroup] = useState<ShgGroup | null>(null);
  const [transactions, setTransactions] = useState<ShgTransaction[]>([]);
  const [approvals, setApprovals] = useState<ShgApproval[]>([]);
  const [proposals, setProposals] = useState<ShgProposal[]>([]);
  const [members, setMembers] = useState<ShgMember[]>([]);

  // Create / Join form state
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Withdrawal form
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalPurpose, setWithdrawalPurpose] = useState('');

  // Proposal form
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');

  // QR modal
  const [showQR, setShowQR] = useState(false);

  const pendingApprovals = useMemo(
    () => approvals.filter((a) => a.status === 'pending').length,
    [approvals]
  );

  // ── Data loading ──────────────────────────────────────
  const loadShg = useCallback(async () => {
    try {
      const groupsRes = await endpoints.getMyShgGroups();
      const groups: ShgGroup[] = groupsRes.data?.data || [];
      const selectedGroup = groups[0];

      if (!selectedGroup) {
        setGroup(null);
        setTransactions([]);
        setApprovals([]);
        setProposals([]);
        setMembers([]);
        return;
      }

      const [dashboardRes, txRes, approvalsRes, proposalsRes, membersRes] = await Promise.all([
        endpoints.getShgDashboard(selectedGroup.id),
        endpoints.getShgTransactions(selectedGroup.id),
        endpoints.getShgApprovals(selectedGroup.id),
        endpoints.getShgProposals(selectedGroup.id),
        endpoints.getShgMembers(selectedGroup.id),
      ]);

      const dashboard = dashboardRes.data?.data || {};
      setGroup({
        ...selectedGroup,
        ...dashboard.group,
        inviteCode: dashboard.group?.inviteCode || selectedGroup.inviteCode,
      });

      // Map transactions
      const rawTx: any[] = txRes.data?.data || [];
      setTransactions(rawTx);

      // Map approvals — these are pending withdrawal transactions
      const rawApprovals: any[] = approvalsRes.data?.data || [];
      setApprovals(rawApprovals.map((tx: any) => ({
        id: tx.id,
        transactionId: tx.id,
        amount: tx.amount,
        description: tx.description,
        requestedBy: tx.createdBy?.name || tx.createdBy?.phone || 'Member',
        status: tx.status,
      })));

      setProposals(proposalsRes.data?.data || []);
      setMembers(membersRes.data?.data || []);
    } catch (error) {
      console.warn('Failed to load SHG data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadShg(); }, [loadShg]);

  const refresh = async () => {
    setRefreshing(true);
    await loadShg();
    setRefreshing(false);
  };

  // ── Actions ───────────────────────────────────────────
  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Group name needed', 'Enter an SHG name to create a group.');
      return;
    }
    try {
      const res = await endpoints.createShgGroup({ name: groupName.trim() });
      const created = res.data?.data;
      setGroup(created);
      setGroupName('');
      // Show QR right away after creation
      await loadShg();
      setShowQR(true);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Could not create group. Please try again.');
    }
  };

  const joinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Code needed', 'Enter the invite code shown on the admin\'s QR.');
      return;
    }
    try {
      await endpoints.joinShgGroup({ inviteCode: inviteCode.trim().toUpperCase() });
      setInviteCode('');
      Alert.alert('✅ Joined!', 'You are now a member of the SHG group.');
      await loadShg();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Invalid invite code. Please try again.');
    }
  };

  const approveTransaction = async (transactionId: string) => {
    try {
      await endpoints.approveShgTransaction(transactionId);
      Alert.alert('✅ Approved', 'Your approval has been recorded.');
      await loadShg();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Could not approve transaction.');
    }
  };

  const rejectTransaction = async (transactionId: string) => {
    Alert.alert(
      'Reject Withdrawal',
      'Are you sure you want to reject this withdrawal request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await endpoints.rejectShgTransaction(transactionId, 'Rejected by member');
              Alert.alert('Rejected', 'The withdrawal request has been rejected.');
              await loadShg();
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.message || 'Could not reject transaction.');
            }
          },
        },
      ]
    );
  };

  const createWithdrawalRequest = async () => {
    if (!group) return;
    const amount = Number(withdrawalAmount);
    if (!amount || amount < 1) {
      Alert.alert('Invalid amount', 'Enter a withdrawal amount greater than zero.');
      return;
    }
    try {
      await endpoints.createShgTransaction(group.id, {
        type: 'withdrawal',
        amount,
        description: withdrawalPurpose || 'SHG withdrawal request',
      });
      setWithdrawalAmount('');
      setWithdrawalPurpose('');
      setShowWithdrawalForm(false);
      Alert.alert('Request submitted', 'Withdrawal is pending member approval.');
      await loadShg();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Could not submit withdrawal.');
    }
  };

  const createProposal = async () => {
    if (!group || !proposalTitle.trim()) {
      Alert.alert('Title needed', 'Enter a proposal title.');
      return;
    }
    try {
      await endpoints.createShgProposal(group.id, {
        title: proposalTitle.trim(),
        description: proposalDesc.trim() || undefined,
      });
      setProposalTitle('');
      setProposalDesc('');
      setShowProposalForm(false);
      Alert.alert('✅ Proposal created', 'Members can now vote on your proposal.');
      await loadShg();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Could not create proposal.');
    }
  };

  const voteProposal = async (proposalId: string, vote: 'yes' | 'no') => {
    try {
      await endpoints.voteShgProposal(proposalId, vote);
      Alert.alert('Vote recorded', `You voted ${vote.toUpperCase()}.`);
      await loadShg();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Could not record vote.');
    }
  };

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.slate50 }}>
        <ActivityIndicator color={C.emerald600} size="large" />
        <Text style={{ color: C.slate500, marginTop: 12, fontWeight: '700' }}>Loading SHG banking...</Text>
      </SafeAreaView>
    );
  }

  // ── Render ──────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.slate50 }} edges={['top']}>

      {/* QR Modal */}
      {group?.inviteCode && (
        <QRModal
          visible={showQR}
          inviteCode={group.inviteCode}
          groupName={group.name}
          onClose={() => setShowQR(false)}
        />
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.emerald600} />}
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={[C.emerald600, C.teal600]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 26, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>SHG Digital Banking</Text>
          <Text style={{ color: '#d1fae5', fontSize: 13, marginTop: 6 }}>
            Group savings · Approvals · Voting · Audit trail
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          {!group ? (
            /* ── No group: Create or Join ── */
            <>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Ionicons name="add-circle" size={20} color={C.emerald600} />
                  </View>
                  <View>
                    <Text style={{ color: C.slate900, fontSize: 16, fontWeight: '900' }}>Create SHG Group</Text>
                    <Text style={{ color: C.slate500, fontSize: 12 }}>You become the group admin</Text>
                  </View>
                </View>
                <TextInput
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="e.g. Sri Lakshmi Women SHG"
                  placeholderTextColor={C.slate400}
                  style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.slate900, marginBottom: 12 }}
                />
                <TouchableOpacity onPress={createGroup} style={{ backgroundColor: C.emerald600, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Create Group</Text>
                </TouchableOpacity>
              </Card>

              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Ionicons name="qr-code" size={20} color={C.blue600} />
                  </View>
                  <View>
                    <Text style={{ color: C.slate900, fontSize: 16, fontWeight: '900' }}>Join Existing SHG</Text>
                    <Text style={{ color: C.slate500, fontSize: 12 }}>Enter the 6-letter invite code</Text>
                  </View>
                </View>
                <TextInput
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder="e.g. SRI847"
                  placeholderTextColor={C.slate400}
                  autoCapitalize="characters"
                  maxLength={10}
                  style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.slate900, marginBottom: 12, fontWeight: '900', fontSize: 18, letterSpacing: 4, textAlign: 'center' }}
                />
                <TouchableOpacity onPress={joinGroup} style={{ backgroundColor: C.slate900, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Join Group</Text>
                </TouchableOpacity>
              </Card>
            </>
          ) : (
            /* ── Has group: Full dashboard ── */
            <>
              {/* Group Balance Card */}
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.slate500, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Active SHG</Text>
                    <Text style={{ color: C.slate900, fontSize: 20, fontWeight: '900', marginTop: 2 }}>{group.name}</Text>
                    <Text style={{ color: C.slate500, fontSize: 13, marginTop: 2 }}>
                      {group.memberCount || members.length} members · min {group.approvalThreshold || 2} approvals
                    </Text>
                  </View>
                  <Badge
                    text={group.currentUserRole || 'member'}
                    color={C.emerald700}
                    bg="#ECFDF5"
                  />
                </View>

                <Text style={{ color: C.slate900, fontSize: 32, fontWeight: '900', marginTop: 18 }}>
                  {fmt(group.totalBalance || 0)}
                </Text>
                <Text style={{ color: C.slate500, fontSize: 13, marginTop: 2 }}>Total group balance</Text>

                {/* Invite code + QR */}
                {group.inviteCode && (
                  <TouchableOpacity
                    onPress={() => setShowQR(true)}
                    style={{
                      marginTop: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F0FDF4',
                      borderRadius: 10,
                      padding: 10,
                      borderWidth: 1,
                      borderColor: '#BBF7D0',
                      gap: 8,
                    }}
                  >
                    <Ionicons name="qr-code-outline" size={20} color={C.emerald600} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.slate500, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Invite Code (tap to share QR)</Text>
                      <Text style={{ color: C.emerald700, fontSize: 18, fontWeight: '900', letterSpacing: 3 }}>{group.inviteCode}</Text>
                    </View>
                    <Feather name="share-2" size={16} color={C.emerald600} />
                  </TouchableOpacity>
                )}
              </Card>

              {/* Quick Actions */}
              <Text style={{ color: C.slate900, fontSize: 15, fontWeight: '900', marginBottom: 10 }}>Quick Actions</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <QuickAction
                  label="Deposit / Pay"
                  color={C.emerald600}
                  icon={<Feather name="credit-card" size={19} color={C.emerald600} />}
                  onPress={() => router.push('/screens/payment')}
                />
                <QuickAction
                  label="Withdrawal Request"
                  color={C.rose600}
                  icon={<Feather name="send" size={19} color={C.rose600} />}
                  onPress={() => { setShowWithdrawalForm((v) => !v); setActiveTab('transactions'); }}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                <QuickAction
                  label="Approvals"
                  color={C.blue600}
                  icon={<Ionicons name="shield-checkmark-outline" size={20} color={C.blue600} />}
                  onPress={() => setActiveTab('approvals')}
                />
                <QuickAction
                  label="New Proposal"
                  color={C.amber600}
                  icon={<MaterialIcons name="how-to-vote" size={20} color={C.amber600} />}
                  onPress={() => { setShowProposalForm((v) => !v); setActiveTab('proposals'); }}
                />
              </View>

              {/* Withdrawal Form */}
              {showWithdrawalForm && (
                <Card>
                  <Text style={{ color: C.slate900, fontWeight: '900', fontSize: 15, marginBottom: 4 }}>New Withdrawal Request</Text>
                  <Text style={{ color: C.slate500, fontSize: 13, marginBottom: 14 }}>
                    Needs at least {group.approvalThreshold || 2} approvals from office bearers.
                  </Text>
                  <TextInput
                    value={withdrawalAmount}
                    onChangeText={setWithdrawalAmount}
                    placeholder="Amount (Rs)"
                    placeholderTextColor={C.slate400}
                    keyboardType="numeric"
                    style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.slate900, marginBottom: 10 }}
                  />
                  <TextInput
                    value={withdrawalPurpose}
                    onChangeText={setWithdrawalPurpose}
                    placeholder="Purpose (e.g. medical emergency)"
                    placeholderTextColor={C.slate400}
                    style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.slate900, marginBottom: 12 }}
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={createWithdrawalRequest} style={{ flex: 1, backgroundColor: C.emerald600, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '900' }}>Submit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowWithdrawalForm(false)} style={{ flex: 1, backgroundColor: C.slate100, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                      <Text style={{ color: C.slate700, fontWeight: '900' }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              )}

              {/* Proposal Form */}
              {showProposalForm && (
                <Card>
                  <Text style={{ color: C.slate900, fontWeight: '900', fontSize: 15, marginBottom: 14 }}>Create New Proposal</Text>
                  <TextInput
                    value={proposalTitle}
                    onChangeText={setProposalTitle}
                    placeholder="Proposal title"
                    placeholderTextColor={C.slate400}
                    style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.slate900, marginBottom: 10 }}
                  />
                  <TextInput
                    value={proposalDesc}
                    onChangeText={setProposalDesc}
                    placeholder="Description (optional)"
                    placeholderTextColor={C.slate400}
                    multiline
                    numberOfLines={3}
                    style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.slate900, marginBottom: 12, minHeight: 72, textAlignVertical: 'top' }}
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={createProposal} style={{ flex: 1, backgroundColor: C.amber600, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '900' }}>Create</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowProposalForm(false)} style={{ flex: 1, backgroundColor: C.slate100, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                      <Text style={{ color: C.slate700, fontWeight: '900' }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              )}

              {/* Tab Bar */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {[
                  ['overview', 'Dashboard'],
                  ['transactions', 'Transactions'],
                  ['approvals', `Approvals${pendingApprovals ? ` (${pendingApprovals})` : ''}`],
                  ['proposals', 'Proposals'],
                  ['members', 'Members'],
                ].map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setActiveTab(key as ShgTab)}
                    style={{
                      backgroundColor: activeTab === key ? C.emerald600 : '#fff',
                      borderColor: activeTab === key ? C.emerald600 : C.slate200,
                      borderWidth: 1,
                      borderRadius: 999,
                      paddingHorizontal: 16,
                      paddingVertical: 9,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: activeTab === key ? '#fff' : C.slate700, fontWeight: '900', fontSize: 12 }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* ── Overview Tab ── */}
              {activeTab === 'overview' && (
                <>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Card>
                        <Text style={{ color: C.slate500, fontSize: 11, fontWeight: '700' }}>PENDING APPROVALS</Text>
                        <Text style={{ color: C.slate900, fontSize: 26, fontWeight: '900', marginTop: 4 }}>{pendingApprovals}</Text>
                      </Card>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Card>
                        <Text style={{ color: C.slate500, fontSize: 11, fontWeight: '700' }}>OPEN PROPOSALS</Text>
                        <Text style={{ color: C.slate900, fontSize: 26, fontWeight: '900', marginTop: 4 }}>
                          {proposals.filter((p) => p.status === 'open').length}
                        </Text>
                      </Card>
                    </View>
                  </View>
                  <Card>
                    <Text style={{ color: C.slate900, fontWeight: '900', marginBottom: 6 }}>Approval Rule</Text>
                    <Text style={{ color: C.slate600, fontSize: 13, lineHeight: 20 }}>
                      Every withdrawal needs at least {group.approvalThreshold || 2} approvals from office bearers (treasurer, president, or admin) before it is executed.
                    </Text>
                  </Card>
                  <Card>
                    <Text style={{ color: C.slate900, fontWeight: '900', marginBottom: 6 }}>Share this Group</Text>
                    <Text style={{ color: C.slate600, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
                      Share the QR code or invite code with members so they can join this SHG group.
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowQR(true)}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.emerald600, borderRadius: 12, paddingVertical: 12 }}
                    >
                      <Ionicons name="qr-code-outline" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '900' }}>Show QR Code</Text>
                    </TouchableOpacity>
                  </Card>
                </>
              )}

              {/* ── Transactions Tab ── */}
              {activeTab === 'transactions' && (
                <>
                  {transactions.length === 0 && (
                    <Card>
                      <Text style={{ color: C.slate500, textAlign: 'center', fontWeight: '700' }}>No transactions yet.</Text>
                    </Card>
                  )}
                  {transactions.map((tx) => (
                    <Card key={tx.id}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: C.slate900, fontWeight: '900', textTransform: 'capitalize' }}>
                            {tx.type.replace('_', ' ')}
                          </Text>
                          <Text style={{ color: C.slate500, fontSize: 12, marginTop: 2 }}>
                            {tx.description || 'SHG transaction'}
                          </Text>
                          {tx.createdBy?.name && (
                            <Text style={{ color: C.slate400, fontSize: 11, marginTop: 2 }}>by {tx.createdBy.name}</Text>
                          )}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: C.slate900, fontWeight: '900' }}>{fmt(tx.amount)}</Text>
                          <View style={{ marginTop: 6 }}>
                            <Badge
                              text={tx.status}
                              color={statusColor(tx.status)}
                              bg={statusBg(tx.status)}
                            />
                          </View>
                        </View>
                      </View>
                    </Card>
                  ))}
                </>
              )}

              {/* ── Approvals Tab ── */}
              {activeTab === 'approvals' && (
                <>
                  {approvals.filter((a) => a.status === 'pending').length === 0 && (
                    <Card>
                      <Text style={{ color: C.slate500, textAlign: 'center', fontWeight: '700' }}>No pending approvals.</Text>
                    </Card>
                  )}
                  {approvals.filter((a) => a.status === 'pending').map((approval) => (
                    <Card key={approval.id}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <View>
                          <Text style={{ color: C.slate900, fontWeight: '900' }}>Withdrawal Request</Text>
                          <Text style={{ color: C.slate500, fontSize: 12, marginTop: 2 }}>
                            by {approval.requestedBy || 'member'}
                          </Text>
                          {approval.description && (
                            <Text style={{ color: C.slate500, fontSize: 12, marginTop: 2 }}>{approval.description}</Text>
                          )}
                        </View>
                        <Text style={{ color: C.slate900, fontWeight: '900', fontSize: 18 }}>{fmt(approval.amount)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                        <TouchableOpacity
                          onPress={() => approveTransaction(approval.transactionId)}
                          style={{ flex: 1, backgroundColor: C.emerald600, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                        >
                          <Text style={{ color: '#fff', fontWeight: '900' }}>✓ Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => rejectTransaction(approval.transactionId)}
                          style={{ flex: 1, backgroundColor: '#FFF1F2', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FECDD3' }}
                        >
                          <Text style={{ color: C.rose600, fontWeight: '900' }}>✕ Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </Card>
                  ))}
                </>
              )}

              {/* ── Proposals Tab ── */}
              {activeTab === 'proposals' && (
                <>
                  {proposals.length === 0 && (
                    <Card>
                      <Text style={{ color: C.slate500, textAlign: 'center', fontWeight: '700' }}>No proposals yet.</Text>
                    </Card>
                  )}
                  {proposals.map((proposal) => {
                    const yesVotes = proposal.votes?.filter((v) => v.vote === 'yes').length ?? 0;
                    const noVotes = proposal.votes?.filter((v) => v.vote === 'no').length ?? 0;
                    return (
                      <Card key={proposal.id}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: C.slate900, fontWeight: '900' }}>{proposal.title}</Text>
                            {proposal.description && (
                              <Text style={{ color: C.slate500, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
                                {proposal.description}
                              </Text>
                            )}
                          </View>
                          <Badge
                            text={proposal.status}
                            color={statusColor(proposal.status)}
                            bg={statusBg(proposal.status)}
                          />
                        </View>
                        <Text style={{ color: C.slate400, fontSize: 12, marginBottom: 10 }}>
                          ✓ Yes {yesVotes} · ✕ No {noVotes}
                        </Text>
                        {proposal.status === 'open' && (
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                              onPress={() => voteProposal(proposal.id, 'yes')}
                              style={{ flex: 1, backgroundColor: C.emerald600, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                            >
                              <Text style={{ color: '#fff', fontWeight: '900' }}>Vote Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => voteProposal(proposal.id, 'no')}
                              style={{ flex: 1, backgroundColor: C.slate100, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                            >
                              <Text style={{ color: C.slate700, fontWeight: '900' }}>Vote No</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </Card>
                    );
                  })}
                </>
              )}

              {/* ── Members Tab — visible to everyone ── */}
              {activeTab === 'members' && (
                <>
                  <Text style={{ color: C.slate500, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>
                    {members.length} MEMBER{members.length !== 1 ? 'S' : ''} IN THIS GROUP
                  </Text>
                  {members.length === 0 && (
                    <Card>
                      <Text style={{ color: C.slate500, textAlign: 'center', fontWeight: '700' }}>No members found.</Text>
                    </Card>
                  )}
                  {members.map((member) => {
                    const displayName = member.user?.name || member.name || 'Member';
                    const displayRole = member.role || 'member';
                    const trust = member.trustScore ?? 75;
                    return (
                      <Card key={member.id || member.userId}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{
                              width: 44, height: 44, borderRadius: 22,
                              backgroundColor: C.emerald600,
                              alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
                                {displayName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View>
                              <Text style={{ color: C.slate900, fontWeight: '900' }}>{displayName}</Text>
                              <Text style={{ color: C.slate500, fontSize: 12, marginTop: 2, textTransform: 'capitalize' }}>
                                {displayRole}
                              </Text>
                              {member.user?.village && (
                                <Text style={{ color: C.slate400, fontSize: 11 }}>{member.user.village}</Text>
                              )}
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: C.slate400, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Trust</Text>
                            <Text style={{ color: trust >= 80 ? C.emerald600 : trust >= 60 ? C.amber600 : C.rose600, fontSize: 20, fontWeight: '900' }}>
                              {trust}
                            </Text>
                          </View>
                        </View>
                      </Card>
                    );
                  })}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
