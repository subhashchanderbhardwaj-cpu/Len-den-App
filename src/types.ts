export type AccountCategory = 'customer' | 'supplier' | 'friend' | 'family' | 'staff' | 'other';

export interface Account {
  id: string;
  name: string;
  phone?: string;
  place: string;
  openingDate: string;
  category: AccountCategory;
  notes?: string;
  createdAt: number;
  avatarColor?: string;
}

export type TransactionType = 'credit' | 'debit';
export type PaymentMode = 'cash' | 'upi' | 'bank' | 'cheque' | 'other';

export interface Transaction {
  id: string;
  accountId: string;
  accountName: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  details: string;
  type: TransactionType; // 'credit' = received/in/CR, 'debit' = paid/out/DR
  amount: number;
  paymentMode: PaymentMode;
  billImage?: string; // base64 / data URL
  tag?: string;
  createdAt: number;
}

export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  place: string;
  upiId?: string;
  currencySymbol: string;
}

export type Language = 'hi' | 'en';
export type FilterTab = 'all' | 'get' | 'give' | 'settled';
export type DateRangePreset = 'all' | 'today' | 'week' | 'month' | 'lastMonth' | 'custom';
