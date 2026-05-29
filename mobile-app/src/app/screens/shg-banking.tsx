import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { C } from '../../constants/colors';
import { endpoints } from '../../services/api';

type ShgTab = 'overview' | 'transactions' | 'approvals' | 'proposals' | 'members';

type ShgGroup = {
  id: string;
  name: string;
  totalBalance?: number;
  approvalThreshold?: number;
  memberCount?: number;
  currentUserRole?: 'admin' | 'member';
};

type ShgTransaction = {
  id: string;
  type: 'deposit' | 'withdrawal' | 'loan_repayment';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  description?: string;
  createdAt?: string;
};

type ShgApproval = {
  id: string;
  transactionId: string;
  amount: number;
  requestedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
};

type ShgProposal = {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'passed' | 'rejected' | 'expired';
  yesVotes?: number;
  noVotes?: number;
};

type ShgMember = {
  id: string;
  name: string;
  role: 'admin' | 'member';
  trustScore?: number;
};

const fmt = (amount: number) => 'Rs ' + amount.toLocaleString('en-IN');

const sampleGroup: ShgGroup = {
  id: 'demo-shg',
  name: 'Sri Lakshmi Women SHG',
  totalBalance: 124500,
  approvalThreshold: 2,
  memberCount: 12,
  currentUserRole: 'admin',
};

const sampleTransactions: ShgTransaction[] = [
  { id: 'tx1', type: 'deposit', amount: 5000, status: 'executed', description: 'Monthly savings deposit' },
  { id: 'tx2', type: 'withdrawal', amount: 50000, status: 'pending', description: 'Emergency medical withdrawal' },
  { id: 'tx3', type: 'loan_repayment', amount: 8000, status: 'executed', description: 'Member loan repayment' },
];

const sampleApprovals: ShgApproval[] = [
  { id: 'ap1', transactionId: 'tx2', amount: 50000, requestedBy: 'Kavitha', status: 'pending' },
];

const sampleProposals: ShgProposal[] = [
  {
    id: 'pr1',
    title: 'Increase monthly savings rule',
    description: 'Move monthly savings from Rs 500 to Rs 750.',
    status: 'open',
    yesVotes: 7,
    noVotes: 2,
  },
];

const sampleMembers: ShgMember[] = [
  { id: 'm1', name: 'Kavitha', role: 'admin', trustScore: 92 },
  { id: 'm2', name: 'Lakshmi', role: 'member', trustScore: 86 },
  { id: 'm3', name: 'Meena', role: 'member', trustScore: 81 },
];

function statusColor(status: string) {
  if (status === 'executed' || status === 'approved' || status === 'passed') return C.emerald600;
  if (status === 'pending' || status === 'open') return C.amber600;
  return C.rose600;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: C.slate100,
        marginBottom: 12,
      }}
    >
      {children}
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}) {
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
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: `${color}1F`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}
        >
          {icon}
        </View>
        <Text style={{ color: C.slate800, fontSize: 13, fontWeight: '900', lineHeight: 17 }}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

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
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalPurpose, setWithdrawalPurpose] = useState('');

  const pendingApprovals = useMemo(
    () => approvals.filter((approval) => approval.status === 'pending').length,
    [approvals]
  );

  const hydrateFallback = () => {
    setGroup(sampleGroup);
    setTransactions(sampleTransactions);
    setApprovals(sampleApprovals);
    setProposals(sampleProposals);
    setMembers(sampleMembers);
  };

  const loadShg = async () => {
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

      setGroup(selectedGroup);
      const [dashboardRes, txRes, approvalsRes, proposalsRes, membersRes] = await Promise.all([
        endpoints.getShgDashboard(selectedGroup.id),
        endpoints.getShgTransactions(selectedGroup.id),
        endpoints.getShgApprovals(selectedGroup.id),
        endpoints.getShgProposals(selectedGroup.id),
        endpoints.getShgMembers(selectedGroup.id),
      ]);

      const dashboard = dashboardRes.data?.data || {};
      setGroup({ ...selectedGroup, ...dashboard.group, ...dashboard.summary });
      setTransactions(txRes.data?.data || []);
      setApprovals(approvalsRes.data?.data || []);
      setProposals(proposalsRes.data?.data || []);
      setMembers(membersRes.data?.data || []);
    } catch (error) {
      console.warn('Failed to load SHG data, using preview data', error);
      hydrateFallback();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShg();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await loadShg();
    setRefreshing(false);
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Group name needed', 'Enter an SHG name to create a group.');
      return;
    }

    try {
      const res = await endpoints.createShgGroup({
        name: groupName.trim(),
        approvalThreshold: 2,
      });
      setGroup(res.data?.data || { ...sampleGroup, name: groupName.trim() });
      setGroupName('');
      Alert.alert('SHG created', 'Your SHG group is ready.');
      await loadShg();
    } catch (error: any) {
      Alert.alert('Backend not ready', error?.response?.data?.message || 'Showing preview group for now.');
      setGroup({ ...sampleGroup, name: groupName.trim() });
      setGroupName('');
    }
  };

  const joinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Invite code needed', 'Enter the SHG invite code or group ID.');
      return;
    }

    try {
      const res = await endpoints.joinShgGroup({ inviteCode: inviteCode.trim() });
      setGroup(res.data?.data || sampleGroup);
      setInviteCode('');
      Alert.alert('Joined SHG', 'You are now a group member.');
      await loadShg();
    } catch (error: any) {
      Alert.alert('Backend not ready', error?.response?.data?.message || 'Showing preview group for now.');
      setGroup(sampleGroup);
      setInviteCode('');
    }
  };

  const approveTransaction = async (transactionId: string) => {
    try {
      await endpoints.approveShgTransaction(transactionId);
      Alert.alert('Approved', 'Your approval has been recorded.');
      await loadShg();
    } catch (error: any) {
      Alert.alert('Backend not ready', error?.response?.data?.message || 'Approval will work once SHG APIs are live.');
    }
  };

  const createWithdrawalRequest = async () => {
    if (!group) return;

    const amount = Number(withdrawalAmount);
    if (!amount || amount < 1) {
      Alert.alert('Invalid amount', 'Enter a withdrawal amount greater than zero.');
      return;
    }

    try {
      const res = await endpoints.createShgTransaction(group.id, {
        type: 'withdrawal',
        amount,
        description: withdrawalPurpose || 'SHG withdrawal request',
      });
      const created = res.data?.data;
      if (created) {
        setTransactions((items) => [created, ...items]);
      }
      setWithdrawalAmount('');
      setWithdrawalPurpose('');
      setShowWithdrawalForm(false);
      Alert.alert('Request submitted', 'Withdrawal is pending member approval.');
      await loadShg();
    } catch (error: any) {
      Alert.alert(
        'Backend not ready',
        error?.response?.data?.message || 'Withdrawal requests will submit once SHG APIs are live.'
      );
    }
  };

  const voteProposal = async (proposalId: string, vote: 'yes' | 'no') => {
    try {
      await endpoints.voteShgProposal(proposalId, vote);
      Alert.alert('Vote recorded', `You voted ${vote.toUpperCase()}.`);
      await loadShg();
    } catch (error: any) {
      Alert.alert('Backend not ready', error?.response?.data?.message || 'Voting will work once SHG APIs are live.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.slate50 }}>
        <ActivityIndicator color={C.emerald600} />
        <Text style={{ color: C.slate500, marginTop: 10, fontWeight: '700' }}>Loading SHG banking...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 34 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.emerald600} />}
      >
        <LinearGradient
          colors={[C.emerald600, C.teal600]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 26, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-black">SHG Digital Banking</Text>
          <Text className="text-emerald-50 text-sm mt-2">
            Group savings, approvals, voting, payments, and audit trail.
          </Text>
        </LinearGradient>

        <View className="px-5 mt-5">
          {!group ? (
            <>
              <Card>
                <Text className="text-slate-900 text-lg font-black">Create SHG Group</Text>
                <Text className="text-slate-500 text-sm mt-1 mb-4">
                  Admin creates the group. Minimum approval threshold is fixed at 2.
                </Text>
                <TextInput
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="e.g. Sri Lakshmi Women SHG"
                  placeholderTextColor={C.slate400}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 mb-3"
                />
                <TouchableOpacity onPress={createGroup} className="bg-emerald-600 rounded-xl py-3 items-center">
                  <Text className="text-white font-black">Create Group</Text>
                </TouchableOpacity>
              </Card>

              <Card>
                <Text className="text-slate-900 text-lg font-black">Join Existing SHG</Text>
                <Text className="text-slate-500 text-sm mt-1 mb-4">
                  Members can join using an invite code or group ID from the admin.
                </Text>
                <TextInput
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder="Invite code or group ID"
                  placeholderTextColor={C.slate400}
                  autoCapitalize="characters"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 mb-3"
                />
                <TouchableOpacity onPress={joinGroup} className="bg-slate-900 rounded-xl py-3 items-center">
                  <Text className="text-white font-black">Join Group</Text>
                </TouchableOpacity>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <View className="flex-row justify-between items-start">
                  <View style={{ flex: 1 }}>
                    <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active SHG</Text>
                    <Text className="text-slate-900 text-xl font-black mt-1">{group.name}</Text>
                    <Text className="text-slate-500 text-sm mt-1">
                      {group.memberCount || members.length} members · min {group.approvalThreshold || 2} approvals
                    </Text>
                  </View>
                  <View className="bg-emerald-50 px-3 py-2 rounded-xl">
                    <Text className="text-emerald-700 font-black uppercase text-xs">{group.currentUserRole || 'member'}</Text>
                  </View>
                </View>
                <Text className="text-slate-900 text-3xl font-black mt-5">{fmt(group.totalBalance || 0)}</Text>
                <Text className="text-slate-500 text-sm mt-1">Total group balance</Text>
              </Card>

              <Text className="text-slate-900 text-base font-black mb-3">Quick Actions</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
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
                  onPress={() => {
                    setShowWithdrawalForm((current) => !current);
                    setActiveTab('transactions');
                  }}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
                <QuickAction
                  label="Approvals"
                  color={C.blue600}
                  icon={<Ionicons name="shield-checkmark-outline" size={20} color={C.blue600} />}
                  onPress={() => setActiveTab('approvals')}
                />
                <QuickAction
                  label="Rules & Proposals"
                  color={C.amber600}
                  icon={<MaterialIcons name="how-to-vote" size={20} color={C.amber600} />}
                  onPress={() => setActiveTab('proposals')}
                />
              </View>

              {showWithdrawalForm && (
                <Card>
                  <Text className="text-slate-900 font-black mb-2">New Withdrawal Request</Text>
                  <Text className="text-slate-500 text-sm mb-4">
                    This starts as pending and needs at least {group.approvalThreshold || 2} approvals.
                  </Text>
                  <TextInput
                    value={withdrawalAmount}
                    onChangeText={setWithdrawalAmount}
                    placeholder="Amount"
                    placeholderTextColor={C.slate400}
                    keyboardType="numeric"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 mb-3"
                  />
                  <TextInput
                    value={withdrawalPurpose}
                    onChangeText={setWithdrawalPurpose}
                    placeholder="Purpose, e.g. medical emergency"
                    placeholderTextColor={C.slate400}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 mb-3"
                  />
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={createWithdrawalRequest} className="flex-1 bg-emerald-600 rounded-xl py-3 items-center">
                      <Text className="text-white font-black">Submit Request</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowWithdrawalForm(false)} className="flex-1 bg-slate-100 rounded-xl py-3 items-center">
                      <Text className="text-slate-700 font-black">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              )}

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {[
                  ['overview', 'Dashboard'],
                  ['transactions', 'Transactions'],
                  ['approvals', `Approvals ${pendingApprovals ? `(${pendingApprovals})` : ''}`],
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
                      paddingHorizontal: 14,
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

              {activeTab === 'overview' && (
                <>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Card>
                      <Text className="text-slate-500 text-xs font-bold">Pending Approvals</Text>
                      <Text className="text-slate-900 text-2xl font-black mt-1">{pendingApprovals}</Text>
                    </Card>
                    <Card>
                      <Text className="text-slate-500 text-xs font-bold">Open Proposals</Text>
                      <Text className="text-slate-900 text-2xl font-black mt-1">
                        {proposals.filter((item) => item.status === 'open').length}
                      </Text>
                    </Card>
                  </View>
                  <Card>
                    <Text className="text-slate-900 font-black mb-2">Approval Rule</Text>
                    <Text className="text-slate-600 text-sm leading-5">
                      Every withdrawal needs at least 2 approvals. Maximum approvals can include every member in the SHG.
                    </Text>
                  </Card>
                </>
              )}

              {activeTab === 'transactions' && transactions.map((tx) => (
                <Card key={tx.id}>
                  <View className="flex-row justify-between">
                    <View style={{ flex: 1 }}>
                      <Text className="text-slate-900 font-black capitalize">{tx.type.replace('_', ' ')}</Text>
                      <Text className="text-slate-500 text-sm mt-1">{tx.description || 'SHG transaction'}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-slate-900 font-black">{fmt(tx.amount)}</Text>
                      <Text style={{ color: statusColor(tx.status), fontSize: 12, fontWeight: '900', marginTop: 4 }}>
                        {tx.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}

              {activeTab === 'approvals' && approvals.map((approval) => (
                <Card key={approval.id}>
                  <Text className="text-slate-900 font-black">Withdrawal Approval</Text>
                  <Text className="text-slate-500 text-sm mt-1">
                    Requested by {approval.requestedBy || 'member'} · {fmt(approval.amount)}
                  </Text>
                  <View className="flex-row gap-2 mt-4">
                    <TouchableOpacity
                      onPress={() => approveTransaction(approval.transactionId)}
                      className="flex-1 bg-emerald-600 rounded-xl py-3 items-center"
                    >
                      <Text className="text-white font-black">Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Reject', 'This will call POST /api/shg/transactions/:id/reject.')}
                      className="flex-1 bg-rose-50 rounded-xl py-3 items-center"
                    >
                      <Text className="text-rose-600 font-black">Reject</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}

              {activeTab === 'proposals' && proposals.map((proposal) => (
                <Card key={proposal.id}>
                  <View className="flex-row justify-between">
                    <View style={{ flex: 1 }}>
                      <Text className="text-slate-900 font-black">{proposal.title}</Text>
                      <Text className="text-slate-500 text-sm mt-1">{proposal.description}</Text>
                    </View>
                    <Text style={{ color: statusColor(proposal.status), fontSize: 12, fontWeight: '900' }}>
                      {proposal.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text className="text-slate-500 text-xs mt-3">
                    Yes {proposal.yesVotes || 0} · No {proposal.noVotes || 0}
                  </Text>
                  <View className="flex-row gap-2 mt-4">
                    <TouchableOpacity onPress={() => voteProposal(proposal.id, 'yes')} className="flex-1 bg-emerald-600 rounded-xl py-3 items-center">
                      <Text className="text-white font-black">Vote Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => voteProposal(proposal.id, 'no')} className="flex-1 bg-slate-100 rounded-xl py-3 items-center">
                      <Text className="text-slate-700 font-black">Vote No</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}

              {activeTab === 'members' && members.map((member) => (
                <Card key={member.id}>
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-slate-900 font-black">{member.name}</Text>
                      <Text className="text-slate-500 text-sm mt-1 capitalize">{member.role}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-slate-500 text-xs font-bold">Trust Score</Text>
                      <Text className="text-emerald-600 text-lg font-black">{member.trustScore || 75}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
