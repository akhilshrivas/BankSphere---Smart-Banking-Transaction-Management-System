export type Role = 'Customer' | 'Admin' | 'Manager';

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  customerId?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  user?: UserInfo;
}

export interface Account {
  id: string;
  accountNumber: string;
  customerId: string;
  customerName: string;
  accountTypeId: string;
  accountTypeName: string;
  balance: number;
  availableBalance: number;
  currency: string;
  status: 'Active' | 'Frozen' | 'Closed' | 'Suspended';
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  bankAccountId?: string;
  accountNumber: string;
  entryType: 'Debit' | 'Credit';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface FraudAlert {
  id: string;
  transactionId: string;
  referenceNumber: string;
  ruleName: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'UnderReview' | 'Cleared' | 'ConfirmedFraud';
  description: string;
  riskScore: number;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface Transaction {
  id: string;
  referenceNumber: string;
  type: 'Deposit' | 'Withdrawal' | 'Transfer' | 'Fee' | 'Interest';
  status: 'Pending' | 'Completed' | 'Failed' | 'Flagged' | 'Reversed';
  amount: number;
  fee: number;
  currency: string;
  description: string;
  sourceAccountId?: string;
  sourceAccountNumber?: string;
  destinationAccountId?: string;
  destinationAccountNumber?: string;
  failureReason?: string;
  createdAt: string;
  processedAt?: string;
  ledgerEntries?: LedgerEntry[];
  fraudAlerts?: FraudAlert[];
}

export interface Beneficiary {
  id: string;
  customerId: string;
  name: string;
  accountNumber: string;
  bankName: string;
  routingNumber: string;
  nickname?: string;
  email?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  customerId: string;
  title: string;
  message: string;
  type: 'TransactionAlert' | 'FraudNotice' | 'SecurityAlert' | 'SystemNotification';
  isRead: boolean;
  createdAt: string;
}

export interface CustomerDashboard {
  customerId: string;
  customerName: string;
  customerNumber: string;
  totalBalance: number;
  accounts: Account[];
  recentTransactions: Transaction[];
  unreadNotifications: NotificationItem[];
  beneficiaries: Beneficiary[];
}

export interface AdminDashboard {
  totalSystemReserves: number;
  totalCustomers: number;
  totalAccounts: number;
  totalTransactionsToday: number;
  volumeToday: number;
  pendingFraudAlerts: number;
  recentAlerts: FraudAlert[];
  recentTransactions: Transaction[];
  recentAudits: AuditLogItem[];
}

export interface AuditLogItem {
  id: string;
  userId?: string;
  userEmail: string;
  action: string;
  entityName: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface AccountReconciliation {
  accountId: string;
  accountNumber: string;
  cachedBalance: number;
  authoritativeLedgerBalance: number;
  totalCredits: number;
  totalDebits: number;
  discrepancy: number;
  isReconciled: boolean;
  checkedAt: string;
}

export interface SystemReconciliationReport {
  totalAccountsChecked: number;
  reconciledCount: number;
  discrepancyCount: number;
  totalSystemReserves: number;
  totalCustomerAuthoritativeBalances: number;
  discrepancies: AccountReconciliation[];
  generatedAt: string;
}
