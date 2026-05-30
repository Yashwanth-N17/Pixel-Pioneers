import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Svg, Rect } from 'react-native-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import qrcode from 'qrcode-generator';

import { C } from '../../constants/colors';
import { endpoints } from '../../services/api';
import { TRANSLATIONS } from '../../constants/translations';
import { useStore } from '../../store';

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

// ─────────────────────────────────────────
// Pure-JS QR Code renderer using react-native-svg
// ─────────────────────────────────────────
function QRCodeSVG({ value, size = 200 }: { value: string; size?: number }) {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    const cellSize = size / count;
    const cells: React.ReactNode[] = [];
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) {
          cells.push(
            <Rect
              key={`${row}-${col}`}
              x={col * cellSize}
              y={row * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#1e293b"
            />
          );
        }
      }
    }
    return (
      <Svg width={size} height={size} backgroundColor="#fff">
        {cells}
      </Svg>
    );
  } catch {
    return <View style={{ width: size, height: size, backgroundColor: '#f1f5f9', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: C.slate400, fontSize: 12 }}>QR unavailable</Text>
    </View>;
  }
}

// ─────────────────────────────────────────
// QR Scanner Modal
// ─────────────────────────────────────────
function QRScannerModal({ visible, onScanned, onClose }: {
  visible: boolean;
  onScanned: (code: string) => void;
  onClose: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) setScanned(false);
  }, [visible]);

  // Permission still loading — wait silently
  if (permission === null) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.emerald600} size="large" />
          <Text style={{ color: '#fff', marginTop: 12, fontWeight: '700' }}>Checking camera permission...</Text>
        </View>
      </Modal>
    );
  }

  // Permission denied or not yet granted
  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="camera-outline" size={40} color={C.emerald400} />
          </View>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' }}>Camera Access Needed</Text>
          <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 22 }}>
            Allow camera access to scan the SHG QR code and join the group instantly.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={{ marginTop: 28, backgroundColor: C.emerald600, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 36 }}
          >
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }}>
            <Text style={{ color: '#64748b', fontWeight: '700' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // Camera ready — full screen camera with overlay
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        {/* Camera fills the entire modal */}
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : ({ data }) => {
            setScanned(true);
            onScanned(data);
          }}
        />

        {/* Dark top bar */}
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 100, backgroundColor: 'rgba(0,0,0,0.6)',
          paddingTop: 52, paddingHorizontal: 20,
          flexDirection: 'row', alignItems: 'center',
        }}>
          <TouchableOpacity onPress={onClose} style={{ marginRight: 16 }}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 }}>Scan QR Code</Text>
        </View>

        {/* Center viewfinder */}
        <View style={{
          position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Corner brackets */}
          <View style={{ width: 250, height: 250, position: 'relative' }}>
            {/* Top-left */}
            <View style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: C.emerald400, borderTopLeftRadius: 8 }} />
            {/* Top-right */}
            <View style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: C.emerald400, borderTopRightRadius: 8 }} />
            {/* Bottom-left */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: C.emerald400, borderBottomLeftRadius: 8 }} />
            {/* Bottom-right */}
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: C.emerald400, borderBottomRightRadius: 8 }} />
          </View>
          <Text style={{ color: '#fff', fontWeight: '700', marginTop: 24, fontSize: 14, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 6 }}>
            Point at the admin's SHG QR code
          </Text>
        </View>

        {/* Dark bottom bar */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 100, backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: '#64748b', fontSize: 13 }}>QR code will be detected automatically</Text>
        </View>
      </View>
    </Modal>
  );
}


// ─────────────────────────────────────────
// QR Display Modal
// ─────────────────────────────────────────
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
                <QRCodeSVG value={inviteCode} size={180} />
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
// Pre-Join Modal
// ─────────────────────────────────────────
function PreJoinModal({
  visible,
  groupData,
  lang,
  onCancel,
  onConfirm
}: {
  visible: boolean;
  groupData: any;
  lang: any;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!groupData) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
          
          <View style={{ width: 40, height: 4, backgroundColor: C.slate200, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
          
          <Text style={{ fontSize: 22, fontWeight: '900', color: C.slate900, marginBottom: 4 }}>
            {lang.shgJoinTermsTitle || 'Group Rules & Terms'}
          </Text>
          <Text style={{ fontSize: 16, color: C.slate500, marginBottom: 20 }}>
            {groupData.name}
          </Text>

          <View style={{ backgroundColor: C.slate50, borderRadius: 16, padding: 16, marginBottom: 24, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar-outline" size={20} color={C.emerald600} />
                <Text style={{ color: C.slate700, fontWeight: '700' }}>{lang.shgTermPeriod || 'Term Period'}</Text>
              </View>
              <Text style={{ color: C.slate900, fontWeight: '900' }}>{groupData.maxMembers} months</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="warning-outline" size={20} color={C.rose600} />
                <Text style={{ color: C.slate700, fontWeight: '700' }}>{lang.shgEarlyExitFine || 'Early Exit Fine'}</Text>
              </View>
              <Text style={{ color: C.rose600, fontWeight: '900' }}>₹{groupData.earlyExitFine || 0}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="people-outline" size={20} color={C.blue600} />
                <Text style={{ color: C.slate700, fontWeight: '700' }}>{lang.shgMaxMembers || 'Group Size'}</Text>
              </View>
              <Text style={{ color: C.slate900, fontWeight: '900' }}>{groupData._count?.members || 1} / {groupData.maxMembers}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onConfirm}
            style={{ backgroundColor: C.emerald600, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
              {lang.shgAcceptJoin || 'Accept & Join Group'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} style={{ paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ color: C.slate500, fontWeight: '700' }}>{lang.shgCancel || 'Cancel'}</Text>
          </TouchableOpacity>

        </View>
      </View>
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
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  // Create / Join form state
  const [groupName, setGroupName] = useState('');
  const [maxMembers, setMaxMembers] = useState('10');
  const [earlyExitFine, setEarlyExitFine] = useState('500');
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
  const [showScanner, setShowScanner] = useState(false);
  const [joinMethod, setJoinMethod] = useState<'code' | 'qr'>('code');

  const [preJoinGroup, setPreJoinGroup] = useState<any>(null);

  const user = useStore(s => s.user);
  const lang = TRANSLATIONS[user?.language || 'English'];

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

      let joinReqRes: any = { data: { data: [] } };
      if (selectedGroup.currentUserRole === 'admin') {
        try {
          joinReqRes = await endpoints.getShgJoinRequests(selectedGroup.id);
        } catch (e) {
          // ignore
        }
      }

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
      setPendingRequests(joinReqRes.data?.data || []);
    } catch (error) {
      console.warn('Failed to load SHG data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadShg();
    }, [loadShg])
  );

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
      const payload = {
        name: groupName.trim(),
        maxMembers: parseInt(maxMembers) || 10,
        earlyExitFine: parseFloat(earlyExitFine) || 0,
      };
      const res = await endpoints.createShgGroup(payload);
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

  const initiateJoinGroup = async (code: string) => {
    if (!code.trim()) {
      Alert.alert('Code needed', 'Enter the invite code shown on the admin\'s QR.');
      return;
    }
    try {
      setLoading(true);
      const res = await endpoints.getGroupByInvite(code.trim().toUpperCase());
      setPreJoinGroup(res.data?.data);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error?.response?.data?.message || 'Invalid invite code. Please try again.');
    }
  };

  const confirmJoinGroup = async () => {
    if (!preJoinGroup?.inviteCode) return;
    try {
      await endpoints.joinShgGroup({ inviteCode: preJoinGroup.inviteCode });
      setInviteCode('');
      setPreJoinGroup(null);
      Alert.alert('✅ Request Sent!', 'Your request to join has been sent to the admin for approval.');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to join group.');
    }
  };

  const approveJoin = async (memberId: string) => {
    if (!group) return;
    try {
      await endpoints.approveShgJoinRequest(group.id, memberId);
      Alert.alert('Approved', 'Member has been approved.');
      await loadShg();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not approve request.');
    }
  };

  const rejectJoin = async (memberId: string) => {
    if (!group) return;
    try {
      await endpoints.rejectShgJoinRequest(group.id, memberId);
      Alert.alert('Rejected', 'Member request has been rejected.');
      await loadShg();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not reject request.');
    }
  };

  const leaveGroup = async () => {
    if (!group) return;
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this SHG group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await endpoints.leaveShgGroup(group.id);
              Alert.alert('Success', 'You have left the SHG group.');
              await loadShg();
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.message || 'Could not leave group.');
            }
          },
        },
      ]
    );
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

      {/* QR Display Modal */}
      {group?.inviteCode && (
        <QRModal
          visible={showQR}
          inviteCode={group.inviteCode}
          groupName={group.name}
          onClose={() => setShowQR(false)}
        />
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={(scannedCode) => {
          setShowScanner(false);
          setInviteCode(scannedCode.toUpperCase());
          initiateJoinGroup(scannedCode.toUpperCase());
        }}
      />

      {/* Pre Join Modal */}
      <PreJoinModal
        visible={!!preJoinGroup}
        groupData={preJoinGroup}
        lang={lang}
        onCancel={() => setPreJoinGroup(null)}
        onConfirm={confirmJoinGroup}
      />

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
                <Text style={{ color: C.slate500, fontSize: 12, marginBottom: 4, marginLeft: 4 }}>Group Name</Text>
                <TextInput
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="e.g. Sri Lakshmi Women SHG"
                  placeholderTextColor={C.slate400}
                  style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.slate900, marginBottom: 12 }}
                />
                <Text style={{ color: C.slate500, fontSize: 12, marginBottom: 4, marginLeft: 4 }}>Number of Members (Dictates Term length in months)</Text>
                <TextInput
                  value={maxMembers}
                  onChangeText={setMaxMembers}
                  placeholder="e.g. 10"
                  keyboardType="numeric"
                  placeholderTextColor={C.slate400}
                  style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.slate900, marginBottom: 12 }}
                />
                <Text style={{ color: C.slate500, fontSize: 12, marginBottom: 4, marginLeft: 4 }}>Early Exit Fine (₹)</Text>
                <TextInput
                  value={earlyExitFine}
                  onChangeText={setEarlyExitFine}
                  placeholder="e.g. 500"
                  keyboardType="numeric"
                  placeholderTextColor={C.slate400}
                  style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.slate900, marginBottom: 16 }}
                />
                <TouchableOpacity onPress={createGroup} style={{ backgroundColor: C.emerald600, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Create Group</Text>
                </TouchableOpacity>
              </Card>

              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Ionicons name="qr-code" size={20} color={C.blue600} />
                  </View>
                  <View>
                    <Text style={{ color: C.slate900, fontSize: 16, fontWeight: '900' }}>Join Existing SHG</Text>
                    <Text style={{ color: C.slate500, fontSize: 12 }}>Use invite code or scan QR</Text>
                  </View>
                </View>

                {/* Tab switcher */}
                <View style={{ flexDirection: 'row', backgroundColor: C.slate100, borderRadius: 10, padding: 3, marginBottom: 14 }}>
                  <TouchableOpacity
                    onPress={() => setJoinMethod('code')}
                    style={{
                      flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                      backgroundColor: joinMethod === 'code' ? '#fff' : 'transparent',
                    }}
                  >
                    <Text style={{ fontWeight: '900', fontSize: 13, color: joinMethod === 'code' ? C.slate900 : C.slate500 }}>Enter Code</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setJoinMethod('qr')}
                    style={{
                      flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                      backgroundColor: joinMethod === 'qr' ? '#fff' : 'transparent',
                    }}
                  >
                    <Text style={{ fontWeight: '900', fontSize: 13, color: joinMethod === 'qr' ? C.slate900 : C.slate500 }}>Scan QR</Text>
                  </TouchableOpacity>
                </View>

                {joinMethod === 'code' ? (
                  <>
                    <TextInput
                      value={inviteCode}
                      onChangeText={setInviteCode}
                      placeholder="e.g. SRI847"
                      placeholderTextColor={C.slate400}
                      autoCapitalize="characters"
                      maxLength={10}
                      style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: C.slate900, marginBottom: 12, fontWeight: '900', fontSize: 22, letterSpacing: 6, textAlign: 'center' }}
                    />
                    <TouchableOpacity onPress={() => initiateJoinGroup(inviteCode)} style={{ backgroundColor: C.slate900, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Join Group</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowScanner(true)}
                    style={{
                      backgroundColor: C.slate900, borderRadius: 12, paddingVertical: 20,
                      alignItems: 'center', gap: 8,
                    }}
                  >
                    <Ionicons name="qr-code-outline" size={32} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Open Camera Scanner</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 12 }}>Point at admin's QR code</Text>
                  </TouchableOpacity>
                )}
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

                <TouchableOpacity 
                  onPress={leaveGroup}
                  style={{
                    marginTop: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FEF2F2',
                    borderRadius: 10,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: '#FECACA',
                    gap: 6
                  }}
                >
                  <Ionicons name="exit-outline" size={16} color="#DC2626" />
                  <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '700' }}>Leave Group</Text>
                </TouchableOpacity>
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
                  {group.currentUserRole === 'admin' && pendingRequests.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ color: C.slate500, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>
                        {pendingRequests.length} PENDING JOIN REQUEST{pendingRequests.length !== 1 ? 'S' : ''}
                      </Text>
                      {pendingRequests.map((req) => {
                        const displayName = req.user?.name || req.name || req.user?.phone || 'Unknown User';
                        return (
                          <Card key={req.id}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <View>
                                <Text style={{ color: C.slate900, fontWeight: '900' }}>{displayName}</Text>
                                <Text style={{ color: C.slate500, fontSize: 12 }}>Requested to join</Text>
                              </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                              <TouchableOpacity
                                onPress={() => approveJoin(req.user.id)}
                                style={{ flex: 1, backgroundColor: C.emerald600, borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}
                              >
                                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>Approve</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => rejectJoin(req.user.id)}
                                style={{ flex: 1, backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}
                              >
                                <Text style={{ color: C.rose600, fontWeight: '900', fontSize: 13 }}>Reject</Text>
                              </TouchableOpacity>
                            </View>
                          </Card>
                        );
                      })}
                    </View>
                  )}

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
