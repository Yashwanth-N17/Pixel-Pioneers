import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BellRing, ChevronRight, Fingerprint, Shield, Type } from 'lucide-react-native';

import { C } from '../../constants/colors';
import { useStore } from '../../store';
import { endpoints } from '../../services/api';
import { setToken } from '../../services/auth';
import type { Lang } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';

const LANGS: { code: Lang; native: string }[] = [
  { code: 'English', native: 'English' },
  { code: 'Hindi', native: 'हिंदी' },
  { code: 'Kannada', native: 'ಕನ್ನಡ' },
];

const langMap: Record<string, string> = { English: 'en', Hindi: 'hi', Kannada: 'kn' };

const PROFILE_LOCALE: Record<string, Record<string, string>> = {
  English: {
    accountProfile: 'Account Profile',
    editProfile: 'Edit Profile',
    save: 'Save',
    saving: 'Saving...',
    arthSaathiUser: 'ArthSaathi User',
    joined: 'Joined',
    mobileNumber: 'Mobile',
    notSet: 'Not set',
    language: 'Language',
    monthlyIncome: 'Monthly income',
    monthlyExpenses: 'Monthly expenses',
    workProfile: 'Work profile',
    profession: 'Profession',
    selectLanguage: 'Select Language',
    preferences: 'Preferences',
    enableFraudWarnings: 'Enable Fraud Warnings',
    notificationsAlerts: 'Notifications Alerts',
    largeAccessibilityText: 'Large Accessibility Text',
    biometricPasskeyAccess: 'Biometric Passkey Access',
    privacyPolicy: 'Privacy Policy',
    helpAndSupport: 'Help & Support',
    aboutArthSaathi: 'About ArthSaathi',
    logOut: 'Log Out',
    farmer: 'Farmer',
    shopOwner: 'Grocery Shop',
    tailor: 'Tailor',
    dailyWage: 'Daily Wage Worker',
    unknown: 'Unknown'
  },
  Hindi: {
    accountProfile: 'खाता प्रोफ़ाइल',
    editProfile: 'प्रोफ़ाइल संपादित करें',
    save: 'सहेजें',
    saving: 'सहेजा जा रहा है...',
    arthSaathiUser: 'अर्थसाथी उपयोगकर्ता',
    joined: 'शामिल हुए',
    mobileNumber: 'मोबाइल नंबर',
    notSet: 'सेट नहीं है',
    language: 'भाषा',
    monthlyIncome: 'मासिक आय',
    monthlyExpenses: 'मासिक खर्च',
    workProfile: 'कार्य प्रोफ़ाइल',
    profession: 'पेशा',
    selectLanguage: 'भाषा चुनें',
    preferences: 'प्राथमिकताएं',
    enableFraudWarnings: 'धोखाधड़ी की चेतावनी सक्षम करें',
    notificationsAlerts: 'सूचना अलर्ट',
    largeAccessibilityText: 'बड़ा एक्सेसिबिलिटी टेक्स्ट',
    biometricPasskeyAccess: 'बायोमेट्रिक पासकी एक्सेस',
    privacyPolicy: 'गोपनीयता नीति',
    helpAndSupport: 'मदद और समर्थन',
    aboutArthSaathi: 'अर्थसाथी के बारे में',
    logOut: 'लॉग आउट',
    farmer: 'किसान',
    shopOwner: 'किराने की दुकान',
    tailor: 'दर्जी',
    dailyWage: 'दैनिक वेतन भोगी कर्मचारी',
    unknown: 'अज्ञात'
  },
  Kannada: {
    accountProfile: 'ಖಾತೆ ಪ್ರೊಫೈಲ್',
    editProfile: 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ',
    save: 'ಉಳಿಸಿ',
    saving: 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...',
    arthSaathiUser: 'ಅರ್ಥಸಾಥಿ ಬಳಕೆದಾರ',
    joined: 'ಸೇರಿದ್ದಾರೆ',
    mobileNumber: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
    notSet: 'ಹೊಂದಿಸಿಲ್ಲ',
    language: 'ಭಾಷೆ',
    monthlyIncome: 'ಮಾಸಿಕ ಆದಾಯ',
    monthlyExpenses: 'ಮಾಸಿಕ ವೆಚ್ಚಗಳು',
    workProfile: 'ಕೆಲಸದ ಪ್ರೊಫೈಲ್',
    profession: 'ವೃತ್ತಿ',
    selectLanguage: 'ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
    preferences: 'ಆದ್ಯತೆಗಳು',
    enableFraudWarnings: 'ವಂಚನೆ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ',
    notificationsAlerts: 'ಅಧಿಸೂಚನೆ ಎಚ್ಚರಿಕೆಗಳು',
    largeAccessibilityText: 'ದೊಡ್ಡ ಪ್ರವೇಶಿಸುವಿಕೆ ಪಠ್ಯ',
    biometricPasskeyAccess: 'ಬಯೋಮೆಟ್ರಿಕ್ ಪಾಸ್ಕೀ ಪ್ರವೇಶ',
    privacyPolicy: 'ಗೌಪ್ಯತಾ ನೀತಿ',
    helpAndSupport: 'ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ',
    aboutArthSaathi: 'ಅರ್ಥಸಾಥಿ ಬಗ್ಗೆ',
    logOut: 'ಲಾಗ್ ಔಟ್',
    farmer: 'ರೈತ',
    shopOwner: 'ದಿನಸಿ ಅಂಗಡಿ',
    tailor: 'ಟೈಲರ್',
    dailyWage: 'ದೈನಂದಿನ ಕೂಲಿ ಕಾರ್ಮಿಕ',
    unknown: 'ತಿಳಿದಿಲ್ಲ'
  }
};

export default function ProfileScreen() {
  const router = useRouter();
  const storeOccupation = useStore((s) => s.occupation);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const resetGlobalDataState = useStore((s) => s.resetGlobalDataState);
  const t = useTranslations();

  const [toggles, setToggles] = useState({ notif: true, fraud: true, largeText: false, biometric: true });
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', income: '', expenses: '', businessDetails: {} as any });

  const loc = PROFILE_LOCALE[language as string] || PROFILE_LOCALE['English'];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'FARMER': return t.farmer ?? loc.farmer;
      case 'SHOP_OWNER': return t.shopOwner ?? loc.shopOwner;
      case 'TAILOR': return t.tailor ?? loc.tailor;
      case 'DAILY_WAGE': return t.dailyWage ?? loc.dailyWage;
      default: return t.unknown ?? loc.unknown;
    }
  };

  const TOGGLES = [
    { key: 'notif', label: t.enableFraudWarnings ?? loc.enableFraudWarnings, Icon: BellRing },
    { key: 'fraud', label: t.notificationsAlerts ?? loc.notificationsAlerts, Icon: Shield },
    { key: 'largeText', label: t.largeAccessibilityText ?? loc.largeAccessibilityText, Icon: Type },
    { key: 'biometric', label: t.biometricPasskeyAccess ?? loc.biometricPasskeyAccess, Icon: Fingerprint },
  ] as const;

  const MENU = [t.privacyPolicy ?? loc.privacyPolicy, t.helpAndSupport ?? loc.helpAndSupport, t.aboutArthSaathi ?? loc.aboutArthSaathi];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await endpoints.getMyProfile();
        setProfileData(res.data?.data);
        if (res.data?.data?.preferences) {
          setToggles(prev => ({ ...prev, ...res.data.data.preferences }));
        }
      } catch (error) {
        console.warn('Failed to fetch profile', error);
        Alert.alert('Error', 'Could not load profile data');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const toggle = async (key: keyof typeof toggles) => {
    const newVal = !toggles[key];
    setToggles((current) => ({ ...current, [key]: newVal }));
    try {
      await endpoints.updateProfile({ preferences: { ...toggles, [key]: newVal } });
    } catch (e) {
      console.warn('Failed to update preference on backend', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color={C.emerald600} />
      </SafeAreaView>
    );
  }

  const mapOccupation = (occ?: string) => {
    switch (occ?.toLowerCase()) {
      case 'farmer': return 'FARMER';
      case 'shop_owner': return 'SHOP_OWNER';
      case 'tailor': return 'TAILOR';
      case 'daily_wage_worker':
      case 'daily_wage': return 'DAILY_WAGE';
      default: return 'FARMER';
    }
  };

  let businessDetails: any = {};
  let derivedOccupation = storeOccupation;

  if (profileData?.farmerProfile) { businessDetails = profileData.farmerProfile; derivedOccupation = 'FARMER'; }
  else if (profileData?.shopProfile) { businessDetails = profileData.shopProfile; derivedOccupation = 'SHOP_OWNER'; }
  else if (profileData?.tailorProfile) { businessDetails = profileData.tailorProfile; derivedOccupation = 'TAILOR'; }
  else if (profileData?.genericProfile) { businessDetails = profileData.genericProfile; derivedOccupation = 'DAILY_WAGE'; }
  else if (profileData?.occupation) { derivedOccupation = mapOccupation(profileData.occupation); }

  const fullName = profileData?.name || 'ArthSaathi User';
  const mobileNumber = profileData?.phone || 'Not set';
  const occupationEnum = derivedOccupation;
  const monthlyIncome = businessDetails?.monthlyIncome || profileData?.monthlyIncome || 0;
  const monthlyExpenses = businessDetails?.monthlyExpenses || profileData?.monthlyExpenses || 0;

  const initials = (fullName || 'User')
    .split(' ')
    .map((part: string) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    router.replace('/(auth)/logout');
  };

  const joinedDate = businessDetails?.createdAt
    ? new Date(businessDetails.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const startEditing = () => {
    const cleanBusinessDetails = { ...businessDetails };
    delete cleanBusinessDetails.createdAt;
    delete cleanBusinessDetails.updatedAt;
    delete cleanBusinessDetails.id;
    delete cleanBusinessDetails.userId;

    setEditForm({
      name: fullName,
      phone: mobileNumber !== 'Not set' ? mobileNumber : '',
      income: String(monthlyIncome),
      expenses: String(monthlyExpenses),
      businessDetails: cleanBusinessDetails
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const payloadBusinessDetails = { ...editForm.businessDetails };
      if (typeof payloadBusinessDetails.crops === 'string') {
        payloadBusinessDetails.crops = payloadBusinessDetails.crops.split(',').map((c: string) => c.trim());
      }
      await endpoints.updateProfile({
        name: editForm.name, phone: editForm.phone, monthlyIncome: editForm.income,
        monthlyExpenses: editForm.expenses, businessDetails: payloadBusinessDetails
      });
      const res = await endpoints.getMyProfile();
      setProfileData(res.data?.data);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = async (code: Lang) => {
    setLanguage(code);
    try { await endpoints.updateProfile({ language: langMap[code] || 'en' }); } catch (e) {}
  };

  const displayDetails = Object.entries(businessDetails).filter(
    ([key]) => !['monthlyIncome', 'monthlyExpenses', 'id', 'userId', 'occupation', 'createdAt', 'updatedAt'].includes(key)
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[C.emerald600, C.teal600]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 20,
            padding: 18,
            paddingBottom: 20,
          }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-emerald-50 text-xs font-black uppercase">{t.accountProfile ?? loc.accountProfile}</Text>
                <TouchableOpacity onPress={isEditing ? handleSaveProfile : startEditing} className="bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">{isEditing ? (saving ? (t.saving ?? loc.saving) : (t.save ?? loc.save)) : (t.editProfile ?? loc.editProfile)}</Text>
                </TouchableOpacity>
              </View>
              {isEditing ? (
                <TextInput
                  value={editForm.name}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
                  className="text-white text-2xl font-black bg-white/20 px-3 py-1 rounded-xl"
                />
              ) : (
                <Text className="text-white text-2xl font-black mt-1" numberOfLines={1}>{fullName || (t.arthSaathiUser ?? loc.arthSaathiUser)}</Text>
              )}
              <View className="flex-row items-center mt-2 flex-wrap">
                <View className="self-start bg-white/20 border border-white/20 rounded-full px-3 py-1 mr-2 mb-1">
                  <Text className="text-white text-xs font-black">{getRoleLabel(occupationEnum)}</Text>
                </View>
                {joinedDate ? (
                  <View className="self-start bg-white/20 border border-white/20 rounded-full px-3 py-1 mb-1">
                    <Text className="text-white text-xs font-black">{t.joined ?? loc.joined} {joinedDate}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="items-center">
              <View
                className="w-20 h-20 rounded-3xl bg-white items-center justify-center"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.16,
                  shadowRadius: 10,
                  elevation: 6,
                }}
              >
                <Text className="text-2xl font-black text-emerald-600">{initials}</Text>
              </View>
              <View className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-50 border-2 border-emerald-600 items-center justify-center">
                <Feather name="check" size={15} color={C.emerald600} />
              </View>
            </View>
          </View>

          <View className="flex-row mt-5">
            <View className="flex-1 bg-white/15 rounded-2xl px-3 py-3 mr-2">
              <Text className="text-emerald-50 text-[11px] font-bold">{t.mobileNumber ?? loc.mobileNumber}</Text>
              {isEditing ? (
                <TextInput
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
                  className="text-white text-sm font-black mt-1 bg-white/20 px-2 py-0.5 rounded"
                />
              ) : (
                <Text className="text-white text-sm font-black mt-1" numberOfLines={1}>
                  {mobileNumber || (t.notSet ?? loc.notSet)}
                </Text>
              )}
            </View>
            <View className="flex-1 bg-white/15 rounded-2xl px-3 py-3 ml-2">
              <Text className="text-emerald-50 text-[11px] font-bold">{t.language ?? loc.language}</Text>
              <Text className="text-white text-sm font-black mt-1">{language}</Text>
            </View>
          </View>
        </LinearGradient>

        <View className="px-4 mt-4">
          <View className="flex-row mb-3">
            <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4 mr-2">
              <Text className="text-slate-500 text-xs font-bold">{t.monthlyIncome ?? loc.monthlyIncome}</Text>
              {isEditing ? (
                <TextInput
                  value={editForm.income}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, income: text }))}
                  keyboardType="numeric"
                  className="text-slate-900 text-lg font-black mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200"
                />
              ) : (
                <Text className="text-slate-900 text-lg font-black mt-1">
                  Rs {Number(monthlyIncome || 0).toLocaleString('en-IN')}
                </Text>
              )}
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4 ml-2">
              <Text className="text-slate-500 text-xs font-bold">{t.monthlyExpenses ?? loc.monthlyExpenses}</Text>
              {isEditing ? (
                <TextInput
                  value={editForm.expenses}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, expenses: text }))}
                  keyboardType="numeric"
                  className="text-slate-900 text-lg font-black mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200"
                />
              ) : (
                <Text className="text-slate-900 text-lg font-black mt-1">
                  Rs {Number(monthlyExpenses || 0).toLocaleString('en-IN')}
                </Text>
              )}
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
            <Text className="text-sm font-black text-slate-800 mb-3">{t.workProfile ?? loc.workProfile}</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-500 text-sm">{t.profession ?? loc.profession}</Text>
            <Text className="text-slate-800 text-sm font-black">{getRoleLabel(occupationEnum)}</Text>
            </View>
            {displayDetails.map(([key, value]) => (
              <View key={key} className="flex-row justify-between items-center mb-2">
                <Text className="text-slate-500 text-sm capitalize flex-1">{key.replace(/([A-Z])/g, ' $1')}</Text>
                {isEditing ? (
                  <TextInput
                    value={String(editForm.businessDetails[key] || '')}
                    onChangeText={(text) => setEditForm(prev => ({
                      ...prev, businessDetails: { ...prev.businessDetails, [key]: text }
                    }))}
                    className="text-slate-800 text-sm font-bold bg-slate-50 border border-slate-200 rounded px-2 py-1 flex-1 ml-3"
                    style={{ textAlign: 'right' }}
                  />
                ) : (
                  <Text className="text-slate-800 text-sm font-bold flex-1 text-right ml-3" numberOfLines={1}>
                    {Array.isArray(value) ? value.join(', ') : String(value || '')}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-3">
            <Text className="text-sm font-black text-slate-800 mb-3">{t.selectLanguage ?? loc.selectLanguage}</Text>
            <View className="flex-row flex-wrap">
              {LANGS.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  onPress={() => handleLanguageChange(item.code)}
                  className={`px-3 py-2 rounded-xl items-center border mr-2 mb-2 ${
                    language === item.code ? 'bg-emerald-500 border-emerald-600' : 'bg-white border-slate-300'
                  }`}
                >
                  <Text className={`text-[11px] font-bold ${language === item.code ? 'text-white' : 'text-slate-700'}`}>
                    {item.native}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-3">
            <Text className="text-sm font-black text-slate-800 px-4 pt-4 pb-3">{t.preferences ?? loc.preferences}</Text>
            {TOGGLES.map((row, index) => (
              <View key={row.key} className={`flex-row items-center px-4 py-3 ${index < TOGGLES.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <row.Icon size={16} color={C.slate500} />
                <Text className="flex-1 text-sm text-slate-700 font-medium ml-3">{row.label}</Text>
                <Switch value={toggles[row.key]} onValueChange={() => toggle(row.key)} trackColor={{ false: C.slate200, true: C.emerald500 }} thumbColor={C.white} />
              </View>
            ))}
          </View>

          <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-3">
            {MENU.map((item, index) => (
              <TouchableOpacity key={item} className={`flex-row items-center justify-between px-4 py-3.5 ${index < MENU.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <Text className="text-sm text-slate-700 font-medium">{item}</Text>
                <ChevronRight size={14} color={C.slate400} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleLogout} activeOpacity={0.85} className="bg-rose-50 border border-rose-100 rounded-2xl py-3.5 items-center justify-center">
            <Text className="text-sm font-bold text-rose-600">{t.logOut ?? loc.logOut}</Text>
          </TouchableOpacity>

          <Text className="text-center text-[11px] text-slate-500 mt-3 mb-2">Version 1.0.4 - Local Prototype</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
