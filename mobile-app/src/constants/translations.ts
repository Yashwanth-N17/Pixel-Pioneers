import type { Lang } from '../types';

export type TranslationSet = {
  appName: string;
  tagline: string;
  welcome: string;
  selectLanguage: string;
  chooseLanguage: string;
  createAccountTitle: string;
  createAccountSubtitle: string;
  createAccount: string;
  loginTitle: string;
  loginSubtitle: string;
  loginToAccount: string;
  signupDetails: string;
  fullName: string;
  mobileNumber: string;
  password: string;
  chooseProfession: string;
  farmer: string;
  farmerSub: string;
  shopOwner: string;
  shopOwnerSub: string;
  tailor: string;
  tailorSub: string;
  dailyWage: string;
  dailyWageSub: string;
  register: string;
  alreadyHaveAccount: string;
  login: string;
  answerMode: string;
  normalInput: string;
  voiceInput: string;
  voiceQuestionTitle: string;
  voiceQuestionSummary: string;
  simulateVoiceAnswers: string;
  forwardToDashboard: string;
  homeGreeting: string;
  location: string;
  financialHealth: string;
  excellent: string;
  good: string;
  needsAttention: string;
  income: string;
  expenses: string;
  savings: string;
  loanCardTitle: string;
  borrowerCardTitle: string;
  lowInterestScheme: string;
  openLenderFlow: string;
  myBusiness: string;
  loanRiskCheck: string;
  smartInsights: string;
  quickServices: string;
  check: string;
  tabHome: string;
  tabLedger: string;
  tabInsights: string;
  tabProfile: string;
  monthlySpendingTrends: string;
  recentTransactions: string;
  seeAll: string;
  noRecordedTransactions: string;
  noTransactionsFound: string;
  addNew: string;
  addTransaction: string;
  type: string;
  amount: string;
  category: string;
  note: string;
  saveTransaction: string;
  tipDeleteTransaction: string;
  accountProfile: string;
  mobile: string;
  language: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  workProfile: string;
  profession: string;
  shgJoinTermsTitle: string;
  shgTermPeriod: string;
  shgEarlyExitFine: string;
  shgMaxMembers: string;
  shgAcceptJoin: string;
  shgCancel: string;
  shgJoinTermsTitle: string;
  shgTermPeriod: string;
  shgEarlyExitFine: string;
  shgMaxMembers: string;
  shgAcceptJoin: string;
  shgCancel: string;
  preferences: string;
  enableFraudWarnings: string;
  notificationsAlerts: string;
  largeAccessibilityText: string;
  biometricPasskeyAccess: string;
  privacyPolicy: string;
  helpAndSupport: string;
  aboutArthSaathi: string;
  arthSaathiUser: string;
  logout: string;
  logOut: string;
  version: string;
  loanRiskTitle: string;
  estimatedEligibleAmount: string;
  loanDetails: string;
  expectedInterestRate: string;
  purpose: string;
  analyzeLoan: string;
  riskMeter: string;
  analysisResult: string;
  monthlyEmi: string;
  totalRepayment: string;
  repaymentPurposeHint: string;
  borrowerFlow: string;
  quickSnapshot: string;
  lendersAndBanks: string;
  dueSoon: string;
  nextPayment: string;
  activeBorrowings: string;
  noMockBorrowings: string;
  whatHappensNext: string;
  paymentFlow: string;
  paymentInitiation: string;
  borrower: string;
  amountDueNow: string;
  originalBorrowed: string;
  remainingBalance: string;
  dueDate: string;
  repaymentProgress: string;
  proceedToPayment: string;
  selectPaymentMethod: string;
  amountPayable: string;
  payNow: string;
  processingPayment: string;
  verifyingRepayment: string;
  paymentSuccess: string;
  paymentSuccessful: string;
  paymentRecordedLocally: string;
  transactionId: string;
  method: string;
  paidTo: string;
  remainingAfterPayment: string;
  viewInsights: string;
  analyzingYourPayment: string;
  updatingRepaymentInsights: string;
  ledgerUpdated: string;
  newBalance: string;
  status: string;
  mockInsight: string;
  goToLedger: string;
  payAnother: string;
  shiftTracker: string;
  paymentDue: string;
  noShiftsLogged: string;
  noPendingPayments: string;
  wantDeeperFinancialAnalysis: string;
  voiceAssistantHelp: string;
  startVoiceAssistant: string;
  askAi: string;
  editProfile: string;
  save: string;
  saving: string;
  joined: string;
  notSet: string;
  unknown: string;
  loading: string;
  profileUpdatedSuccessfully: string;
  failedToLoadProfile: string;
  failedToUpdateProfile: string;
  fetchingLocation: string;
  locationNotSet: string;
  couldNotLoadData: string;
  loanSummary: string;
  repaymentForecast: string;
  whyThisScore: string;
  riskFactors: string;
  recommendedProducts: string;
  sbiKisanCreditCard: string;
  nabardFarmLoan: string;
  grameenMfiLoan: string;
  basedOnIncomeExpensesHabits: string;
  monthlyEmiVsIncomeOverTenure: string;
  regularTransactionsRecorded: string;
  noExistingDefaults: string;
  landCollateralAvailable: string;
  appHistorySixMonths: string;
  irregularIncomePastMonths: string;
  highExpenseRatio: string;
  seasonalIncomeThreeMonths: string;
  noFormalCreditHistory: string;
  eligibleAmount: string;
  bestTenure: string;
  interestRate: string;
  totalPayable: string;
  months: string;
  loanEligibilityReport: string;
  lowRiskBorrower: string;
  moderateRiskBorrower: string;
  highRiskBorrower: string;
  fair: string;
  poor: string;
  logged: string;
  newOrder: string;
  weekly: string;
  monthly: string;
};

const english: TranslationSet = {
  appName: 'ArthSaathi',
  tagline: 'Voice-first financial assistant',
  welcome: 'Welcome to ArthSaathi',
  selectLanguage: 'Choose your language',
  chooseLanguage: 'Choose your language',
  createAccountTitle: 'Create account',
  createAccountSubtitle: 'Sign up once, then answer work questions by typing or voice.',
  createAccount: 'Create new account',
  loginTitle: 'Login',
  loginSubtitle: 'Continue with your mobile number and password.',
  loginToAccount: 'Login to existing account',
  signupDetails: 'Signup details',
  fullName: 'Full name',
  mobileNumber: 'Mobile number',
  password: 'Password',
  chooseProfession: 'Choose profession',
  farmer: 'Farmer',
  farmerSub: 'Mandi, crops, RTC and input costs',
  shopOwner: 'Grocery Shop',
  shopOwnerSub: 'Udhar, inventory and supplier credit',
  tailor: 'Tailor',
  tailorSub: 'Orders, cloth yield and delivery dates',
  dailyWage: 'Daily Wage',
  dailyWageSub: 'Shift days, payments and work stability',
  register: 'Register',
  alreadyHaveAccount: 'New User? Please SignUp',
  login: 'Login',
  answerMode: 'Answer mode',
  normalInput: 'Normal input',
  voiceInput: 'Voice input',
  voiceQuestionTitle: 'Voice question mode',
  voiceQuestionSummary: 'Speak your answers and we will simulate the form filling.',
  simulateVoiceAnswers: 'Simulate voice answers',
  forwardToDashboard: 'Forward to dashboard',
  homeGreeting: 'Namaste',
  location: 'Location',
  financialHealth: 'Financial Health',
  excellent: 'Excellent',
  good: 'Good',
  needsAttention: 'Needs attention',
  income: 'Income',
  expenses: 'Expenses',
  savings: 'Savings',
  loanCardTitle: 'Loan up to',
  borrowerCardTitle: 'Borrower section',
  lowInterestScheme: 'Low interest agricultural scheme',
  openLenderFlow: 'Open lender repayment flow',
  myBusiness: 'My Business',
  loanRiskCheck: 'Loan Risk Check',
  smartInsights: 'Smart Insights',
  quickServices: 'Quick Services',
  check: 'Check',
  monthlySpendingTrends: 'Monthly Spending Trends',
  recentTransactions: 'Recent Transactions',
  seeAll: 'See all',
  noRecordedTransactions: 'No recorded transactions',
  noTransactionsFound: 'No transactions found',
  addNew: 'Add New',
  addTransaction: 'Add Transaction',
  type: 'Type',
  amount: 'Amount',
  category: 'Category',
  note: 'Note',
  saveTransaction: 'Save Transaction',
  tipDeleteTransaction: 'Tip: Long-press a transaction to delete it',
  accountProfile: 'Account Profile',
  mobile: 'Mobile',
  language: 'Language',
  monthlyIncome: 'Monthly income',
  monthlyExpenses: 'Monthly expenses',
  workProfile: 'Work Profile',
  profession: 'Profession',
  shgJoinTermsTitle: 'Group Rules & Terms',
  shgTermPeriod: 'Term Period',
  shgEarlyExitFine: 'Early Exit Fine',
  shgMaxMembers: 'Group Size',
  shgAcceptJoin: 'Accept & Join Group',
  shgCancel: 'Cancel',
  preferences: 'Preferences',
  enableFraudWarnings: 'Enable fraud warnings',
  notificationsAlerts: 'Notifications and alerts',
  largeAccessibilityText: 'Large accessibility text',
  biometricPasskeyAccess: 'Biometric / passkey access',
  privacyPolicy: 'Privacy Policy',
  helpAndSupport: 'Help and Support',
  aboutArthSaathi: 'About ArthSaathi',
  arthSaathiUser: 'ArthSaathi User',
  logout: 'Log Out',
  logOut: 'Log Out',
  version: 'Version',
  loanRiskTitle: 'Loan Risk Check',
  estimatedEligibleAmount: 'Estimated eligible amount',
  loanDetails: 'Loan details',
  expectedInterestRate: 'Expected Interest Rate',
  purpose: 'Purpose',
  analyzeLoan: 'Analyze Loan',
  riskMeter: 'Risk meter',
  analysisResult: 'Analysis result',
  monthlyEmi: 'Monthly EMI',
  totalRepayment: 'Total repayment',
  repaymentPurposeHint: 'Keep EMI below one-third of monthly income for a safer local score.',
  borrowerFlow: 'Borrower Flow',
  quickSnapshot: 'Quick snapshot',
  lendersAndBanks: 'lenders and banks',
  dueSoon: 'Due soon',
  nextPayment: 'Next payment',
  activeBorrowings: 'Active borrowings',
  noMockBorrowings: 'No mock borrowings available.',
  whatHappensNext: 'What happens next',
  paymentFlow: 'Payment Flow',
  paymentInitiation: 'Payment initiation',
  borrower: 'Borrower',
  amountDueNow: 'Amount due now',
  originalBorrowed: 'Original borrowed',
  remainingBalance: 'Remaining balance',
  dueDate: 'Due date',
  repaymentProgress: 'Repayment progress',
  proceedToPayment: 'Proceed to payment',
  selectPaymentMethod: 'Select payment method',
  amountPayable: 'Amount payable',
  payNow: 'Pay now',
  processingPayment: 'Processing payment',
  verifyingRepayment: 'Verifying your repayment',
  paymentSuccess: 'Payment success',
  paymentSuccessful: 'Payment successful',
  paymentRecordedLocally: 'Your repayment has been recorded locally and the ledger has been updated.',
  transactionId: 'Transaction ID',
  method: 'Method',
  paidTo: 'Paid to',
  remainingAfterPayment: 'Remaining after payment',
  viewInsights: 'View insights',
  analyzingYourPayment: 'Analyzing your payment',
  updatingRepaymentInsights: 'Updating repayment insights',
  ledgerUpdated: 'Ledger updated',
  newBalance: 'New balance',
  status: 'Status',
  mockInsight: 'Mock insight',
  goToLedger: 'Go to ledger',
  payAnother: 'Pay another',
  shiftTracker: 'Shift tracker',
  paymentDue: 'Payment due',
  noShiftsLogged: 'No shifts logged yet.',
  noPendingPayments: 'No pending payments.',
  wantDeeperFinancialAnalysis: 'Want deeper financial analysis?',
  voiceAssistantHelp: 'Use ArthSaathi Voice Assistant from the center mic button.',
  startVoiceAssistant: 'Start Voice Assistant',
  askAi: 'Ask AI',
  tabHome: 'Home',
  tabLedger: 'Ledger',
  tabInsights: 'Insights',
  tabProfile: 'Profile',
  editProfile: 'Edit Profile',
  save: 'Save',
  saving: 'Saving...',
  joined: 'Joined',
  notSet: 'Not set',
  unknown: 'Unknown',
  loading: 'Loading...',
  profileUpdatedSuccessfully: 'Profile updated successfully.',
  failedToLoadProfile: 'Could not load profile data.',
  failedToUpdateProfile: 'Failed to update profile.',
  fetchingLocation: 'Fetching location...',
  locationNotSet: 'Location not set',
  couldNotLoadData: 'Could not load data. Check your connection.',
  loanSummary: 'Loan Summary',
  repaymentForecast: 'Repayment Forecast',
  whyThisScore: 'Why This Score?',
  riskFactors: 'Risk Factors',
  recommendedProducts: 'Recommended Products',
  sbiKisanCreditCard: 'SBI Kisan Credit Card',
  nabardFarmLoan: 'NABARD Farm Loan',
  grameenMfiLoan: 'Grameen MFI Loan',
  basedOnIncomeExpensesHabits: 'Based on your income, expenses & repayment habits',
  monthlyEmiVsIncomeOverTenure: 'Monthly EMI vs. Income over loan tenure',
  regularTransactionsRecorded: 'Regular transactions recorded',
  noExistingDefaults: 'No existing defaults',
  landCollateralAvailable: 'Land collateral available (RTC)',
  appHistorySixMonths: '6+ months app history',
  irregularIncomePastMonths: 'Irregular income in past months',
  highExpenseRatio: 'High expense-to-income ratio',
  seasonalIncomeThreeMonths: 'Seasonal income - 3 low income months per year',
  noFormalCreditHistory: 'No formal credit bureau history',
  eligibleAmount: 'Eligible Amount',
  bestTenure: 'Best Tenure',
  interestRate: 'Interest Rate',
  totalPayable: 'Total Payable',
  months: 'months',
  loanEligibilityReport: 'Your Loan Eligibility Report',
  lowRiskBorrower: 'Low Risk Borrower',
  moderateRiskBorrower: 'Moderate Risk',
  highRiskBorrower: 'High Risk',
  fair: 'Fair',
  poor: 'Poor',
  logged: 'Logged',
  newOrder: 'New order',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const cp1252ByteMap: Record<number, number> = {
  0x20AC: 0x80,
  0x201A: 0x82,
  0x0192: 0x83,
  0x201E: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02C6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8A,
  0x2039: 0x8B,
  0x0152: 0x8C,
  0x017D: 0x8E,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201C: 0x93,
  0x201D: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02DC: 0x98,
  0x2122: 0x99,
  0x0161: 0x9A,
  0x203A: 0x9B,
  0x0153: 0x9C,
  0x017E: 0x9E,
  0x0178: 0x9F,
};

function decodeCp1252Mojibake(value: string) {
  const hasHindiMojibake = Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint === 0x00E0 || codePoint === 0x00A4 || codePoint === 0x00A5;
  });
  if (!hasHindiMojibake) return value;

  try {
    const encodedBytes = Array.from(value).map((character) => {
      const codePoint = character.codePointAt(0) || 0;
      const byte = cp1252ByteMap[codePoint] ?? codePoint;
      return `%${byte.toString(16).padStart(2, '0')}`;
    });
    return decodeURIComponent(encodedBytes.join(''));
  } catch {
    return value;
  }
}

function repairHindiTranslations(translations: TranslationSet): TranslationSet {
  return Object.fromEntries(
    Object.entries(translations).map(([key, value]) => [key, decodeCp1252Mojibake(value)])
  ) as TranslationSet;
}

const hindi: TranslationSet = repairHindiTranslations({
  ...english,
  tagline: 'à¤†à¤µà¤¾à¤œà¤¼-à¤†à¤§à¤¾à¤°à¤¿à¤¤ à¤µà¤¿à¤¤à¥ à¤¤à¥€à¤¯ à¤¸à¤¹à¤¾à¤¯à¤•',
  welcome: 'ArthSaathi à¤®à¥‡à¤‚ à¤†à¤ªà¤•à¤¾ à¤¸à¥ à¤µà¤¾à¤—à¤¤ à¤¹à¥ˆ',
  selectLanguage: 'à¤…à¤ªà¤¨à¥€ à¤­à¤¾à¤·à¤¾ à¤šà¥ à¤¨à¥‡à¤‚',
  createAccountTitle: 'à¤–à¤¾à¤¤à¤¾ à¤¬à¤¨à¤¾à¤ à¤‚',
  createAccountSubtitle: 'à¤ à¤• à¤¬à¤¾à¤° à¤¸à¤¾à¤‡à¤¨ à¤…à¤ª à¤•à¤°à¥‡à¤‚, à¤«à¤¿à¤° à¤Ÿà¤¾à¤‡à¤ª à¤¯à¤¾ à¤†à¤µà¤¾à¤œ à¤¸à¥‡ à¤¸à¤µà¤¾à¤²à¥‹à¤‚ à¤•à¥‡ à¤œà¤µà¤¾à¤¬ à¤¦à¥‡à¤‚à¥¤',
  loginTitle: 'à¤²à¥‰à¤—à¤¿à¤¨',
  loginSubtitle: 'à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤¨à¤‚à¤¬à¤° à¤”à¤° à¤ªà¤¾à¤¸à¤µà¤°à¥ à¤¡ à¤¸à¥‡ à¤†à¤—à¥‡ à¤¬à¤¢à¤¼à¥‡à¤‚à¥¤',
  signupDetails: 'à¤¸à¤¾à¤‡à¤¨à¤…à¤ª à¤µà¤¿à¤µà¤°à¤£',
  fullName: 'à¤ªà¥‚à¤°à¤¾ à¤¨à¤¾à¤®',
  mobileNumber: 'à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤¨à¤‚à¤¬à¤°',
  password: 'à¤ªà¤¾à¤¸à¤µà¤°à¥ à¤¡',
  chooseProfession: 'à¤ªà¥‡à¤¶à¤¾ à¤šà¥ à¤¨à¥‡à¤‚',
  farmer: 'किसान',
  farmerSub: 'मंडी, फसल, RTC और इनपुट खर्च',
  shopOwner: 'किराना दुकान',
  shopOwnerSub: 'उधार, स्टॉक और सप्लायर क्रेडिट',
  tailor: 'दर्जी',
  tailorSub: 'ऑर्डर, कपड़ा और डिलीवरी तारीखें',
  dailyWage: 'दिहाड़ी मजदूर',
  dailyWageSub: 'शिफ्ट दिन, भुगतान और काम की स्थिरता',
  register: 'à¤°à¤œà¤¿à¤¸à¥ à¤Ÿà¤°',
  alreadyHaveAccount: 'à¤ªà¤¹à¤²à¥‡ à¤¸à¥‡ à¤–à¤¾à¤¤à¤¾ à¤¹à¥ˆ? à¤²à¥‰à¤—à¤¿à¤¨ à¤•à¤°à¥‡à¤‚',
  login: 'à¤²à¥‰à¤—à¤¿à¤¨',
  answerMode: 'à¤‰à¤¤à¥ à¤¤à¤° à¤¤à¤°à¥€à¤•à¤¾',
  normalInput: 'à¤¸à¤¾à¤®à¤¾à¤¨à¥ à¤¯ à¤‡à¤¨à¤ªà¥ à¤Ÿ',
  voiceInput: 'à¤†à¤µà¤¾à¤œà¤¼ à¤‡à¤¨à¤ªà¥ à¤Ÿ',
  voiceQuestionTitle: 'à¤†à¤µà¤¾à¤œà¤¼ à¤ªà¥ à¤°à¤¶à¥ à¤¨ à¤®à¥‹à¤¡',
  voiceQuestionSummary: 'à¤†à¤ªà¤•à¥‡ à¤œà¤µà¤¾à¤¬ à¤¸à¥ à¤¨à¤•à¤° à¤¹à¤® à¤«à¥‰à¤°à¥ à¤® à¤­à¤°à¤¨à¥‡ à¤•à¤¾ à¤¸à¤¿à¤®à¥ à¤²à¥‡à¤¶à¤¨ à¤•à¤°à¥‡à¤‚à¤—à¥‡à¥¤',
  simulateVoiceAnswers: 'à¤†à¤µà¤¾à¤œà¤¼ à¤œà¤µà¤¾à¤¬ à¤†à¤œà¤¼à¤®à¤¾à¤ à¤‚',
  forwardToDashboard: 'à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥ à¤¡ à¤ªà¤° à¤œà¤¾à¤ à¤‚',
  homeGreeting: 'à¤¨à¤®à¤¸à¥ à¤¤à¥‡',
  location: 'à¤¸à¥ à¤¥à¤¾à¤¨',
  financialHealth: 'à¤µà¤¿à¤¤à¥ à¤¤à¥€à¤¯ à¤¸à¥ à¤µà¤¾à¤¸à¥ à¤¥à¥ à¤¯',
  excellent: 'à¤‰à¤¤à¥ à¤¤à¤®',
  good: 'à¤…à¤šà¥ à¤›à¤¾',
  needsAttention: 'à¤§à¥ à¤¯à¤¾à¤¨ à¤šà¤¾à¤¹à¤¿à¤ ',
  income: 'à¤†à¤¯',
  expenses: 'à¤–à¤°à¥ à¤š',
  savings: 'à¤¬à¤šà¤¤',
  loanCardTitle: 'à¤œà¤¿à¤¤à¤¨à¥€ à¤°à¤¾à¤¶à¤¿',
  borrowerCardTitle: 'à¤‹à¤£à¤¦à¤¾à¤° à¤­à¤¾à¤—',
  lowInterestScheme: 'à¤•à¤® à¤¬à¥ à¤¯à¤¾à¤œ à¤µà¤¾à¤²à¥€ à¤•à¥ƒà¤·à¤¿ à¤¯à¥‹à¤œà¤¨à¤¾',
  openLenderFlow: 'à¤‹à¤£ à¤šà¥ à¤•à¥Œà¤¤à¥€ à¤–à¥‹à¤²à¥‡à¤‚',
  myBusiness: 'à¤®à¥‡à¤°à¤¾ à¤µà¥ à¤¯à¤µà¤¸à¤¾à¤¯',
  loanRiskCheck: 'à¤²à¥‹à¤¨ à¤œà¥‹à¤–à¤¿à¤® à¤œà¤¾à¤‚à¤š',
  smartInsights: 'à¤¸à¥ à¤®à¤¾à¤°à¥ à¤Ÿ à¤‡à¤¨à¤¸à¤¾à¤‡à¤Ÿà¥ à¤¸',
  monthlySpendingTrends: 'à¤®à¤¾à¤¸à¤¿à¤• à¤–à¤°à¥ à¤š à¤ªà¥ à¤°à¤µà¥ƒà¤¤à¥ à¤¤à¤¿',
  recentTransactions: 'à¤¹à¤¾à¤² à¤•à¥€ à¤²à¥‡à¤¨à¤¦à¥‡à¤¨',
  seeAll: 'à¤¸à¤­à¥€ à¤¦à¥‡à¤–à¥‡à¤‚',
  noRecordedTransactions: 'à¤•à¥‹à¤ˆ à¤²à¥‡à¤¨à¤¦à¥‡à¤¨ à¤°à¤¿à¤•à¥‰à¤°à¥ à¤¡ à¤¨à¤¹à¥€à¤‚',
  noTransactionsFound: 'à¤•à¥‹à¤ˆ à¤²à¥‡à¤¨à¤¦à¥‡à¤¨ à¤¨à¤¹à¥€à¤‚ à¤®à¤¿à¤²à¤¾',
  addNew: 'à¤¨à¤¯à¤¾ à¤œà¥‹à¤¡à¤¼à¥‡à¤‚',
  addTransaction: 'à¤²à¥‡à¤¨à¤¦à¥‡à¤¨ à¤œà¥‹à¤¡à¤¼à¥‡à¤‚',
  type: 'à¤ªà¥ à¤°à¤•à¤¾à¤°',
  amount: 'à¤°à¤¾à¤¶à¤¿',
  category: 'à¤¶à¥ à¤°à¥‡à¤£à¥€',
  note: 'à¤¨à¥‹à¤Ÿ',
  saveTransaction: 'à¤²à¥‡à¤¨à¤¦à¥‡à¤¨ à¤¸à¥‡à¤µ à¤•à¤°à¥‡à¤‚',
  tipDeleteTransaction: 'à¤Ÿà¤¿à¤ª: à¤²à¥‡à¤¨à¤¦à¥‡à¤¨ à¤®à¤¿à¤Ÿà¤¾à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤  à¤²à¥‰à¤¨à¥ à¤— à¤ªà¥ à¤°à¥‡à¤¸ à¤•à¤°à¥‡à¤‚',
  accountProfile: 'à¤–à¤¾à¤¤à¤¾ à¤ªà¥ à¤°à¥‹à¤«à¤¾à¤‡à¤²',
  mobile: 'à¤®à¥‹à¤¬à¤¾à¤‡à¤²',
  language: 'à¤­à¤¾à¤·à¤¾',
  monthlyIncome: 'à¤®à¤¾à¤¸à¤¿à¤• à¤†à¤¯',
  monthlyExpenses: 'à¤®à¤¾à¤¸à¤¿à¤• à¤–à¤°à¥ à¤š',
  workProfile: 'à¤•à¤¾à¤® à¤ªà¥ à¤°à¥‹à¤«à¤¾à¤‡à¤²',
  profession: 'à¤ªà¥‡à¤¶à¤¾',
  shgJoinTermsTitle: 'समूह के नियम और शर्तें',
  shgTermPeriod: 'अवधि (महीने)',
  shgEarlyExitFine: 'जल्दी निकलने पर जुर्माना',
  shgMaxMembers: 'समूह का आकार',
  shgAcceptJoin: 'स्वीकार करें और जुड़ें',
  shgCancel: 'रद्द करें',
  preferences: 'à¤ªà¤¸à¤‚à¤¦',
  enableFraudWarnings: 'धोखाधड़ी चेतावनी चालू करें',
  notificationsAlerts: 'सूचनाएं और अलर्ट',
  largeAccessibilityText: 'बड़ा टेक्स्ट',
  biometricPasskeyAccess: 'बायोमेट्रिक / पासकी एक्सेस',
  privacyPolicy: 'गोपनीयता नीति',
  helpAndSupport: 'सहायता और समर्थन',
  aboutArthSaathi: 'ArthSaathi के बारे में',
  arthSaathiUser: 'ArthSaathi उपयोगकर्ता',
  logout: 'à¤²à¥‰à¤—à¤†à¤‰à¤Ÿ',
  logOut: 'लॉग आउट',
  version: 'à¤¸à¤‚à¤¸à¥ à¤•à¤°à¤£',
  loanRiskTitle: 'à¤²à¥‹à¤¨ à¤œà¥‹à¤–à¤¿à¤® à¤œà¤¾à¤‚à¤š',
  estimatedEligibleAmount: 'à¤…à¤¨à¥ à¤®à¤¾à¤¨à¤¿à¤¤ à¤¯à¥‹à¤—à¥ à¤¯ à¤°à¤¾à¤¶à¤¿',
  loanDetails: 'à¤²à¥‹à¤¨ à¤µà¤¿à¤µà¤°à¤£',
  expectedInterestRate: 'à¤…à¤ªà¥‡à¤•à¥ à¤·à¤¿à¤¤ à¤¬à¥ à¤¯à¤¾à¤œ',
  purpose: 'à¤‰à¤¦à¥ à¤¦à¥‡à¤¶à¥ à¤¯',
  analyzeLoan: 'à¤²à¥‹à¤¨ à¤•à¤¾ à¤µà¤¿à¤¶à¥ à¤²à¥‡à¤·à¤£',
  riskMeter: 'à¤°à¤¿à¤¸à¥ à¤• à¤®à¥€à¤Ÿà¤°',
  analysisResult: 'à¤µà¤¿à¤¶à¥ à¤²à¥‡à¤·à¤£ à¤ªà¤°à¤¿à¤£à¤¾à¤®',
  monthlyEmi: 'à¤®à¤¾à¤¸à¤¿à¤• EMI',
  totalRepayment: 'à¤•à¥ à¤² à¤µà¤¾à¤ªà¤¸à¥€',
  repaymentPurposeHint: 'à¤¸à¥ à¤°à¤•à¥ à¤·à¤¿à¤¤ à¤¸à¥ à¤•à¥‹à¤° à¤•à¥‡ à¤²à¤¿à¤  EMI à¤•à¥‹ à¤®à¤¾à¤¸à¤¿à¤• à¤†à¤¯ à¤•à¥‡ à¤ à¤• à¤¤à¤¿à¤¹à¤¾à¤ˆ à¤¸à¥‡ à¤•à¤® à¤°à¤–à¥‡à¤‚à¥¤',
  borrowerFlow: 'à¤‹à¤£à¤¦à¤¾à¤° à¤ªà¥ à¤°à¤µà¤¾à¤¹',
  quickSnapshot: 'à¤¤à¥ à¤µà¤°à¤¿à¤¤ à¤¸à¤¾à¤°',
  lendersAndBanks: 'à¤¬à¥ˆà¤‚à¤• à¤”à¤° à¤‹à¤£à¤¦à¤¾à¤¤à¤¾',
  dueSoon: 'à¤œà¤²à¥ à¤¦ à¤¦à¥‡à¤¯',
  nextPayment: 'à¤…à¤—à¤²à¥€ à¤•à¤¿à¤¸à¥ à¤¤',
  activeBorrowings: 'à¤¸à¤•à¥ à¤°à¤¿à¤¯ à¤‹à¤£',
  noMockBorrowings: 'à¤•à¥‹à¤ˆ à¤®à¥‰à¤• à¤‹à¤£ à¤‰à¤ªà¤²à¤¬à¥ à¤§ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤',
  whatHappensNext: 'à¤…à¤—à¤²à¤¾ à¤šà¤°à¤£',
  paymentFlow: 'à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤ªà¥ à¤°à¤µà¤¾à¤¹',
  paymentInitiation: 'à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤ªà¥ à¤°à¤¾à¤°à¤‚à¤­',
  borrower: 'à¤‹à¤£à¤¦à¤¾à¤°',
  amountDueNow: 'à¤…à¤¬ à¤¦à¥‡à¤¯ à¤°à¤¾à¤¶à¤¿',
  originalBorrowed: 'à¤®à¥‚à¤² à¤‹à¤£',
  remainingBalance: 'à¤¬à¤¾à¤•à¥€ à¤¬à¥ˆà¤²à¥‡à¤‚à¤¸',
  dueDate: 'à¤¦à¥‡à¤¯ à¤¤à¤¿à¤¥à¤¿',
  repaymentProgress: 'à¤ªà¥ à¤¨à¤°à¥ à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤ªà¥ à¤°à¤—à¤¤à¤¿',
  proceedToPayment: 'à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤•à¥‡ à¤²à¤¿à¤  à¤†à¤—à¥‡',
  selectPaymentMethod: 'à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤¤à¤°à¥€à¤•à¤¾ à¤šà¥ à¤¨à¥‡à¤‚',
  amountPayable: 'à¤¦à¥‡à¤¯ à¤°à¤¾à¤¶à¤¿',
  payNow: 'à¤…à¤­à¥€ à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤•à¤°à¥‡à¤‚',
  processingPayment: 'à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤ªà¥ à¤°à¤¸à¤‚à¤¸à¥ à¤•à¤°à¤£',
  verifyingRepayment: 'à¤†à¤ªà¤•à¥‡ à¤ªà¥ à¤¨à¤°à¥ à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤•à¥€ à¤œà¤¾à¤‚à¤š',
  paymentSuccess: 'à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤¸à¤«à¤²',
  paymentSuccessful: 'à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤¸à¤«à¤² à¤¹à¥ à¤†',
  paymentRecordedLocally: 'à¤†à¤ªà¤•à¤¾ à¤ªà¥ à¤¨à¤°à¥ à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤¸à¥ à¤¥à¤¾à¤¨à¥€à¤¯ à¤°à¥‚à¤ª à¤¸à¥‡ à¤°à¤¿à¤•à¥‰à¤°à¥ à¤¡ à¤¹à¥‹ à¤—à¤¯à¤¾ à¤¹à¥ˆ à¤”à¤° à¤²à¥‡à¤œà¤° à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤¹à¥‹ à¤—à¤¯à¤¾ à¤¹à¥ˆà¥¤',
  transactionId: 'à¤²à¥‡à¤¨à¤¦à¥‡à¤¨ à¤†à¤ˆà¤¡à¥€',
  method: 'à¤¤à¤°à¥€à¤•à¤¾',
  paidTo: 'à¤•à¥‹ à¤­à¥ à¤—à¤¤à¤¾à¤¨',
  remainingAfterPayment: 'à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤•à¥‡ à¤¬à¤¾à¤¦',
  viewInsights: 'à¤‡à¤¨à¤¸à¤¾à¤‡à¤Ÿà¥ à¤¸ à¤¦à¥‡à¤–à¥‡à¤‚',
  analyzingYourPayment: 'à¤†à¤ªà¤•à¥‡ à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤•à¤¾ à¤µà¤¿à¤¶à¥ à¤²à¥‡à¤·à¤£',
  updatingRepaymentInsights: 'à¤ªà¥ à¤¨à¤°à¥ à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤‡à¤¨à¤¸à¤¾à¤‡à¤Ÿà¥ à¤¸ à¤…à¤ªà¤¡à¥‡à¤Ÿ',
  ledgerUpdated: 'à¤²à¥‡à¤œà¤° à¤…à¤ªà¤¡à¥‡à¤Ÿ',
  newBalance: 'à¤¨à¤¯à¤¾ à¤¬à¥ˆà¤²à¥‡à¤‚à¤¸',
  status: 'à¤¸à¥ à¤¥à¤¿à¤¤à¤¿',
  mockInsight: 'à¤®à¥‰à¤• à¤‡à¤¨à¤¸à¤¾à¤‡à¤Ÿ',
  goToLedger: 'à¤²à¥‡à¤œà¤° à¤ªà¤° à¤œà¤¾à¤ à¤‚',
  payAnother: 'à¤”à¤° à¤­à¥ à¤—à¤¤à¤¾à¤¨',
  shiftTracker: 'à¤¶à¤¿à¤«à¥ à¤Ÿ à¤Ÿà¥ à¤°à¥ˆà¤•à¤°',
  paymentDue: 'à¤¦à¥‡à¤¯ à¤­à¥ à¤—à¤¤à¤¾à¤¨',
  noShiftsLogged: 'à¤…à¤­à¥€ à¤•à¥‹à¤ˆ à¤¶à¤¿à¤«à¥ à¤Ÿ à¤¦à¤°à¥ à¤œ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤',
  noPendingPayments: 'à¤•à¥‹à¤ˆ à¤­à¥ à¤—à¤¤à¤¾à¤¨ à¤²à¤‚à¤¬à¤¿à¤¤ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤',
});

const kannada: TranslationSet = {
  ...english,
  tagline: 'ಧ್ವನಿ-ಆಧಾರಿತ ಹಣಕಾಸು ಸಹಾಯಕ',
  welcome: 'ArthSaathi ಗೆ ಸ್ವಾಗತ',
  selectLanguage: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
  createAccountTitle: 'ಖಾತೆ ರಚಿಸಿ',
  createAccountSubtitle: 'ಒಮ್ಮೆ ನೋಂದಾಯಿಸಿ, ನಂತರ ಟೈಪ್ ಅಥವಾ ಧ್ವನಿಯಿಂದ ಕೆಲಸದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.',
  loginTitle: 'ಲಾಗಿನ್',
  loginSubtitle: 'ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿ ಮುಂದುವರಿಯಿರಿ.',
  signupDetails: 'ಸೈನ್‌ಅಪ್ ವಿವರಗಳು',
  fullName: 'ಪೂರ್ಣ ಹೆಸರು',
  mobileNumber: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
  password: 'ಪಾಸ್‌ವರ್ಡ್',
  chooseProfession: 'ವೃತ್ತಿ ಆಯ್ಕೆಮಾಡಿ',
  register: 'ನೋಂದಣಿ',
  alreadyHaveAccount: 'ಈಗಾಗಲೇ ಖಾತೆಯಿದೆಯೇ? ಲಾಗಿನ್ ಮಾಡಿ',
  answerMode: 'ಉತ್ತರ ವಿಧಾನ',
  normalInput: 'ಸಾಮಾನ್ಯ ಇನ್‌ಪುಟ್',
  voiceInput: 'ಧ್ವನಿ ಇನ್‌ಪುಟ್',
  voiceQuestionTitle: 'ಧ್ವನಿ ಪ್ರಶ್ನೆ ಮೋಡ್',
  voiceQuestionSummary: 'ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ಹೇಳಿ, ನಾವು ಫಾರ್ಮ್ ಭರ್ತಿಯನ್ನು ಅನುಕರಿಸುತ್ತೇವೆ.',
  simulateVoiceAnswers: 'ಧ್ವನಿ ಉತ್ತರಗಳನ್ನು ಅನುಕರಿಸಿ',
  forwardToDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಕಳುಹಿಸಿ',
  homeGreeting: 'ನಮಸ್ಕಾರ',
  location: 'ಸ್ಥಳ',
  financialHealth: 'ಹಣಕಾಸಿನ ಆರೋಗ್ಯ',
  excellent: 'ಅತ್ಯುತ್ತಮ',
  good: 'ಚೆನ್ನಾಗಿದೆ',
  needsAttention: 'ಗಮನ ಅಗತ್ಯ',
  income: 'ಆದಾಯ',
  expenses: 'ಖರ್ಚು',
  savings: 'ಉಳಿತಾಯ',
  loanCardTitle: 'ರೂಪಾಯಿವರೆಗೆ ಸಾಲ',
  borrowerCardTitle: 'ಸಾಲಗಾರ ವಿಭಾಗ',
  lowInterestScheme: 'ಕಡಿಮೆ ಬಡ್ಡಿ ಕೃಷಿ ಯೋಜನೆ',
  openLenderFlow: 'ಸಾಲದಾತ ಮರುಪಾವತಿ ಹರಿವು ತೆರೆಯಿರಿ',
  myBusiness: 'ನನ್ನ ವ್ಯವಹಾರ',
  loanRiskCheck: 'ಸಾಲ ಅಪಾಯ ಪರಿಶೀಲನೆ',
  smartInsights: 'ಸ್ಮಾರ್ಟ್ ಒಳನೋಟಗಳು',
  quickServices: 'ತ್ವರಿತ ಸೇವೆಗಳು',
  check: 'ಪರಿಶೀಲಿಸಿ',
  tabHome: 'ಮುಖಪುಟ',
  tabLedger: 'ಲೆಡ್ಜರ್',
  tabInsights: 'ಒಳನೋಟಗಳು',
  tabProfile: 'ಪ್ರೊಫೈಲ್',
  monthlySpendingTrends: 'ಮಾಸಿಕ ಖರ್ಚಿನ ಪ್ರವೃತ್ತಿಗಳು',
  recentTransactions: 'ಇತ್ತೀಚಿನ ವಹಿವಾಟುಗಳು',
  seeAll: 'ಎಲ್ಲವೂ ನೋಡಿ',
  noRecordedTransactions: 'ಯಾವುದೇ ವಹಿವಾಟು ದಾಖಲಾಗಿಲ್ಲ',
  noTransactionsFound: 'ಯಾವುದೇ ವಹಿವಾಟುಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
  addNew: 'ಹೊಸದನ್ನು ಸೇರಿಸಿ',
  addTransaction: 'ವಹಿವಾಟು ಸೇರಿಸಿ',
  type: 'ಪ್ರಕಾರ',
  amount: 'ಮೊತ್ತ',
  category: 'ವರ್ಗ',
  note: 'ಟಿಪ್ಪಣಿ',
  saveTransaction: 'ವಹಿವಾಟು ಉಳಿಸಿ',
  tipDeleteTransaction: 'ಸಲಹೆ: ಅಳಿಸಲು ವಹಿವಾಟನ್ನು ದೀರ್ಘವಾಗಿ ಒತ್ತಿರಿ',
  accountProfile: 'ಖಾತೆ ಪ್ರೊಫೈಲ್',
  mobile: 'ಮೊಬೈಲ್',
  language: 'ಭಾಷೆ',
  monthlyIncome: 'ಮಾಸಿಕ ಆದಾಯ',
  monthlyExpenses: 'ಮಾಸಿಕ ಖರ್ಚು',
  workProfile: 'ಕೆಲಸದ ವಿವರ',
  profession: 'ವೃತ್ತಿ',
  shgJoinTermsTitle: 'ಗುಂಪಿನ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು',
  shgTermPeriod: 'ಅವಧಿ (ತಿಂಗಳುಗಳು)',
  shgEarlyExitFine: 'ಬೇಗ ನಿರ್ಗಮಿಸುವ ದಂಡ',
  shgMaxMembers: 'ಗುಂಪಿನ ಗಾತ್ರ',
  shgAcceptJoin: 'ಒಪ್ಪಿಕೊಳ್ಳಿ ಮತ್ತು ಸೇರಿ',
  shgCancel: 'ರದ್ದುಗೊಳಿಸಿ',
  logout: 'ಲಾಗ್ ಔಟ್',
  version: 'ಆವೃತ್ತಿ',
  loanRiskTitle: 'ಸಾಲ ಅಪಾಯ ಪರಿಶೀಲನೆ',
  estimatedEligibleAmount: 'ಅಂದಾಜು ಅರ್ಹ ಮೊತ್ತ',
  loanDetails: 'ಸಾಲದ ವಿವರಗಳು',
  expectedInterestRate: 'ಅಪೇಕ್ಷಿತ ಬಡ್ಡಿ ದರ',
  purpose: 'ಉದ್ದೇಶ',
  analyzeLoan: 'ಸಾಲ ವಿಶ್ಲೇಷಿಸಿ',
  riskMeter: 'ಅಪಾಯ ಮೀಟರ್',
  analysisResult: 'ವಿಶ್ಲೇಷಣೆಯ ಫಲಿತಾಂಶ',
  monthlyEmi: 'ಮಾಸಿಕ EMI',
  totalRepayment: 'ಒಟ್ಟು ಮರುಪಾವತಿ',
  repaymentPurposeHint: 'ಹೆಚ್ಚು ಸುರಕ್ಷಿತ ಅಂಕಿಗಾಗಿ EMI ಅನ್ನು ಮಾಸಿಕ ಆದಾಯದ ಮೂರನೇ ಭಾಗಕ್ಕಿಂತ ಕಡಿಮೆ ಇಡಿ.',
  borrowerFlow: 'ಸಾಲಗಾರ ಹರಿವು',
  quickSnapshot: 'ತ್ವರಿತ ದೃಶ್ಯ',
  lendersAndBanks: 'ಸಾಲದಾತರು ಮತ್ತು ಬ್ಯಾಂಕುಗಳು',
  dueSoon: 'ಶೀಘ್ರದಲ್ಲೇ ಪಾವತಿ',
  nextPayment: 'ಮುಂದಿನ ಪಾವತಿ',
  activeBorrowings: 'ಸಕ್ರಿಯ ಸಾಲಗಳು',
  noMockBorrowings: 'ಯಾವುದೇ ಮಾದರಿ ಸಾಲಗಳು ಲಭ್ಯವಿಲ್ಲ.',
  whatHappensNext: 'ಮುಂದೆ ಏನಾಗುತ್ತದೆ',
  paymentFlow: 'ಪಾವತಿ ಹರಿವು',
  paymentInitiation: 'ಪಾವತಿ ಆರಂಭ',
  borrower: 'ಸಾಲಗಾರ',
  amountDueNow: 'ಈಗ ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ',
  originalBorrowed: 'ಮೂಲವಾಗಿ ಪಡೆದದ್ದು',
  remainingBalance: 'ಉಳಿದ ಬಾಕಿ',
  dueDate: 'ಕೊನೆಯ ದಿನಾಂಕ',
  repaymentProgress: 'ಮರುಪಾವತಿ ಪ್ರಗತಿ',
  proceedToPayment: 'ಪಾವತಿಗೆ ಮುಂದುವರಿಯಿರಿ',
  selectPaymentMethod: 'ಪಾವತಿ ವಿಧಾನ ಆಯ್ಕೆಮಾಡಿ',
  amountPayable: 'ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ',
  payNow: 'ಈಗ ಪಾವತಿಸಿ',
  processingPayment: 'ಪಾವತಿ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ',
  verifyingRepayment: 'ನಿಮ್ಮ ಮರುಪಾವತಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ',
  paymentSuccess: 'ಪಾವತಿ ಯಶಸ್ವಿ',
  paymentSuccessful: 'ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ',
  paymentRecordedLocally: 'ನಿಮ್ಮ ಮರುಪಾವತಿ ಸ್ಥಳೀಯವಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ ಮತ್ತು ಲೆಡ್ಜರ್ ನವೀಕರಿಸಲಾಗಿದೆ.',
  transactionId: 'ವಹಿವಾಟು ಐಡಿ',
  method: 'ವಿಧಾನ',
  paidTo: 'ಗೆ ಪಾವತಿಸಲಾಗಿದೆ',
  remainingAfterPayment: 'ಪಾವತಿಯ ನಂತರ ಉಳಿದದ್ದು',
  viewInsights: 'ಒಳನೋಟಗಳನ್ನು ನೋಡಿ',
  analyzingYourPayment: 'ನಿಮ್ಮ ಪಾವತಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ',
  updatingRepaymentInsights: 'ಮರುಪಾವತಿ ಒಳನೋಟಗಳನ್ನು ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ',
  ledgerUpdated: 'ಲೆಡ್ಜರ್ ನವೀಕರಿಸಲಾಗಿದೆ',
  newBalance: 'ಹೊಸ ಬಾಕಿ',
  status: 'ಸ್ಥಿತಿ',
  mockInsight: 'ಮಾದರಿ ಒಳನೋಟ',
  goToLedger: 'ಲೆಡ್ಜರ್‌ಗೆ ಹೋಗಿ',
  payAnother: 'ಮತ್ತೊಂದು ಪಾವತಿಸಿ',
  shiftTracker: 'ಶಿಫ್ಟ್ ಟ್ರ್ಯಾಕರ್',
  paymentDue: 'ಪಾವತಿ ಬಾಕಿ',
  noShiftsLogged: 'ಇನ್ನೂ ಯಾವುದೇ ಶಿಫ್ಟ್‌ಗಳು ದಾಖಲಾಗಿಲ್ಲ.',
  noPendingPayments: 'ಬಾಕಿ ಪಾವತಿಗಳು ಇಲ್ಲ.',
  wantDeeperFinancialAnalysis: 'ಹೆಚ್ಚಿನ ಹಣಕಾಸು ವಿಶ್ಲೇಷಣೆ ಬೇಕೆ?',
  voiceAssistantHelp: 'ಮಧ್ಯದ ಮೈಕ್ ಬಟನ್‌ನಿಂದ ArthSaathi Voice Assistant ಬಳಸಿ.',
  startVoiceAssistant: 'Voice Assistant ಪ್ರಾರಂಭಿಸಿ',
  askAi: 'AI ಅನ್ನು ಕೇಳಿ',
  editProfile: 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ',
  save: 'ಉಳಿಸಿ',
  saving: 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...',
  joined: 'ಸೇರಿದೆ',
  notSet: 'ಸೆಟ್ ಆಗಿಲ್ಲ',
  unknown: 'ಅಜ್ಞಾತ',
  loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
  profileUpdatedSuccessfully: 'ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.',
  failedToLoadProfile: 'ಪ್ರೊಫೈಲ್ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
  failedToUpdateProfile: 'ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ.',
  fetchingLocation: 'ಸ್ಥಳ ಪಡೆಯಲಾಗುತ್ತಿದೆ...',
  locationNotSet: 'ಸ್ಥಳ ಸೆಟ್ ಆಗಿಲ್ಲ',
  loanSummary: 'ಸಾಲ ಸಾರಾಂಶ',
  repaymentForecast: 'ಮರುಪಾವತಿ ಮುನ್ಸೂಚನೆ',
  whyThisScore: 'ಈ ಅಂಕ ಏಕೆ?',
  riskFactors: 'ಅಪಾಯಕಾರಿ ಅಂಶಗಳು',
  recommendedProducts: 'ಶಿಫಾರಸು ಮಾಡಿದ ಉತ್ಪನ್ನಗಳು',
  basedOnIncomeExpensesHabits: 'ನಿಮ್ಮ ಆದಾಯ, ಖರ್ಚು ಮತ್ತು ಮರುಪಾವತಿ ಅಭ್ಯಾಸಗಳ ಆಧಾರದ ಮೇಲೆ',
  monthlyEmiVsIncomeOverTenure: 'ಸಾಲ ಅವಧಿಯಲ್ಲಿ ಮಾಸಿಕ EMI ಮತ್ತು ಆದಾಯ',
  regularTransactionsRecorded: 'ನಿಯಮಿತ ವಹಿವಾಟುಗಳು ದಾಖಲಾಗಿವೆ',
  noExistingDefaults: 'ಯಾವುದೇ ಹಳೆಯ ಡೀಫಾಲ್ಟ್ ಇಲ್ಲ',
  landCollateralAvailable: 'ಭೂ ಬಾಂಧವ್ಯ ಲಭ್ಯವಿದೆ (RTC)',
  appHistorySixMonths: '6ಕ್ಕೂ ಹೆಚ್ಚು ತಿಂಗಳ ಆಪ್ ಇತಿಹಾಸ',
  irregularIncomePastMonths: 'ಹಿಂದಿನ ತಿಂಗಳುಗಳಲ್ಲಿ ಅಸ್ಥಿರ ಆದಾಯ',
  highExpenseRatio: 'ಖರ್ಚು-ಆದಾಯ ಅನುಪಾತ ಹೆಚ್ಚು',
  seasonalIncomeThreeMonths: 'ಋತುಕಾಲೀನ ಆದಾಯ - ವರ್ಷಕ್ಕೆ 3 ಕಡಿಮೆ ಆದಾಯದ ತಿಂಗಳುಗಳು',
  noFormalCreditHistory: 'ಅಧಿಕೃತ ಕ್ರೆಡಿಟ್ ಇತಿಹಾಸ ಇಲ್ಲ',
  eligibleAmount: 'ಅರ್ಹ ಮೊತ್ತ',
  bestTenure: 'ಉತ್ತಮ ಅವಧಿ',
  interestRate: 'ಬಡ್ಡಿ ದರ',
  totalPayable: 'ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದುದು',
  months: 'ತಿಂಗಳುಗಳು',
  loanEligibilityReport: 'ನಿಮ್ಮ ಸಾಲ ಅರ್ಹತಾ ವರದಿ',
  lowRiskBorrower: 'ಕಡಿಮೆ ಅಪಾಯದ ಸಾಲಗಾರ',
  moderateRiskBorrower: 'ಮಧ್ಯಮ ಅಪಾಯ',
  highRiskBorrower: 'ಹೆಚ್ಚು ಅಪಾಯ',
  fair: 'ಸರಾಸರಿ',
  poor: 'ಕಡಿಮೆ',
};
export const TRANSLATIONS: Record<Lang, TranslationSet> = {
  English: english,
  Hindi: hindi,
  Kannada: kannada,
  Marathi: english,
  Tamil: english,
  Telugu: english,
};
