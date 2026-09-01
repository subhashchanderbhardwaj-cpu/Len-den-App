import { Account, Transaction, BusinessProfile, Language } from '../types';

const STORAGE_KEYS = {
  ACCOUNTS: 'lenden_accounts_v1',
  TRANSACTIONS: 'lenden_transactions_v1',
  PROFILE: 'lenden_profile_v1',
  LANGUAGE: 'lenden_lang_v1',
  DEMO_PURGED: 'lenden_demo_purged_v1',
};

const DEFAULT_PROFILE: BusinessProfile = {
  businessName: 'मेरी दुकान व पर्सनल खाता',
  ownerName: '',
  phone: '',
  place: '',
  upiId: '',
  currencySymbol: '₹',
};

export const INITIAL_ACCOUNTS: Account[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];

const DEMO_ACCOUNT_IDS = new Set(['acc_1', 'acc_2', 'acc_3', 'acc_4', 'acc_5']);
const DEMO_TXN_IDS = new Set(['txn_1', 'txn_2', 'txn_3', 'txn_4', 'txn_5', 'txn_6', 'txn_7', 'txn_8']);

export const storage = {
  /**
   * Helper to ensure demo mock data is cleanly purged on first run
   */
  _ensureDemoPurged(): void {
    try {
      const isPurged = localStorage.getItem(STORAGE_KEYS.DEMO_PURGED);
      if (!isPurged) {
        // Check accounts
        const rawAcc = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        if (rawAcc) {
          const accs: Account[] = JSON.parse(rawAcc);
          const filteredAccs = accs.filter(a => !DEMO_ACCOUNT_IDS.has(a.id));
          localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(filteredAccs));
        }

        // Check transactions
        const rawTxns = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (rawTxns) {
          const txns: Transaction[] = JSON.parse(rawTxns);
          const filteredTxns = txns.filter(t => !DEMO_TXN_IDS.has(t.id) && !DEMO_ACCOUNT_IDS.has(t.accountId));
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filteredTxns));
        }

        // Check profile
        const rawProf = localStorage.getItem(STORAGE_KEYS.PROFILE);
        if (rawProf) {
          const prof: BusinessProfile = JSON.parse(rawProf);
          if (prof.ownerName === 'सुभाष शर्मा' && prof.phone === '9876543210') {
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
          }
        }

        localStorage.setItem(STORAGE_KEYS.DEMO_PURGED, 'true');
      }
    } catch {
      // Ignore storage errors
    }
  },

  getAccounts(): Account[] {
    this._ensureDemoPurged();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!data) {
        return [];
      }
      const parsed: Account[] = JSON.parse(data);
      return parsed.filter(a => !DEMO_ACCOUNT_IDS.has(a.id));
    } catch {
      return [];
    }
  },

  saveAccounts(accounts: Account[]): void {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  getTransactions(): Transaction[] {
    this._ensureDemoPurged();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        return [];
      }
      const parsed: Transaction[] = JSON.parse(data);
      return parsed.filter(t => !DEMO_TXN_IDS.has(t.id) && !DEMO_ACCOUNT_IDS.has(t.accountId));
    } catch {
      return [];
    }
  },

  saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getProfile(): BusinessProfile {
    this._ensureDemoPurged();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!data) {
        this.saveProfile(DEFAULT_PROFILE);
        return DEFAULT_PROFILE;
      }
      const parsed: BusinessProfile = JSON.parse(data);
      if (parsed.ownerName === 'सुभाष शर्मा' && parsed.phone === '9876543210') {
        return DEFAULT_PROFILE;
      }
      return parsed;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: BusinessProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getLanguage(): Language {
    try {
      const lang = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language;
      return lang === 'en' ? 'en' : 'hi';
    } catch {
      return 'hi';
    }
  },

  saveLanguage(lang: Language): void {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  },

  exportBackup(): string {
    const backupData = {
      accounts: this.getAccounts(),
      transactions: this.getTransactions(),
      profile: this.getProfile(),
      language: this.getLanguage(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    return JSON.stringify(backupData, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.accounts) && Array.isArray(parsed.transactions)) {
        this.saveAccounts(parsed.accounts);
        this.saveTransactions(parsed.transactions);
        if (parsed.profile) this.saveProfile(parsed.profile);
        if (parsed.language) this.saveLanguage(parsed.language);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  resetToDefault(): void {
    this.saveAccounts([]);
    this.saveTransactions([]);
    this.saveProfile(DEFAULT_PROFILE);
  },

  clearAll(): void {
    this.saveAccounts([]);
    this.saveTransactions([]);
  },
};
